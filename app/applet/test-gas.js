const fs = require('fs');

async function run() {
  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywsGQc4kmC2tOrLYGEFpq_DD956F_gJQ1Tc5vTI7-A5VI1xkQCVSezmeGtEWUrwAnD/exec";
  const base64Data = Buffer.from("test").toString('base64');
  
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
         filename: `test_avatar.txt`,
         mimeType: 'text/plain',
         file: base64Data
      }),
    });
    
    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
