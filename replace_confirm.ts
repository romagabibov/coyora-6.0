import fs from 'fs';

const path = 'src/AdminPanel.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace all instances of window.confirm(...) with true
content = content.replace(/window\.confirm\([^)]+\)/g, 'true');

fs.writeFileSync(path, content, 'utf8');
console.log('Replaced window.confirm');
