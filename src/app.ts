import { BUY_URL, initialLicense, storeLicense, verifyLicense } from './license';
import { blankProject, clamp, CURVES, diagnostics, format, makeEmitter, parseProjectText, round, sampleProject } from './model';
import { downloadBlob, downloadPng, projectCsv, projectSvg, slug } from './export';
import { listSnapshots, loadProject, saveProject, saveSnapshot } from './storage';
import type { Emitter, LicenseState, Project } from './types';

const escapeHtml = (value: string | number): string => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char] ?? char);

export class App {
  private project: Project = blankProject();
  private selectedId: string | null = null;
  private license: LicenseState = initialLicense();
  private onboarding = false;
  private saveTimer = 0;
  private deleted: Emitter | null = null;
  private dragged = false;

  constructor(private readonly root: HTMLDivElement) {}

  async start(): Promise<void> {
    this.shell();
    try {
      const saved = await loadProject();
      if (saved) this.project = saved; else this.onboarding = true;
    } catch { this.announce('Local storage is unavailable. You can still export your work before closing this tab.', 'error'); }
    this.render();
    this.bindStatic();
    if (this.license.token) {
      this.license = await verifyLicense(this.license); this.updateLicenseUi();
      if (this.license.notice) this.announce(this.license.notice, this.license.unlocked ? 'success' : 'info');
    }
    this.setupOffline();
  }

