import { CURVES, format } from './model';
import type { Project } from './types';

export function projectSvg(project: Project): string {
  const pad = 42; const scale = Math.min(10, Math.max(4, 900 / Math.max(project.width, project.height)));
  const width = project.width * scale + pad * 2; const height = project.height * scale + pad * 2 + 70;
  const gx = (x: number) => pad + x * scale; const gy = (y: number) => pad + y * scale;
  const grid = Array.from({ length: 11 }, (_, index) => { const x = pad + project.width * scale * index / 10; const y = pad + project.height * scale * index / 10; return `<path d="M${x} ${pad}V${pad + project.height * scale}M${pad} ${y}H${pad + project.width * scale}"/>`; }).join('');
  const emitters = project.emitters.map((e, index) => `<g><circle cx="${gx(e.x)}" cy="${gy(e.y)}" r="${e.maxDistance * scale}" fill="${e.color}" fill-opacity=".09" stroke="${e.color}" stroke-width="2" ${e.curve === 'inverse' ? 'stroke-dasharray="8 5"' : e.curve === 'exponential' ? 'stroke-dasharray="2 5"' : ''}/><circle cx="${gx(e.x)}" cy="${gy(e.y)}" r="${e.innerRadius * scale}" fill="${e.color}" fill-opacity=".18" stroke="${e.color}"/><circle cx="${gx(e.x)}" cy="${gy(e.y)}" r="4" fill="#f1f7f4"/><text x="${gx(e.x) + 8}" y="${gy(e.y) - 8}" fill="#f1f7f4" font-size="13" font-family="system-ui">${index + 1}. ${xml(e.name)}</text></g>`).join('');
  const legend = project.emitters.map((e, index) => `<text x="${pad + index % 3 * (width - pad * 2) / 3}" y="${height - 42 + Math.floor(index / 3) * 18}" fill="#b9cbc7" font-size="11" font-family="system-ui">${index + 1} · ${xml(e.name)} · ${format(e.innerRadius)}–${format(e.maxDistance)} ${xml(project.unit)} · ${CURVES[e.curve].label}</text>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${Math.ceil(height + Math.ceil(project.emitters.length / 3) * 18)}" viewBox="0 0 ${width} ${height + Math.ceil(project.emitters.length / 3) * 18}"><rect width="100%" height="100%" fill="#071012"/><text x="${pad}" y="26" fill="#f1f7f4" font-size="18" font-weight="700" font-family="system-ui">${xml(project.title)}</text><g fill="none" stroke="#244045" stroke-width="1">${grid}</g><rect x="${pad}" y="${pad}" width="${project.width * scale}" height="${project.height * scale}" fill="#0b1719" fill-opacity=".6" stroke="#4c6b6c"/>${emitters}<text x="${pad}" y="${height - 56}" fill="#65f4d0" font-size="11" font-family="system-ui">AUDIO RANGE CARTOGRAPHER · ENGINE-NEUTRAL ESTIMATE · ${project.width} × ${project.height} ${xml(project.unit)}</text>${legend}</svg>`;
}

export function downloadBlob(content: BlobPart, type: string, name: string): void {
  const url = URL.createObjectURL(new Blob([content], { type })); const link = document.createElement('a');
  link.href = url; link.download = name; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPng(project: Project, multiplier = 1): Promise<void> {
  const svg = projectSvg(project); const source = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Could not render the map.')); image.src = source; });
  const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth * multiplier; canvas.height = image.naturalHeight * multiplier;
  const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas export is not supported in this browser.');
  context.scale(multiplier, multiplier); context.drawImage(image, 0, 0); URL.revokeObjectURL(source);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not encode the PNG.'); downloadBlob(blob, 'image/png', `${slug(project.title)}${multiplier > 1 ? '-4x' : ''}.png`);
}

export function projectCsv(project: Project): string {
  const quote = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return ['name,x,y,innerRadius,maxDistance,curve,color,notes', ...project.emitters.map((e) => [e.name, e.x, e.y, e.innerRadius, e.maxDistance, e.curve, e.color, e.notes].map(quote).join(','))].join('\n');
}

export function slug(value: string): string { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'audibility-map'; }
function xml(value: string): string { return value.replace(/[<>&"']/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[char] ?? char); }
