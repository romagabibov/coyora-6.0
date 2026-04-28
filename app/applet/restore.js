import { execSync } from 'child_process';
try {
  execSync('git checkout -- src/AdminPanel.tsx');
  console.log('Restored');
} catch (e) {
  console.error(e);
}
