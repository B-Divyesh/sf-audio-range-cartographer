/* global console */

import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const output = resolve('dist');

function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? filesIn(path) : [path];
  });
}

function fingerprint() {
  const digest = createHash('sha256');
  for (const file of filesIn(output).sort()) {
    digest.update(relative(output, file)).update('\0').update(readFileSync(file)).update('\0');
  }
  return digest.digest('hex');
}

function buildCleanly() {
  const result = spawnSync('npm', ['run', 'build'], { cwd: resolve('.'), stdio: 'inherit' });
  if (result.status !== 0) throw new Error('Production build failed while checking reproducibility.');
}

buildCleanly();
const first = fingerprint();
buildCleanly();
const second = fingerprint();

if (first !== second) throw new Error(`Clean production builds differ: ${first} != ${second}`);
console.log(`Byte-stable clean build: ${first}`);
