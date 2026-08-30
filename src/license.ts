import type { LicenseState } from './types';

const SLUG = 'audio-range-cartographer';
const KEY = `sb_license:${SLUG}`;
const CACHE_KEY = `${KEY}:verdict`;
const ATTEMPTS_KEY = `${KEY}:verification-attempts`;
const BLOCKED_UNTIL_KEY = `${KEY}:verification-blocked-until`;
const API = import.meta.env.VITE_SOCIOBOT_API_URL || 'https://api.sociobot.in';
export const BUY_URL = `${API}/api/v1/products/${SLUG}/checkout`;
export const LICENSE_VERIFICATION_ALLOWANCE = { requests: 5, windowMs: 60_000 } as const;

type CachedVerdict = { token?: string; valid?: boolean; checkedAt?: number };

function cachedVerdict(token: string): CachedVerdict | null {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null') as CachedVerdict | null;
    return cached?.token === token ? cached : null;
  } catch { return null; }
}

function retryAfterMs(value: string | null, now = Date.now()): number {
  if (!value) return LICENSE_VERIFICATION_ALLOWANCE.windowMs;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds * 1000);
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - now) : LICENSE_VERIFICATION_ALLOWANCE.windowMs;
}

function formatRetry(ms: number): string {
  const seconds = Math.max(1, Math.ceil(ms / 1000));
  return seconds >= 60 ? `${Math.ceil(seconds / 60)} minute${seconds >= 120 ? 's' : ''}` : `${seconds} seconds`;
}

export function localRateLimitResponse(attempts: number[], now = Date.now()): Response | null {
  const recent = attempts.filter((attempt) => attempt > now - LICENSE_VERIFICATION_ALLOWANCE.windowMs && attempt <= now).sort((a, b) => a - b);
  if (recent.length < LICENSE_VERIFICATION_ALLOWANCE.requests) return null;
  const retrySeconds = Math.max(1, Math.ceil((recent[0] + LICENSE_VERIFICATION_ALLOWANCE.windowMs - now) / 1000));
  return new Response(null, { status: 429, headers: { 'Retry-After': String(retrySeconds) } });
}

function readAttempts(): number[] {
  try {
    const stored = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]') as unknown;
    return Array.isArray(stored) ? stored.filter((value): value is number => typeof value === 'number' && Number.isFinite(value)) : [];
  } catch { return []; }
}

function reserveAttempt(now = Date.now()): Response | null {
  const blockedUntil = Number(localStorage.getItem(BLOCKED_UNTIL_KEY));
  if (Number.isFinite(blockedUntil) && blockedUntil > now) return new Response(null, { status: 429, headers: { 'Retry-After': String(Math.max(1, Math.ceil((blockedUntil - now) / 1000))) } });
  const attempts = readAttempts().filter((attempt) => attempt > now - LICENSE_VERIFICATION_ALLOWANCE.windowMs && attempt <= now);
  const limited = localRateLimitResponse(attempts, now);
  if (limited) return limited;
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([...attempts, now]));
  return null;
}

function rateLimitNotice(response: Response): string {
  const retry = retryAfterMs(response.headers.get('Retry-After'));
  localStorage.setItem(BLOCKED_UNTIL_KEY, String(Date.now() + retry));
  return `Too many license checks. Try again in ${formatRetry(retry)}.`;
}

export function initialLicense(): LicenseState {
  const query = new URLSearchParams(location.search);
  const incoming = query.get('license');
  if (incoming) {
    const token = incoming.trim();
    if (localStorage.getItem(KEY) !== token) localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(KEY, token); query.delete('license');
    const next = `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`;
    history.replaceState({}, '', next);
  }
  const token = incoming?.trim() || localStorage.getItem(KEY);
  let unlocked = false;
  if (token) unlocked = Boolean(cachedVerdict(token)?.valid);
  return { token, unlocked, checking: Boolean(token), notice: '' };
}

export async function verifyLicense(state: LicenseState): Promise<LicenseState> {
  if (!state.token) return { ...state, checking: false };
  try {
    const cached = cachedVerdict(state.token);
    if (cached?.checkedAt && Date.now() - cached.checkedAt < 86_400_000) return { ...state, checking: false, unlocked: Boolean(cached.valid) };
    const limited = reserveAttempt();
    if (limited) return { ...state, checking: false, notice: rateLimitNotice(limited) };
    const response = await fetch(`${API}/api/v1/products/${SLUG}/verify?license=${encodeURIComponent(state.token)}`);
    if (response.status === 429) return { ...state, checking: false, notice: rateLimitNotice(response) };
    if (!response.ok) throw new Error('verification unavailable');
    const result = await response.json() as { valid: boolean; reason?: string };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ token: state.token, valid: result.valid, checkedAt: Date.now() }));
    return { ...state, checking: false, unlocked: result.valid, notice: result.valid ? 'Cartographer Pro unlocked.' : 'License no longer active. The free workspace is still available.' };
  } catch {
    return { ...state, checking: false, notice: state.unlocked ? 'Offline — using the last verified license.' : 'Could not verify this license. Check your connection and try again.' };
  }
}

export function storeLicense(token: string): LicenseState {
  localStorage.setItem(KEY, token.trim()); localStorage.removeItem(CACHE_KEY);
  return { token: token.trim(), unlocked: false, checking: true, notice: 'Checking license…' };
}
