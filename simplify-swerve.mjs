/**
 * simplify-swerve.mjs
 * Reduces swerve-original.glb (33MB, 88 meshes, 1.1M vertices) to < 2MB
 * Uses grid-based vertex decimation + manual GLB read/write (no external deps beyond Node.js)
 */

import { readFileSync, writeFileSync } from 'fs';

// --- Config ---
const INPUT = 'public/models/armory/swerve-original.glb';
const OUTPUT = 'public/models/armory/swerve.glb';
const TARGET_TOTAL_VERTICES = 45000; // Budget for total vertices after simplification
const MIN_VERTICES_PER_MESH = 12;

// ============================================================
// GLB Parser
// ============================================================
function parseGLB(buffer) {
  const view = new DataView(buffer);
  
  // Header
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  if (magic !== 'glTF') throw new Error('Not a GLB file');
  const version = view.getUint32(4, true);
  const totalLength = view.getUint32(8, true);
  
  // JSON chunk
  const jsonChunkLen = view.getUint32(12, true);
  const jsonChunkType = view.getUint32(16, true);
  if (jsonChunkType !== 0x4E4F534A) throw new Error('First chunk is not JSON');
  
  const jsonBytes = new Uint8Array(buffer, 20, jsonChunkLen);
  const jsonStr = new TextDecoder().decode(jsonBytes);
  const gltf = JSON.parse(jsonStr);
  
  // BIN chunk
  const binOffset = 20 + jsonChunkLen;
  const binChunkLen = view.getUint32(binOffset, true);
  const binChunkType = view.getUint32(binOffset + 4, true);
  const binData = new Uint8Array(buffer, binOffset + 8, binChunkLen);
  
  return { gltf, binData };
}

// ============================================================
// GLB Writer
// ============================================================
function writeGLB(gltf, binData) {
  const jsonStr = JSON.stringify(gltf);
  
  // Pad JSON to 4-byte alignment
  let jsonPadded = jsonStr;
  while ((jsonPadded.length % 4) !== 0) jsonPadded += ' ';
  
  // Pad BIN to 4-byte alignment
  const binPadded = new Uint8Array(Math.ceil(binData.length / 4) * 4);
  binPadded.set(binData);
  
  const totalLength = 12 + 8 + jsonPadded.length + 8 + binPadded.length;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  
  // GLB header
  bytes[0] = 0x67; bytes[1] = 0x6C; bytes[2] = 0x54; bytes[3] = 0x46; // glTF
  view.setUint32(4, 2, true);  // version
  view.setUint32(8, totalLength, true);
  
  // JSON chunk
  let offset = 12;
  view.setUint32(offset, jsonPadded.length, true); offset += 4;
  view.setUint32(offset, 0x4E4F534A, true); offset += 4; // JSON
  for (let i = 0; i < jsonPadded.length; i++) bytes[offset + i] = jsonPadded.charCodeAt(i);
  offset += jsonPadded.length;
  
  // BIN chunk
  view.setUint32(offset, binPadded.length, true); offset += 4;
  view.setUint32(offset, 0x004E4942, true); offset += 4; // BIN
  bytes.set(binPadded, offset);
  
  return buffer;
}

// ============================================================
// Geometry helpers
// ============================================================
function getAccessorData(gltf, binData, accessorIdx) {
  const acc = gltf.accessors[accessorIdx];
  const bufView = gltf.bufferViews[acc.bufferView];
  const byteOffset = (bufView.byteOffset || 0) + (acc.byteOffset || 0);
  const componentSize = acc.componentType === 5126 ? 4 : (acc.componentType === 5123 ? 2 : (acc.componentType === 5125 ? 4 : 1));
  const typeCounts = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
  const typeCount = typeCounts[acc.type] || 1;
  const stride = bufView.byteStride || (componentSize * typeCount);
  const count = acc.count;
  
  const result = new Float32Array(count * typeCount);
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < typeCount; j++) {
      const srcOffset = byteOffset + i * stride + j * componentSize;
      if (acc.componentType === 5126) {
        result[i * typeCount + j] = new DataView(binData.buffer, binData.byteOffset + srcOffset, 4).getFloat32(0, true);
      } else if (acc.componentType === 5123) {
        result[i * typeCount + j] = new DataView(binData.buffer, binData.byteOffset + srcOffset, 2).getUint16(0, true);
      } else if (acc.componentType === 5125) {
        result[i * typeCount + j] = new DataView(binData.buffer, binData.byteOffset + srcOffset, 4).getUint32(0, true);
      }
    }
  }
  return { data: result, count, typeCount, componentSize, componentType: acc.componentType };
}

