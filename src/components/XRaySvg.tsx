import React from "react";

interface XRaySvgProps {
  type: "NORMAL" | "BACTERIAL_PNEUMONIA" | "VIRAL_PNEUMONIA" | "CUSTOM";
  customDataUrl?: string;
  brightness: number;  // 50 to 150
  contrast: number;    // 50 to 200
  invert: boolean;
  enhance: boolean;    // Bone/Edge enhancement (high contrast filter)
  className?: string;
  onCoordinatesClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

export default function XRaySvg({
  type,
  customDataUrl,
  brightness,
  contrast,
  invert,
  enhance,
  className = "",
  onCoordinatesClick,
}: XRaySvgProps) {
  // If it's a custom uploaded image, render an image element within an styled container
  if (type === "CUSTOM" && customDataUrl) {
    return (
      <div 
        className={`relative overflow-hidden w-full h-full bg-slate-900 flex items-center justify-center select-none ${className}`}
        style={{
          filter: `
            brightness(${brightness}%) 
            contrast(${contrast}%) 
            ${invert ? "invert(100%)" : "invert(0%)"}
            ${enhance ? "contrast(180%) saturate(0%) brightness(95%)" : ""}
          `
        }}
      >
        <img 
          src={customDataUrl} 
          alt="Chest X-Ray Plate" 
          className="max-w-full max-h-full object-contain pointer-events-none"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Generate a procedural Chest X-Ray using vector SVG graphics
  return (
    <svg
      id="chest-xray-plate"
      viewBox="0 0 400 400"
      className={`w-full h-full select-none bg-slate-950/95 cursor-crosshair ${className}`}
      style={{
        filter: `
          brightness(${brightness}%) 
          contrast(${contrast}%) 
          ${invert ? "invert(100%)" : "invert(0%)"}
          ${enhance ? "contrast(160%) saturate(0%) brightness(95%)" : ""}
        `
      }}
      onClick={onCoordinatesClick as any}
    >
      <defs>
        {/* Soft radiographic blur filters for lung cavities, heart, and infiltrates */}
        <filter id="chest-blur-sm" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="chest-blur-md" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="chest-blur-lg" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="15" />
        </filter>
        <filter id="chest-blur-xl" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="25" />
        </filter>

        {/* Anatomical shading gradients */}
        <radialGradient id="lung-grad-left" cx="35%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#040608" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#0f141b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#303b47" stopOpacity="0.3" />
        </radialGradient>
        <radialGradient id="lung-grad-right" cx="65%" cy="50%" r="40%">
          <stop offset="0%" stopColor="#040608" stopOpacity="0.95" />
          <stop offset="60%" stopColor="#0f141b" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#303b47" stopOpacity="0.3" />
        </radialGradient>
        <linearGradient id="spine-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#222b35" />
          <stop offset="50%" stopColor="#8d99a6" />
          <stop offset="100%" stopColor="#222b35" />
        </linearGradient>
      </defs>

      {/* Main radiograph card backing */}
      <rect width="400" height="400" fill="#0c1015" />

      {/* RADIOGRAPHIC SCALINGS AND NOISE OVERLAYS */}
      {/* Simulation of typical medical CRT scanning grid lines */}
      <g opacity="0.08">
        {Array.from({ length: 40 }).map((_, i) => (
          <line key={i} x1="0" y1={i * 10} x2="400" y2={i * 10} stroke="#ffffff" strokeWidth="0.5" />
        ))}
      </g>

      {/* THORACIC SHELL (BODY WALL OUTLINE) */}
      <path
        d="M 120,40 C 120,40 50,80 50,180 C 50,280 60,350 80,370 C 90,380 310,380 320,370 C 340,350 350,280 350,180 C 350,80 280,40 280,40 Z"
        fill="transparent"
        stroke="#4a5568"
        strokeWidth="6"
        opacity="0.18"
      />

      {/* LEFT & RIGHT LUNG CAVITIES */}
      {/* Left Lung Recess */}
      <path
        d="M 190,75 C 150,70 90,95 85,190 C 80,270 95,330 135,340 C 160,345 180,310 190,290 Z"
        fill="url(#lung-grad-left)"
      />
      {/* Right Lung Recess */}
      <path
        d="M 210,75 C 250,70 310,95 315,190 C 320,270 305,330 265,340 C 240,345 220,310 210,290 Z"
        fill="url(#lung-grad-right)"
      />

      {/* MEDIASTINUM AND CARDIA SHADOW (HEART CENTER) */}
      {/* Mediastinal column */}
      <path
        d="M 180,40 L 180,320 C 180,320 185,350 200,350 C 215,350 220,320 220,320 L 220,40 Z"
        fill="#5a6875"
        opacity="0.45"
        filter="url(#chest-blur-lg)"
      />
      {/* Heart Contour (Cardiac Shadow) - shifted slightly left (anatomically right of screen) */}
      <path
        d="M 185,160 Q 150,210 152,260 Q 175,305 230,300 Q 215,195 185,160 Z"
        fill="#cfd7de"
        opacity="0.65"
        filter="url(#chest-blur-md)"
      />

      {/* DIAPHRAGM DOMES */}
      {/* Left Diaphragm Dome */}
      <path
        d="M 70,350 C 90,320 140,310 190,340 L 190,365 L 70,365 Z"
        fill="#4d5a69"
        opacity="0.75"
        filter="url(#chest-blur-sm)"
      />
      {/* Right Diaphragm Dome */}
      <path
        d="M 210,340 C 265,310 310,320 330,351 L 330,365 L 210,365 Z"
        fill="#4d5a69"
        opacity="0.75"
        filter="url(#chest-blur-sm)"
      />

      {/* SKELETAL SYSTEM: SPINE & RIBS */}
      {/* Vertebrae Spine center */}
      <g opacity="0.48">
        {Array.from({ length: 18 }).map((_, i) => (
          <rect
            key={i}
            x="193"
            y={40 + i * 16}
            width="14"
            height="11"
            rx="2"
            fill="url(#spine-grad)"
            opacity={0.35 + (i * 0.02)}
            filter="url(#chest-blur-sm)"
          />
        ))}
      </g>

      {/* Clavicles (Collar bones) */}
      {/* Left Clavicle */}
      <path
        d="M 195,65 Q 140,55 90,72"
        fill="none"
        stroke="#cfd7de"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
        filter="url(#chest-blur-sm)"
      />
      {/* Right Clavicle */}
      <path
        d="M 205,65 Q 260,55 310,72"
        fill="none"
        stroke="#cfd7de"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.55"
        filter="url(#chest-blur-sm)"
      />

      {/* Rib Cage Overlay (Drawn symmetrically curving outward and down) */}
      <g opacity="0.32" stroke="#d5dee6" strokeWidth="3.5" fill="none" filter="url(#chest-blur-sm)">
        {/* Left ribs */}
        <path d="M 190,95 Q 130,85 100,120" />
        <path d="M 190,125 Q 120,115 88,160" />
        <path d="M 190,155 Q 110,145 80,200" />
        <path d="M 190,185 Q 105,175 76,240" />
        <path d="M 190,215 Q 105,210 78,280" />
        <path d="M 190,245 Q 110,240 85,315" />
        <path d="M 190,275 Q 120,270 95,335" />

        {/* Right ribs */}
        <path d="M 210,95 Q 270,85 300,120" />
        <path d="M 210,125 Q 280,115 312,160" />
        <path d="M 210,155 Q 290,145 320,200" />
        <path d="M 210,185 Q 295,175 324,240" />
        <path d="M 210,215 Q 295,210 322,280" />
        <path d="M 210,245 Q 290,240 315,315" />
        <path d="M 210,275 Q 280,270 305,335" />
      </g>

      {/* DISEASE PATHOLOGY VISUALIZATION OVERLAYS */}

      {/* 1. BACTERIAL PNEUMONIA PATHOLOGY: Sharp lobar consolidation in RLL (Anatomical Right = screen Left) */}
      {type === "BACTERIAL_PNEUMONIA" && (
        <g id="bacterial-pathology">
          {/* Main lobar consolidation block */}
          <ellipse
            cx="135"
            cy="260"
            rx="45"
            ry="35"
            fill="#ffffff"
            opacity="0.65"
            filter="url(#chest-blur-lg)"
          />
          {/* Secondary smaller dense core */}
          <ellipse
            cx="128"
            cy="270"
            rx="25"
            ry="20"
            fill="#ffffff"
            opacity="0.5"
            filter="url(#chest-blur-md)"
          />
          {/* Air bronchogram simulation lines (dark streaks in dense white) */}
          <g opacity="0.45" stroke="#121820" strokeWidth="1.5" strokeLinecap="round" filter="url(#chest-blur-sm)">
            <path d="M 120,250 L 132,270" />
            <path d="M 132,270 Q 135,285 142,295" />
            <path d="M 132,270 L 115,280" />
          </g>
        </g>
      )}

      {/* 2. VIRAL PNEUMONIA PATHOLOGY: Bilateral, patchy, streaky diffuse interstitial markings */}
      {type === "VIRAL_PNEUMONIA" && (
        <g id="viral-pathology">
          {/* Left Lung patchy infiltrates (screen right) */}
          <circle cx="260" cy="160" r="30" fill="#ffffff" opacity="0.32" filter="url(#chest-blur-lg)" />
          <circle cx="275" cy="220" r="35" fill="#ffffff" opacity="0.44" filter="url(#chest-blur-lg)" />
          <circle cx="250" cy="270" r="28" fill="#ffffff" opacity="0.3" filter="url(#chest-blur-lg)" />

          {/* Right Lung patchy infiltrates (screen left) */}
          <circle cx="140" cy="150" r="28" fill="#ffffff" opacity="0.35" filter="url(#chest-blur-lg)" />
          <circle cx="120" cy="210" r="32" fill="#ffffff" opacity="0.4" filter="url(#chest-blur-lg)" />
          <circle cx="148" cy="265" r="25" fill="#ffffff" opacity="0.25" filter="url(#chest-blur-lg)" />

          {/* Reticular web patterns (Interstitial thickening networks) */}
          <g opacity="0.35" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" filter="url(#chest-blur-sm)">
            {/* Screen Right web */}
            <path d="M 230,170 Q 255,160 280,210" />
            <path d="M 240,210 Q 275,225 290,195" />
            <path d="M 235,230 Q 260,250 285,240" />
            <path d="M 220,150 L 250,210" />
            
            {/* Screen Left web */}
            <path d="M 170,165 Q 145,155 120,200" />
            <path d="M 160,205 Q 125,220 110,190" />
            <path d="M 165,225 Q 140,245 115,235" />
            <path d="M 180,145 L 150,205" />
          </g>
        </g>
      )}

      {/* METRIC GRATICULES AND CALIBRATORS for technical look */}
      <g stroke="#ffffff" strokeWidth="0.5" opacity="0.3">
        {/* Anatomical directions */}
        <text x="375" y="200" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">L</text>
        <text x="25" y="200" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">R</text>
        <text x="200" y="25" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">A</text>
        <text x="200" y="385" fill="#ffffff" fontSize="10" fontFamily="monospace" textAnchor="middle" opacity="0.6">P</text>

        {/* Small corner alignment indicators */}
        <path d="M 15,15 L 25,15 M 15,15 L 15,25" fill="none" />
        <path d="M 385,15 L 375,15 M 385,15 L 385,25" fill="none" />
        <path d="M 15,385 L 25,385 M 15,385 L 15,375" fill="none" />
        <path d="M 385,385 L 375,385 M 385,385 L 385,375" fill="none" />
      </g>
    </svg>
  );
}
