import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const cloudinaryAccounts = [];
    
    if (process.env.CLOUDINARY_CLOUD_NAME_1 && process.env.CLOUDINARY_API_KEY_1 && process.env.CLOUDINARY_API_SECRET_1) {
      cloudinaryAccounts.push({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME_1,
        apiKey: process.env.CLOUDINARY_API_KEY_1,
        apiSecret: process.env.CLOUDINARY_API_SECRET_1
      });
    }
    
    if (process.env.CLOUDINARY_CLOUD_NAME_2 && process.env.CLOUDINARY_API_KEY_2 && process.env.CLOUDINARY_API_SECRET_2) {
      cloudinaryAccounts.push({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME_2,
        apiKey: process.env.CLOUDINARY_API_KEY_2,
        apiSecret: process.env.CLOUDINARY_API_SECRET_2
      });
    }
    
    if (process.env.CLOUDINARY_CLOUD_NAME_3 && process.env.CLOUDINARY_API_KEY_3 && process.env.CLOUDINARY_API_SECRET_3) {
      cloudinaryAccounts.push({
        cloudName: process.env.CLOUDINARY_CLOUD_NAME_3,
        apiKey: process.env.CLOUDINARY_API_KEY_3,
        apiSecret: process.env.CLOUDINARY_API_SECRET_3
      });
    }

    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    const match = url.match(/res\.cloudinary\.com\/([^\/]+)\/(?:image|video|raw)\/upload\/(?:v\d+\/)?([^\.]+)/);
    if (!match) return res.status(400).json({ error: 'Invalid Cloudinary URL' });

    const [_, cloudName, publicIdWithPaths] = match;
    const account = cloudinaryAccounts.find(a => a.cloudName === cloudName);
    if (!account) return res.status(404).json({ error: 'Cloudinary account not found for this image' });

    const publicId = decodeURIComponent(publicIdWithPaths);

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
    res.status(200).json(result);
  } catch (e) {
    console.error('Delete cloudinary error:', e);
    res.status(500).json({ error: e.message });
  }
}