// ============================================================
// Grid-based vertex decimation
// ============================================================
function gridDecimate(positions, normals, indices, targetVertexCount) {
  const numVerts = positions.length / 3;
  if (numVerts <= targetVertexCount) {
    return { positions, normals, indices };
  }
  
  // Compute bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]);
    minY = Math.min(minY, positions[i + 1]);
    minZ = Math.min(minZ, positions[i + 2]);
    maxX = Math.max(maxX, positions[i]);
    maxY = Math.max(maxY, positions[i + 1]);
    maxZ = Math.max(maxZ, positions[i + 2]);
  }
  
  const extentX = maxX - minX || 1e-6;
  const extentY = maxY - minY || 1e-6;
  const extentZ = maxZ - minZ || 1e-6;
  
  // Determine grid resolution
  // Number of cells = N^3, we want ~targetVertexCount occupied cells
  // Ratio of occupied cells to total cells depends on geometry, estimate ~30%
  // So N^3 ≈ targetVertexCount / 0.3
  const targetCells = Math.max(targetVertexCount, 100);
  const N = Math.max(2, Math.min(256, Math.round(Math.pow(targetCells / 0.35, 1 / 3))));
  
  // Map vertex to grid cell
  const cellMap = new Map();
  const cellSizeX = extentX / N;
  const cellSizeY = extentY / N;
  const cellSizeZ = extentZ / N;
  
  for (let i = 0; i < numVerts; i++) {
    const cx = Math.min(N - 1, Math.floor((positions[i * 3] - minX) / cellSizeX));
    const cy = Math.min(N - 1, Math.floor((positions[i * 3 + 1] - minY) / cellSizeY));
    const cz = Math.min(N - 1, Math.floor((positions[i * 3 + 2] - minZ) / cellSizeZ));
    const key = cx * N * N + cy * N + cz;
    
    if (!cellMap.has(key)) {
      cellMap.set(key, { idx: i, count: 1 });
    } else {
      const cell = cellMap.get(key);
      cell.count++;
      // Weighted average of positions
      const w1 = 1 / cell.count;
      const w2 = (cell.count - 1) / cell.count;
      cell.idx = i; // Keep last vertex index (approximate)
    }
  }
  
  // Build mapping: old vertex index → new compact vertex index
  const oldToNew = new Int32Array(numVerts);
  oldToNew.fill(-1);
  
  const newPositions = new Float32Array(cellMap.size * 3);
  const newNormals = normals ? new Float32Array(cellMap.size * 3) : null;
  
  // First pass: average positions within each cell
  const cellPositions = new Map(); // key → [sumX, sumY, sumZ, sumNX, sumNY, sumNZ, count]
  for (let i = 0; i < numVerts; i++) {
    const cx = Math.min(N - 1, Math.floor((positions[i * 3] - minX) / cellSizeX));
    const cy = Math.min(N - 1, Math.floor((positions[i * 3 + 1] - minY) / cellSizeY));
    const cz = Math.min(N - 1, Math.floor((positions[i * 3 + 2] - minZ) / cellSizeZ));
    const key = cx * N * N + cy * N + cz;
    
    if (!cellPositions.has(key)) {
      const entry = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], 0, 0, 0, 1];
      if (normals) {
        entry[3] = normals[i * 3];
        entry[4] = normals[i * 3 + 1];
        entry[5] = normals[i * 3 + 2];
      }
      cellPositions.set(key, entry);
    } else {
      const e = cellPositions.get(key);
      const n = e[6] + 1;
      e[0] = (e[0] * e[6] + positions[i * 3]) / n;
      e[1] = (e[1] * e[6] + positions[i * 3 + 1]) / n;
      e[2] = (e[2] * e[6] + positions[i * 3 + 2]) / n;
      if (normals) {
        // Average normals (normalize later)
        e[3] += normals[i * 3];
        e[4] += normals[i * 3 + 1];
        e[5] += normals[i * 3 + 2];
      }
      e[6] = n;
    }
  }
  
  // Second pass: assign compact indices
  let newVertIdx = 0;
  const keyToNewIdx = new Map();
  for (const [key, entry] of cellPositions) {
    keyToNewIdx.set(key, newVertIdx);
    newPositions[newVertIdx * 3] = entry[0];
    newPositions[newVertIdx * 3 + 1] = entry[1];
    newPositions[newVertIdx * 3 + 2] = entry[2];
    
    if (newNormals) {
      // Normalize averaged normal
      const len = Math.sqrt(entry[3] * entry[3] + entry[4] * entry[4] + entry[5] * entry[5]) || 1;
      newNormals[newVertIdx * 3] = entry[3] / len;
      newNormals[newVertIdx * 3 + 1] = entry[4] / len;
      newNormals[newVertIdx * 3 + 2] = entry[5] / len;
    }
    
    newVertIdx++;
  }
  
  // Third pass: map old vertices to new indices
  for (let i = 0; i < numVerts; i++) {
    const cx = Math.min(N - 1, Math.floor((positions[i * 3] - minX) / cellSizeX));
    const cy = Math.min(N - 1, Math.floor((positions[i * 3 + 1] - minY) / cellSizeY));
    const cz = Math.min(N - 1, Math.floor((positions[i * 3 + 2] - minZ) / cellSizeZ));
    const key = cx * N * N + cy * N + cz;
    oldToNew[i] = keyToNewIdx.get(key);
  }
  
  // Rebuild indices, removing degenerate triangles
  const newIndices = [];
  for (let i = 0; i < indices.length; i += 3) {
    const a = oldToNew[indices[i]];
    const b = oldToNew[indices[i + 1]];
    const c = oldToNew[indices[i + 2]];
    
    // Skip degenerate triangles (collapsed to point or line)
    if (a === b || b === c || a === c) continue;
    if (a < 0 || b < 0 || c < 0) continue;
    
    newIndices.push(a, b, c);
  }
  
  return {
    positions: newPositions,
    normals: newNormals,
    indices: new Int32Array(newIndices),
  };
}

