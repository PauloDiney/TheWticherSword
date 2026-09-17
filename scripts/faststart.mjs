/**
 * Move o índice (`moov`) do MP4 para o início do arquivo — o equivalente ao
 * `-movflags +faststart` do ffmpeg, porém sem recomprimir nada: os bytes de
 * vídeo (`mdat`) são copiados intactos.
 *
 * Por que isso importa: com o `moov` no fim, o navegador precisa baixar o
 * arquivo inteiro antes de saber a duração e antes de conseguir resolver
 * qualquer seek. O scrub por scroll busca o tempo todo, então o vídeo trava.
 *
 * Como os offsets de chunk em `stco`/`co64` são absolutos dentro do arquivo,
 * reordenar os boxes exige somar o deslocamento do `mdat` em cada entrada.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INPUT = resolve(ROOT, 'public/optimized-sword.mp4');
const OUTPUT = resolve(ROOT, 'public/sword-scroll.mp4');

/** Boxes cujo conteúdo é uma lista de outros boxes, logo após o cabeçalho. */
const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl']);

/** Lê a lista de boxes de um intervalo do buffer. */
function readBoxes(buf, start = 0, end = buf.length) {
  const boxes = [];
  let offset = start;

  while (offset + 8 <= end) {
    let size = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    let headerSize = 8;

    if (size === 1) {
      size = Number(buf.readBigUInt64BE(offset + 8));
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }

    if (size < headerSize || offset + size > end) {
      throw new Error(`box "${type}" inválido no offset ${offset} (size ${size})`);
    }

    boxes.push({ type, start: offset, size, headerSize });
    offset += size;
  }

  return boxes;
}

/** Soma `delta` a toda tabela de offsets de chunk encontrada dentro do moov. */
function shiftChunkOffsets(moov, delta) {
  const entries = [];

  const walk = (start, end) => {
    for (const box of readBoxes(moov, start, end)) {
      const body = box.start + box.headerSize;

      if (box.type === 'stco') {
        const count = moov.readUInt32BE(body + 4);
        for (let i = 0; i < count; i++) {
          const at = body + 8 + i * 4;
          const shifted = moov.readUInt32BE(at) + delta;
          moov.writeUInt32BE(shifted, at);
          entries.push(shifted);
        }
      } else if (box.type === 'co64') {
        const count = moov.readUInt32BE(body + 4);
        for (let i = 0; i < count; i++) {
          const at = body + 8 + i * 8;
          const shifted = moov.readBigUInt64BE(at) + BigInt(delta);
          moov.writeBigUInt64BE(shifted, at);
          entries.push(Number(shifted));
        }
      } else if (CONTAINERS.has(box.type)) {
        walk(body, box.start + box.size);
      }
    }
  };

  walk(0, moov.length);
  return entries;
}

/** Duração em segundos, lida do `mvhd`. */
function readDuration(moov) {
  const at = moov.indexOf('mvhd', 0, 'latin1');
  if (at < 0) return null;

  const version = moov.readUInt8(at + 4);
  return version === 1
    ? Number(moov.readBigUInt64BE(at + 28)) / moov.readUInt32BE(at + 24)
    : moov.readUInt32BE(at + 20) / moov.readUInt32BE(at + 16);
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(2)} MB`;

// ---------------------------------------------------------------------------

const source = readFileSync(INPUT);
const boxes = readBoxes(source);
const layout = boxes.map((b) => b.type).join(' ');

const ftyp = boxes.find((b) => b.type === 'ftyp');
const moovBox = boxes.find((b) => b.type === 'moov');
const mdatBox = boxes.find((b) => b.type === 'mdat');

if (!ftyp || !moovBox || !mdatBox) {
  throw new Error(`MP4 sem ftyp/moov/mdat — boxes encontrados: ${layout}`);
}

console.log(`entrada : ${INPUT}`);
console.log(`          ${mb(source.length)} · boxes: ${layout}`);

if (boxes.indexOf(moovBox) < boxes.indexOf(mdatBox)) {
  console.log('\nO moov já vem antes do mdat — nada a fazer.');
  process.exit(0);
}

// Nova ordem: ftyp, moov, e o restante preservando a ordem original.
const rest = boxes.filter((b) => b !== ftyp && b !== moovBox);
const moov = Buffer.from(source.subarray(moovBox.start, moovBox.start + moovBox.size));

let cursor = ftyp.size + moov.length;
let newMdatStart = -1;
for (const box of rest) {
  if (box === mdatBox) {
    newMdatStart = cursor;
    break;
  }
  cursor += box.size;
}

const delta = newMdatStart - mdatBox.start;
const patched = shiftChunkOffsets(moov, delta);

const output = Buffer.concat([
  source.subarray(ftyp.start, ftyp.start + ftyp.size),
  moov,
  ...rest.map((b) => source.subarray(b.start, b.start + b.size)),
]);

writeFileSync(OUTPUT, output);

// --- validação -------------------------------------------------------------

const check = readFileSync(OUTPUT);
const newBoxes = readBoxes(check);
const newLayout = newBoxes.map((b) => b.type).join(' ');
const newMoov = newBoxes.find((b) => b.type === 'moov');
const newMdat = newBoxes.find((b) => b.type === 'mdat');

const problems = [];

if (newBoxes.indexOf(newMoov) !== 1) {
  problems.push(`moov deveria ser o 2º box, está na posição ${newBoxes.indexOf(newMoov)}`);
}
if (check.length !== source.length) {
  problems.push(`tamanho mudou: ${source.length} -> ${check.length}`);
}

const dataStart = newMdat.start + newMdat.headerSize;
const dataEnd = newMdat.start + newMdat.size;
const foraDaFaixa = patched.filter((o) => o < dataStart || o >= dataEnd);
if (foraDaFaixa.length > 0) {
  problems.push(`${foraDaFaixa.length} offset(s) de chunk fora do mdat (ex.: ${foraDaFaixa[0]})`);
}

const before = readDuration(source.subarray(moovBox.start, moovBox.start + moovBox.size));
const after = readDuration(check.subarray(newMoov.start, newMoov.start + newMoov.size));
if (before === null || after === null || Math.abs(before - after) > 0.001) {
  problems.push(`duração divergente: ${before} -> ${after}`);
}

console.log(`\nsaída   : ${OUTPUT}`);
console.log(`          ${mb(check.length)} · boxes: ${newLayout}`);
console.log(`          mdat deslocado ${delta} bytes · ${patched.length} offset(s) corrigido(s)`);
console.log(`          duração ${after?.toFixed(2)}s (origem ${before?.toFixed(2)}s)`);

if (problems.length > 0) {
  console.error('\nFALHOU:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log('\nOK — o índice agora está no início e o vídeo pode ser buscado durante o download.');