  private shell(): void {
    this.root.innerHTML = `
      <header class="topbar">
        <a class="brand" href="/" aria-label="Audio Range Cartographer home">
          <img src="/icon.svg" width="40" height="40" alt="" />
          <span><strong>Audio Range Cartographer</strong><small>Engine-neutral range planning</small></span>
        </a>
        <nav aria-label="Workspace actions">
          <span class="network-state" id="network-state" hidden>Offline · changes stay local</span>
          <button class="button ghost compact" id="help-button" type="button">Guide</button>
          <button class="button pro-button compact" id="pro-button" type="button">Unlock Pro · $12</button>
        </nav>
      </header>
      <main id="main" tabindex="-1">
        <section class="workspace-heading" aria-labelledby="workspace-title">
          <div>
            <p class="eyebrow">Spatial audio workbench</p>
            <h1 id="workspace-title">See the soundscape before you play it</h1>
            <p>Place emitters, compare labelled attenuation models, and catch coverage problems on a reviewable map.</p>
          </div>
          <div class="save-state" id="save-state"><span aria-hidden="true"></span> Saved in this browser</div>
        </section>
        <section class="project-bar" aria-label="Project settings">
          <label class="project-name">Level name<input id="project-title" maxlength="80" autocomplete="off" /></label>
          <div class="dimension-fields">
            <label>Width<input id="project-width" type="number" min="1" max="100000" step="1" inputmode="decimal" /></label>
            <span aria-hidden="true">×</span>
            <label>Height<input id="project-height" type="number" min="1" max="100000" step="1" inputmode="decimal" /></label>
            <label>Unit<input id="project-unit" maxlength="12" autocomplete="off" /></label>
          </div>
          <div class="bar-actions">
            <button class="button ghost" id="new-project" type="button">New</button>
            <label class="button ghost file-button" for="file-input">Import<input id="file-input" type="file" accept=".json,.csv,application/json,text/csv" /></label>
            <details class="export-menu" id="export-menu">
              <summary class="button primary">Export <span aria-hidden="true">⌄</span></summary>
              <div class="menu" role="group" aria-label="Export formats">
                <button type="button" data-export="png">PNG map <small>Standard resolution</small></button>
                <button type="button" data-export="svg">SVG map <small>Editable vector</small></button>
                <button type="button" data-export="json">Preset JSON <small>Share or restore</small></button>
                <button type="button" data-export="csv">Emitter CSV <small>Engine handoff</small></button>
                <button type="button" data-export="png4" class="pro-export">4× PNG <small>Pro · print-ready</small></button>
              </div>
            </details>
          </div>
        </section>
        <div class="workbench">
          <section class="map-panel" aria-labelledby="map-heading">
            <div class="panel-heading">
              <div><p class="eyebrow">Audibility map</p><h2 id="map-heading">Range field</h2></div>
              <button class="button add-button" id="add-emitter" type="button"><span aria-hidden="true">＋</span> Add emitter</button>
            </div>
            <div class="map-wrap" id="map-wrap"></div>
            <div class="map-foot">
              <p><span class="legend-line solid"></span> Linear <span class="legend-line dashed"></span> Inverse <span class="legend-line dotted"></span> Exponential</p>
              <p>Click to place · drag to move · arrows nudge selected</p>
            </div>
          </section>
          <aside class="inspector" aria-label="Emitter inspector and findings">
            <div id="inspector-content"></div>
            <div id="findings-content"></div>
          </aside>
        </div>
      </main>
      <footer>
        <p>Local-first. Your level data never leaves this device.</p>
        <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><span>Original AI-assisted landscape · <a href="https://sociobot.in">Param Factory</a></span></nav>
      </footer>
      <div class="toast" id="toast" role="status" aria-live="polite" hidden><span id="toast-text"></span><button type="button" id="toast-action" hidden></button></div>
      <dialog id="help-dialog"><form method="dialog"><button class="dialog-close" value="close" aria-label="Close guide">×</button><p class="eyebrow">Five-minute workflow</p><h2>From coordinates to review map</h2><ol><li><strong>Set the level size</strong> in your engine’s coordinate unit.</li><li><strong>Import JSON/CSV or place emitters.</strong> CSV needs <code>name,x,y</code>; optional fields are <code>innerRadius,maxDistance,curve,color,notes</code>.</li><li><strong>Tune the inner and maximum range.</strong> Curve labels are estimates, not claims of engine equivalence.</li><li><strong>Review findings</strong> for clipped, over-wide, narrow, and strongly overlapping fields.</li><li><strong>Export a labelled map</strong> plus JSON or CSV for the project folder.</li></ol><p class="dialog-note">Keyboard: Tab to a marker, then use Arrow keys to move 1 unit or Shift + Arrow to move 10.</p><button class="button primary" value="close">Back to map</button></form></dialog>
      <dialog id="pro-dialog"><form method="dialog"><button class="dialog-close" value="close" aria-label="Close Pro details">×</button><p class="eyebrow">Cartographer Pro</p><h2>Sharper handoffs, safer iterations</h2><p class="price"><strong>$12</strong> once · no subscription</p><ul><li>4× print-ready PNG exports</li><li>Named local snapshots before a risky tuning pass</li><li>All future Pro features for this version</li></ul><p>The free workspace always includes unlimited emitters, local saving, diagnostics, and standard PNG, SVG, JSON, and CSV export.</p><a class="button primary wide" href="${BUY_URL}">Buy securely through Sociobot</a><details class="restore"><summary>Have a license? Restore it</summary><label>License token<input id="license-input" autocomplete="off" spellcheck="false" /></label><button class="button ghost" id="verify-button" type="button">Verify license</button></details><p class="fine-print">Sociobot/Dodo is the merchant of record. Refunds are handled there. See <a href="/privacy">privacy</a> and <a href="/terms">terms</a>.</p></form></dialog>
      <dialog id="snapshot-dialog"><form method="dialog"><button class="dialog-close" value="close" aria-label="Close snapshots">×</button><p class="eyebrow">Pro snapshots</p><h2>Local tuning checkpoints</h2><div id="snapshot-list"></div><button class="button primary wide" type="button" id="save-snapshot">Save current checkpoint</button></form></dialog>`;
  }

  private render(): void {
    const title = this.root.querySelector<HTMLInputElement>('#project-title'); const width = this.root.querySelector<HTMLInputElement>('#project-width'); const height = this.root.querySelector<HTMLInputElement>('#project-height'); const unit = this.root.querySelector<HTMLInputElement>('#project-unit');
    if (title) title.value = this.project.title; if (width) width.value = String(this.project.width); if (height) height.value = String(this.project.height); if (unit) unit.value = this.project.unit;
    this.renderMap(); this.renderInspector(); this.renderFindings(); this.updateLicenseUi();
  }

