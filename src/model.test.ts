import { describe, expect, it } from 'vitest';
import { diagnostics, parseProjectText } from './model';

describe('scene import', () => {
  it('imports bounded JSON with labelled curve semantics', () => {
    const project = parseProjectText(JSON.stringify({
      title: 'Atrium', width: 40, height: 30, unit: 'tiles',
      emitters: [{ name: 'Fountain', x: 12, y: 8, innerRadius: 2, maxDistance: 14, curve: 'inverse' }],
    }), 'atrium.json');
    expect(project.title).toBe('Atrium');
    expect(project.emitters[0]).toMatchObject({ name: 'Fountain', curve: 'inverse', maxDistance: 14 });
  });

  it('imports quoted CSV and infers a useful map size', () => {
    const project = parseProjectText('name,x,y,maxDistance,curve,notes\n"Bell, west",20,18,30,exponential,"loop, exterior"', 'village.csv');
    expect(project.emitters[0].name).toBe('Bell, west');
    expect(project.emitters[0].notes).toBe('loop, exterior');
    expect(project.width).toBeGreaterThanOrEqual(100);
  });

  it('rejects malformed and unsafe imports without returning partial data', () => {
    expect(() => parseProjectText('{bad json', 'bad.json')).toThrow(/JSON is not valid/);
    expect(() => parseProjectText('label,x,y\nBell,1,2', 'bad.csv')).toThrow(/missing the “name”/);
    const tooMany = JSON.stringify({ emitters: Array.from({ length: 201 }, () => ({ name: 'x', x: 1, y: 1 })) });
    expect(() => parseProjectText(tooMany, 'large.json')).toThrow(/at most 200/);
  });
});

describe('preflight diagnostics', () => {
  it('finds overlap and clipped ranges', () => {
    const project = parseProjectText(JSON.stringify({ width: 100, height: 70, emitters: [
      { name: 'A', x: 10, y: 10, innerRadius: 2, maxDistance: 30 },
      { name: 'B', x: 30, y: 10, innerRadius: 2, maxDistance: 30 },
    ] }), 'map.json');
    const findings = diagnostics(project);
    expect(findings.some((finding) => finding.id.startsWith('edge-'))).toBe(true);
    expect(findings.some((finding) => finding.id.startsWith('overlap-'))).toBe(true);
  });
});
