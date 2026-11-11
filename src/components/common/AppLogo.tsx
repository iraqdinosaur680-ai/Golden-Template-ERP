import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBackground?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = '',
  size = 'md',
  showBackground = false,
}) => {
  const sizeMap = {
    xs: 'h-6 w-6',
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
    '2xl': 'h-32 w-32',
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${
        showBackground ? 'bg-slate-900/90 p-1.5 rounded-2xl shadow-md border border-amber-500/30' : ''
      } ${sizeMap[size]} ${className}`}
    >
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full object-contain filter drop-shadow-sm"
      >
        <defs>
          {/* Gear 3D Gradients & Filters */}
          <linearGradient id="gearBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5568" />
            <stop offset="50%" stopColor="#2D3748" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>

          <linearGradient id="gearHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#718096" />
            <stop offset="100%" stopColor="#2D3748" />
          </linearGradient>

          {/* Golden Shield Gradients */}
          <linearGradient id="goldShieldFront" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" />
            <stop offset="30%" stopColor="#F59E0B" />
            <stop offset="80%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          <linearGradient id="goldShieldBevelTop" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FBBF24" />
          </linearGradient>

          <linearGradient id="goldShieldBevelSide" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#92400E" />
          </linearGradient>

          {/* Bottle Gradients */}
          <linearGradient id="bottleBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="25%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#F8FAFC" />
            <stop offset="85%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          <linearGradient id="bottleCapGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="40%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          <filter id="dropShadowFilter" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. INDUSTRIAL GEAR (Cogs Around Outer Rim) */}
        <g id="gearOuter" filter="url(#dropShadowFilter)">
          {/* 12-tooth industrial cogwheel shape */}
          <path
            d="M 250 15 
               L 268 15 L 273 45 L 305 52 L 326 29 L 341 39 L 333 70 L 361 84 L 389 69 L 401 83 L 383 110 L 406 131 L 437 124 L 445 140 L 420 162 L 434 193 L 465 197 L 467 216 L 437 230 L 442 262 L 471 275 L 468 294 L 436 300 L 424 330 L 447 353 L 437 369 L 406 363 L 386 388 L 401 416 L 387 429 L 360 414 L 333 430 L 339 461 L 323 470 L 303 446 L 273 453 L 267 485 L 248 485 L 242 453 L 212 446 L 192 470 L 176 461 L 182 430 L 155 414 L 128 429 L 114 416 L 129 388 L 109 363 L 78 369 L 68 353 L 91 330 L 79 300 L 47 294 L 44 275 L 73 262 L 78 230 L 48 216 L 50 197 L 81 193 L 95 162 L 70 140 L 78 124 L 109 131 L 132 110 L 114 83 L 126 69 L 154 84 L 182 70 L 174 39 L 189 29 L 210 52 L 242 45 Z"
            fill="url(#gearBaseGrad)"
            stroke="#1A202C"
            strokeWidth="6"
            strokeLinejoin="round"
          />
          {/* Gear Bevel / Inset Ring */}
          <circle cx="250" cy="250" r="185" fill="#242B35" stroke="#4A5568" strokeWidth="4" />
          <circle cx="250" cy="250" r="172" fill="#1E232B" />
        </g>

        {/* 2. GOLDEN SHIELD (3D Hexagonal Gold Plate) */}
        <g id="goldShield">
          {/* Shield Outer 3D Thick Edge Base */}
          <polygon
            points="250,75 395,135 395,355 250,425 105,355 105,135"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="5"
          />
          {/* Shield 3D Bottom/Side Bevel */}
          <polygon
            points="250,85 385,142 385,348 250,415 115,348 115,142"
            fill="url(#goldShieldBevelSide)"
          />
          {/* Shield Front Bright Plate */}
          <polygon
            points="250,96 373,148 373,338 250,398 127,338 127,148"
            fill="url(#goldShieldFront)"
            stroke="#FDE68A"
            strokeWidth="2"
          />

          {/* 4 Hexagonal Screw Rivets on the Shield */}
          {/* Top-Left Rivet */}
          <circle cx="158" cy="165" r="11" fill="#1F2937" />
          <circle cx="158" cy="165" r="8" fill="#4B5563" />
          <circle cx="156" cy="163" r="3" fill="#9CA3AF" />

          {/* Top-Right Rivet */}
          <circle cx="342" cy="165" r="11" fill="#1F2937" />
          <circle cx="342" cy="165" r="8" fill="#4B5563" />
          <circle cx="340" cy="163" r="3" fill="#9CA3AF" />

          {/* Bottom-Left Rivet */}
          <circle cx="158" cy="305" r="11" fill="#1F2937" />
          <circle cx="158" cy="305" r="8" fill="#4B5563" />
          <circle cx="156" cy="303" r="3" fill="#9CA3AF" />

          {/* Bottom-Right Rivet */}
          <circle cx="342" cy="305" r="11" fill="#1F2937" />
          <circle cx="342" cy="305" r="8" fill="#4B5563" />
          <circle cx="340" cy="303" r="3" fill="#9CA3AF" />
        </g>

        {/* 3. CENTER MILK / BEVERAGE BOTTLE */}
        <g id="milkBottle" filter="url(#dropShadowFilter)">
          {/* Bottle Outer Silhouette & Shadow */}
          {/* Cap Lip */}
          <rect
            x="215"
            y="68"
            width="70"
            height="18"
            rx="5"
            fill="url(#bottleCapGrad)"
            stroke="#1E293B"
            strokeWidth="4"
          />
          {/* Cap Ring */}
          <rect
            x="220"
            y="86"
            width="60"
            height="8"
            rx="2"
            fill="#CBD5E1"
            stroke="#1E293B"
            strokeWidth="3"
          />

          {/* Main Bottle Body Path */}
          <path
            d="M 223 94 
               C 223 130, 192 165, 192 205
               L 192 335
               C 192 355, 208 360, 230 360
               L 270 360
               C 292 360, 308 355, 308 335
               L 308 205
               C 308 165, 277 130, 277 94
               Z"
            fill="url(#bottleBodyGrad)"
            stroke="#0F172A"
            strokeWidth="6"
            strokeLinejoin="round"
          />

          {/* Bottle Ridges / Horizontal Grips (8 distinct grooves) */}
          <g stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" opacity="0.85">
            <line x1="196" y1="195" x2="304" y2="195" />
            <line x1="196" y1="214" x2="304" y2="214" />
            <line x1="196" y1="233" x2="304" y2="233" />
            <line x1="196" y1="252" x2="304" y2="252" />
            <line x1="196" y1="271" x2="304" y2="271" />
            <line x1="196" y1="290" x2="304" y2="290" />
            <line x1="196" y1="309" x2="304" y2="309" />
            <line x1="196" y1="328" x2="304" y2="328" />
          </g>

          {/* Bottle Glass/Plastic High-Gloss Light Reflection */}
          <path
            d="M 235 110
               C 235 135, 208 165, 208 195
               L 208 338"
            stroke="#FFFFFF"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
};

export default AppLogo;
