import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const expected = { bytes: 61810, sha256: '5a8ae1762c2a92a67889029d7c407d0fd9bfda50d23829fc84a3fca0db93cbab', width: 768, height: 576, frameWidth: 384, frameHeight: 288, columns: 2, rows: 2 };
const file = resolve(process.argv[2] ?? 'src/assets/weapons/first-person-atlas.png');
const data = await readFile(file);
const fail = (message) => { console.error(`First-person atlas validation failed: ${message}`); process.exitCode = 1; };
const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (data.length < 32 || !data.subarray(0, 8).equals(signature)) {
  fail('file is not a PNG image');
} else {
  let offset = 8; let width = 0; let height = 0; let hasTransparency = false; let hasEnd = false;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset); const type = data.toString('ascii', offset + 4, offset + 8);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > data.length) { fail(`truncated ${type} chunk`); break; }
    const payload = data.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR' && length === 13) { width = payload.readUInt32BE(0); height = payload.readUInt32BE(4); if (payload[9] !== 3) fail('expected an indexed-colour PNG'); }
    if (type === 'tRNS') hasTransparency = payload.some((alpha) => alpha < 255);
    if (type === 'IEND') { hasEnd = true; break; }
    offset = chunkEnd;
  }
  if (width !== expected.width || height !== expected.height) fail(`expected ${expected.width}×${expected.height}, got ${width}×${height}`);
  if (width / expected.frameWidth !== expected.columns || height / expected.frameHeight !== expected.rows) fail('expected a 2×2 grid of 384×288 frames');
  if (!hasTransparency) fail('PNG transparency table is missing');
  if (!hasEnd) fail('PNG IEND chunk is missing');
}
if (data.length !== expected.bytes) fail(`expected ${expected.bytes} bytes, got ${data.length}`);
const sha256 = createHash('sha256').update(data).digest('hex');
if (sha256 !== expected.sha256) fail(`SHA-256 mismatch: ${sha256}`);
if (process.exitCode) process.exit(process.exitCode);
console.log(`First-person atlas OK: ${expected.width}×${expected.height}, 2×2 frames, transparency, ${data.length} bytes`);
console.log(`SHA-256: ${sha256}`);