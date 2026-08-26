import React, { useState } from 'react';
import { Sparkles, Info, Copy, Check, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface VectorVisualizerProps {
  vector?: number[] | Float32Array;
  label?: string;
  className?: string;
  isLive?: boolean;
}

export const VectorVisualizer: React.FC<VectorVisualizerProps> = ({
  vector,
  label = '128-Dimensional Biometric Embedding',
  className = '',
  isLive = false,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate deterministic synthetic vector if none provided
  const data: number[] = React.useMemo(() => {
    if (vector && vector.length === 128) {
      return Array.from(vector);
    }
    // Deterministic mock 128D vector
    const pseudo: number[] = [];
    for (let i = 0; i < 128; i++) {
      pseudo.push(Math.sin((i + 1) * 1.618) * 0.18 + Math.cos((i + 3) * 0.8) * 0.12);
    }
    return pseudo;
  }, [vector]);

  // Compute Vector Stats
  const stats = React.useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let sumSq = 0;
    for (const val of data) {
      if (val < min) min = val;
      if (val > max) max = val;
      sumSq += val * val;
    }
    const l2Norm = Math.sqrt(sumSq);
    return {
      min: min.toFixed(3),
      max: max.toFixed(3),
      l2Norm: l2Norm.toFixed(3),
      dimCount: data.length,
    };
  }, [data]);

  const handleCopyHex = () => {
    try {
      const jsonStr = JSON.stringify(data);
      navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      toast.success('128D Float32 vector copied to clipboard (JSON array)');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Color generator for matrix cells based on value
  const getCellColor = (val: number) => {
    // values usually range between -0.35 and +0.35
    const normalized = Math.max(-1, Math.min(1, val * 3));
    if (normalized > 0) {
      const alpha = Math.min(1, Math.max(0.15, normalized));
      return `rgba(6, 182, 212, ${alpha})`; // Cyan
    } else {
      const alpha = Math.min(1, Math.max(0.15, Math.abs(normalized)));
      return `rgba(168, 85, 247, ${alpha})`; // Purple
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 backdrop-blur-sm space-y-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-xs font-bold text-slate-200 font-mono tracking-tight flex items-center gap-1.5">
            {label}
            {isLive && (
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyHex}
            className="text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1"
            title="Copy vector values"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" /> Copied
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" /> Copy Vector
              </>
            )}
          </button>
        </div>
      </div>

      {/* 128-Cell Matrix Heatmap Grid (8 rows x 16 cols = 128 dimensions) */}
      <div className="space-y-1.5">
        <div
          className="grid gap-1 p-2 rounded-xl bg-black/50 border border-slate-900 overflow-hidden"
          style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
        >
          {data.map((val, idx) => (
            <div
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="aspect-square rounded-[3px] transition-transform duration-100 hover:scale-125 cursor-pointer relative group"
              style={{
                backgroundColor: getCellColor(val),
                boxShadow:
                  hoveredIdx === idx ? '0 0 8px rgba(6, 182, 212, 0.8)' : undefined,
              }}
            />
          ))}
        </div>

        {/* Hovered Dimension Inspector */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-1">
          {hoveredIdx !== null ? (
            <span className="text-accent-cyan flex items-center gap-1">
              <Eye className="w-3 h-3 inline" /> Dim [{hoveredIdx}]:{' '}
              <strong className="text-white">{data[hoveredIdx].toFixed(6)}</strong>
            </span>
          ) : (
            <span className="text-slate-500">Hover over any cell to inspect dimension coordinate</span>
          )}

          <span className="text-slate-500">128 × Float32 (512 Bytes)</span>
        </div>
      </div>

      {/* Vector Mathematical Properties Footer */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <span className="text-slate-500 text-[10px] block">L2 Norm (Unit)</span>
          <span className="font-bold text-accent-cyan block">{stats.l2Norm}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <span className="text-slate-500 text-[10px] block">Coordinate Min</span>
          <span className="font-bold text-purple-400 block">{stats.min}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/50">
          <span className="text-slate-500 text-[10px] block">Coordinate Max</span>
          <span className="font-bold text-emerald-400 block">+{stats.max}</span>
        </div>
      </div>
    </div>
  );
};
