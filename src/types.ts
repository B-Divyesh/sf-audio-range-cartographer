export type Curve = 'linear' | 'inverse' | 'exponential';

export interface Emitter {
  id: string;
  name: string;
  x: number;
  y: number;
  innerRadius: number;
  maxDistance: number;
  curve: Curve;
  color: string;
  notes: string;
}

export interface Project {
  version: 1;
  title: string;
  width: number;
  height: number;
  unit: string;
  updatedAt: string;
  emitters: Emitter[];
}

export interface Finding {
  id: string;
  severity: 'review' | 'info';
  emitterIds: string[];
  title: string;
  detail: string;
}

export interface LicenseState {
  token: string | null;
  unlocked: boolean;
  checking: boolean;
  notice: string;
}
