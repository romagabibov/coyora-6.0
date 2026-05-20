async function check() {
  const urls = [
    'https://actions.google.com/sounds/v1/science_fiction/space_room_tone.ogg',
    'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c8/150bpm_ambient_loop.ogg'
  ];
  for (const u of urls) {
    const res = await fetch(u);
    console.log(u, res.status);
  }
}
check();
