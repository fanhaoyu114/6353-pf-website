import fs from 'fs';
import path from 'path';

const INPUT = path.resolve('public/models/armory/swerve-original.glb');
const OUTPUT = path.resolve('public/models/armory/swerve.glb');

// Step 1: Use gltf-pipeline to get a clean (but large) GLB
const { execSync } = await import('child_process');
execSync(`npx gltf-pipeline -i "${INPUT}" -o /tmp/swerve-pipeline.glb`, { stdio: 'pipe' });

// Step 2: Read the pipeline output and sanitize + simplify
let buf = fs.readFileSync('/tmp/swerve-pipeline.glb');

// Parse GLB
const jsonLen = buf.readUInt32LE(12);
const jsonType = buf.readUInt32LE(16);
console.log('JSON chunk len:', jsonLen, 'type:', jsonType.toString(16));

let jsonBuf = buf.slice(20, 20 + jsonLen);

// Sanitize: remove all control characters except tab/newline/CR
for (let i = 0; i < jsonBuf.length; i++) {
  const b = jsonBuf[i];
  if ((b <= 0x08) || (b === 0x0B) || (b === 0x0C) || (b >= 0x0E && b <= 0x1F)) {
    jsonBuf[i] = 0x20;
  }
}

// Parse JSON
const jsonStr = jsonBuf.toString('utf8');
let gltf;
try {
  gltf = JSON.parse(jsonStr);
  console.log('JSON parsed OK');
} catch (e) {
  console.error('JSON parse failed:', e.message);
  process.exit(1);
}

// Step 3: Quantize positions to reduce binary size
// Read binary data
const binStart = 20 + jsonLen + 8;
const binChunkLen = buf.readUInt32LE(binStart - 4);
const binData = buf.slice(binStart, binStart + binChunkLen);
console.log('BIN chunk len:', binChunkLen);

// Quantize POSITION accessors to float16-like precision
// by dividing positions by a common scale and storing as float32
// Actually, just use mesh_quantize if available, otherwise skip
// For now, just sanitize and output - the pipeline already optimizes

// Step 4: Rebuild clean GLB
const cleanJson = JSON.stringify(gltf);
const pad = (4 - (cleanJson.length % 4)) % 4;
const paddedJson = cleanJson + ' '.repeat(pad);

const totalLen = 12 + 8 + paddedJson.length + 8 + binData.length;
const out = Buffer.alloc(totalLen);

// GLB Header
out.write('glTF', 0);
out.writeUInt32LE(2, 4);
out.writeUInt32LE(totalLen, 8);

// JSON chunk
out.writeUInt32LE(paddedJson.length, 12);
out.writeUInt32LE(0x4E4F534A, 16); // 'JSON'
out.write(paddedJson, 20);

// BIN chunk
const bo = 20 + paddedJson.length;
out.writeUInt32LE(binData.length, bo);
out.writeUInt32LE(0x004E4942, bo + 4); // 'BIN\0'
binData.copy(out, bo + 8);

fs.writeFileSync(OUTPUT, out);
console.log(`Output: ${(out.length / 1024 / 1024).toFixed(1)} MB`);

// Verify
const verify = fs.readFileSync(OUTPUT);
const vJsonLen = verify.readUInt32LE(12);
const vJson = verify.slice(20, 20 + vJsonLen).toString('utf8');
try {
  JSON.parse(vJson);
  console.log('✓ Output GLB is valid');
} catch (e) {
  console.error('✗ Output GLB invalid:', e.message);
}
