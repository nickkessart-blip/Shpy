import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const expected = {
  bytes: 63266,
  sha256: '6af559f7b2b6fd4950cdd098e4792e6e56c9ca3bbb8324a691335f030fa3cc67',
  width: 768,
  height: 1152,
  frameWidth: 192,
  frameHeight: 288,
  columns: 4,
  rows: 4,
};

const file = resolve(process.argv[2] ?? 'src/assets/enemies/animation-atlas.png');
const data = await readFile(file);
const fail = (message) => {
  console.error(`Enemy atlas validation failed: ${message}`);
  process.exitCode = 1;
};

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (data.length < 32 || !data.subarray(0, 8).equals(signature)) {
  fail('file is not a PNG image');
} else {
  let offset = 8;
  let width = 0;
  let height = 0;
  let hasTransparency = false;
  let hasEnd = false;
  while (offset + 12 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.toString('ascii', offset + 4, offset + 8);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > data.length) {
      fail(`truncated ${type} chunk`);
      break;
    }
    const payload = data.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR' && length === 13) {
      width = payload.readUInt32BE(0);
      height = payload.readUInt32BE(4);
      if (payload[9] !== 3) fail('expected an indexed-colour PNG');
    }
    if (type === 'tRNS') hasTransparency = payload.some((alpha) => alpha < 255);
    if (type === 'IEND') {
      hasEnd = true;
      break;
    }
    offset = chunkEnd;
  }

  if (width !== expected.width || height !== expected.height) {
    fail(`expected ${expected.width}×${expected.height}, got ${width}×${height}`);
  }
  if (width % expected.frameWidth !== 0 || height % expected.frameHeight !== 0
    || width / expected.frameWidth !== expected.columns
    || height / expected.frameHeight !== expected.rows) {
    fail('expected a 4×4 grid of 192×288 frames');
  }
  if (!hasTransparency) fail('PNG transparency table is missing');
  if (!hasEnd) fail('PNG IEND chunk is missing');
}

if (data.length !== expected.bytes) fail(`expected ${expected.bytes} bytes, got ${data.length}`);
const sha256 = createHash('sha256').update(data).digest('hex');
if (sha256 !== expected.sha256) fail(`SHA-256 mismatch: ${sha256}`);

if (process.exitCode) process.exit(process.exitCode);
console.log(`Enemy atlas OK: ${expected.width}×${expected.height}, 4×4 frames, transparency, ${data.length} bytes`);
console.log(`SHA-256: ${sha256}`);
