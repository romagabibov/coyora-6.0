import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#050505] text-white p-6 font-mono overflow-hidden relative">
      {/* Grid lines background for technical feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-20 z-0" />
      <div className="bg-noise" />

      <motion.div 
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h1 
          className="text-8xl md:text-[12rem] font-bold tracking-tighter text-[#fe0000] leading-none mb-4"
          animate={{ x: [-2, 2, -2, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
        >
          404
        </motion.h1>
        
        <motion.p 
          className="text-sm md:text-xl text-white/60 tracking-[0.3em] uppercase mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          ARCHIVE NOT FOUND / SIGNAL LOST
        </motion.p>

        <motion.button 
          onClick={() => navigate('/')}
          className="inline-block px-8 py-4 bg-[#fe0000] text-white font-mono text-xs tracking-[0.2em] uppercase hover:bg-white hover:text-black transition-colors duration-500"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          RETURN TO BASE
        </motion.button>
      </motion.div>
    </div>
  );
}
