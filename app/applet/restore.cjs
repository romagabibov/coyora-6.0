const fs = require('fs');
let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => \{ setActiveTab\(''\); setIsMobileMenuOpen\(false\); \}\} className=\{\`(.*?)\$\{activeTab === '([^']+)'/g,
  `onClick={() => { setActiveTab('$2'); setIsMobileMenuOpen(false); }} className={\`$1\${activeTab === '$2'`
);

fs.writeFileSync('src/AdminPanel.tsx', code);
