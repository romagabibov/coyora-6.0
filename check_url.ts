import https from 'https';

https.get('https://res.cloudinary.com/dxnrmskvb/video/upload/v1731608752/coyora_bg_music_v2_f8q2k3.mp3', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});