  private renderMap(): void {
    const map = this.root.querySelector<HTMLDivElement>('#map-wrap'); if (!map) return;
    const { width, height } = this.project; const grid = 10;
    const gridLines = Array.from({ length: grid + 1 }, (_, i) => { const x = width * i / grid; const y = height * i / grid; return `<path d="M${x} 0V${height}M0 ${y}H${width}" />`; }).join('');
    const emitters = this.project.emitters.map((emitter, index) => {
      const selected = emitter.id === this.selectedId; const dash = emitter.curve === 'inverse' ? `${Math.max(width, height) * .012} ${Math.max(width, height) * .008}` : emitter.curve === 'exponential' ? `${Math.max(width, height) * .003} ${Math.max(width, height) * .008}` : '';
      const font = Math.max(width, height) * .018; const marker = Math.max(width, height) * .009;
      return `<g class="emitter ${selected ? 'selected' : ''}" data-emitter-id="${emitter.id}" tabindex="0" role="button" aria-label="${escapeHtml(emitter.name)}, ${format(emitter.maxDistance)} ${escapeHtml(this.project.unit)} maximum range. Use arrow keys to move.">
        <circle class="outer-range" cx="${emitter.x}" cy="${emitter.y}" r="${emitter.maxDistance}" fill="${emitter.color}" stroke="${emitter.color}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>
        <circle class="inner-range" cx="${emitter.x}" cy="${emitter.y}" r="${emitter.innerRadius}" fill="${emitter.color}" stroke="${emitter.color}" />
        <circle class="emitter-hit" cx="${emitter.x}" cy="${emitter.y}" r="${marker * 2.5}" fill="transparent" />
        <circle class="emitter-core" cx="${emitter.x}" cy="${emitter.y}" r="${marker}" />
        <text x="${emitter.x + marker * 1.8}" y="${emitter.y - marker * 1.8}" font-size="${font}">${index + 1} · ${escapeHtml(emitter.name)}</text>
      </g>`;
    }).join('');
    const empty = this.onboarding ? `<div class="onboarding"><picture><source srcset="/assets/range-landscape-768.webp 768w, /assets/range-landscape-1200.webp 1200w" type="image/webp"><img src="/assets/range-landscape-768.jpg" width="768" height="512" alt="Abstract glass level with luminous, overlapping sonar ranges" fetchpriority="high" decoding="async"></picture><div class="onboarding-copy"><p class="eyebrow">Your level, made audible</p><h2>Map a first soundscape in minutes</h2><p>Start with a realistic example, import engine coordinates, or open a clean ${width} × ${height} ${escapeHtml(this.project.unit)} field.</p><div><button class="button primary" type="button" data-onboard="sample">Explore sample</button><button class="button ghost" type="button" data-onboard="blank">Start blank</button><label class="button ghost file-button" for="file-input">Import scene</label></div></div></div>` : this.project.emitters.length === 0 ? `<div class="map-empty"><span aria-hidden="true">◎</span><strong>No emitters yet</strong><p>Click anywhere on the grid or use “Add emitter”.</p></div>` : '';
    map.innerHTML = `<svg class="range-map" id="range-map" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="map-svg-title map-svg-desc"><title id="map-svg-title">${escapeHtml(this.project.title)} audibility map</title><desc id="map-svg-desc">${this.project.emitters.length} emitters on a ${width} by ${height} ${escapeHtml(this.project.unit)} field. Select markers for details; findings are listed after the map.</desc><rect class="map-bg" width="${width}" height="${height}"/><g class="grid">${gridLines}</g>${emitters}<rect class="map-border" x="0" y="0" width="${width}" height="${height}"/></svg>${empty}`;
    this.bindMap();
  }

