// Compila con la configuración adecuada según dónde se ejecute:
//  - Vercel, despliegue de producción (rama master)  -> configuración "production"
//  - Vercel, despliegue de previsualización (develop) -> configuración "staging"
//  - En local (sin VERCEL_ENV)                         -> configuración "production"
// Así una web de pruebas NUNCA habla con el backend de producción.
import { execSync } from 'node:child_process';

const vercelEnv = process.env.VERCEL_ENV;
const configuracion = vercelEnv === 'preview' ? 'staging' : 'production';

console.log(`\n> Compilando con --configuration=${configuracion} (VERCEL_ENV=${vercelEnv ?? 'no definido'})\n`);
execSync(`npx ng build --configuration=${configuracion}`, { stdio: 'inherit' });
