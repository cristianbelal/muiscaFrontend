// Escribe dist/zenodo-muisca/browser/config.js con la configuración del entorno de despliegue.
// Lo ejecuta el hosting después de `ng build` (ver render.yaml):
//   API_URL=https://muisca-api-lab.onrender.com ENVIRONMENT_NAME=Laboratorio node scripts/write-runtime-config.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const output = join('dist', 'zenodo-muisca', 'browser', 'config.js');
if (!existsSync(join('dist', 'zenodo-muisca', 'browser'))) {
  console.error('No existe dist/zenodo-muisca/browser: ejecute primero `npm run build`.');
  process.exit(1);
}

const config = {};
if (process.env.API_URL) config.apiUrl = process.env.API_URL.replace(/\/+$/, '');
if (process.env.GOOGLE_CLIENT_ID) config.googleClientId = process.env.GOOGLE_CLIENT_ID;
if (process.env.ENVIRONMENT_NAME) config.environmentName = process.env.ENVIRONMENT_NAME;

if (!config.apiUrl) {
  console.warn('Advertencia: API_URL no está definida; el frontend usará http://localhost:8080.');
}

writeFileSync(output, `window.__MUISCA_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`);
console.log(`config.js escrito en ${output}:`, config);
