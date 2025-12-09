/**
 * rNPV Calculator Detail Panel
 * Step-by-step risk-adjusted NPV calculator
 */

import React, { useState } from 'react';
import {
  Calculator,
  ChevronLeft,
  FileText,
  Settings,
  BarChart3,
  DollarSign,
  Calendar,
  Info,
  Check,
  Download,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RNPVCalculatorPanelProps {
  onBack: () => void;
  onCalculate?: (inputs: any) => void;
}

const STAGES = [
  { id: 'preclinical', label: 'Preclinical', basePoS: 10 },
  { id: 'phase1', label: 'Phase 1', basePoS: 15 },
  { id: 'phase2', label: 'Phase 2', basePoS: 25 },
  { id: 'phase3', label: 'Phase 3', basePoS: 50 },
  { id: 'filed', label: 'Filed/Approved', basePoS: 85 },
];

const INDICATIONS = [
  { id: 'oncology', label: 'Oncology', adjustment: -5 },
  { id: 'rare', label: 'Rare Disease', adjustment: +10 },
  { id: 'cns', label: 'CNS/Neuro', adjustment: -8 },
  { id: 'immunology', label: 'Immunology', adjustment: 0 },
  { id: 'cardio', label: 'Cardiovascular', adjustment: -3 },
  { id: 'infectious', label: 'Infectious', adjustment: +2 },
];

const MODALITIES = [
  { id: 'small_molecule', label: 'Small Molecule' },
  { id: 'antibody', label: 'Antibody/Biologic' },
  { id: 'adc', label: 'ADC' },
  { id: 'cell_therapy', label: 'Cell Therapy' },
  { id: 'gene_therapy', label: 'Gene Therapy' },
  { id: 'mrna', label: 'mRNA' },
];

const STEPS = [
  { id: 1, label: 'Program Info', icon: FileText },
  { id: 2, label: 'Assumptions', icon: Calculator },
  { id: 3, label: 'Adjustments', icon: Settings },
  { id: 4, label: 'Results', icon: BarChart3 },
];

export default function RNPVCalculatorPanel({
  onBack,
  onCalculate,
}: RNPVCalculatorPanelProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [inputs, setInputs] = useState({
    peakSales: 2000,
    launchYear: 2028,
    currentStage: 'phase2',
    indication: 'oncology',
    modality: 'antibody',
    hasGeneticValidation: true,
    hasBiomarker: true,
    priorFailures: false,
  });
  const [results, setResults] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateResults = () => {
    setIsCalculating(true);
    const stage = STAGES.find((s) => s.id === inputs.currentStage);
    const indication = INDICATIONS.find((i) => i.id === inputs.indication);

    let adjustedPoS = (stage?.basePoS || 25) + (indication?.adjustment || 0);
    if (inputs.hasGeneticValidation) adjustedPoS += 10;
    if (inputs.hasBiomarker) adjustedPoS += 8;
    if (inputs.priorFailures) adjustedPoS -= 12;

    // Simulate calculation
    setTimeout(() => {
      const rNPV = (inputs.peakSales * (adjustedPoS / 100) * 0.4).toFixed(0);

      setResults({
        basePoS: stage?.basePoS || 25,
        adjustedPoS: adjustedPoS,
        rNPV: rNPV,
        npv: (inputs.peakSales * 0.4).toFixed(0),
        sensitivities: [
          { driver: 'Peak Sales ±20%', impact: `±$${(parseFloat(rNPV) * 0.2).toFixed(0)}M` },
          { driver: 'PoS ±10 ppt', impact: `±$${(parseFloat(rNPV) * 0.25).toFixed(0)}M` },
          { driver: 'Launch ±1 year', impact: `±$${(parseFloat(rNPV) * 0.08).toFixed(0)}M` },
        ],
      });
      setIsCalculating(false);
      setActiveStep(4);
      onCalculate?.(inputs);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-textSecondary hover:text-textPrimary mb-3 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to Financial Analyst
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Calculator size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-textPrimary">rNPV Calculator</h3>
            <p className="text-xs text-textSecondary">Risk-adjusted net present value</p>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="px-4 py-3 bg-surfaceElevated border-b border-white/10">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => setActiveStep(step.id)}
                className={`flex flex-col items-center gap-1 ${
                  activeStep >= step.id ? 'text-green-400' : 'text-textTertiary'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activeStep >= step.id ? 'bg-green-500/20' : 'bg-white/5'
                  }`}
                >
                  <step.icon size={14} />
                </div>
                <span className="text-xs font-medium">{step.label}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    activeStep > step.id ? 'bg-green-500/50' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Current Development Stage
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STAGES.map((stage) => (
                  <button
                    key={stage.id}
                    onClick={() => setInputs({ ...inputs, currentStage: stage.id })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      inputs.currentStage === stage.id
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 hover:border-white/20 bg-surfaceElevated'
                    }`}
                  >
                    <p className="text-sm font-medium text-textPrimary">{stage.label}</p>
                    <p className="text-xs text-textSecondary">Base PoS: {stage.basePoS}%</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Therapeutic Area
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INDICATIONS.map((ind) => (
                  <button
                    key={ind.id}
                    onClick={() => setInputs({ ...inputs, indication: ind.id })}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      inputs.indication === ind.id
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 hover:border-white/20 bg-surfaceElevated'
                    }`}
                  >
                    <p className="text-sm font-medium text-textPrimary">{ind.label}</p>
                    <p className="text-xs text-textSecondary">
                      Adj: {ind.adjustment >= 0 ? '+' : ''}{ind.adjustment}%
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">Modality</label>
              <select
                value={inputs.modality}
                onChange={(e) => setInputs({ ...inputs, modality: e.target.value })}
                className="w-full p-3 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                {MODALITIES.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Peak Sales Estimate ($M)
              </label>
              <div className="relative">
                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textTertiary" />
                <input
                  type="number"
                  value={inputs.peakSales}
                  onChange={(e) => setInputs({ ...inputs, peakSales: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
              <p className="text-xs text-textTertiary mt-1">Annual peak sales in millions USD</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                Expected Launch Year
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-textTertiary" />
                <input
                  type="number"
                  value={inputs.launchYear}
                  onChange={(e) => setInputs({ ...inputs, launchYear: Number(e.target.value) })}
                  min={2024}
                  max={2040}
                  className="w-full pl-10 pr-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg text-sm text-textPrimary focus:outline-none focus:ring-2 focus:ring-green-500/50"
                />
              </div>
            </div>

            <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning mb-1">Assumption Note</p>
                  <p className="text-xs text-textSecondary">
                    Peak sales should be based on bottom-up patient flow modeling, not top-down market share assumptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeStep === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-textSecondary mb-4">
              Adjust probability of success based on program-specific factors:
            </p>

            <div className="space-y-3">
              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  inputs.hasGeneticValidation ? 'border-green-500/50 bg-green-500/10' : 'border-white/10'
                }`}
                onClick={() => setInputs({ ...inputs, hasGeneticValidation: !inputs.hasGeneticValidation })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      inputs.hasGeneticValidation ? 'bg-green-500' : 'border-2 border-white/20'
                    }`}
                  >
                    {inputs.hasGeneticValidation && <Check size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textPrimary">Human Genetic Validation</p>
                    <p className="text-xs text-textSecondary">GWAS, Mendelian genetics support</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-green-400">+10%</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  inputs.hasBiomarker ? 'border-green-500/50 bg-green-500/10' : 'border-white/10'
                }`}
                onClick={() => setInputs({ ...inputs, hasBiomarker: !inputs.hasBiomarker })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      inputs.hasBiomarker ? 'bg-green-500' : 'border-2 border-white/20'
                    }`}
                  >
                    {inputs.hasBiomarker && <Check size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textPrimary">Predictive Biomarker</p>
                    <p className="text-xs text-textSecondary">Validated patient selection marker</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-green-400">+8%</span>
              </div>

              <div
                className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                  inputs.priorFailures ? 'border-danger/50 bg-danger/10' : 'border-white/10'
                }`}
                onClick={() => setInputs({ ...inputs, priorFailures: !inputs.priorFailures })}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center ${
                      inputs.priorFailures ? 'bg-danger' : 'border-2 border-white/20'
                    }`}
                  >
                    {inputs.priorFailures && <Check size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-textPrimary">Prior Mechanism Failures</p>
                    <p className="text-xs text-textSecondary">Similar MOA failed in clinic</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-danger">-12%</span>
              </div>
            </div>
          </div>
        )}

        {activeStep === 4 && results && (
          <div className="space-y-4">
            {/* Main Result */}
            <div className="p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
              <p className="text-green-100 text-sm mb-1">Risk-Adjusted NPV</p>
              <p className="text-4xl font-bold">${results.rNPV}M</p>
              <div className="mt-4 pt-4 border-t border-green-400/30">
                <div className="flex justify-between text-sm">
                  <span className="text-green-100">Base NPV</span>
                  <span className="font-semibold">${results.npv}M</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-green-100">Adjusted PoS</span>
                  <span className="font-semibold">{results.adjustedPoS}%</span>
                </div>
              </div>
            </div>

            {/* PoS Breakdown */}
            <div className="p-4 bg-surfaceElevated rounded-lg border border-white/10">
              <h4 className="text-sm font-semibold text-textPrimary mb-3">PoS Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-textSecondary">Base PoS (Stage)</span>
                  <span className="font-medium text-textPrimary">{results.basePoS}%</span>
                </div>
                {inputs.hasGeneticValidation && (
                  <div className="flex justify-between text-sm">
                    <span className="text-textSecondary">+ Genetic Validation</span>
                    <span className="font-medium text-green-400">+10%</span>
                  </div>
                )}
                {inputs.hasBiomarker && (
                  <div className="flex justify-between text-sm">
                    <span className="text-textSecondary">+ Biomarker</span>
                    <span className="font-medium text-green-400">+8%</span>
                  </div>
                )}
                {inputs.priorFailures && (
                  <div className="flex justify-between text-sm">
                    <span className="text-textSecondary">- Prior Failures</span>
                    <span className="font-medium text-danger">-12%</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-2 border-t border-white/10">
                  <span className="font-semibold text-textPrimary">Adjusted PoS</span>
                  <span className="font-bold text-green-400">{results.adjustedPoS}%</span>
                </div>
              </div>
            </div>

            {/* Sensitivities */}
            <div className="p-4 bg-surfaceElevated rounded-lg border border-white/10">
              <h4 className="text-sm font-semibold text-textPrimary mb-3">Key Sensitivities</h4>
              <div className="space-y-2">
                {results.sensitivities.map((sens: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-textSecondary">{sens.driver}</span>
                    <span className="font-medium text-textPrimary">{sens.impact}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className="flex-1 py-2 px-4 bg-surfaceElevated border border-white/10 rounded-lg text-sm font-medium text-textPrimary hover:border-white/20 flex items-center justify-center gap-2 transition-colors">
                <Download size={16} />
                Export
              </button>
              <button className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 flex items-center justify-center gap-2 transition-colors">
                <FileText size={16} />
                Full Report
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      {activeStep < 4 && (
        <div className="p-4 border-t border-white/10 bg-surfaceElevated">
          <div className="flex gap-3">
            {activeStep > 1 && (
              <button
                onClick={() => setActiveStep(activeStep - 1)}
                className="flex-1 py-3 border border-white/10 rounded-xl font-semibold text-sm text-textPrimary hover:bg-surface transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (activeStep === 3 ? calculateResults() : setActiveStep(activeStep + 1))}
              disabled={isCalculating}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold text-sm hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isCalculating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Calculating...
                </>
              ) : activeStep === 3 ? (
                'Calculate rNPV'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
