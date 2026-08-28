import type { LicenseState } from './types';

const SLUG = 'audio-range-cartographer';
const KEY = `sb_license:${SLUG}`;
const CACHE_KEY = `${KEY}:verdict`;
const API = import.meta.env.VITE_SOCIOBOT_API_URL || 'https://api.sociobot.in';
export const BUY_URL = `${API}/api/v1/products/${SLUG}/checkout`;

export function initialLicense(): LicenseState {
  const query = new URLSearchParams(location.search);
  const incoming = query.get('license');
  if (incoming) {
    localStorage.setItem(KEY, incoming.trim()); query.delete('license');
    const next = `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`;
    history.replaceState({}, '', next);
  }
  const token = incoming?.trim() || localStorage.getItem(KEY);
  let unlocked = false;
  try { const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as { valid?: boolean; checkedAt?: number } | null; unlocked = Boolean(token && cached?.valid && Date.now() - Number(cached.checkedAt) < 86_400_000); } catch { /* ignore malformed cache */ }
  return { token, unlocked, checking: Boolean(token), notice: '' };
}

export async function verifyLicense(state: LicenseState): Promise<LicenseState> {
  if (!state.token) return { ...state, checking: false };
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as { valid?: boolean; checkedAt?: number } | null;
    if (cached?.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return { ...state, checking: false, unlocked: Boolean(cached.valid) };
    const response = await fetch(`${API}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(state.token)}`);
    if (!response.ok) throw new Error('verification unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ valid: result.valid, checkedAt: Date.now() }));
    return { ...state, checking: false, unlocked: result.valid, notice: result.valid ? 'Cartographer Pro unlocked.' : 'License no longer active. The free workspace is still available.' };
  } catch {
    return { ...state, checking: false, notice: state.unlocked ? 'Offline — using the last verified license.' : 'Could not verify this license. Check your connection and try again.' };
  }
}

export function storeLicense(token: string): LicenseState {
  localStorage.setItem(KEY, token.trim()); localStorage.removeItem(CACHE_KEY);
  return { token: token.trim(), unlocked: false, checking: true, notice: 'Checking license…' };
}
