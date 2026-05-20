const fs = require('fs');
let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

code = code.replace(
  /onClick={\(\) => setActiveTab\('([^']+)'\)}/g,
  `onClick={() => { setActiveTab('$1'); setIsMobileMenuOpen(false); }}`
);

fs.writeFileSync('src/AdminPanel.tsx', code);
