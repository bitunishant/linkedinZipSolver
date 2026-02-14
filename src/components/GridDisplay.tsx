'use client';

import { Grid } from '@/types';
import { useState, useEffect, useMemo } from 'react';

interface GridDisplayProps {
  grid: Grid;
  solutionPath: Array<[number, number]>;
  showAnimation: boolean;
}

export default function GridDisplay({
  grid,
  solutionPath,
  showAnimation,
}: GridDisplayProps) {
  const [displayedPoints, setDisplayedPoints] = useState<Array<[number, number]>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (!showAnimation) {
        setDisplayedPoints([]);
        return;
      }

      // Safety check
      if (!solutionPath || solutionPath.length === 0) {
        console.warn('No solution path provided');
        return;
      }

      // Animate by showing points progressively
      setDisplayedPoints([]);
      let pointIndex = 0;

      const timer = setInterval(() => {
        if (pointIndex < solutionPath.length) {
          const point = solutionPath[pointIndex];
          if (point && Array.isArray(point) && point.length === 2) {
            setDisplayedPoints((prev) => [...prev, point]);
          }
          pointIndex++;
        } else {
          clearInterval(timer);
        }
      }, 40); // Add a new point every 40ms

      return () => clearInterval(timer);
    } catch (err) {
      console.error('Error in GridDisplay animation:', err);
      setError(String(err));
    }
  }, [showAnimation, solutionPath]);

  const cellWidth = 100 / (grid?.cols || 1);
  const cellHeight = 100 / (grid?.rows || 1);

  const animatedPointsString = useMemo(() => {
    if (!displayedPoints || displayedPoints.length === 0) return '';
    
    return displayedPoints
      .filter((pos) => pos && typeof pos[0] === 'number' && typeof pos[1] === 'number')
      .map((pos) => {
        const centerX = (pos[0] + 0.5) * cellWidth;
        const centerY = (pos[1] + 0.5) * cellHeight;
        return `${centerX},${centerY}`;
      })
      .join(' ');
  }, [displayedPoints, cellWidth, cellHeight]);

  if (!grid) {
    return <div className="text-red-500">Grid data not available</div>;
  }

  if (error) {
    return <div className="text-red-500">Grid Error: {error}</div>;
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="relative w-full aspect-square bg-gray-100 border-2 border-gray-300 rounded-lg overflow-hidden">
        {/* Grid background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Vertical lines */}
          {Array.from({ length: grid.cols + 1 }).map((_, i) => (
            <line
              key={`v-${i}`}
              x1={`${(i * 100) / grid.cols}`}
              y1="0"
              x2={`${(i * 100) / grid.cols}`}
              y2="100"
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}
          {/* Horizontal lines */}
          {Array.from({ length: grid.rows + 1 }).map((_, i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={`${(i * 100) / grid.rows}`}
              x2="100"
              y2={`${(i * 100) / grid.rows}`}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}
        </svg>

        {/* Cells layer */}
        {grid.cells.map((cell, index) => {
          const left = cell.x * cellWidth;
          const top = cell.y * cellHeight;

          let bgColor = 'bg-white';
          if (cell.type === 'hurdle') {
            bgColor = 'bg-blue-600';
          } else if (cell.type === 'number') {
            bgColor = 'bg-yellow-200';
          }

          return (
            <div
              key={index}
              className={`absolute ${bgColor} border border-gray-300 flex items-center justify-center font-bold text-xl`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${cellWidth}%`,
                height: `${cellHeight}%`,
              }}
            >
              {cell.type === 'number' && (
                <span className="text-gray-900">{cell.number}</span>
              )}
            </div>
          );
        })}

        {/* Animation SVG overlay */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ zIndex: 20 }}
        >
          {/* Show full path faintly for reference */}
          {solutionPath.length > 0 && (
            <polyline
              points={solutionPath
                .map((pos) => `${(pos[0] + 0.5) * cellWidth},${(pos[1] + 0.5) * cellHeight}`)
                .join(' ')}
              stroke="rgba(30, 58, 138, 0.15)"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Animated path - progressively drawn */}
          {animatedPointsString && (
            <polyline
              points={animatedPointsString}
              stroke="#1e3a8a"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: 'drop-shadow(0 0 2px rgba(30, 58, 138, 0.8))',
              }}
            />
          )}

          {/* Circles at each point for clarity */}
          {displayedPoints.map((pos, idx) => (
            <circle
              key={`pt-${idx}`}
              cx={`${(pos[0] + 0.5) * cellWidth}`}
              cy={`${(pos[1] + 0.5) * cellHeight}`}
              r="1.5"
              fill="#1e3a8a"
              stroke="white"
              strokeWidth="0.3"
            />
          ))}
        </svg>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-gray-600">
        <div>Grid: {grid.rows}×{grid.cols}</div>
        <div>Hurdles: {grid.hurdles.length}</div>
        <div>Path: {solutionPath.length} points</div>
        <div>Progress: {displayedPoints.length}/{solutionPath.length}</div>
      </div>
    </div>
  );
}
