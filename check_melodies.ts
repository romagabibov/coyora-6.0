import https from 'https';

const urls = [
  'https://assets.mixkit.co/music/preview/mixkit-sleepy-cat-135.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-chill-bro-894.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-delightful-4.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-slow-trail-71.mp3',
  'https://assets.mixkit.co/music/preview/mixkit-deep-urban-623.mp3',
];

async function checkUrl(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ url, status: res.statusCode });
    }).on('error', (e) => resolve({ url, status: e.message }));
  });
}

(async () => {
    for(const u of urls) {
        console.log(await checkUrl(u));
    }
})();
