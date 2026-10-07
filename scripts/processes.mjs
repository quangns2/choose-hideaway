import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
export const frontend = resolve(root, 'frontend');
export const backend = resolve(root, 'backend');
export const vite = resolve(root, 'node_modules/vite/bin/vite.js');
export const next = resolve(root, 'node_modules/next/dist/bin/next');
export const tsc = resolve(root, 'node_modules/typescript/bin/tsc');
export function launch(cwd, args, env = {}) {
  return spawn(process.execPath, args, {cwd, env:{...process.env,...env}, stdio:'inherit', windowsHide:true});
}
export function run(cwd, args, env = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = launch(cwd, args, env);
    child.on('error', reject);
    child.on('exit', (code, signal) => code === 0 ? resolvePromise() : reject(new Error(`Command failed (${signal || code}): ${args.join(' ')}`)));
  });
}
export function stop(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    // Terminate the process tree launched by this runner, including Next workers.
    const terminator = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {stdio:'ignore', windowsHide:true});
    terminator.on('error', () => child.kill());
  } else child.kill('SIGTERM');
}
export function watch(children) {
  let shuttingDown = false;
  const shutdown = code => {
    if (shuttingDown) return;
    shuttingDown = true;
    children.forEach(stop);
    setTimeout(()=>process.exit(code), 500).unref();
  };
  process.on('SIGINT', ()=>shutdown(0));
  process.on('SIGTERM', ()=>shutdown(0));
  children.forEach(child => {
    child.on('error', error => {console.error(error.message);shutdown(1);});
    child.on('exit', code => {if (!shuttingDown) shutdown(code ?? 1);});
  });
}
