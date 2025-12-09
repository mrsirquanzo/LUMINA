import { useState, useMemo } from 'react';
import {
  GitCompare,
  X,
  ChevronDown,
  Download,
  Save,
  AlertTriangle,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const AVAILABLE_TARGETS = ['TROP2', 'HER2', 'PD-L1', 'EGFR', 'CD19'];

export default function CompareView() {
  const [selectedTargets, setSelectedTargets] = useState<string[]>(['TROP2', 'HER2']);
  const [showTargetSelector, setShowTargetSelector] = useState<string | null>(null);

  const addTarget = (target: string) => {
    if (selectedTargets.length < 3 && !selectedTargets.includes(target)) {
      setSelectedTargets([...selectedTargets, target]);
    }
  };

  const removeTarget = (target: string) => {
    setSelectedTargets(selectedTargets.filter((t) => t !== target));
  };

  // Mock comparison data - in real app, this would come from API/state
  const comparisonData = useMemo(() => {
    return selectedTargets.map((target) => {
      const baseData = {
        target,
        overallScore: 75,
        therapeuticWindow: 'Moderate' as const,
        safetyScore: 'Manageable' as const,
        druggability: 'High' as const,
        clinicalActivity: 'Validated' as const,
        marketSize: 5.0,
      };
      
      if (target === 'TROP2') {
        return { ...baseData, overallScore: 82, therapeuticWindow: 'Favorable' as const, marketSize: 5.2 };
      } else if (target === 'HER2') {
        return { ...baseData, overallScore: 88, safetyScore: 'Favorable' as const, marketSize: 12.5 };
      }
      
      return baseData;
    });
  }, [selectedTargets]);

  const expressionComparisonData = useMemo(() => {
    return selectedTargets.map((target) => ({
      target,
      tnbc: target === 'TROP2' ? 892 : 450,
      nsclc: target === 'TROP2' ? 489 : 380,
      ovarian: target === 'TROP2' ? 389 : 320,
    }));
  }, [selectedTargets]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary mb-2">Compare Analysis</h1>
          <p className="text-textSecondary">Side-by-side comparison of targets and assets</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textPrimary">
            <Save className="w-4 h-4" />
            Save Comparison
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-warning text-black rounded-lg hover:bg-warning/90 transition-colors font-medium">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Target Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((index) => {
          const target = selectedTargets[index];
          return (
            <div key={index} className="relative">
              <label className="block text-xs text-textTertiary mb-2 uppercase tracking-wider">
                {index === 0 ? 'Target 1' : index === 1 ? 'Target 2' : 'Target 3 (Optional)'}
              </label>
              {target ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-surface border border-white/10 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-textPrimary font-medium">{target}</span>
                    </div>
                    <button
                      onClick={() => removeTarget(target)}
                      className="text-textTertiary hover:text-textPrimary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setShowTargetSelector(index.toString())}
                    className="w-full px-4 py-3 bg-surfaceElevated border border-white/10 rounded-lg hover:bg-surface transition-colors text-textSecondary hover:text-textPrimary flex items-center justify-between"
                  >
                    <span>Select target...</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showTargetSelector === index.toString() && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-surfaceElevated border border-white/10 rounded-lg shadow-xl z-10 max-h-60 overflow-y-auto">
                      {AVAILABLE_TARGETS.filter((t) => !selectedTargets.includes(t)).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            addTarget(t);
                            setShowTargetSelector(null);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-surface transition-colors text-textPrimary"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectedTargets.length < 2 && (
        <div className="text-center py-12 bg-surfaceElevated rounded-xl border border-white/5">
          <GitCompare className="w-12 h-12 text-textTertiary mx-auto mb-4 opacity-50" />
          <p className="text-textSecondary mb-2">Select at least 2 targets to compare</p>
          <p className="text-sm text-textTertiary">Choose targets from the dropdowns above</p>
        </div>
      )}

      {selectedTargets.length >= 2 && (
        <div className="space-y-8">
          {/* Executive Summary Comparison */}
          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-4">Executive Summary</h2>
            <div className="bg-surfaceElevated border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase">
                        Metric
                      </th>
                      {comparisonData.map((data) => (
                        <th
                          key={data.target}
                          className="px-4 py-3 text-center text-sm font-semibold text-textPrimary"
                        >
                          {data.target}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3 text-sm text-textSecondary">Overall Score</td>
                      {comparisonData.map((data) => (
                        <td key={data.target} className="px-4 py-3 text-center">
                          <span
                            className={`text-lg font-bold ${
                              data.overallScore >= 80
                                ? 'text-success'
                                : data.overallScore >= 60
                                  ? 'text-warning'
                                  : 'text-danger'
                            }`}
                          >
                            {data.overallScore}
                          </span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3 text-sm text-textSecondary">Therapeutic Window</td>
                      {comparisonData.map((data) => (
                        <td key={data.target} className="px-4 py-3 text-center">
                          <span className="text-sm text-textPrimary">{data.therapeuticWindow}</span>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-4 py-3 text-sm text-textSecondary">Safety Profile</td>
                      {comparisonData.map((data) => (
                        <td key={data.target} className="px-4 py-3 text-center">
                          <span className="text-sm text-textPrimary">{data.safetyScore}</span>
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-textSecondary">Druggability</td>
                      {comparisonData.map((data) => (
                        <td key={data.target} className="px-4 py-3 text-center">
                          <span className="text-sm text-textPrimary">{data.druggability}</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Expression Comparison */}
          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-4">Expression Profile</h2>
            <div className="bg-surfaceElevated border border-white/5 rounded-xl p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expressionComparisonData}>
                    <XAxis
                      dataKey="indication"
                      tick={{ fill: '#86868B', fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#86868B', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1C1C1E',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    {selectedTargets.map((target, idx) => {
                      const colors = ['#BF5AF2', '#FF9F0A', '#0A84FF'];
                      return (
                        <Line
                          key={target}
                          type="monotone"
                          dataKey={target.toLowerCase()}
                          stroke={colors[idx]}
                          strokeWidth={2}
                          name={target}
                          data={[
                            { indication: 'TNBC', [target.toLowerCase()]: expressionComparisonData[idx]?.tnbc },
                            {
                              indication: 'NSCLC',
                              [target.toLowerCase()]: expressionComparisonData[idx]?.nsclc,
                            },
                            {
                              indication: 'Ovarian',
                              [target.toLowerCase()]: expressionComparisonData[idx]?.ovarian,
                            },
                          ]}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Safety Profile Comparison */}
          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-4">Safety Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisonData.map((data) => (
                <div
                  key={data.target}
                  className="bg-surfaceElevated border border-white/5 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-textPrimary">{data.target}</h3>
                    <AlertTriangle
                      className={`w-5 h-5 ${
                        data.safetyScore === 'Favorable'
                          ? 'text-success'
                          : data.safetyScore === 'Manageable'
                            ? 'text-warning'
                            : 'text-danger'
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-textSecondary">Safety Score</span>
                      <span className="text-sm font-semibold text-textPrimary">{data.safetyScore}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-textSecondary">Therapeutic Index</span>
                      <span className="text-sm font-semibold text-textPrimary">3-5x</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Clinical Data Comparison */}
          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-4">Clinical Activity</h2>
            <div className="bg-surfaceElevated border border-white/5 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase">
                        Target
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase">
                        Activity
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase">
                        Approved Assets
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-textTertiary uppercase">
                        Active Programs
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((data) => (
                      <tr key={data.target} className="border-b border-white/5">
                        <td className="px-4 py-3 text-sm font-semibold text-textPrimary">{data.target}</td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-success">{data.clinicalActivity}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-textSecondary">1-2</td>
                        <td className="px-4 py-3 text-sm text-textSecondary">15-20</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Differences Highlight */}
          <section>
            <h2 className="text-xl font-semibold text-textPrimary mb-4">Key Differences</h2>
            <div className="bg-warning/10 border border-warning/30 rounded-xl p-6">
              <ul className="space-y-2">
                <li className="text-sm text-textSecondary flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span>
                    <strong className="text-textPrimary">HER2</strong> shows higher overall score (88 vs 82)
                    but <strong className="text-textPrimary">TROP2</strong> has more favorable therapeutic
                    window
                  </span>
                </li>
                <li className="text-sm text-textSecondary flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span>
                    <strong className="text-textPrimary">TROP2</strong> has newer competitive landscape
                    compared to more established <strong className="text-textPrimary">HER2</strong> market
                  </span>
                </li>
                <li className="text-sm text-textSecondary flex items-start gap-2">
                  <span className="text-warning mt-0.5">•</span>
                  <span>
                    Safety profiles are similar, both manageable with distinct risk profiles
                  </span>
                </li>
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
