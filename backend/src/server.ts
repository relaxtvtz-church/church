import { app, ready } from './app.js';
import { env } from './config/env.js';

ready
  .then(() => {
    app.listen(env.port, () => {
      console.log(`Dreamers Centre Fellowship API listening on http://localhost:${env.port}`);
      console.log(`Database: ${env.databaseUrl ? 'Postgres' : env.dbPath}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialise database:', error);
    process.exit(1);
  });