// ============================================================
// Main
// ============================================================
function main() {
  console.log('=== Swerve GLB Simplifier (Grid Decimation) ===\n');
  
  // Read and parse GLB
  console.log(`[...] Reading ${INPUT}...`);
  const glbBuffer = readFileSync(INPUT);
  const { gltf, binData } = parseGLB(glbBuffer.buffer.slice(glbBuffer.byteOffset, glbBuffer.byteOffset + glbBuffer.byteLength));
  
  // Analyze meshes
  const meshInfos = gltf.meshes.map((mesh, meshIdx) => {
    let totalVerts = 0;
    let totalTris = 0;
    mesh.primitives.forEach((prim) => {
      const posAcc = gltf.accessors[prim.attributes.POSITION];
      totalVerts += posAcc.count;
      if (prim.indices !== undefined) {
        totalTris += gltf.accessors[prim.indices].count / 3;
      } else {
        totalTris += posAcc.count / 3;
      }
    });
    return { meshIdx, totalVerts, totalTris };
  });
  
  const origTotalVerts = meshInfos.reduce((s, m) => s + m.totalVerts, 0);
  const origTotalTris = meshInfos.reduce((s, m) => s + m.totalTris, 0);
  console.log(`[✓] ${gltf.meshes.length} meshes, ${origTotalVerts.toLocaleString()} vertices, ${origTotalTris.toLocaleString()} triangles\n`);
  
  // Compute per-mesh vertex budget
  for (const info of meshInfos) {
    const ratio = info.totalVerts / origTotalVerts;
    info.targetVerts = Math.max(MIN_VERTICES_PER_MESH, Math.round(TARGET_TOTAL_VERTICES * ratio));
    if (info.totalVerts <= MIN_VERTICES_PER_MESH * 2) {
      info.targetVerts = info.totalVerts; // Don't simplify very small meshes
    }
  }
  
  // Process each primitive in each mesh
  // We'll rebuild binData and update accessors/bufferViews
  const newBinChunks = []; // Array of Uint8Array segments
  let binOffset = 0;
  const newBufferViews = [];
  const newAccessors = [];
  
  // Keep everything from gltf except meshes, accessors, bufferViews
  // We'll rebuild those
  
  // Deep clone what we need
  const newGltf = {
    asset: gltf.asset,
    scene: gltf.scene,
    nodes: JSON.parse(JSON.stringify(gltf.nodes)),
    scenes: JSON.parse(JSON.stringify(gltf.scenes)),
    meshes: [],
    materials: gltf.materials ? JSON.parse(JSON.stringify(gltf.materials)) : undefined,
    accessors: [],
    bufferViews: [],
    buffers: [{ byteLength: 0 }],
  };
  
  // Copy over extras if present
  if (gltf.extras) newGltf.extras = gltf.extras;
  if (gltf.extensions) newGltf.extensions = gltf.extensions;
  if (gltf.extrasRequired) newGltf.extrasRequired = gltf.extrasRequired;
  
  let totalNewVerts = 0;
  let totalNewTris = 0;
  
  console.log('Processing meshes...');
  
  for (let mi = 0; mi < gltf.meshes.length; mi++) {
    const mesh = gltf.meshes[mi];
    const meshInfo = meshInfos[mi];
    const newMesh = { name: mesh.name, primitives: [] };
    
    for (let pi = 0; pi < mesh.primitives.length; pi++) {
      const prim = mesh.primitives[pi];
      
      // Read position data
      const posResult = getAccessorData(gltf, binData, prim.attributes.POSITION);
      const posData = posResult.data;
      const vertCount = posResult.count;
      
      // Read normal data
      let normData = null;
      if (prim.attributes.NORMAL !== undefined) {
        normData = getAccessorData(gltf, binData, prim.attributes.NORMAL).data;
      }
      
      // Read index data
      let idxData = null;
      let idxCount = 0;
      if (prim.indices !== undefined) {
        const idxResult = getAccessorData(gltf, binData, prim.indices);
        idxData = idxResult.data;
        idxCount = idxResult.count;
      } else {
        // Non-indexed: generate sequential indices
        idxData = new Float32Array(vertCount);
        for (let i = 0; i < vertCount; i++) idxData[i] = i;
        idxCount = vertCount;
      }
      
      // Convert to Int32Array for processing
      const idxInt = new Int32Array(idxCount);
      for (let i = 0; i < idxCount; i++) idxInt[i] = idxData[i] | 0;
      
      // Decimate
      const simplified = gridDecimate(
        posData,
        normData,
        idxInt,
        meshInfo.targetVerts
      );
      
      const newVertCount = simplified.positions.length / 3;
      const newIdxCount = simplified.indices.length;
      const newTriCount = Math.floor(newIdxCount / 3);
      
      // Write positions to bin
      const posBytes = new Float32Array(simplified.positions); // ensure aligned
      const posBVIdx = newBufferViews.length;
      const posOffset = binOffset;
      newBufferViews.push({
        byteOffset: posOffset,
        byteLength: posBytes.byteLength,
        target: 34962, // ARRAY_BUFFER
      });
      newBinChunks.push(posBytes);
      binOffset += posBytes.byteLength;
      // Align to 4 bytes
      if (binOffset % 4 !== 0) binOffset += 4 - (binOffset % 4);
      
      const posAccIdx = newAccessors.length;
      newAccessors.push({
        bufferView: posBVIdx,
        componentType: 5126, // FLOAT
        count: newVertCount,
        type: 'VEC3',
        max: [0, 0, 0], // will fill below
        min: [0, 0, 0],
      });
      
      // Compute min/max
      let minX = Infinity, minY = Infinity, minZ = Infinity;
      let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
      for (let i = 0; i < newVertCount; i++) {
        const x = simplified.positions[i * 3];
        const y = simplified.positions[i * 3 + 1];
        const z = simplified.positions[i * 3 + 2];
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
      }
      newAccessors[posAccIdx].max = [
        Math.fround(maxX), Math.fround(maxY), Math.fround(maxZ)
      ];
      newAccessors[posAccIdx].min = [
        Math.fround(minX), Math.fround(minY), Math.fround(minZ)
      ];
      
      // Write normals if present
      let normAccIdx = null;
      if (simplified.normals) {
        const normBytes = new Float32Array(simplified.normals);
        const normBVIdx = newBufferViews.length;
        newBufferViews.push({
          byteOffset: binOffset,
          byteLength: normBytes.byteLength,
          target: 34962,
        });
        newBinChunks.push(normBytes);
        binOffset += normBytes.byteLength;
        if (binOffset % 4 !== 0) binOffset += 4 - (binOffset % 4);
        
        normAccIdx = newAccessors.length;
        newAccessors.push({
          bufferView: normBVIdx,
          componentType: 5126,
          count: newVertCount,
          type: 'VEC3',
        });
      }
      
      // Write indices
      const useUint16 = newVertCount <= 65535 && newVertCount > 0;
      const idxComponentType = useUint16 ? 5123 : 5125; // UNSIGNED_SHORT or UNSIGNED_INT
      
      let idxBytes;
      if (useUint16) {
        idxBytes = new Uint16Array(newIdxCount);
        for (let i = 0; i < newIdxCount; i++) idxBytes[i] = simplified.indices[i];
      } else {
        idxBytes = new Uint32Array(newIdxCount);
        for (let i = 0; i < newIdxCount; i++) idxBytes[i] = simplified.indices[i];
      }
      
      const idxBVIdx = newBufferViews.length;
      newBufferViews.push({
        byteOffset: binOffset,
        byteLength: idxBytes.byteLength,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      });
      newBinChunks.push(idxBytes);
      binOffset += idxBytes.byteLength;
      if (binOffset % 4 !== 0) binOffset += 4 - (binOffset % 4);
      
      const idxAccIdx = newAccessors.length;
      newAccessors.push({
        bufferView: idxBVIdx,
        componentType: idxComponentType,
        count: newIdxCount,
        type: 'SCALAR',
      });
      
      // Build primitive
      const newPrim = {
        attributes: { POSITION: posAccIdx },
        indices: idxAccIdx,
      };
      if (normAccIdx !== null) newPrim.attributes.NORMAL = normAccIdx;
      if (prim.material !== undefined) newPrim.material = prim.material;
      if (prim.mode !== undefined) newPrim.mode = prim.mode;
      
      newMesh.primitives.push(newPrim);
      
      totalNewVerts += newVertCount;
      totalNewTris += newTriCount;
      
      if ((mi + 1) % 20 === 0 || mi === 0 || mi === gltf.meshes.length - 1) {
        const reduction = ((1 - newVertCount / vertCount) * 100).toFixed(1);
        console.log(`  [${mi + 1}/${gltf.meshes.length}] ${vertCount} → ${newVertCount} verts (${reduction}% ↓), ${Math.floor(idxCount / 3)} → ${newTriCount} tris`);
      }
    }
    
    newGltf.meshes.push(newMesh);
  }
  
  // Update buffer size
  newGltf.buffers[0].byteLength = binOffset;
  newGltf.accessors = newAccessors;
  newGltf.bufferViews = newBufferViews;
  
  // Combine bin chunks into single buffer
  const combinedBin = new Uint8Array(binOffset);
  let writePos = 0;
  for (const chunk of newBinChunks) {
    combinedBin.set(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength), writePos);
    writePos += chunk.byteLength;
    // Align
    while (writePos % 4 !== 0) writePos++;
  }
  
  // Write GLB
  console.log(`\n[...] Writing GLB...`);
  const outputBuffer = writeGLB(newGltf, combinedBin);
  writeFileSync(OUTPUT, Buffer.from(outputBuffer));
  
  const origSizeMB = (glbBuffer.length / (1024 * 1024)).toFixed(2);
  const newSizeKB = (outputBuffer.byteLength / 1024).toFixed(1);
  const newSizeMB = (outputBuffer.byteLength / (1024 * 1024)).toFixed(2);
  
  console.log(`\n[✓] Complete!`);
  console.log(`    Vertices: ${origTotalVerts.toLocaleString()} → ${totalNewVerts.toLocaleString()} (${((1 - totalNewVerts / origTotalVerts) * 100).toFixed(1)}% reduction)`);
  console.log(`    Triangles: ${Math.floor(origTotalTris).toLocaleString()} → ${totalNewTris.toLocaleString()} (${((1 - totalNewTris / origTotalTris) * 100).toFixed(1)}% reduction)`);
  console.log(`    File size: ${origSizeMB} MB → ${newSizeMB} MB (${((1 - outputBuffer.byteLength / glbBuffer.length) * 100).toFixed(1)}% reduction)`);
  console.log(`    Output: ${OUTPUT}`);
  
  if (outputBuffer.byteLength <= 2 * 1024 * 1024) {
    console.log(`\n✅ SUCCESS: Under 2MB target!`);
  } else if (outputBuffer.byteLength <= 3 * 1024 * 1024) {
    console.log(`\n⚠️  Under 3MB but over 2MB target.`);
  } else {
    console.log(`\n❌ Still over 3MB. Need more aggressive simplification.`);
  }
}

main();