  private renderInspector(): void {
    const target = this.root.querySelector<HTMLDivElement>('#inspector-content'); if (!target) return;
    const selected = this.project.emitters.find((emitter) => emitter.id === this.selectedId);
    if (!selected) {
      target.innerHTML = `<div class="inspector-heading"><div><p class="eyebrow">Emitters</p><h2>${this.project.emitters.length || 'None placed'}</h2></div>${this.license.unlocked ? '<button class="text-button" id="snapshots-button" type="button">Snapshots</button>' : ''}</div>${this.project.emitters.length ? `<ol class="emitter-list">${this.project.emitters.map((e) => `<li><button type="button" data-select="${e.id}"><span class="color-dot" style="--dot:${e.color}"></span><span><strong>${escapeHtml(e.name)}</strong><small>${format(e.x)}, ${format(e.y)} · ${format(e.maxDistance)} ${escapeHtml(this.project.unit)}</small></span><span aria-hidden="true">›</span></button></li>`).join('')}</ol><p class="inspector-hint">Select a range to tune it. All curve names describe this map only; transfer values according to your engine.</p>` : `<div class="inspector-empty"><span aria-hidden="true">⌖</span><p>Emitter controls appear here after you place one.</p></div>`}`;
      target.querySelectorAll<HTMLButtonElement>('[data-select]').forEach((button) => button.addEventListener('click', () => { this.selectedId = button.dataset.select ?? null; this.onboarding = false; this.render(); }));
      target.querySelector<HTMLButtonElement>('#snapshots-button')?.addEventListener('click', () => this.openSnapshots());
      return;
    }
    target.innerHTML = `<div class="inspector-heading"><div><p class="eyebrow">Selected emitter</p><h2>${escapeHtml(selected.name)}</h2></div><button class="icon-button" id="deselect" type="button" aria-label="Close emitter inspector">×</button></div>
      <form class="emitter-form" id="emitter-form">
        <label class="full">Name<input name="name" maxlength="80" value="${escapeHtml(selected.name)}" /></label>
        <div class="field-row"><label>X position<input name="x" type="number" step="0.1" min="0" max="${this.project.width}" value="${selected.x}" inputmode="decimal" /></label><label>Y position<input name="y" type="number" step="0.1" min="0" max="${this.project.height}" value="${selected.y}" inputmode="decimal" /></label></div>
        <div class="field-row"><label>Inner range<input name="innerRadius" type="number" step="0.1" min="0" max="${selected.maxDistance}" value="${selected.innerRadius}" inputmode="decimal" /></label><label>Max range<input name="maxDistance" type="number" step="0.1" min="0.1" value="${selected.maxDistance}" inputmode="decimal" /></label></div>
        <label class="full">Attenuation model<select name="curve">${Object.entries(CURVES).map(([key, value]) => `<option value="${key}" ${selected.curve === key ? 'selected' : ''}>${value.label}</option>`).join('')}</select><small>${CURVES[selected.curve].description} Engine-neutral visual estimate.</small></label>
        <div class="curve-preview" aria-label="${CURVES[selected.curve].label} attenuation curve preview"><span>Level</span>${curvePreview(selected.curve)}<span>Distance →</span></div>
        <label class="color-field">Map color<input name="color" type="color" value="${selected.color}" /></label>
        <label class="full">Notes<textarea name="notes" maxlength="240" rows="3">${escapeHtml(selected.notes)}</textarea></label>
        <button class="button danger wide" id="delete-emitter" type="button">Delete ${escapeHtml(selected.name)}</button>
      </form>`;
    target.querySelector<HTMLButtonElement>('#deselect')?.addEventListener('click', () => { this.selectedId = null; this.render(); });
    target.querySelector<HTMLFormElement>('#emitter-form')?.addEventListener('change', (event) => this.updateEmitter(event));
    target.querySelector<HTMLButtonElement>('#delete-emitter')?.addEventListener('click', () => this.deleteEmitter(selected));
  }

  private renderFindings(): void {
    const target = this.root.querySelector<HTMLDivElement>('#findings-content'); if (!target) return;
    const items = diagnostics(this.project);
    target.innerHTML = `<section class="findings" aria-labelledby="findings-title"><div class="findings-heading"><div><p class="eyebrow">Preflight</p><h2 id="findings-title">${items.length ? `${items.length} finding${items.length === 1 ? '' : 's'}` : 'Clear field'}</h2></div><span class="finding-count ${items.length ? 'has-findings' : ''}">${items.length ? 'Review' : 'Ready'}</span></div>${items.length ? `<ol>${items.map((finding, index) => `<li><button type="button" data-finding="${finding.emitterIds[0]}"><span>${index + 1}</span><span><strong>${escapeHtml(finding.title)}</strong><small>${escapeHtml(finding.detail)}</small></span></button></li>`).join('')}</ol>` : `<p class="all-clear">No strong overlaps, clipped ranges, or unusual coverage widths detected. Listen in-engine before shipping.</p>`}</section>`;
    target.querySelectorAll<HTMLButtonElement>('[data-finding]').forEach((button) => button.addEventListener('click', () => { this.selectedId = button.dataset.finding ?? null; this.render(); this.root.querySelector('.inspector')?.scrollIntoView({ behavior: motionOk() ? 'smooth' : 'auto' }); }));
  }

