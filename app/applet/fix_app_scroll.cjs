const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf-8");
content = content.replace(/className="fixed inset-0 bg-\[var\(--color-bg\)\] z-\[100\] overflow-y-auto overscroll-contain block"/g, 'className="fixed inset-0 bg-[var(--color-bg)] z-[100] overflow-y-auto overscroll-contain block" data-lenis-prevent="true"');
content = content.replace(/className="fixed inset-0 bg-\[var\(--color-bg\)\] z-\[100\] overflow-y-auto overscroll-contain block p-6"/g, 'className="fixed inset-0 bg-[var(--color-bg)] z-[100] overflow-y-auto overscroll-contain block p-6" data-lenis-prevent="true"');
fs.writeFileSync("src/App.tsx", content);
