import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { frontend, backend, vite, next, tsc, run } from './processes.mjs';
await run(frontend, [tsc, '--noEmit']);
await run(frontend, [vite, 'build']);
// Generated React files are served by Next.js in production, on one origin.
mkdirSync(resolve(backend,'public'), {recursive:true});
cpSync(resolve(frontend,'dist'), resolve(backend,'public'), {recursive:true});
await run(backend, [next, 'build', '--webpack']);
