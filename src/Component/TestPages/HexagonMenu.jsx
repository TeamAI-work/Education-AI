import React, { useState } from 'react';
import { motion } from 'framer-motion';

const GRADE_GROUPS = [
  { id: 1, name: "K-Primary", color: "bg-emerald-500/20 border-emerald-400 text-emerald-300" },
  { id: 2, name: "Elementary", color: "bg-cyan-500/20 border-cyan-400 text-cyan-300" },
  { id: 3, name: "Middle School", color: "bg-indigo-500/20 border-indigo-400 text-indigo-300" },
  { id: 4, name: "High School", color: "bg-purple-500/20 border-purple-400 text-purple-300" },
  { id: 5, name: "System Info", color: "bg-slate-500/20 border-slate-400 text-slate-300" },
  { id: 6, name: "AI Core", color: "bg-amber-500/20 border-amber-400 text-amber-300" },
];

export default function HexagonMenu() {
  // 3D Rotation State
  const [rotX, setRotX] = useState(-15); // Slight tilt down so top is visible
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const [activeFace, setActiveFace] = useState(0);

  // When a grade button is clicked, spin to that specific Y-axis angle
  const handleGradeSelect = (index) => {
    setActiveFace(index);
    // Each face is 60 degrees apart. Multiplying by -60 brings that face to the front.
    setRotY(index * -60);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-6 font-sans">
      
      {/* 1. Grade Selection Buttons */}
      <div className="flex flex-wrap gap-3 justify-center mb-16 z-10">
        {GRADE_GROUPS.slice(0, 4).map((group, idx) => (
          <button
            key={group.id}
            onClick={() => handleGradeSelect(idx)}
            className={`px-5 py-2.5 rounded-lg font-medium border transition-all duration-300 shadow-lg ${
              activeFace === idx 
                ? 'bg-white text-slate-950 border-white scale-105' 
                : 'bg-slate-900/80 border-slate-700 hover:border-slate-500 text-slate-300'
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* 2. 3D Viewport Wrapper */}
      <div className="relative w-[400px] h-[400px] flex items-center justify-center [perspective:1200px]">
        
        {/* Holographic Core Text (Stays fixed in the center, facing the viewer) */}
        <div className="absolute pointer-events-none text-center z-20 select-none">
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">Active Sector</p>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {GRADE_GROUPS[activeFace].name}
          </h2>
        </div>

        {/* The 3D Hexagonal Prism */}
        <motion.div
          className="relative w-[200px] h-[220px] [transform-style:preserve-3d]"
          animate={{
            rotateX: rotX,
            rotateY: rotY,
            rotateZ: rotZ
          }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          {GRADE_GROUPS.map((group, idx) => {
            // Hexagon geometry math: 60 degrees rotation steps
            const angle = idx * 60; 
            // translateZ acts as the radius. For a 200px wide panel, ~173px creates a seamless closure.
            const transformStyle = `rotateY(${angle}deg) translateZ(173px)`;

            return (
              <div
                key={group.id}
                style={{ transform: transformStyle }}
                className={`absolute inset-0 border-2 rounded-xl backdrop-blur-md flex flex-col items-center justify-between p-4 [backface-visibility:hidden] transition-colors duration-500 ${group.color}`}
              >
                {/* Top Corner Indicator */}
                <span className="text-[10px] opacity-40 font-mono self-start">
                  SEC_0{idx + 1}
                </span>

                {/* Face Content */}
                <div className="text-center">
                  <p className="text-lg font-bold tracking-wide">{group.name}</p>
                  <p className="text-[11px] opacity-60 mt-1">AI Module Active</p>
                </div>

                {/* Bottom Status Graphic */}
                <div className="w-full h-1 bg-current opacity-20 rounded-full" />
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* 3. 3-Dimension Freedom Sliders */}
      <div className="mt-16 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl w-full max-w-md backdrop-blur-sm shadow-xl">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 mb-4 uppercase">
          3D Axis Fine Tuning
        </h3>
        
        <div className="space-y-4 font-mono text-xs text-slate-400">
          {/* X Axis Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label>Pitch (Rotate X)</label>
              <span className="text-slate-200">{rotX}°</span>
            </div>
            <input 
              type="range" min="-180" max="180" value={rotX} 
              onChange={(e) => setRotX(Number(e.target.value))}
              className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Y Axis Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label>Yaw (Rotate Y)</label>
              <span className="text-slate-200">{Math.round(rotY)}°</span>
            </div>
            <input 
              type="range" min="-360" max="360" value={Math.round(rotY)} 
              onChange={(e) => setRotY(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Z Axis Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <label>Roll (Rotate Z)</label>
              <span className="text-slate-200">{rotZ}°</span>
            </div>
            <input 
              type="range" min="-180" max="180" value={rotZ} 
              onChange={(e) => setRotZ(Number(e.target.value))}
              className="w-full accent-indigo-400 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => { setRotX(-15); setRotY(activeFace * -60); setRotZ(0); }}
          className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-lg font-medium transition-all"
        >
          Reset To Active Facing Alignment
        </button>
      </div>

    </div>
  );
}