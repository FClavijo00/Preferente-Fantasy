// Entorno de PRUEBAS (rama develop → web de previsualización de Vercel).
// Habla con el backend de staging de Railway, que usa una COPIA de la base de datos.
export const environment = {
  production: true,
  entorno: 'staging' as 'local' | 'staging' | 'produccion',
  // URL del backend del entorno "staging" de Railway (Settings → Networking del servicio)
  apiBaseURL: 'https://preferente-fantasy-back-staging.up.railway.app/api',
  storageBucket: 'https://t3.storageapi.dev/integrated-shoebox-gfnvqe/',
  siteUrl: 'https://preferente-fantasy.vercel.app',
};