  private bindStatic(): void {
    const bindProject = (id: string, key: 'title' | 'width' | 'height' | 'unit') => this.root.querySelector<HTMLInputElement>(id)?.addEventListener('change', (event) => {
      const input = event.currentTarget as HTMLInputElement;
      if (key === 'width' || key === 'height') { const value = Number(input.value); if (!Number.isFinite(value) || value < 1 || value > 100000) { this.announce(`${key} must be between 1 and 100,000.`, 'error'); this.render(); return; } this.project[key] = value; this.project.emitters = this.project.emitters.map((e) => ({ ...e, x: clamp(e.x, 0, this.project.width), y: clamp(e.y, 0, this.project.height) })); }
      else this.project[key] = input.value.trim().slice(0, key === 'unit' ? 12 : 80) || (key === 'unit' ? 'm' : 'Untitled level');
      this.changed(); this.render();
    });
    bindProject('#project-title', 'title'); bindProject('#project-width', 'width'); bindProject('#project-height', 'height'); bindProject('#project-unit', 'unit');
    this.root.querySelector<HTMLButtonElement>('#add-emitter')?.addEventListener('click', () => this.addEmitter());
    this.root.querySelector<HTMLButtonElement>('#new-project')?.addEventListener('click', () => { if (this.project.emitters.length && !confirm(`Start a new map? Export “${this.project.title}” first if you need it.`)) return; this.project = blankProject(); this.selectedId = null; this.onboarding = false; this.changed(); this.render(); });
    this.root.querySelector<HTMLInputElement>('#file-input')?.addEventListener('change', (event) => this.importFile(event));
    this.root.querySelectorAll<HTMLButtonElement>('[data-export]').forEach((button) => button.addEventListener('click', () => this.export(button.dataset.export ?? '')));
    this.root.querySelector<HTMLButtonElement>('#help-button')?.addEventListener('click', () => this.openDialog('help-dialog'));
    this.root.querySelector<HTMLButtonElement>('#pro-button')?.addEventListener('click', () => this.openDialog('pro-dialog'));
    this.root.querySelector<HTMLButtonElement>('#verify-button')?.addEventListener('click', () => this.restoreLicense());
    this.root.querySelector<HTMLButtonElement>('#toast-action')?.addEventListener('click', () => this.undoDelete());
  }

  private bindMap(): void {
    const svg = this.root.querySelector<SVGSVGElement>('#range-map'); if (!svg) return;
    svg.addEventListener('click', (event) => { if (this.dragged) { this.dragged = false; return; } if ((event.target as Element).closest('.emitter')) return; const point = this.svgPoint(svg, event.clientX, event.clientY); this.addEmitter(point.x, point.y); });
    svg.querySelectorAll<SVGGElement>('.emitter').forEach((group) => {
      group.addEventListener('click', () => { this.selectedId = group.dataset.emitterId ?? null; this.render(); });
      group.addEventListener('keydown', (event) => this.markerKey(event, group.dataset.emitterId ?? ''));
      group.querySelector('.emitter-hit')?.addEventListener('pointerdown', (event) => this.beginDrag(event as PointerEvent, group.dataset.emitterId ?? '', svg));
    });
    this.root.querySelectorAll<HTMLButtonElement>('[data-onboard]').forEach((button) => button.addEventListener('click', () => { this.onboarding = false; if (button.dataset.onboard === 'sample') { this.project = sampleProject(); this.selectedId = this.project.emitters[0]?.id ?? null; this.changed(); } this.render(); }));
  }

  private addEmitter(x?: number, y?: number): void {
    this.onboarding = false; const emitter = makeEmitter(this.project, x, y); this.project.emitters.push(emitter); this.selectedId = emitter.id; this.changed(); this.render(); this.announce(`${emitter.name} placed at ${format(emitter.x)}, ${format(emitter.y)}.`, 'success');
  }

