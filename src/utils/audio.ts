let audioCtx: AudioContext | null = null;
let bgAudio: HTMLAudioElement | null = null;
export let isMuted = true;
let currentTrackIndex = 0;

const PLAYLIST = [
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461810/32256300-stellar-391676_cxgn1d.mp3',
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461800/32256300-untitled-392146_o4frpl.mp3',
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461799/the_mountain-space-438391_tvupgs.mp3',
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461798/delosound-space-ambient-cinematic-351304_yszqyl.mp3',
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461798/good_b_music-drone-space-main-9706_tcamrx.mp3',
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461798/geoffharvey-future-worlds-space-theme-379490_bslqgx.mp3',
  'https://res.cloudinary.com/dxnrmskvb/video/upload/v1776461842/backgroundmusicforvideos-space-space-galaxy-universe-music-301239_oguynb.mp3'
];

const playNextTrack = () => {
  if (!bgAudio) return;
  currentTrackIndex = (currentTrackIndex + 1) % PLAYLIST.length;
  bgAudio.src = PLAYLIST[currentTrackIndex];
  if (!isMuted) {
    bgAudio.play().catch(e => {
      console.log("Audio play suppressed or failed:", e.message || e);
    });
  }
};

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  if (!bgAudio) {
    bgAudio = new Audio(PLAYLIST[currentTrackIndex]);
    bgAudio.loop = false; // We handle the loop manually to go to the next track
    bgAudio.volume = 0.5;
    bgAudio.crossOrigin = 'anonymous';
    bgAudio.addEventListener('ended', playNextTrack);
    // Pre-load to avoid delay
    bgAudio.load();
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  if (!isMuted) {
    initAudio();
    if (bgAudio) {
      bgAudio.play().catch(e => {
        // Log as simple log rather than error to prevent popup
        console.log("Audio play suppressed or failed:", e.message || e);
      });
    }
  } else {
    bgAudio?.pause();
  }
  return isMuted;
};

export const playHover = () => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // High-tech short tick
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.03);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.03);
  } catch (e) {
    console.error(e);
  }
};

export const playClick = () => {
  if (isMuted || !audioCtx) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    // Deep electronic thud
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
  } catch (e) {
    console.error(e);
  }
};
