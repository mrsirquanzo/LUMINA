"use client";

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface OrganRisk {
  organ: string;
  level: 'high' | 'medium' | 'low';
  notes: string;
}

interface AnatomicalBodyMapProps {
  risks: OrganRisk[];
}

// Medical-grade organ paths with organic shapes for viewBox="0 0 300 600"
const organPaths: Record<string, { path: string; label: string }> = {
  brain: {
    // Organic brain shape with cerebral hemispheres
    path: 'M150,40 Q135,38 125,48 Q118,58 120,72 Q122,88 132,98 Q142,105 150,103 Q158,105 168,98 Q178,88 180,72 Q182,58 175,48 Q165,38 150,40 Z',
    label: 'Brain'
  },
  heart: {
    // Anatomical heart shape with ventricles
    path: 'M150,155 Q145,150 138,155 Q132,162 130,172 Q128,182 132,192 Q138,202 150,212 Q162,202 168,192 Q172,182 170,172 Q168,162 162,155 Q155,150 150,155 Z',
    label: 'Heart'
  },
  liver: {
    // Triangular/wedge shape on right side, tucking under diaphragm
    path: 'M135,195 Q130,200 125,215 Q120,235 124,255 Q130,275 145,285 Q160,290 175,285 Q185,280 190,270 Q193,255 191,240 Q188,225 180,215 Q170,205 155,200 Q145,197 135,195 Z',
    label: 'Liver'
  },
  stomach: {
    // J-shape curve under left lung
    path: 'M105,235 Q100,240 95,255 Q92,270 96,285 Q102,300 115,310 Q130,315 145,310 Q155,305 160,295 Q163,280 160,265 Q155,250 145,245 Q135,240 120,238 Q110,237 105,235 Z',
    label: 'Stomach'
  },
  intestines: {
    // Convoluted/coiled path in center (not a circle)
    path: 'M125,315 Q120,320 115,335 Q112,350 116,365 Q122,380 135,390 Q150,395 165,390 Q175,385 180,375 Q183,360 181,345 Q178,330 170,325 Q160,320 150,318 Q140,317 125,315 M140,355 Q135,360 133,370 Q133,380 137,387 Q142,393 150,393 Q158,393 163,387 Q167,380 167,370 Q167,360 163,355 Q158,350 150,350 Q145,350 140,355',
    label: 'Intestines'
  },
  kidneys: {
    // Left kidney - bean shape
    path: 'M95,275 Q90,280 88,290 Q87,305 90,320 Q94,333 101,340 Q108,345 115,343 Q122,340 125,332 Q127,322 126,310 Q125,298 121,288 Q117,280 110,278 Q103,277 95,275 Z',
    // Right kidney - bean shape
    label: 'Kidneys'
  },
  bladder: {
    // Rounded organ in pelvis
    path: 'M135,445 Q130,450 128,460 Q127,475 131,487 Q136,497 145,500 Q155,502 165,500 Q174,497 179,487 Q183,475 182,460 Q180,450 175,445 Q168,442 155,442 Q142,442 135,445 Z',
    label: 'Bladder'
  },
  boneMarrow: {
    // Femurs (thigh bones) - narrow shaft, wide ends
    path: 'M115,415 L117,515 Q118,525 122,530 L127,535 Q130,535 132,533 L134,525 L137,415 Q137,410 135,407 L130,405 Q125,405 122,407 L120,410 Q117,410 115,415 M185,415 L183,515 Q182,525 178,530 L173,535 Q170,535 168,533 L166,525 L163,415 Q163,410 165,407 L170,405 Q175,405 178,407 L180,410 Q183,410 185,415',
    // Humerus (upper arm bones) - narrow shaft, wide ends
    label: 'Bone Marrow'
  }
};

// Complete lungs path (both left and right) - follows ribcage curve (narrow top, wide bottom)
const lungsPath = 'M105,115 Q100,120 95,135 Q92,155 94,175 Q96,195 102,215 Q110,232 118,242 Q125,248 132,246 Q138,243 140,233 Q141,213 140,193 Q138,173 135,153 Q130,133 122,128 Q115,125 105,115 Z M195,115 Q200,120 205,135 Q208,155 206,175 Q204,195 198,215 Q190,232 182,242 Q175,248 168,246 Q162,243 160,233 Q159,213 160,193 Q162,173 165,153 Q170,133 178,128 Q185,125 195,115 Z';

