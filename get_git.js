import { execSync } from 'child_process';
try {
  const output = execSync('git log -p src/utils/audio.ts', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.error(e);
}