  private updateEmitter(event: Event): void {
    const selected = this.project.emitters.find((emitter) => emitter.id === this.selectedId); const input = event.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement; if (!selected || !input.name) return;
    if (['x', 'y', 'innerRadius', 'maxDistance'].includes(input.name)) {
      const number = Number(input.value); if (!Number.isFinite(number)) { this.announce('Enter a valid number.', 'error'); this.renderInspector(); return; }
      if (input.name === 'x') selected.x = clamp(number, 0, this.project.width);
      if (input.name === 'y') selected.y = clamp(number, 0, this.project.height);
      if (input.name === 'maxDistance') { selected.maxDistance = clamp(number, .1, Math.max(this.project.width, this.project.height) * 4); selected.innerRadius = Math.min(selected.innerRadius, selected.maxDistance); }
      if (input.name === 'innerRadius') selected.innerRadius = clamp(number, 0, selected.maxDistance);
    } else if (input.name === 'curve' && (input.value === 'linear' || input.value === 'inverse' || input.value === 'exponential')) selected.curve = input.value;
    else if (input.name === 'color' && /^#[0-9a-f]{6}$/i.test(input.value)) selected.color = input.value;
    else if (input.name === 'name') selected.name = input.value.trim().slice(0, 80) || 'Untitled emitter';
    else if (input.name === 'notes') selected.notes = input.value.slice(0, 240);
    this.changed(); this.render();
  }

  private deleteEmitter(emitter: Emitter): void {
    this.deleted = structuredClone(emitter); this.project.emitters = this.project.emitters.filter((item) => item.id !== emitter.id); this.selectedId = null; this.changed(); this.render(); this.announce(`${emitter.name} deleted.`, 'info', 'Undo');
  }

  private undoDelete(): void { if (!this.deleted) return; this.project.emitters.push(this.deleted); this.selectedId = this.deleted.id; this.announce(`${this.deleted.name} restored.`, 'success'); this.deleted = null; this.changed(); this.render(); }

  private beginDrag(event: PointerEvent, id: string, svg: SVGSVGElement): void {
    event.preventDefault(); this.selectedId = id; const start = this.svgPoint(svg, event.clientX, event.clientY); const emitter = this.project.emitters.find((item) => item.id === id); if (!emitter) return; const origin = { x: emitter.x, y: emitter.y };
    const move = (moveEvent: PointerEvent) => { const point = this.svgPoint(svg, moveEvent.clientX, moveEvent.clientY); emitter.x = round(clamp(origin.x + point.x - start.x, 0, this.project.width)); emitter.y = round(clamp(origin.y + point.y - start.y, 0, this.project.height)); this.dragged = true; this.renderMap(); };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); this.changed(); this.render(); this.announce(`${emitter.name} moved to ${format(emitter.x)}, ${format(emitter.y)}.`, 'success'); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  }

