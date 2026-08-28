import type { Curve, Emitter, Finding, Project } from './types';

export const COLORS = ['#65F4D0', '#B4A4FF', '#FFC76A', '#FF8B7B', '#75B8FF', '#86E6AE'];
export const CURVES: Record<Curve, { label: string; description: string }> = {
  linear: { label: 'Linear', description: 'Even fade from the inner range to silence.' },
  inverse: { label: 'Inverse', description: 'Fast drop near the source with a longer quiet tail.' },
  exponential: { label: 'Exponential', description: 'Gentle near the source, then steeper toward the edge.' },
};

export function blankProject(): Project {
  return { version: 1, title: 'Untitled level', width: 100, height: 70, unit: 'm', updatedAt: new Date().toISOString(), emitters: [] };
}

export function sampleProject(): Project {
  return {
    version: 1, title: 'Harbor approach', width: 120, height: 80, unit: 'm', updatedAt: new Date().toISOString(),
    emitters: [
      { id: uid(), name: 'Dock machinery', x: 28, y: 27, innerRadius: 6, maxDistance: 31, curve: 'inverse', color: COLORS[0], notes: 'Industrial ambience bed' },
      { id: uid(), name: 'Warning beacon', x: 63, y: 38, innerRadius: 4, maxDistance: 27, curve: 'linear', color: COLORS[2], notes: 'Check overlap at bridge' },
      { id: uid(), name: 'Market crowd', x: 97, y: 57, innerRadius: 10, maxDistance: 38, curve: 'exponential', color: COLORS[1], notes: 'Wide crowd loop' },
    ],
  };
}

