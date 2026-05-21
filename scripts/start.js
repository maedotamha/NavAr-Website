const { spawn } = require('node:child_process');
const children = [
  spawn('npm', ['start', '--prefix', 'backend'], { stdio: 'inherit', shell: true }),
  spawn('npm', ['start', '--prefix', 'frontend'], { stdio: 'inherit', shell: true })
];
function stop(){ for (const child of children) child.kill(); }
process.on('SIGINT', stop);
process.on('SIGTERM', stop);