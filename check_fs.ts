import http from 'http';
import https from 'https';

https.get('https://cdn.freesound.org/previews/514/514154_10910242-lq.mp3', {
  headers: { 'User-Agent': 'Mozilla/5.0' }
}, (res) => {
  console.log(res.statusCode);
});
