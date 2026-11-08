import { spawn } from 'node:child_process';
const child = spawn('npm', ['run', 'dev:web'], { stdio: 'inherit', env: process.env });
child.on('exit', (code) => process.exit(code ?? 0));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
