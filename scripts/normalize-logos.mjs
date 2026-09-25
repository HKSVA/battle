import sharp from '/Users/una/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';
import path from 'node:path';

const base = path.resolve('public/assets');
const jobs = [
  ['sva-logo-clear-source.png', 'sva-logo-final.png'],
  ['onevent-logo-clear-source.png', 'onevent-logo-final.png'],
];

for (const [source, output] of jobs) {
  const image = sharp(path.join(base, source)).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < data.length; index += 4) {
    const whiteness = Math.min(data[index], data[index + 1], data[index + 2]);
    data[index + 3] = whiteness > 246 ? 0 : Math.round(255 * (1 - Math.max(0, whiteness - 220) / 35));
  }
  await sharp(data, { raw: info }).png().toFile(path.join(base, output));
}
