import React, { useMemo } from 'react';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface DynamicQRCodeProps {
  data: string;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const DynamicQRCode: React.FC<DynamicQRCodeProps> = ({
  data,
  size = 220,
  className = '',
  animate = true,
}) => {
  // Deterministically generate a 21x21 QR-like matrix grid based on the data string
  const grid = useMemo(() => {
    const matrix: boolean[][] = Array(21).fill(false).map(() => Array(21).fill(false));

    // Helper to draw standard 7x7 Finder Patterns at top-left, top-right, bottom-left
    const drawFinderPattern = (rowStart: number, colStart: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[rowStart + r][colStart + c] = true;
          } else {
            matrix[rowStart + r][colStart + c] = false;
          }
        }
      }
    };

    // Draw 3 corner finder patterns
    drawFinderPattern(0, 0);
    drawFinderPattern(0, 14);
    drawFinderPattern(14, 0);

    // Draw timing patterns
    for (let i = 8; i < 13; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Hash the input data into bit values for the data cells
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }

    // Populate data cells
    let bitIndex = 0;
    for (let r = 0; r < 21; r++) {
      for (let c = 0; c < 21; c++) {
        // Skip finder areas
        const isTopLeft = r < 8 && c < 8;
        const isTopRight = r < 8 && c >= 13;
        const isBottomLeft = r >= 13 && c < 8;
        const isCenter = r >= 8 && r <= 12 && c >= 8 && c <= 12;

        if (!isTopLeft && !isTopRight && !isBottomLeft && !isCenter) {
          const pseudoBit = ((hash ^ (r * 31 + c * 17 + bitIndex)) & (1 << (bitIndex % 16))) !== 0;
          matrix[r][c] = pseudoBit;
          bitIndex++;
        }
      }
    }

    return matrix;
  }, [data]);

  return (
    <div
      className={`relative inline-flex items-center justify-center p-3.5 bg-white rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700/60 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 21 21"
        className="w-full h-full text-slate-900"
        fill="currentColor"
        shapeRendering="crispEdges"
      >
        {grid.map((row, r) =>
          row.map((cell, c) => {
            // Keep center area clear for shield badge
            if (r >= 8 && r <= 12 && c >= 8 && c <= 12) return null;
            if (!cell) return null;
            return (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width="1"
                height="1"
                className="transition-all duration-300 fill-slate-900"
              />
            );
          })
        )}
      </svg>

      {/* Center Cryptographic Badge */}
      <motion.div
        animate={animate ? { scale: [1, 1.08, 1] } : undefined}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-lg border-2 border-white shadow-brand-500/40"
      >
        <ShieldCheck className="w-5 h-5 text-white" />
      </motion.div>
    </div>
  );
};
