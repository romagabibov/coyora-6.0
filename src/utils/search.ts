export function generateSearchKeywords(text: string): string[] {
  if (!text) return [];
  const normalized = text.toLowerCase().trim();
  const words = normalized.split(/\s+/).filter(word => word.length > 0);
  
  const keywords = new Set<string>();
  
  // Add full normalized string
  keywords.add(normalized);
  
  // Add each word and its prefixes
  words.forEach(word => {
    // Add the whole word
    keywords.add(word);
    
    // Add substrings/prefixes of length >= 2
    for (let i = 2; i <= Math.min(word.length, 10); i++) {
        keywords.add(word.substring(0, i));
    }
  });
  
  return Array.from(keywords);
}

export function generateApplicationKeywords(app: any): string[] {
    let formDataVals: string[] = [];
    if (app.formData) {
        const targetKeys = ['name', 'surname', 'email', 'phone', 'имя', 'фамилия', 'телефон', 'почта'];
        Object.entries(app.formData).forEach(([key, val]) => {
            if (typeof val === 'string' && targetKeys.some(t => key.toLowerCase().includes(t))) {
               formDataVals.push(val.substring(0, 100));
            }
        });
    }

    const textToSearch = [
        app.name || '',
        app.surname || '',
        app.profileName || '',
        app.profileSurname || '',
        app.email || '',
        ...formDataVals
    ].join(' ').substring(0, 500);
    
    return generateSearchKeywords(textToSearch);
}