// Complete kidneys path (both left and right) - bean shapes
const kidneysPath = 'M95,275 Q90,280 88,290 Q87,305 90,320 Q94,333 101,340 Q108,345 115,343 Q122,340 125,332 Q127,322 126,310 Q125,298 121,288 Q117,280 110,278 Q103,277 95,275 Z M205,275 Q210,280 212,290 Q213,305 210,320 Q206,333 199,340 Q192,345 185,343 Q178,340 175,332 Q173,322 174,310 Q175,298 179,288 Q183,280 190,278 Q197,277 205,275 Z';

// Complete bone marrow path (femurs + humerus)
const boneMarrowPath = 'M115,415 L117,515 Q118,525 122,530 L127,535 Q130,535 132,533 L134,525 L137,415 Q137,410 135,407 L130,405 Q125,405 122,407 L120,410 Q117,410 115,415 M185,415 L183,515 Q182,525 178,530 L173,535 Q170,535 168,533 L166,525 L163,415 Q163,410 165,407 L170,405 Q175,405 178,407 L180,410 Q183,410 185,415 M90,130 L92,180 Q93,190 97,195 L102,200 Q105,200 107,198 L109,190 L112,130 Q112,125 110,122 L105,120 Q100,120 97,122 L95,125 Q92,125 90,130 M210,130 L208,180 Q207,190 203,195 L198,200 Q195,200 193,198 L191,190 L188,130 Q188,125 190,122 L195,120 Q200,120 203,122 L205,125 Q208,125 210,130';

// Smooth, continuous body silhouette with defined shoulders, neck, and hips
const bodySilhouette = 'M150,30 Q135,28 125,35 Q115,45 110,60 L108,90 Q108,110 110,130 L112,160 Q115,200 118,240 L120,300 Q122,360 125,420 L128,480 Q130,530 135,560 Q140,580 150,585 Q160,580 165,560 Q170,530 172,480 L175,420 Q178,360 180,300 L182,240 Q185,200 188,160 L190,130 Q192,110 192,90 L190,60 Q185,45 175,35 Q165,28 150,30 Z';

