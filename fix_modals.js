const fs = require('fs');
const file_path = 'src/App.tsx';
let code = fs.readFileSync(file_path, 'utf8');

// Fix modal outer containers
code = code.replace(
    /className="fixed inset-0 bg-\[var\(--color-bg\)\] z-50 overflow-y-auto"/g,
    'className="fixed inset-0 bg-[var(--color-bg)] z-[100] overflow-y-auto overscroll-contain block"'
);

// Fix info modal outer container
code = code.replace(
    /className="fixed inset-0 bg-\[var\(--color-bg\)\] z-50 overflow-y-auto flex items-center justify-start md:justify-center p-6"/g,
    'className="fixed inset-0 bg-[var(--color-bg)] z-[100] overflow-y-auto overscroll-contain block p-6 md:p-12"'
);
code = code.replace(
    /<div className="bg-\[var\(--color-surface\)\] border border-\[var\(--color-border\)\] p-8 md:p-12 max-w-2xl w-full relative z-10">/g,
    '<div className="bg-[var(--color-surface)] border border-[var(--color-border)] p-8 md:p-12 max-w-2xl w-full relative z-10 mx-auto mt-12 mb-24">'
);

// Fix min-h-[100dvh]
code = code.replace(
    /<div className="min-h-\[100dvh\] p-6 md:p-12 flex flex-col relative z-10">/g,
    '<div className="min-h-full p-6 md:p-12 flex flex-col relative z-10 pb-24 border-box">'
);

// Fix centering that cuts off tops
code = code.replace(
    /<div className="max-w-7xl mx-auto w-full flex-1 flex flex-col justify-start md:my-auto md:justify-center">/g,
    '<div className="max-w-7xl mx-auto w-full flex flex-col mt-4 md:mt-12 mb-12">'
);
code = code.replace(
    /<div className="w-full md:w-1\/2 flex flex-col justify-center">/g,
    '<div className="w-full md:w-1/2 flex flex-col">'
);

fs.writeFileSync(file_path, code);
