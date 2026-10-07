import { backend, frontend, next, vite, run, launch, watch } from './processes.mjs';
await run(backend, ['db/migrate.mjs']);
console.log('Choose Hideaway frontend: http://127.0.0.1:5173');
console.log('Next.js backend: http://127.0.0.1:3001/api/health');
watch([
  launch(backend, [next, 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', '3001']),
  launch(frontend, [vite]),
]);
