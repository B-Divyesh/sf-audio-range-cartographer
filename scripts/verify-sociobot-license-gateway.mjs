/* global console, fetch, process */

import { randomUUID } from 'node:crypto';

const policy = { requestsPerSecond: 20, burst: 40 };
const burst = Number(process.env.SOCIOBOT_GATEWAY_BURST ?? 64);
const endpoint = 'https://api.sociobot.in/api/v1/products/audio-range-cartographer/verify';

if (process.env.SOCIOBOT_OPERATOR_GATEWAY_CHECK !== '1') {
  throw new Error('This shared-gateway check is operator-gated. Re-run with SOCIOBOT_OPERATOR_GATEWAY_CHECK=1.');
}
if (!Number.isInteger(burst) || burst <= policy.burst) {
  throw new Error(`Gateway burst must exceed the documented ${policy.burst}-request burst allowance.`);
}

const batch = randomUUID();
const responses = await Promise.all(Array.from({ length: burst }, async (_, index) => {
  const response = await fetch(`${endpoint}?license=operator-check-${batch}-${index}`);
  return { status: response.status, retryAfter: response.headers.get('retry-after') };
}));
const limited = responses.filter(({ status, retryAfter }) => status === 429 && Boolean(retryAfter));
const summary = Object.entries(Object.groupBy(responses, ({ status }) => status)).map(([status, values]) => `${status}:${values.length}`).join(', ');

if (limited.length === 0) throw new Error(`Expected 429 + Retry-After after the documented ${policy.burst}-request burst allowance; saw ${summary}.`);
console.log(`Sociobot operator-gated gateway check passed (${burst} concurrent invalid tokens; ${summary}; 429 with Retry-After: ${limited.length}).`);
