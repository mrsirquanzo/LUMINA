'use client';

import { useState } from 'react';
import { AgentType } from '@/lib/multiAgentTypes';
import {
  AGENT_INFO,
  CustomAgentTeam,
  validateTeam,
  deleteCustomTeam,
  getAgentTeams,
  DEFAULT_TEAMS,
} from '@/lib/customAgentTeams';
import { FiCheck, FiTrash2, FiUsers, FiZap, FiClock } from 'react-icons/fi';

interface CustomAgentTeamBuilderProps {
  onTeamSelect: (team: CustomAgentTeam) => void;
  selectedTeam?: CustomAgentTeam | null;
}

export default function CustomAgentTeamBuilder({
  onTeamSelect,
  selectedTeam,
}: CustomAgentTeamBuilderProps) {
  const [allTeams, setAllTeams] = useState<CustomAgentTeam[]>(getAgentTeams());
  const [selectedAgents, setSelectedAgents] = useState<AgentType[]>([]);
  const [mode, setMode] = useState<'fast' | 'thorough'>('thorough');

  const toggleAgent = (agent: AgentType) => {
    setSelectedAgents(prev =>
      prev.includes(agent) ? prev.filter(a => a !== agent) : [...prev, agent]
    );
  };

  const handleDeleteTeam = (id: string) => {
    if (!confirm('Are you sure you want to delete this custom team?')) return;

    if (deleteCustomTeam(id)) {
      setAllTeams(getAgentTeams());
      if (selectedTeam?.id === id) {
        onTeamSelect(DEFAULT_TEAMS[0]);
      }
    }
  };

  const handleUseCustomSelection = () => {
    const validation = validateTeam(selectedAgents);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    // Create temporary team from selection
    const tempTeam: CustomAgentTeam = {
      id: 'temp-' + Date.now(),
      name: 'Custom Selection',
      description: `${selectedAgents.length} agents selected`,
      agents: selectedAgents,
      mode,
      createdAt: Date.now(),
    };

    onTeamSelect(tempTeam);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { border: string; bg: string; text: string }> = {
      blue: {
        border: isSelected ? 'border-blue-500' : 'border-blue-200',
        bg: isSelected ? 'bg-blue-100' : 'bg-blue-50',
        text: 'text-blue-700',
      },
      purple: {
        border: isSelected ? 'border-purple-500' : 'border-purple-200',
        bg: isSelected ? 'bg-purple-100' : 'bg-purple-50',
        text: 'text-purple-700',
      },
      green: {
        border: isSelected ? 'border-green-500' : 'border-green-200',
        bg: isSelected ? 'bg-green-100' : 'bg-green-50',
        text: 'text-green-700',
      },
      orange: {
        border: isSelected ? 'border-orange-500' : 'border-orange-200',
        bg: isSelected ? 'bg-orange-100' : 'bg-orange-50',
        text: 'text-orange-700',
      },
      teal: {
        border: isSelected ? 'border-teal-500' : 'border-teal-200',
        bg: isSelected ? 'bg-teal-100' : 'bg-teal-50',
        text: 'text-teal-700',
      },
    };

    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Build Custom Team</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(AGENT_INFO) as AgentType[]).map(agent => {
            const info = AGENT_INFO[agent];
            const isSelected = selectedAgents.includes(agent);
            const colors = getColorClasses(info.color, isSelected);

            return (
              <button
                key={agent}
                onClick={() => toggleAgent(agent)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${colors.border} ${colors.bg}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{info.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={`font-semibold ${colors.text}`}>{info.name}</h4>
                      {isSelected && (
                        <FiCheck className={`w-5 h-5 flex-shrink-0 ${colors.text}`} />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{info.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mode Selection */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Execution Mode:</span>
          <button
            onClick={() => setMode('fast')}
            className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
              mode === 'fast'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiZap className="w-4 h-4" />
            FAST
          </button>
          <button
            onClick={() => setMode('thorough')}
            className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
              mode === 'thorough'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FiClock className="w-4 h-4" />
            THOROUGH
          </button>
        </div>

        {/* Action Buttons */}
        {selectedAgents.length > 0 && (
          <div className="mt-4 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleUseCustomSelection}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <FiUsers className="w-4 h-4" />
              Use This Team ({selectedAgents.length} agents)
            </button>
          </div>
        )}
      </div>

      {/* Saved Teams */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preset Teams</h3>
        <div className="space-y-2">
          {allTeams.map(team => (
            <button
              key={team.id}
              onClick={() => onTeamSelect(team)}
              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                selectedTeam?.id === team.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{team.name}</h4>
                    {team.isDefault && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        Preset
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        team.mode === 'fast'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {team.mode}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{team.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {team.agents.map(agent => (
                      <span
                        key={agent}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                      >
                        {AGENT_INFO[agent].icon} {AGENT_INFO[agent].name}
                      </span>
                    ))}
                  </div>
                </div>
                {!team.isDefault && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      handleDeleteTeam(team.id);
                    }}
                    className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
