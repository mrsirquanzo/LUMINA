"use client";

import { cn } from '@/lib/utils';
import { Zap, Dna, Radio as RadioIcon } from 'lucide-react';

interface Props {
  modality: string;
  structure: any;
}

export function ConstructVisualizer({ modality, structure }: Props) {
  const isADC = modality.includes('ADC') || modality.includes('Peptide');
  const isRadioligand = modality.includes('Radio');
  const isGeneTherapy = modality.includes('Gene');
  const isPeptide = modality.toLowerCase().includes('peptide') || 
                    modality.toLowerCase().includes('bicycle') ||
                    structure?.type?.toLowerCase().includes('peptide') ||
                    structure?.type?.toLowerCase().includes('bicycle');

  // Detailed Y-Shape SVG for Antibody (IgG structure with Heavy and Light Chains)
  const YShapeSVG = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" className="w-28 h-28">
      {/* Heavy Chain - Inner Y (Dark Blue) */}
      {/* Main stem (Fc region) */}
      <path
        d="M 60 20 L 60 80"
        stroke="#1e3a8a"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left arm (Fab region) */}
      <path
        d="M 60 20 L 25 8 L 25 25 L 60 35"
        stroke="#1e3a8a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right arm (Fab region) */}
      <path
        d="M 60 20 L 95 8 L 95 25 L 60 35"
        stroke="#1e3a8a"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Light Chains - Outer Arms (Light Blue) */}
      {/* Left light chain (parallel to left heavy chain) */}
      <path
        d="M 25 8 L 15 5 L 15 22 L 25 25"
        stroke="#67e8f9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right light chain (parallel to right heavy chain) */}
      <path
        d="M 95 8 L 105 5 L 105 22 L 95 25"
        stroke="#67e8f9"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Antigen binding sites */}
      <circle cx="15" cy="5" r="2.5" fill="#67e8f9" />
      <circle cx="105" cy="5" r="2.5" fill="#67e8f9" />
      {/* Base (Fc region bottom) */}
      <circle cx="60" cy="80" r="7" fill="#1e3a8a" />
    </svg>
  );

  // Bicyclic Peptide Scaffold SVG
  const BicyclicPeptideSVG = () => (
    <svg width="96" height="96" viewBox="0 0 96 96" className="w-24 h-24">
      {/* Central chemical core (hexagon) */}
      <polygon
        points="48,30 56,35 56,45 48,50 40,45 40,35"
        stroke="currentColor"
        strokeWidth="2.5"
        fill="currentColor"
        fillOpacity="0.3"
      />
      {/* Top loop (oval extending from core) */}
      <path
        d="M 48 30 Q 30 20, 20 30 Q 20 40, 30 45 Q 40 50, 48 45 Q 56 50, 66 45 Q 76 40, 76 30 Q 66 20, 48 30"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Bottom loop (oval extending from core) */}
      <path
        d="M 48 50 Q 30 60, 20 50 Q 20 40, 30 35 Q 40 30, 48 35 Q 56 30, 66 35 Q 76 40, 76 50 Q 66 60, 48 50"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Connection points to core */}
      <circle cx="48" cy="30" r="2" fill="currentColor" />
      <circle cx="48" cy="50" r="2" fill="currentColor" />
    </svg>
  );

  // Linker Chain SVG (4-5 circles connected)
  const LinkerChainSVG = () => (
    <svg width="100" height="60" viewBox="0 0 100 60" className="w-24 h-16">
      {/* Chain of circles connected by lines */}
      <line x1="10" y1="30" x2="25" y2="30" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
      <circle cx="25" cy="30" r="5" fill="#fdba74" />
      <line x1="30" y1="30" x2="45" y2="30" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
      <circle cx="45" cy="30" r="5" fill="#fdba74" />
      <line x1="50" y1="30" x2="65" y2="30" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
      <circle cx="65" cy="30" r="5" fill="#fdba74" />
      <line x1="70" y1="30" x2="85" y2="30" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" />
      <circle cx="85" cy="30" r="5" fill="#fdba74" />
    </svg>
  );

  // Starburst Payload SVG
  const StarburstPayloadSVG = () => (
    <svg width="80" height="80" viewBox="0 0 80 80" className="w-20 h-20">
      {/* Spiky circle / starburst shape */}
      <g transform="translate(40, 40)">
        {/* Central circle */}
        <circle cx="0" cy="0" r="8" fill="#ea580c" />
        {/* Spikes radiating outward */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * (Math.PI / 180);
          const x1 = Math.cos(angle) * 10;
          const y1 = Math.sin(angle) * 10;
          const x2 = Math.cos(angle) * 20;
          const y2 = Math.sin(angle) * 20;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ea580c"
              strokeWidth="3"
              strokeLinecap="round"
            />
          );
        })}
        {/* Outer spikes (longer) */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * 60) * (Math.PI / 180);
          const x1 = Math.cos(angle) * 12;
          const y1 = Math.sin(angle) * 12;
          const x2 = Math.cos(angle) * 25;
          const y2 = Math.sin(angle) * 25;
          return (
            <line
              key={`outer-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#ea580c"
              strokeWidth="4"
              strokeLinecap="round"
            />
          );
        })}
      </g>
    </svg>
  );

  // Bicycle Peptide Structure SVG
  const BicycleStructureSVG = () => (
    <svg width="600" height="200" viewBox="0 0 600 200" className="w-full max-w-4xl">
      {/* Scaffold: 3 circles in triangle - moved left */}
      {/* Top center circle */}
      <circle cx="100" cy="40" r="8" fill="#6366f1" stroke="#6366f1" strokeWidth="2" />
      {/* Bottom left circle */}
      <circle cx="70" cy="80" r="8" fill="#6366f1" stroke="#6366f1" strokeWidth="2" />
      {/* Bottom right circle */}
      <circle cx="130" cy="80" r="8" fill="#6366f1" stroke="#6366f1" strokeWidth="2" />
      
      {/* Connecting lines between scaffold circles */}
      <line x1="100" y1="40" x2="70" y2="80" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      <line x1="100" y1="40" x2="130" y2="80" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      <line x1="70" y1="80" x2="130" y2="80" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" />
      
      {/* Two thick arched paths (Bicycle loops) */}
      {/* Left arch: top to bottom-left */}
      <path
        d="M 100 40 Q 50 50, 70 80"
        stroke="#6366f1"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Right arch: top to bottom-right */}
      <path
        d="M 100 40 Q 150 50, 130 80"
        stroke="#6366f1"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
      />
      
      {/* Spacer: Curved line extending from bottom-right circle - extended */}
      <path
        d="M 130 80 Q 160 100, 220 120"
        stroke="#60a5fa"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Spacer label - moved below */}
      <text x="175" y="165" fontSize="12" fill="#94a3b8" fontWeight="500" textAnchor="middle">Molecular Spacer</text>
      
      {/* Linker: Wavy/zig-zag line - extended to the right */}
      <path
        d="M 220 120 L 280 110 L 340 130 L 400 120 L 460 130 L 480 130"
        stroke="#475569"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Linker label - moved below, positioned at center of linker */}
      <text x="350" y="165" fontSize="12" fill="#94a3b8" fontWeight="500" textAnchor="middle">Linker</text>
      
      {/* Payload: Circle with X inside - moved further right */}
      <circle cx="500" cy="130" r="12" fill="#ea580c" stroke="#ea580c" strokeWidth="2" />
      <line x1="492" y1="122" x2="508" y2="138" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="508" y1="122" x2="492" y2="138" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      {/* Payload label - moved below */}
      <text x="500" y="165" fontSize="12" fill="#94a3b8" fontWeight="500" textAnchor="middle">Cytotoxic Payload</text>
    </svg>
  );

  // ADC Diagram: [Antibody/Peptide] === [Linker Chain] === [Payload Starburst]
  const renderADC = () => {
    // Check if it's a Bicycle structure
    const isBicycle = modality.toLowerCase().includes('bicycle') || 
                      modality.toLowerCase().includes('peptide') ||
                      structure?.type?.toLowerCase().includes('bicycle') ||
                      structure?.type?.toLowerCase().includes('peptide');

    if (isBicycle) {
      // Render Bicycle Peptide Structure
      return (
        <div className="flex flex-col items-center gap-4 w-full">
          <BicycleStructureSVG />
        </div>
      );
    }

    // Standard ADC: Y-Shape Antibody
    return (
      <div className="flex items-center justify-center gap-6">
        {/* Antibody */}
        <div className="flex flex-col items-center gap-2 relative">
          <div className="relative flex items-center justify-center">
            <div className="relative">
              <YShapeSVG />
              {/* Label with arrow pointing to mAb */}
              <svg width="120" height="120" viewBox="0 0 120 120" className="absolute top-0 left-0 pointer-events-none">
                <path
                  d="M 5 60 L 10 60 L 10 55 L 15 60 L 10 65 L 10 60"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  fill="#94a3b8"
                />
                <text x="18" y="63" fontSize="10" fill="#94a3b8" fontWeight="600">mAb</text>
              </svg>
            </div>
          </div>
          <span className="text-xs text-slate-400 font-medium">Antibody</span>
        </div>

        {/* Connector from hinge region */}
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-slate-600" />
        </div>

        {/* Linker - Chain of circles (Peach/Orange) */}
        <div className="flex flex-col items-center gap-2 relative">
          <div className="relative flex items-center justify-center">
            <LinkerChainSVG />
            {/* Label with arrow pointing down */}
            <svg width="100" height="60" viewBox="0 0 100 60" className="absolute top-0 left-0 pointer-events-none">
              <path
                d="M 50 5 L 50 10 L 45 10 L 50 15 L 55 10 L 50 10"
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="#94a3b8"
              />
              <text x="52" y="8" fontSize="10" fill="#94a3b8" fontWeight="600">Linker</text>
            </svg>
          </div>
          <span className="text-xs text-slate-400 font-medium">Linker</span>
        </div>

        {/* Connector */}
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-slate-600" />
        </div>

        {/* Payload - Starburst (Dark Orange) */}
        <div className="flex flex-col items-center gap-2 relative">
          <div className="relative flex items-center justify-center">
            <StarburstPayloadSVG />
            {/* Label with arrow pointing down */}
            <svg width="80" height="80" viewBox="0 0 80 80" className="absolute top-0 left-0 pointer-events-none">
              <path
                d="M 40 5 L 40 10 L 35 10 L 40 15 L 45 10 L 40 10"
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="#94a3b8"
              />
              <text x="42" y="8" fontSize="9" fill="#94a3b8" fontWeight="600">Cytotoxin</text>
            </svg>
          </div>
          <span className="text-xs text-slate-400 font-medium">Payload</span>
        </div>
      </div>
    );
  };

  // Radioligand Diagram: [Ligand (Circle)] --- [Chelator (Hexagon)] --- [Isotope (Radioactive Icon)]
  const renderRadioligand = () => (
    <div className="flex items-center justify-center gap-8">
      {/* Ligand - Circle (Blue) */}
      <div className="flex flex-col items-center gap-2">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-2 border-blue-400 shadow-xl">
          <span className="text-sm font-bold text-white">L</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">Ligand</span>
      </div>

      {/* Connector */}
      <div className="flex items-center">
        <div className="w-16 h-0.5 bg-slate-600" />
        <div className="w-2 h-2 rounded-full bg-slate-600" />
        <div className="w-16 h-0.5 bg-slate-600" />
      </div>

      {/* Chelator - Hexagon (Slate) */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className="w-24 h-24 bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center border-2 border-slate-400 shadow-xl" 
          style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        >
          <span className="text-sm font-bold text-white">Ch</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">Chelator</span>
      </div>

      {/* Connector */}
      <div className="flex items-center">
        <div className="w-16 h-0.5 bg-slate-600" />
        <div className="w-2 h-2 rounded-full bg-slate-600" />
        <div className="w-16 h-0.5 bg-slate-600" />
      </div>

      {/* Isotope - Radioactive Icon (Neon Green) */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center border-2 border-green-300 shadow-xl">
          <RadioIcon className="w-14 h-14 text-white" />
          <div className="absolute inset-0 rounded-full bg-green-300/40 animate-pulse"></div>
          <div className="absolute inset-0 rounded-full bg-green-300/20 animate-ping"></div>
        </div>
        <span className="text-xs text-slate-400 font-medium">Isotope</span>
      </div>
    </div>
  );

  // Gene Therapy Diagram: Dual view with Capsid and Linear Genome Bar
  const renderGeneTherapy = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
      {/* Left: Capsid (Octagon) */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center border-2 border-purple-400 shadow-xl relative" 
          style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)' }}
        >
          <Dna className="w-16 h-16 text-white" />
        </div>
        <span className="text-xs text-slate-400 font-medium">Capsid</span>
      </div>

      {/* Right: Linear Genome Bar */}
      <div className="flex flex-col gap-3">
        <span className="text-xs text-slate-400 font-medium mb-2">Genome Structure</span>
        <div className="flex items-center gap-2">
          {/* ITR */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-12 bg-slate-700 rounded border-2 border-slate-600 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-300">ITR</span>
            </div>
          </div>
          
          {/* Connector */}
          <div className="w-4 h-0.5 bg-slate-600"></div>
          
          {/* Promoter (Orange) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded border-2 border-orange-400 flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-white">Promoter</span>
            </div>
          </div>
          
          {/* Connector */}
          <div className="w-4 h-0.5 bg-slate-600"></div>
          
          {/* Transgene (Cyan) */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-24 h-12 bg-gradient-to-br from-cyan-500 to-cyan-700 rounded border-2 border-cyan-400 flex items-center justify-center shadow-lg">
              <span className="text-xs font-bold text-white">Transgene</span>
            </div>
          </div>
          
          {/* Connector */}
          <div className="w-4 h-0.5 bg-slate-600"></div>
          
          {/* PolyA */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-16 h-12 bg-slate-700 rounded border-2 border-slate-600 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-300">PolyA</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Default Fallback: Generic Molecule
  const renderDefault = () => (
    <div className="flex items-center justify-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center border-2 border-slate-400 shadow-xl">
          <Dna className="w-12 h-12 text-white" />
        </div>
        <span className="text-xs text-slate-400 font-medium">Molecule</span>
      </div>
    </div>
  );

  // Render appropriate diagram
  const renderDiagram = () => {
    if (isADC) return renderADC();
    if (isRadioligand) return renderRadioligand();
    if (isGeneTherapy) return renderGeneTherapy();
    return renderDefault();
  };

  // Render Tech Specs Grid
  const renderTechSpecs = () => {
    if (!structure) return null;

    const specs: { key: string; value: string | number | undefined }[] = [];

    if (isADC) {
      specs.push(
        { key: 'Type', value: structure.type },
        { key: 'Linker', value: structure.linker },
        { key: 'Payload', value: structure.payload },
        { key: 'DAR', value: structure.dar }
      );
    } else if (isRadioligand) {
      specs.push(
        { key: 'Ligand', value: structure.ligand },
        { key: 'Isotope', value: structure.isotope },
        { key: 'Chelator', value: structure.chelator },
        { key: 'Half-life', value: structure.halflife }
      );
    } else if (isGeneTherapy) {
      specs.push(
        { key: 'Vector', value: structure.vector },
        { key: 'Promoter', value: structure.promoter },
        { key: 'Transgene', value: structure.transgene },
        { key: 'Route', value: structure.route }
      );
    } else {
      // Generic fallback - show all structure keys
      Object.entries(structure).forEach(([key, value]) => {
        specs.push({ key: key.charAt(0).toUpperCase() + key.slice(1), value: String(value) });
      });
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {specs.map((spec, index) => (
          <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-2">{spec.key}</div>
            <div className="text-sm font-semibold text-slate-200">{spec.value || 'N/A'}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mb-6 bg-slate-900/50 rounded-xl border border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">Construct Visualizer</h3>
      
      {/* Visual Diagram */}
      <div className="flex items-center justify-center mb-8 py-8 bg-slate-950/50 rounded-lg border border-slate-800 min-h-[200px]">
        {renderDiagram()}
      </div>

      {/* Tech Specs Grid */}
      {renderTechSpecs()}
    </div>
  );
}