export function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? `em-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function makeEmitter(project: Project, x = project.width / 2, y = project.height / 2): Emitter {
  const index = project.emitters.length;
  const max = Math.max(4, Math.round(Math.min(project.width, project.height) * 0.18));
  return { id: uid(), name: `Emitter ${index + 1}`, x: round(x), y: round(y), innerRadius: Math.max(1, Math.round(max * .2)), maxDistance: max, curve: 'linear', color: COLORS[index % COLORS.length], notes: '' };
}

export function clampEmitter(emitter: Emitter, project: Project): Emitter {
  return { ...emitter, x: clamp(emitter.x, 0, project.width), y: clamp(emitter.y, 0, project.height), innerRadius: clamp(emitter.innerRadius, 0, emitter.maxDistance), maxDistance: clamp(emitter.maxDistance, .1, Math.max(project.width, project.height) * 4) };
}

export function diagnostics(project: Project): Finding[] {
  const findings: Finding[] = [];
  const diagonal = Math.hypot(project.width, project.height);
  project.emitters.forEach((emitter) => {
    if (emitter.x - emitter.maxDistance < 0 || emitter.x + emitter.maxDistance > project.width || emitter.y - emitter.maxDistance < 0 || emitter.y + emitter.maxDistance > project.height) {
      findings.push({ id: `edge-${emitter.id}`, severity: 'review', emitterIds: [emitter.id], title: `${emitter.name} crosses the map edge`, detail: 'Part of its audible range falls outside the mapped level. Confirm this is intentional.' });
    }
    if (emitter.maxDistance > diagonal * .55) {
      findings.push({ id: `wide-${emitter.id}`, severity: 'review', emitterIds: [emitter.id], title: `${emitter.name} is map-wide`, detail: `Its ${format(emitter.maxDistance)} ${project.unit} range covers most of this scene.` });
    } else if (emitter.maxDistance < diagonal * .035) {
      findings.push({ id: `narrow-${emitter.id}`, severity: 'info', emitterIds: [emitter.id], title: `${emitter.name} is easy to miss`, detail: `Its audible range is only ${format(emitter.maxDistance)} ${project.unit}.` });
    }
  });
  for (let i = 0; i < project.emitters.length; i += 1) {
    for (let j = i + 1; j < project.emitters.length; j += 1) {
      const a = project.emitters[i]; const b = project.emitters[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const overlap = a.maxDistance + b.maxDistance - distance;
      if (overlap > Math.min(a.maxDistance, b.maxDistance) * .35) {
        findings.push({ id: `overlap-${a.id}-${b.id}`, severity: 'review', emitterIds: [a.id, b.id], title: `${a.name} overlaps ${b.name}`, detail: `Their outer ranges overlap by about ${format(overlap)} ${project.unit}; audition masking and level buildup.` });
      }
    }
  }
  return findings;
}

export function parseProjectText(text: string, fileName = 'scene'): Project {
  if (text.length > 1_000_000) throw new Error('That file is larger than 1 MB. Split the level into a smaller map and try again.');
  if (fileName.toLowerCase().endsWith('.csv') || (!text.trim().startsWith('{') && !text.trim().startsWith('['))) return fromCsv(text, fileName);
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { throw new Error('The JSON is not valid. Check the missing comma or quote and try again.'); }
  if (Array.isArray(raw)) raw = { title: cleanTitle(fileName), emitters: raw };
  if (!raw || typeof raw !== 'object') throw new Error('JSON must be a project object or an array of emitters.');
  const input = raw as Record<string, unknown>;
  const width = finite(input.width ?? 100, 'width', .1, 100000);
  const height = finite(input.height ?? 70, 'height', .1, 100000);
  const list = input.emitters;
  if (!Array.isArray(list)) throw new Error('JSON needs an “emitters” array.');
  if (list.length > 200) throw new Error('A map can contain at most 200 emitters.');
  const project: Project = { version: 1, title: safeString(input.title, cleanTitle(fileName), 80), width, height, unit: safeString(input.unit, 'm', 12), updatedAt: new Date().toISOString(), emitters: [] };
  project.emitters = list.map((item, index) => parseEmitter(item, index, project));
  return project;
}

function fromCsv(text: string, fileName: string): Project {
  const rows = csvRows(text);
  if (rows.length < 2) throw new Error('CSV needs a header and at least one emitter row.');
  const headers = rows[0].map((value) => value.trim().toLowerCase().replace(/[ _-]/g, ''));
  const get = (row: string[], ...names: string[]) => { const i = headers.findIndex((header) => names.includes(header)); return i >= 0 ? row[i] : undefined; };
  for (const required of ['name', 'x', 'y']) if (!headers.includes(required)) throw new Error(`CSV is missing the “${required}” column. Required: name, x, y.`);
  if (rows.length > 201) throw new Error('A map can contain at most 200 emitters.');
  const project = blankProject(); project.title = cleanTitle(fileName);
  project.emitters = rows.slice(1).filter((row) => row.some(Boolean)).map((row, index) => parseEmitter({ name: get(row, 'name'), x: get(row, 'x'), y: get(row, 'y'), innerRadius: get(row, 'innerradius', 'inner', 'mindistance'), maxDistance: get(row, 'maxdistance', 'max', 'radius'), curve: get(row, 'curve'), color: get(row, 'color'), notes: get(row, 'notes', 'note') }, index, project));
  const maxX = Math.max(100, ...project.emitters.map((emitter) => emitter.x + emitter.maxDistance));
  const maxY = Math.max(70, ...project.emitters.map((emitter) => emitter.y + emitter.maxDistance));
  project.width = Math.ceil(maxX / 10) * 10; project.height = Math.ceil(maxY / 10) * 10;
  return project;
}

function parseEmitter(value: unknown, index: number, project: Project): Emitter {
  if (!value || typeof value !== 'object') throw new Error(`Emitter ${index + 1} must be an object.`);
  const input = value as Record<string, unknown>;
  const curveRaw = safeString(input.curve, 'linear', 20).toLowerCase();
  const curve: Curve = curveRaw === 'inverse' || curveRaw === 'exponential' ? curveRaw : 'linear';
  const maxDistance = finite(input.maxDistance ?? input.radius ?? 20, `emitter ${index + 1} maxDistance`, .1, 400000);
  const innerRadius = finite(input.innerRadius ?? input.minDistance ?? Math.min(5, maxDistance), `emitter ${index + 1} innerRadius`, 0, maxDistance);
  return clampEmitter({ id: uid(), name: safeString(input.name, `Emitter ${index + 1}`, 80), x: finite(input.x, `emitter ${index + 1} x`, -100000, 100000), y: finite(input.y, `emitter ${index + 1} y`, -100000, 100000), innerRadius, maxDistance, curve, color: validColor(input.color) ? String(input.color) : COLORS[index % COLORS.length], notes: safeString(input.notes, '', 240) }, project);
}

function csvRows(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted && char === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(field); if (row.some((v) => v.trim())) rows.push(row); row = []; field = ''; }
    else field += char;
  }
  row.push(field); if (row.some((v) => v.trim())) rows.push(row);
  if (quoted) throw new Error('CSV contains an unclosed quoted value.');
  return rows;
}

function finite(value: unknown, label: string, min: number, max: number): number {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error(`${label} must be a number from ${min} to ${max}.`);
  return number;
}

function safeString(value: unknown, fallback: string, max: number): string {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const cleaned = String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return cleaned ? cleaned.slice(0, max) : fallback;
}

function validColor(value: unknown): boolean { return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value); }
function cleanTitle(name: string): string { return name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').slice(0, 80) || 'Imported level'; }
export function round(value: number): number { return Math.round(value * 10) / 10; }
export function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }
export function format(value: number): string { return Number.isInteger(value) ? String(value) : value.toFixed(1); }
