import { app } from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`Dreamers Centre Fellowship API listening on http://localhost:${env.port}`);
  console.log(`Database: ${env.dbPath}`);
});
