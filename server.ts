import 'dotenv/config';
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { initializeFirestore, doc, getDoc, setLogLevel } from "firebase/firestore";

// Suppress benign grpc stream warnings
setLogLevel('error');

// Read firebase config
const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf-8'));
const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

async function startServer() {
  const server = express();
  const PORT = 3000;
  
  // Add body parser
  server.use(express.json());

  // API Route for translation
  server.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLang } = req.body;
      if (!text || !targetLang) {
        return res.status(400).json({ error: "Missing text or targetLang" });
      }

      // Format targetLang into standard lang codes
      const codeMap: Record<string, string> = {
        'english': 'en',
        'russian': 'ru',
        'azerbaijani': 'az',
      };
      
      const tl = codeMap[targetLang] || targetLang.substring(0, 2);
      
      // Use free public Google Translate API endpoint (gtx)
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      let translatedText = text;
      if (data && data[0]) {
        // Concatenate all parts of the translated text
        translatedText = data[0].map((item: any) => item[0]).join('');
      }

      res.json({ translation: translatedText });
    } catch (e: any) {
      console.error("Translation error:", e);
      // Fallback to original text if translation fails
      res.json({ translation: req.body.text });
    }
  });

  const cloudinaryAccounts = [
    {
      cloudName: 'dvbm6gi4y',
      apiKey: '885398182146218',
      apiSecret: 'ioOwlAF6j4Xn2-4UakInbJ4LEno'
    },
    {
      cloudName: 'dtlo6konr',
      apiKey: '522581993615476',
      apiSecret: 'ZpZhzJvZxRGWD1aC8bjmR63pCPQ'
    },
    {
      cloudName: 'depccwitz',
      apiKey: '314999612125241',
      apiSecret: 'a1AvnIVHHUJhmdMENweuDVoDZ88'
    }
  ];

  let currentAccountIndex = 0;

  server.post("/api/sign-cloudinary", async (req, res) => {
    try {
      const crypto = await import('crypto');
      const account = cloudinaryAccounts[currentAccountIndex];
      currentAccountIndex = (currentAccountIndex + 1) % cloudinaryAccounts.length;

      const timestamp = Math.round((new Date).getTime() / 1000);
      const str = `timestamp=${timestamp}${account.apiSecret}`;
      const signature = crypto.createHash('sha1').update(str).digest('hex');
      
      res.json({ 
        timestamp, 
        signature,
        cloudName: account.cloudName,
        apiKey: account.apiKey
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  server.post("/api/delete-cloudinary", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) return res.status(400).json({ error: 'URL is required' });

      // Example URL: https://res.cloudinary.com/cloud_name/image/upload/v123456/public_id.jpg
      const match = url.match(/res\.cloudinary\.com\/([^\/]+)\/(?:image|video|raw)\/upload\/(?:v\d+\/)?([^\.]+)/);
      if (!match) return res.status(400).json({ error: 'Invalid Cloudinary URL' });

      const [_, cloudName, publicIdWithPaths] = match;
      const account = cloudinaryAccounts.find(a => a.cloudName === cloudName);
      if (!account) return res.status(404).json({ error: 'Cloudinary account not found for this image' });

      // Decode the URL components in public_id if any (e.g., spaces or folders)
      const publicId = decodeURIComponent(publicIdWithPaths);

      const crypto = await import('crypto');
      const timestamp = Math.round((new Date).getTime() / 1000);
      
      const str = `public_id=${publicId}&timestamp=${timestamp}${account.apiSecret}`;
      const signature = crypto.createHash('sha1').update(str).digest('hex');

      const formData = new URLSearchParams();
      formData.append('public_id', publicId);
      formData.append('api_key', account.apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      res.json(result);
    } catch (e: any) {
      console.error('Delete cloudinary error:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR to avoid WebSocket connection errors in cloud environment
      },
      appType: "custom",
    });
    server.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    server.use(express.static(distPath, { index: false }));
  }

  server.get('*', async (req, res) => {
    try {
      let template: string;
      
      if (process.env.NODE_ENV !== "production") {
        template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(path.resolve(process.cwd(), 'dist/index.html'), 'utf-8');
      }

      // Fetch branding from Firestore
      try {
        const brandingDoc = await getDoc(doc(db, 'settings', 'branding'));
        if (brandingDoc.exists()) {
          const brandingData = brandingDoc.data().data;
          
          if (brandingData?.ogImageUrl) {
            template = template.replace(
              /<meta property="og:image" content="[^"]*" \/>/g,
              `<meta property="og:image" content="${brandingData.ogImageUrl}" />`
            );
            // Also update JSON-LD image if present
            template = template.replace(
              /"image":\s*"[^"]*"/g,
              `"image": "${brandingData.ogImageUrl}"`
            );
          }
          
          if (brandingData?.faviconUrl) {
            template = template.replace(
              /<link rel="icon" type="image\/jpeg" href="[^"]*" \/>/g,
              `<link rel="icon" href="${brandingData.faviconUrl}" />`
            );
          }
          
          if (brandingData?.logoUrl) {
            template = template.replace(
              /"logo":\s*"[^"]*"/g,
              `"logo": "${brandingData.logoUrl}"`
            );
          }
        }
      } catch (err) {
        console.error("Error fetching branding for SSR:", err);
      }

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      if (vite) {
        vite.ssrFixStacktrace(e);
      }
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
