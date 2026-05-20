const fs = require('fs');

let code = fs.readFileSync('src/components/VolunteerForm.tsx', 'utf8');

if (!code.includes('import { CustomSelect }')) {
  code = code.replace(
    "import { Toast } from './Toast';",
    "import { Toast } from './Toast';\nimport { CustomSelect } from './CustomSelect';"
  );
}

// Replace Dropdown rendering
code = code.replace(
  /<select\s+value=\{formDataState\[f\.id\] \|\| ''\}\s+onChange=\{e => \{\s+setFormDataState\(\{\.\.\.formDataState, \[f\.id\]: e\.target\.value\}\);\s+setValidationError\(''\);\s+\}\}\s+className=\{`w-full bg-transparent border p-4 font-mono text-sm outline-none transition-colors rounded-lg appearance-none \$\{validationError \? 'border-\[#fe0000\]' : 'border-\[var\(--color-border\)\] focus:border-\[#fe0000\]'}`\}\s*>\s*<option value="" disabled className="bg-\[var\(--color-bg\)\]">\{translate\('Select an option'\)\}<\/option>\s*\{f\.options\?\.map\(\(opt: string\) => \(\s*<option key=\{opt\} value=\{opt\} className="bg-\[var\(--color-bg\)\]">\{opt\}<\/option>\s*\)\)\}\s*<\/select>\s*<div className="absolute right-4 top-1\/2 -translate-y-1\/2 pointer-events-none text-\[var\(--color-muted\)\]">\s*▼\s*<\/div>/g,
  `<CustomSelect 
                  options={f.options || []} 
                  value={formDataState[f.id] || ''} 
                  onChange={(val) => {
                    setFormDataState({...formDataState, [f.id]: val});
                    setValidationError('');
                  }} 
                  placeholder={translate('Select an option')} 
                  hasError={!!validationError} 
                />`
);

// Fix duplicate labels overwriting each other in finalFormData
const finalFormDataOld = `finalFormData[s.label] = formDataState[s.id] !== undefined ? formDataState[s.id] : '';`;
const finalFormDataNew = `let key = s.label;
          if (finalFormData[key] !== undefined) {
             key = \`\${key} (\${s.id})\`;
          }
          finalFormData[key] = formDataState[s.id] !== undefined ? formDataState[s.id] : '';`;

code = code.replace(finalFormDataOld, finalFormDataNew);

const fileFormDataOld = `finalFormData[s.label] = val;`;
const fileFormDataNew = `let key = s.label;
               if (finalFormData[key] !== undefined && finalFormData[key] !== '') {
                  key = \`\${key} (\${s.id})\`;
               }
               finalFormData[key] = val;`;

code = code.replace(fileFormDataOld, fileFormDataNew);

const fileFormDataOld2 = `finalFormData[s.label] = '';`;
const fileFormDataNew2 = `let key = s.label;
               if (finalFormData[key] !== undefined && finalFormData[key] !== '') {
                  key = \`\${key} (\${s.id})\`;
               }
               finalFormData[key] = '';`;

code = code.replace(fileFormDataOld2, fileFormDataNew2);

fs.writeFileSync('src/components/VolunteerForm.tsx', code);
