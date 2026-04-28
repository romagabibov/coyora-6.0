async function check() {
  try {
    const res = await fetch('https://cdn.freesound.org/previews/514/514154_10910242-lq.mp3', {
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
