import React, { useState } from 'react';
import { Clock, Play, RotateCcw, Sparkles, Sliders, Calendar } from 'lucide-react';
import { useTimetableStore } from '../../store/useTimetableStore';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TimeSimulatorBar: React.FC = () => {
  const {
    isSimulationMode,
    simulatedDay,
    simulatedTime,
    enableSimulation,
    disableSimulation,
  } = useTimetableStore();

  const [isOpen, setIsOpen] = useState(false);
  const [customDay, setCustomDay] = useState(1); // Monday default
  const [customTime, setCustomTime] = useState('09:15');

  const presets = [
    { label: 'Mon 09:15 AM (CS402 Lecture)', day: 1, time: '09:15' },
    { label: 'Mon 11:15 AM (CS405 Lecture)', day: 1, time: '11:15' },
    { label: 'Mon 02:30 PM (CS402 Lab)', day: 1, time: '14:30' },
    { label: 'Tue 10:15 AM (CS409 Lecture)', day: 2, time: '10:15' },
    { label: 'Fri 10:30 AM (CS405 Lab)', day: 5, time: '10:30' },
  ];

  const handleApplyCustom = () => {
    enableSimulation(customDay, customTime);
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Clock & Active Session Detection Engine
              </span>
              {isSimulationMode ? (
                <Badge variant="warning" dot pulse className="text-[10px]">
                  SIMULATED: {DAY_NAMES[simulatedDay || 0]} {simulatedTime}
                </Badge>
              ) : (
                <Badge variant="emerald" dot pulse className="text-[10px]">
                  REAL-TIME SYSTEM CLOCK
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Classes matching the active clock and day are automatically highlighted with live session controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSimulationMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={disableSimulation}
              className="text-xs text-slate-600 dark:text-slate-300"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset to Real Clock
            </Button>
          )}

          <Button
            variant={isOpen ? 'glow' : 'outline'}
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs"
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
          >
            {isOpen ? 'Hide Simulator' : 'Test Time Simulator'}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Quick Live Scenarios:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => enableSimulation(p.day, p.time)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSimulationMode && simulatedDay === p.day && simulatedTime === p.time
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Custom Day:</span>
              <select
                value={customDay}
                onChange={(e) => setCustomDay(Number(e.target.value))}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white"
              >
                <option value={1}>Monday</option>
                <option value={2}>Tuesday</option>
                <option value={3}>Wednesday</option>
                <option value={4}>Thursday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
                <option value={0}>Sunday</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Custom Time:</span>
              <input
                type="time"
                value={customTime}
                onChange={(e) => setCustomTime(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <Button
              variant="glow"
              size="sm"
              onClick={handleApplyCustom}
              className="text-xs"
              leftIcon={<Play className="w-3 h-3 fill-current" />}
            >
              Simulate Active Slot
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
