const fs = require('fs');

function fixAdminPanel() {
  let code = fs.readFileSync('src/AdminPanel.tsx', 'utf8');

  // Fix 1: Cloudinary Image in Application Details
  code = code.replace(
    /className="text-\[#fe0000\] hover:underline break-all">\s*\{value\}\s*<\/a>\s*\) : \(/g,
    `className="text-[#fe0000] hover:underline break-all">\n                            {value}\n                          </a>\n                          {value.includes('res.cloudinary.com') && (\n                            <a href={value} target="_blank" rel="noopener noreferrer" className="block mt-2">\n                               <img src={value} alt="Attachment" className="max-w-full h-auto max-h-48 object-cover rounded border border-[#e5e7eb]" />\n                            </a>\n                          )}\n                        </div>\n                        ) : (`
  );

  code = code.replace(
    /\{\s*typeof value === 'string' && \(value\.startsWith\('http:\/\/'\) \|\| value\.startsWith\('https:\/\/'\)\) \? \(/g,
    `{typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (\n                        <div className="flex flex-col items-start gap-1">`
  );

  // Fix 2: Refresh Button apps Cache!
  code = code.replace(
    /const loadApplications = async \(formId: string, loadMore = false, searchQuery = ''\) => {/g,
    `const loadApplications = async (formId: string, loadMore = false, searchQuery = '', forceRefresh = false) => {`
  );
  
  code = code.replace(
    /if \(!loadMore && appsCache\[cacheKey\]\) {/g,
    `if (!loadMore && !forceRefresh && appsCache[cacheKey]) {`
  );

  code = code.replace(
    /loadApplications\(selectedFormForApps\);/g,
    `loadApplications(selectedFormForApps, false, appSearchQuery, true);`
  );

  // Fix 3: Application Details swipebar and data-lenis-prevent
  code = code.replace(
    /className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1"/g,
    `className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1 custom-scrollbar" data-lenis-prevent="true"`
  );

  fs.writeFileSync('src/AdminPanel.tsx', code);
}

function fixViewResponses() {
  let code = fs.readFileSync('src/ViewResponses.tsx', 'utf8');

  code = code.replace(
    /className="text-\[#fe0000\] hover:underline break-all">\s*\{value\}\s*<\/a>\s*\) : \(/g,
    `className="text-[#fe0000] hover:underline break-all">\n                          {value}\n                        </a>\n                        {value.includes('res.cloudinary.com') && (\n                          <a href={value} target="_blank" rel="noopener noreferrer" className="block mt-2">\n                             <img src={value} alt="Attachment" className="max-w-full h-auto max-h-48 object-cover rounded border border-[#e5e7eb]" />\n                          </a>\n                        )}\n                      </div>\n                      ) : (`
  );

  code = code.replace(
    /\{\s*typeof value === 'string' && \(value\.startsWith\('http:\/\/'\) \|\| value\.startsWith\('https:\/\/'\)\) \? \(/g,
    `{typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')) ? (\n                      <div className="flex flex-col items-start gap-1">`
  );

  code = code.replace(
    /className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1"/g,
    `className="p-6 space-y-6 font-mono text-sm text-gray-900 overflow-y-auto flex-1 custom-scrollbar" data-lenis-prevent="true"`
  );

  fs.writeFileSync('src/ViewResponses.tsx', code);
}

fixAdminPanel();
fixViewResponses();
