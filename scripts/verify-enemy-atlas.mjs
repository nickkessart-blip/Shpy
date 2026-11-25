import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const expected = {
  bytes: 115008,
  sha256: '27893c782fb375ea892f53ed0ca9d256fffd23ec2ad7cfdac2fa6cc8632faf04',
  width: 384,
  height: 1024,
  frameWidth: 128,
  frameHeight: 256,
};

const file = resolve(process.argv[2] ?? 'src/assets/enemies/enemy-animation-atlas.webp');
const data = await readFile(file);
const fail = (message) => {
  console.error(`Enemy atlas validation failed: ${message}`);
  process.exitCode = 1;
};

if (data.length !== expected.bytes) fail(`expected ${expected.bytes} bytes, got ${data.length}`);
if (data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') {
  fail('file is not a RIFF/WebP image');
}
if (data.toString('ascii', 12, 16) !== 'VP8X') fail('expected an extended WebP (VP8X) header');

const hasAlpha = (data[20] & 0x10) !== 0;
const width = 1 + data.readUIntLE(24, 3);
const height = 1 + data.readUIntLE(27, 3);
if (!hasAlpha) fail('WebP alpha channel flag is missing');
if (width !== expected.width || height !== expected.height) {
  fail(`expected ${expected.width}×${expected.height}, got ${width}×${height}`);
}
if (width / expected.frameWidth !== 3 || height / expected.frameHeight !== 4) {
  fail('expected a 3×4 grid of 128×256 frames');
}

const sha256 = createHash('sha256').update(data).digest('hex');
if (sha256 !== expected.sha256) fail(`SHA-256 mismatch: ${sha256}`);

if (process.exitCode) process.exit(process.exitCode);
console.log(`Enemy atlas OK: ${width}×${height}, 3×4 frames, alpha, ${data.length} bytes`);
console.log(`SHA-256: ${sha256}`);
