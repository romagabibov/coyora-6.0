export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text, targetLang } = req.body;
    if (!text || !targetLang) {
      return res.status(400).json({ error: "Missing text or targetLang" });
    }

    const codeMap = {
      'english': 'en',
      'russian': 'ru',
      'azerbaijani': 'az',
    };
    
    const tl = codeMap[targetLang] || targetLang.substring(0, 2);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    let translatedText = text;
    if (data && data[0]) {
      translatedText = data[0].map((item) => item[0]).join('');
    }

    res.status(200).json({ translation: translatedText });
  } catch (e) {
    console.error("Translation error:", e);
    res.status(200).json({ translation: req.body?.text || '' });
  }
}
