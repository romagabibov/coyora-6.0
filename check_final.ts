import https from 'https';

const urls = [
  'https://actions.google.com/sounds/v1/science_fiction/space_room_tone.ogg',
  'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
  'https://cdn.pixabay.com/download/audio/2022/05/16/audio_9bc513c239.mp3',
  'https://cdn.freesound.org/previews/514/514154_10910242-lq.mp3'
];

urls.forEach(url => {
  https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
    console.log(url, res.statusCode);
  }).on('error', (e) => {
    console.error(url, e.message);
  });
});
