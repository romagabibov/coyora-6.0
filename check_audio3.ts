async function check() {
  try {
    const res = await fetch('https://actions.google.com/sounds/v1/science_fiction/humming_background.ogg', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    console.log('Status 1:', res.status);
    
    const res2 = await fetch('https://actions.google.com/sounds/v1/water/waves_crashing_on_rock_beach.ogg');
    console.log('Status 2:', res2.status);
  } catch (e) {
    console.error(e);
  }
}
check();
