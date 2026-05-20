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

    if (cloudinaryAccounts.length === 0) {
      return res.status(500).json({ error: 'Cloudinary credentials are not set in environment variables' });
    }

    // В serverless среде мы берём случайный аккаунт
    const accountIndex = Math.floor(Math.random() * cloudinaryAccounts.length);
    const account = cloudinaryAccounts[accountIndex];

    const timestamp = Math.round((new Date).getTime() / 1000);
    const str = `timestamp=${timestamp}${account.apiSecret}`;
    const signature = crypto.createHash('sha1').update(str).digest('hex');
    
    res.status(200).json({ 
      timestamp, 
      signature,
      cloudName: account.cloudName,
      apiKey: account.apiKey
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
