import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'frontend', 'public', 'brand');
const destination = path.join(root, 'backend', 'public', 'brand');

if (fs.existsSync(source)) {
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of fs.readdirSync(source)) {
    fs.copyFileSync(path.join(source, entry), path.join(destination, entry));
  }
  console.log(`Prepared brand assets in ${destination}`);
} else {
  console.warn('Brand assets not found; PDFs will use the drawn ministry mark.');
}
