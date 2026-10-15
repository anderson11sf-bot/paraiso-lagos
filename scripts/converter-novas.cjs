const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = 'C:/Users/ander/OneDrive/Desktop/agua mminando/novas';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jpg'));
console.log('Arquivos encontrados:', files);

const dests = [
  'gleba-c.webp',
  'gleba-f.webp',
  'gleba-g.webp',
  'comunidade.webp',
  'infraestrutura.webp',
  'vida-chacara.webp'
];

files.forEach((f, idx) => {
  if (!dests[idx]) return;
  const src = path.join(dir, f);
  const dst = path.join(__dirname, '../public/media/img', dests[idx]);
  console.log(`Convertendo ${src} -> ${dst}`);
  execSync(`ffmpeg -y -i "${src}" -vf "scale=1280:-2" -c:v libwebp -q:v 80 "${dst}"`, { stdio: 'inherit' });
});
console.log('Todas as 6 novas imagens convertidas com sucesso!');
