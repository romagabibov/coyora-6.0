import https from 'https';

const urls = [
  'https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg',
  'https://upload.wikimedia.org/wikipedia/commons/4/4b/Oce%C3%A1no_con_olas_de_fondo.ogg',
  'https://cdn.pixabay.com/audio/2022/05/16/audio_9bc513c239.mp3',
  'https://audio.jukehost.co.uk/v61mJjZ94Hw3s2q4R5qN8E01Nq69C8Q8'
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