export default function AnatomicalBodyMap({ risks }: AnatomicalBodyMapProps) {
  const [hoveredOrgan, setHoveredOrgan] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const getRiskForOrgan = (organName: string): OrganRisk | undefined => {
    return risks.find((r) => r.organ.toLowerCase() === organName.toLowerCase());
  };

  const handleOrganHover = (organName: string, event: React.MouseEvent<SVGElement>) => {
    const risk = getRiskForOrgan(organName);
    if (risk) {
      setHoveredOrgan(organName);
      const svgElement = (event.currentTarget as SVGElement).ownerSVGElement;
      if (svgElement) {
        const rect = svgElement.getBoundingClientRect();
        setTooltipPosition({ 
          x: event.clientX - rect.left, 
          y: event.clientY - rect.top 
        });
      }
    }
  };

  const handleOrganMove = (organName: string, event: React.MouseEvent<SVGElement>) => {
    if (hoveredOrgan === organName) {
      const svgElement = (event.currentTarget as SVGElement).ownerSVGElement;
      if (svgElement) {
        const rect = svgElement.getBoundingClientRect();
        setTooltipPosition({ 
          x: event.clientX - rect.left, 
          y: event.clientY - rect.top 
        });
      }
    }
  };

  const handleOrganLeave = () => {
    setHoveredOrgan(null);
  };

  const getOrganStyle = (organName: string, isHovered: boolean) => {
    const risk = getRiskForOrgan(organName);
    const riskLevel = risk ? risk.level : 'none';

    if (riskLevel === 'high') {
      return {
        fill: '#ef4444',
        fillOpacity: 0.6,
        stroke: '#ef4444',
        strokeWidth: isHovered ? 2.5 : 2,
        filter: 'url(#highRiskGlow)',
      };
    } else if (riskLevel === 'medium') {
      return {
        fill: '#f59e0b',
        fillOpacity: 0.6,
        stroke: '#f59e0b',
        strokeWidth: isHovered ? 2.5 : 1.5,
        filter: 'url(#organShadow)',
      };
    } else if (riskLevel === 'low') {
      return {
        fill: '#10b981',
        fillOpacity: 0.6,
        stroke: '#10b981',
        strokeWidth: isHovered ? 2.5 : 1.5,
        filter: 'url(#organShadow)',
      };
    } else {
      // Default: fleshy/pink tone at 30% opacity
      return {
        fill: '#fda4af',
        fillOpacity: 0.3,
        stroke: '#fda4af',
        strokeWidth: isHovered ? 2 : 1,
        filter: undefined,
      };
    }
  };

  return (
    <div className="relative bg-slate-900/50 rounded-xl border border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Anatomical Risk Map</h3>
      
      <div className="relative flex items-center justify-center">
        <svg
          width={300}
          height={600}
          viewBox="0 0 300 600"
          className="w-full max-w-md"
          role="img"
          aria-label="Human anatomy map showing organ-specific safety risks"
        >
          <defs>
            {/* High risk glow filter - creates aura effect following body contour */}
            <filter id="highRiskGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Organ shadow for depth */}
            <filter id="organShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Body silhouette - smooth, continuous path */}
          <path
            d={bodySilhouette}
            fill="#94a3b8"
            fillOpacity="0.1"
            stroke="#94a3b8"
            strokeWidth="1"
            strokeOpacity="0.3"
            className="pointer-events-none"
            aria-hidden="true"
          />

          {/* Render organs - semi-transparent for X-ray layering effect */}
          {Object.entries(organPaths).map(([organKey, organ]) => {
            // Handle special cases for bilateral organs
            let pathToRender = organ.path;
            if (organKey === 'lungs') {
              pathToRender = lungsPath;
            } else if (organKey === 'kidneys') {
              pathToRender = kidneysPath;
            } else if (organKey === 'boneMarrow') {
              pathToRender = boneMarrowPath;
            }

            const risk = getRiskForOrgan(organKey);
            const isHovered = hoveredOrgan === organKey;
            const style = getOrganStyle(organKey, isHovered);
            
            return (
              <g key={organKey}>
                <path
                  d={pathToRender}
                  fill={style.fill}
                  fillOpacity={style.fillOpacity}
                  stroke={style.stroke}
                  strokeWidth={style.strokeWidth}
                  strokeOpacity={0.8}
                  filter={style.filter}
                  className={cn(
                    'transition-all duration-500 ease-in-out',
                    risk && 'cursor-pointer',
                    risk && risk.level === 'high' && 'animate-pulse'
                  )}
                  style={{
                    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                    transformBox: 'fill-box',
                  }}
                  onMouseEnter={(e) => handleOrganHover(organKey, e)}
                  onMouseMove={(e) => handleOrganMove(organKey, e)}
                  onMouseLeave={handleOrganLeave}
                  role="button"
                  tabIndex={risk ? 0 : -1}
                  aria-label={`${organ.label} - ${risk ? `${risk.level} risk` : 'No risk data'}`}
                  aria-describedby={risk ? `tooltip-${organKey}` : undefined}
                />
              </g>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredOrgan && (
          <div
            id={`tooltip-${hoveredOrgan}`}
            className="absolute z-50 px-4 py-3 bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-2xl pointer-events-none"
            style={{
              left: `${tooltipPosition.x + 20}px`,
              top: `${tooltipPosition.y - 10}px`,
              transform: 'translateY(-100%)',
              maxWidth: '220px',
            }}
            role="tooltip"
          >
            <div className="text-sm font-semibold text-slate-100 mb-2">
              {organPaths[hoveredOrgan]?.label || hoveredOrgan}
            </div>
            <div className="text-xs text-slate-300 mb-2">
              {getRiskForOrgan(hoveredOrgan)?.notes || 'No risk data'}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium',
                  getRiskForOrgan(hoveredOrgan)?.level === 'high'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : getRiskForOrgan(hoveredOrgan)?.level === 'medium'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                )}
              >
                {getRiskForOrgan(hoveredOrgan)?.level.toUpperCase()} RISK
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-red-500 opacity-80" />
          <span className="text-sm text-slate-300 font-medium">High Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-amber-500 opacity-65" />
          <span className="text-sm text-slate-300 font-medium">Medium Risk</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-500 opacity-45" />
          <span className="text-sm text-slate-300 font-medium">Low Risk</span>
        </div>
      </div>
    </div>
  );
}
