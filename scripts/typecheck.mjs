import { frontend, backend, tsc, run } from './processes.mjs';
await run(frontend, [tsc, '--noEmit']);
await run(backend, [tsc, '--noEmit']);
