import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Start a separate process group so a deadline also stops tool/server children.
const [deadlineText, command, ...args] = process.argv.slice(2);
const deadline = Number(deadlineText);
if (!command || !Number.isFinite(deadline) || deadline <= Date.now()) {
  console.error('Factory deadline reached; command was not started');
  process.exit(124);
}

const child = spawn(command, args, { stdio: 'inherit', detached: true });
let pidFile;
if (process.env.FACTORY_PROCESS_DIR) {
  fs.mkdirSync(process.env.FACTORY_PROCESS_DIR, { recursive: true });
  pidFile = path.join(process.env.FACTORY_PROCESS_DIR, `${process.pid}.pid`);
  fs.writeFileSync(pidFile, String(process.pid));
  process.on('exit', () => { try { fs.unlinkSync(pidFile); } catch {} });
}
let timer;
let forceTimer;
let stopped = false;
const stop = (signal) => {
  if (stopped) return;
  stopped = true;
  console.error(`Factory command stopped (${signal === 'SIGTERM' ? 'deadline or termination' : signal})`);
  try { process.kill(-child.pid, signal); } catch {}
  forceTimer = setTimeout(() => {
    try { process.kill(-child.pid, 'SIGKILL'); } catch {}
  }, 500);
};
timer = setTimeout(() => stop('SIGTERM'), Math.min(deadline - Date.now(), 2_147_483_647));
process.on('SIGTERM', () => stop('SIGTERM'));
process.on('SIGINT', () => stop('SIGINT'));
child.on('error', (error) => {
  clearTimeout(timer);
  clearTimeout(forceTimer);
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  clearTimeout(timer);
  process.exitCode = stopped ? 124 : (code ?? 1);
  if (!stopped) {
    // CLI/tool launchers can exit while leaving a server or another child behind.
    // Keep the registry entry until that entire group has been cleaned up.
    try {
      process.kill(-child.pid, 'SIGTERM');
      forceTimer = setTimeout(() => {
        try { process.kill(-child.pid, 'SIGKILL'); } catch {}
      }, 500);
    } catch { /* No process group remains. */ }
  }
  // Keep an existing escalation timer alive when descendants ignore TERM.
});
