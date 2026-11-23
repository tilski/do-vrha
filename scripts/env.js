// Prebere .env v korenu projekta (KLJUČ=vrednost) in vrne objekt; process.env ima prednost.
const fs = require('fs');
const path = require('path');

module.exports = function beriEnv() {
  const out = {};
  const f = path.join(__dirname, '..', '.env');
  if (fs.existsSync(f)) {
    for (const vrstica of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const m = vrstica.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m) out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
  for (const k of Object.keys(process.env)) if (k.includes('SUPABASE')) out[k] = process.env[k];
  return out;
};