  private markerKey(event: KeyboardEvent, id: string): void {
    const emitter = this.project.emitters.find((item) => item.id === id); if (!emitter) return; const step = event.shiftKey ? 10 : 1;
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.selectedId = id; this.render(); return; }
    if (!event.key.startsWith('Arrow')) return; event.preventDefault();
    if (event.key === 'ArrowLeft') emitter.x = clamp(emitter.x - step, 0, this.project.width); if (event.key === 'ArrowRight') emitter.x = clamp(emitter.x + step, 0, this.project.width); if (event.key === 'ArrowUp') emitter.y = clamp(emitter.y - step, 0, this.project.height); if (event.key === 'ArrowDown') emitter.y = clamp(emitter.y + step, 0, this.project.height);
    this.selectedId = id; this.changed(); this.render(); requestAnimationFrame(() => this.root.querySelector<SVGGElement>(`[data-emitter-id="${CSS.escape(id)}"]`)?.focus());
  }

  private svgPoint(svg: SVGSVGElement, clientX: number, clientY: number): DOMPoint {
    const point = svg.createSVGPoint(); point.x = clientX; point.y = clientY; return point.matrixTransform(svg.getScreenCTM()?.inverse());
  }

  private async importFile(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; input.value = ''; if (!file) return;
    try { const text = await file.text(); const parsed = parseProjectText(text, file.name); this.project = parsed; this.selectedId = parsed.emitters[0]?.id ?? null; this.onboarding = false; this.changed(); this.render(); this.announce(`Imported ${parsed.emitters.length} emitters from ${file.name}.`, 'success'); }
    catch (error) { this.announce(error instanceof Error ? error.message : 'Could not import that file.', 'error'); }
  }

  private async export(kind: string): Promise<void> {
    if (!this.project.emitters.length) { this.announce('Place at least one emitter before exporting a map.', 'error'); return; }
    try {
      if (kind === 'png') await downloadPng(this.project);
      if (kind === 'svg') downloadBlob(projectSvg(this.project), 'image/svg+xml', `${slug(this.project.title)}.svg`);
      if (kind === 'json') downloadBlob(JSON.stringify(this.project, null, 2), 'application/json', `${slug(this.project.title)}.json`);
      if (kind === 'csv') downloadBlob(projectCsv(this.project), 'text/csv', `${slug(this.project.title)}.csv`);
      if (kind === 'png4') { if (!this.license.unlocked) { this.openDialog('pro-dialog'); return; } await downloadPng(this.project, 4); }
      (this.root.querySelector('#export-menu') as HTMLDetailsElement | null)?.removeAttribute('open'); if (kind !== 'png4' || this.license.unlocked) this.announce(`${kind.toUpperCase()} export ready.`, 'success');
    } catch (error) { this.announce(error instanceof Error ? error.message : 'Export failed. Try another format.', 'error'); }
  }

  private changed(): void {
    this.project.updatedAt = new Date().toISOString(); const indicator = this.root.querySelector('#save-state'); if (indicator) indicator.innerHTML = '<span aria-hidden="true"></span> Saving…'; clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => { try { await saveProject(this.project); if (indicator) indicator.innerHTML = '<span aria-hidden="true"></span> Saved in this browser'; } catch { if (indicator) indicator.textContent = 'Export to keep this work'; } }, 350);
  }

  private updateLicenseUi(): void {
    const button = this.root.querySelector<HTMLButtonElement>('#pro-button'); if (!button) return;
    button.textContent = this.license.unlocked ? 'Pro unlocked' : this.license.checking ? 'Checking license…' : 'Unlock Pro · $12'; button.classList.toggle('unlocked', this.license.unlocked);
  }

  private async restoreLicense(): Promise<void> {
    const input = this.root.querySelector<HTMLInputElement>('#license-input'); const token = input?.value.trim() ?? ''; if (token.length < 8) { this.announce('Paste the complete license token.', 'error'); return; }
    this.license = storeLicense(token); this.updateLicenseUi(); this.license = await verifyLicense(this.license); this.updateLicenseUi(); this.announce(this.license.notice, this.license.unlocked ? 'success' : 'error'); if (this.license.unlocked) (this.root.querySelector('#pro-dialog') as HTMLDialogElement).close(); this.renderInspector();
  }

  private async openSnapshots(): Promise<void> {
    const list = this.root.querySelector<HTMLDivElement>('#snapshot-list'); if (!list) return;
    list.innerHTML = '<p class="loading-state">Loading local checkpoints…</p>'; this.openDialog('snapshot-dialog');
    const snapshots = await listSnapshots(); list.innerHTML = snapshots.length ? `<ul class="snapshot-list">${snapshots.map(({ key, project }) => `<li><button type="button" data-snapshot="${key}"><strong>${escapeHtml(project.title)}</strong><span>${new Date(Number(key.split(':')[1])).toLocaleString()} · ${project.emitters.length} emitters</span></button></li>`).join('')}</ul>` : '<p class="dialog-note">No checkpoints yet. Save one before changing a group of ranges.</p>';
    list.querySelectorAll<HTMLButtonElement>('[data-snapshot]').forEach((button, index) => button.addEventListener('click', () => { const chosen = snapshots[index]; if (!chosen) return; this.project = structuredClone(chosen.project); this.selectedId = null; this.changed(); this.render(); (this.root.querySelector('#snapshot-dialog') as HTMLDialogElement).close(); this.announce('Checkpoint restored.', 'success'); }));
    this.root.querySelector<HTMLButtonElement>('#save-snapshot')?.addEventListener('click', async () => { await saveSnapshot(structuredClone(this.project)); this.announce('Local checkpoint saved.', 'success'); (this.root.querySelector('#snapshot-dialog') as HTMLDialogElement).close(); }, { once: true });
  }

  private openDialog(id: string): void { const dialog = this.root.querySelector<HTMLDialogElement>(`#${id}`); if (dialog && !dialog.open) dialog.showModal(); }

  private announce(message: string, tone: 'success' | 'error' | 'info' = 'info', action = ''): void {
    const toast = this.root.querySelector<HTMLDivElement>('#toast'); const text = this.root.querySelector('#toast-text'); const button = this.root.querySelector<HTMLButtonElement>('#toast-action'); if (!toast || !text || !button) return;
    text.textContent = message; toast.dataset.tone = tone; toast.hidden = false; button.hidden = !action; button.textContent = action; window.setTimeout(() => { if (toast && button.hidden) toast.hidden = true; }, 5000);
  }

  private setupOffline(): void {
    const update = () => { const badge = this.root.querySelector<HTMLElement>('#network-state'); if (badge) badge.hidden = navigator.onLine; };
    update(); window.addEventListener('online', update); window.addEventListener('offline', update);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').then((registration) => { registration.addEventListener('updatefound', () => { const worker = registration.installing; worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) this.announce('An app update is ready. Reload to use it.', 'info'); }); }); }).catch(() => { if (!location.hostname.includes('localhost')) this.announce('Offline installation is temporarily unavailable.', 'info'); });
  }
}

