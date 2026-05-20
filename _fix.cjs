const fs = require('fs');
const file_path = 'src/App.tsx';
let code = fs.readFileSync(file_path, 'utf8');

// Fix modal outer containers
code = code.replace(
    /className="fixed inset-0 bg-\[var\(--color-bg\)\] z-50 overflow-y-auto"/g,
    'className="fixed inset-0 bg-[var(--color-bg)] z-[100] overflow-y-auto overscroll-contain block"'
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
    '<div className="w-full md:w-1/2 flex flex-col mt-12 md:mt-0">'
);

fs.writeFileSync(file_path, code);
