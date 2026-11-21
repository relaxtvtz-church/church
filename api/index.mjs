import { app, ready } from '../backend/dist/app.js';

const initialised = ready.catch((error) => {
  console.error('Database initialisation failed:', error);
  throw error;
});

export default async function handler(request, response) {
  await initialised;
  return app(request, response);
}
