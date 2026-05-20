async function check() {
  try {
    const res = await fetch('https://res.cloudinary.com/dxnrmskvb/video/upload/v1731608752/coyora_bg_music_v2_f8q2k3.mp3', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status, res.statusText);
    console.log('Content-Type:', res.headers.get('content-type'));
    console.log('Content-Length:', res.headers.get('content-length'));
  } catch (e) {
    console.error(e);
  }
}
check();
