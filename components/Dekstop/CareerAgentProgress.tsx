"use client"

import React, { useState, useEffect } from 'react';

interface MissionProgress {
  id: string;
  company: string;
  role: string;
  status: string;
  progress: number;
  interviewDate?: string;
  priority: string;
  createdAt: string;
}

export function CareerAgentProgress() {
  const [missions, setMissions] = useState<MissionProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
    // Poll every 5 seconds for updates
    const interval = setInterval(loadMissions, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadMissions = async () => {
    try {
      const response = await fetch('/api/career/mission');
      if (response.ok) {
        const data = await response.json();
        setMissions(data.missions || []);
        setError(null);
      } else {
        setError('Failed to load missions');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CREATED': 'bg-blue-500',
      'ANALYZING': 'bg-yellow-500',
      'PLANNING': 'bg-purple-500',
      'READY': 'bg-green-500',
      'EXECUTING': 'bg-green-600',
      'WAITING_FOR_PERMISSION': 'bg-orange-500',
      'WAITING_FOR_USER': 'bg-orange-600',
      'COMPLETED': 'bg-emerald-500',
      'FAILED': 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getDaysUntilInterview = (date?: string) => {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (loading) {
    return (
      <div className="fixed top-4 right-4 w-96 bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
        <div className="text-white text-center">Loading missions...</div>
      </div>
    );
  }

  if (missions.length === 0) {
    return (
      <div className="fixed top-4 right-4 w-96 bg-black/90 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-2xl">
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <div className="text-white font-bold mb-2">No Active Missions</div>
          <div className="text-white/60 text-sm">
            Click the MIC button and say<br/>"I have an interview"
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 w-96 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div className="text-white font-bold">Career Agent</div>
          </div>
          <button
            onClick={loadMissions}
            className="text-white/80 hover:text-white transition"
          >
            ↻
          </button>
        </div>
        <div className="text-white/80 text-sm mt-1">
          {missions.length} active mission{missions.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Missions List */}
      <div className="max-h-96 overflow-y-auto">
        {missions.map((mission, index) => {
          const daysUntil = getDaysUntilInterview(mission.interviewDate);
          
          return (
            <div key={mission.id} className="p-4 border-b border-white/10 last:border-b-0">
              {/* Company & Role */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="text-white font-bold">{mission.company}</div>
                  <div className="text-white/60 text-sm">{mission.role}</div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold text-white ${getStatusColor(mission.status)}`}>
                  {mission.status}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-white/60 mb-1">
                  <span>Progress</span>
                  <span>{mission.progress}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${mission.progress}%` }}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-white/40">Priority</div>
                  <div className="text-white font-medium">{mission.priority}</div>
                </div>
                {daysUntil !== null && (
                  <div>
                    <div className="text-white/40">Interview</div>
                    <div className={`font-medium ${daysUntil <= 3 ? 'text-red-400' : daysUntil <= 7 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {daysUntil > 0 ? `In ${daysUntil} days` : 'Today!'}
                    </div>
                  </div>
                )}
              </div>

              {/* Created Date */}
              <div className="text-white/40 text-xs mt-2">
                Created: {new Date(mission.createdAt).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-3 bg-white/5 text-center">
        <div className="text-white/60 text-xs">
          Data refreshes every 5 seconds
        </div>
      </div>
    </div>
  );
}
