import sharp from '/Users/una/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';
import path from 'node:path';

const source = '/Users/una/Desktop/2026 Work/SVA/CANTOPOP BATTLE/Logo pack/rock soul logo transparange.png';
const output = path.resolve('public/assets');
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

for (let index = 0; index < data.length; index += 4) {
  const red = data[index], green = data[index + 1], blue = data[index + 2];
  const neutral = Math.max(red, green, blue) - Math.min(red, green, blue) < 7;
  const brightness = (red + green + blue) / 3;
  if (neutral && brightness > 115 && brightness < 230) data[index + 3] = 0;
}

const half = Math.floor(info.width / 2);
const rock = await sharp(Buffer.from(data), { raw: info }).extract({ left: 0, top: 0, width: half, height: info.height }).png().toBuffer();
const soul = await sharp(Buffer.from(data), { raw: info }).extract({ left: half, top: 0, width: info.width - half, height: info.height }).png().toBuffer();
await sharp(rock).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(output, 'cantopop-rock-logo-final.png'));
await sharp(soul).trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(path.join(output, 'cantopop-soul-logo-final.png'));
