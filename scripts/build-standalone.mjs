import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from '/Users/una/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp/dist/index.mjs';

const publicDir = path.resolve('public');
const outputDir = path.resolve('deliverables/CANTOPOP_BATTLE_2026_TEAM_REVIEW');
const mime = { '.svg': 'image/svg+xml' };

let html = await fs.readFile(path.join(publicDir, 'canto-pop-battle-2026.html'), 'utf8');
html = html.replace('<span>EVENT LIST</span>', '<span>IMPORTANT DATES</span>');
const css = await fs.readFile(path.join(publicDir, 'final.css'), 'utf8');
const js = await fs.readFile(path.join(publicDir, 'final.js'), 'utf8');
html = html.replace('<link rel="stylesheet" href="final.css">', () => `<style>${css}</style>`);
html = html.replace('<script src="final.js"></script>', () => `<script>${js}</script>`);

const references = [...new Set([...html.matchAll(/assets\/[A-Za-z0-9_./% -]+\.(?:png|jpe?g|webp|svg)/gi)].map(match => match[0]))];
for (const reference of references) {
  const filePath = path.join(publicDir, reference);
  const extension = path.extname(filePath).toLowerCase();
  const data = extension === '.svg'
    ? await fs.readFile(filePath)
    : await sharp(filePath)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 78, alphaQuality: 88, effort: 5 })
        .toBuffer();
  const uri = `data:${mime[extension] || 'image/webp'};base64,${data.toString('base64')}`;
  html = html.split(reference).join(uri);
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(path.join(outputDir, 'index.html'), html);
