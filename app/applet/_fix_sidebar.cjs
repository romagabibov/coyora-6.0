const fs = require('fs');

let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

if (!code.includes('isMobileMenuOpen')) {
  code = code.replace(
    /const \[attendanceLoading, setAttendanceLoading\] = useState\(false\);/,
    `const [attendanceLoading, setAttendanceLoading] = useState(false);\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);`
  );
}

// Modify the header to add the toggle button
const headerOld = `<div className="flex gap-4 items-center">
                      <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-medium text-[#6b7280] hover:text-[#fe0000] transition-colors">
                        Logout
                      </button>`;
const headerNew = `<div className="flex gap-4 items-center">
                      <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden flex items-center gap-2 text-xs font-medium text-black bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded transition-colors">
                        {isMobileMenuOpen ? 'Hide Menu' : 'Show Menu'}
                      </button>
                      <button onClick={handleLogout} className="hidden md:flex items-center gap-2 text-xs font-medium text-[#6b7280] hover:text-[#fe0000] transition-colors">
                        Logout
                      </button>`;

code = code.replace(headerOld, headerNew);

// Modify the sidebar classes
const sidebarOld = `<div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#e5e7eb] p-4 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto whitespace-nowrap bg-white shrink-0 tracking-tight">`;
const sidebarNew = `<div className={\`\${isMobileMenuOpen ? 'flex' : 'hidden md:flex'} w-full md:w-64 border-b md:border-b-0 md:border-r border-[#e5e7eb] p-4 flex-col gap-1 overflow-y-auto whitespace-nowrap bg-white shrink-0 tracking-tight\`}>`;

code = code.replace(sidebarOld, sidebarNew);

// Since we changed it from flex-row on mobile to flex-col (and hidden), we need to make sure the user knows to use the menu.
// When a tab is selected on mobile, we can also auto-close the menu.
code = code.replace(
  /onClick={\(\) => setActiveTab\('([a-z_]+)'\)}/g,
  `onClick={() => { setActiveTab('$1'); setIsMobileMenuOpen(false); }}`
);

fs.writeFileSync('src/AdminPanel.tsx', code);
