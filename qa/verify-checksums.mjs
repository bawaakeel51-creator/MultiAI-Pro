import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// A consistency check, not a signature: reviewers must inspect manifest changes.
const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = 'qa/SHA256SUMS.json';
const manifest = JSON.parse(readFileSync(new URL('SHA256SUMS.json', import.meta.url)));
const tracked = execFileSync('git', ['ls-files', '-z'], {cwd: root, encoding: 'utf8'})
  .split('\0').filter(path => path && path !== manifestPath).sort();
assert.deepEqual(Object.keys(manifest).sort(), tracked, 'Manifest must cover every tracked file except itself');
for (const path of tracked) {
  assert.match(manifest[path], /^[a-f0-9]{64}$/, `Invalid SHA-256: ${path}`);
  const actual = createHash('sha256').update(readFileSync(new URL('../' + path, import.meta.url))).digest('hex');
  assert.equal(actual, manifest[path], `Checksum mismatch: ${path}`);
}
console.log(`PASS SHA-256: ${tracked.length} tracked files`);