function curvePreview(curve: string): string {
  const path = curve === 'inverse' ? 'M4 6 C18 31 45 40 116 45' : curve === 'exponential' ? 'M4 6 C55 8 85 16 116 45' : 'M4 6 L116 45';
  return `<svg viewBox="0 0 120 50" role="img" aria-hidden="true"><path class="curve-axis" d="M4 2V46H118"/><path class="curve-line" d="${path}"/></svg>`;
}

function motionOk(): boolean { return !matchMedia('(prefers-reduced-motion: reduce)').matches; }

export function renderLegalPage(root: HTMLDivElement, page: 'privacy' | 'terms'): void {
  const privacy = page === 'privacy';
  root.innerHTML = `<header class="topbar legal-top"><a class="brand" href="/"><img src="/icon.svg" width="40" height="40" alt=""><span><strong>Audio Range Cartographer</strong><small>Back to workspace</small></span></a></header><main id="main" class="legal-page"><p class="eyebrow">${privacy ? 'Privacy' : 'Terms'}</p><h1>${privacy ? 'Your maps stay yours' : 'Straightforward terms'}</h1><p class="lede">Effective 28 August 2026</p>${privacy ? `<h2>What stays on your device</h2><p>Level names, dimensions, emitter coordinates, notes, local snapshots, and license tokens are stored in your browser. Audio Range Cartographer does not upload, sync, or inspect project data.</p><h2>License verification</h2><p>If you restore or buy Pro, your license token is sent to the Sociobot billing API only to confirm validity. Sociobot/Dodo processes checkout and acts as merchant of record. This app has no analytics, advertising, tracking pixels, or third-party runtime scripts.</p><h2>Your controls</h2><p>Use JSON or CSV export to keep a portable copy. Clear this site’s browser storage to remove local project and license data. Uninstalling the PWA removes the cached app shell according to your browser’s behavior.</p><h2>Contact</h2><p>For privacy requests, contact <a href="mailto:privacy@sociobot.in">privacy@sociobot.in</a>.</p>` : `<h2>Using the tool</h2><p>You may use exported maps and presets in personal or commercial projects. The tool is an engine-neutral planning aid; attenuation curves differ between engines and must be verified by listening in the target runtime.</p><h2>Pro purchase</h2><p>Cartographer Pro costs $12 as a one-time purchase and unlocks 4× PNG export and local snapshots. Sociobot/Dodo is the merchant of record and handles payment and refunds. A refund or chargeback revokes the associated license.</p><h2>Availability and liability</h2><p>The software is provided “as is,” without warranties. Keep exported project copies before clearing browser data. We may improve or discontinue the hosted app, but exported JSON, CSV, SVG, and PNG files remain yours.</p><h2>Acceptable use</h2><p>Do not probe the license service, bypass access controls, or use the service unlawfully. These terms do not restrict rights granted by the repository’s MIT license.</p>`}<p><a class="button primary" href="/">Return to the workspace</a></p></main><footer><p>Audio Range Cartographer</p><nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a></nav></footer>`;
  document.title = `${privacy ? 'Privacy' : 'Terms'} — Audio Range Cartographer`;
}
