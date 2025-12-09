import { useState, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import ExecutiveSummaryTile from './tiles/ExecutiveSummaryTile';
import GeneticValidationTile from './tiles/GeneticValidationTile';
import DruggabilityTile from './tiles/DruggabilityTile';
import ExpressionBiologyTile from './tiles/ExpressionBiologyTile';
import MechanisticTile from './tiles/MechanisticTile';
import ClinicalPrecedentTile from './tiles/ClinicalPrecedentTile';
import SafetyAssessmentTile from './tiles/SafetyAssessmentTile';
import KeyExperimentsTile from './tiles/KeyExperimentsTile';
import DynamicTile from './DynamicTile';
import { useTileStore } from '../lib/tiles/store';
import {
  SCIENTIST_EXECUTIVE_SUMMARY,
  GENETIC_VALIDATION_DATA,
  DRUGGABILITY_DATA,
  EXPRESSION_DATA,
  MECHANISTIC_DATA,
  CLINICAL_PRECEDENT_DATA,
  SAFETY_DATA,
  KEY_EXPERIMENTS_DATA,
} from '../constants';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1, duration: 0.3 },
  },
};

interface ScientistDashboardProps {
  viewMode?: 'grid' | 'list';
}

const ScientistDashboard = memo(function ScientistDashboard({ viewMode = 'grid' }: ScientistDashboardProps) {
  const [loading] = useState(false);
  const visibleTiles = useTileStore((state) => state.getVisibleTiles());

  // Sort tiles: pinned first, then by creation date
  const sortedTiles = useMemo(() => {
    return [...visibleTiles].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [visibleTiles]);

  const gridClasses = viewMode === 'grid' 
    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'
    : 'flex flex-col gap-6';

  return (
    <div className="p-6 w-full">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={`${gridClasses} w-full`}
      >
        {/* User-Created Tiles (pinned first) */}
        {sortedTiles
          .filter(tile => tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}

        {/* Baseline Tiles */}
        {/* ROW 1: Executive Summary */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 xl:col-span-4' : 'w-full'}>
          <ExecutiveSummaryTile data={SCIENTIST_EXECUTIVE_SUMMARY} loading={loading} />
        </div>

        {/* ROW 2: Expression Biology */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2 xl:col-span-4' : 'w-full'}>
          <ExpressionBiologyTile data={EXPRESSION_DATA} loading={loading} />
        </div>

        {/* ROW 3: Mechanistic Rationale + Clinical Precedent */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <MechanisticTile data={MECHANISTIC_DATA} loading={loading} />
        </div>
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <ClinicalPrecedentTile data={CLINICAL_PRECEDENT_DATA} loading={loading} />
        </div>

        {/* ROW 4: Genetic Validation + Druggability (moved to bottom) */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <GeneticValidationTile data={GENETIC_VALIDATION_DATA} loading={loading} />
        </div>
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <DruggabilityTile data={DRUGGABILITY_DATA} loading={loading} />
        </div>

        {/* ROW 5: Safety Assessment + Key Experiments */}
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <SafetyAssessmentTile data={SAFETY_DATA} loading={loading} />
        </div>
        <div className={viewMode === 'grid' ? 'col-span-1 md:col-span-2' : 'w-full'}>
          <KeyExperimentsTile data={KEY_EXPERIMENTS_DATA} loading={loading} />
        </div>

        {/* User-Created Tiles (non-pinned) */}
        {sortedTiles
          .filter(tile => !tile.isPinned)
          .map((tile) => (
            <DynamicTile key={tile.id} tile={tile} />
          ))}
      </motion.div>
    </div>
  );
});

ScientistDashboard.displayName = 'ScientistDashboard';

export default ScientistDashboard;
