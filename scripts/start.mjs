import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { backend, next, run, launch, watch } from './processes.mjs';
if (!existsSync(resolve(backend,'.next/BUILD_ID')) || !existsSync(resolve(backend,'public/index.html'))) {
  throw new Error('Run npm run build before npm start.');
}
await run(backend, ['db/migrate.mjs'], {NODE_ENV:'production'});
const port = process.env.PORT || '3001';
console.log(`Choose Hideaway production: http://127.0.0.1:${port}`);
watch([launch(backend, [next, 'start', '--hostname', process.env.HOST || '127.0.0.1', '--port', port], {NODE_ENV:'production'})]);
