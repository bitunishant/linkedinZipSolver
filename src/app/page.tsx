'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { GameState } from '@/types';
import { analyzeImage, findSolutionPath } from '@/lib/imageProcessor';
import ImageUpload from '@/components/ImageUpload';
import GridDisplay from '@/components/GridDisplay';
import { AlertCircle, Play, RotateCcw } from 'lucide-react';

export default function Home() {
  const [gameState, setGameState] = useState<GameState>({
    image: null,
    grid: null,
    solutionPath: [],
    isProcessing: false,
    error: null,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showAnimation, setShowAnimation] = useState(false);

  const handleImageUpload = async (imageData: string) => {
    setGameState((prev) => ({
      ...prev,
      isProcessing: true,
      error: null,
      grid: null,
      solutionPath: [],
    }));
    setShowAnimation(false);

    try {
      // Load image and analyze it
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) {
          setGameState((prev) => ({
            ...prev,
            error: 'Canvas not available',
            isProcessing: false,
          }));
          return;
        }

        // Set canvas size to match image
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setGameState((prev) => ({
            ...prev,
            error: 'Could not get canvas context',
            isProcessing: false,
          }));
          return;
        }

        // Draw image on canvas
        ctx.drawImage(img, 0, 0);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Analyze image
        const detectedGrid = analyzeImage(canvas, imageData);

        if (!detectedGrid) {
          setGameState((prev) => ({
            ...prev,
            error: 'Could not detect grid in the image',
            isProcessing: false,
          }));
          return;
        }

        // Find solution path
        const path = findSolutionPath(detectedGrid);

        setGameState((prev) => ({
          ...prev,
          image: imageData,
          grid: detectedGrid,
          solutionPath: path,
          isProcessing: false,
        }));
      };

      img.onerror = () => {
        setGameState((prev) => ({
          ...prev,
          error: 'Failed to load image',
          isProcessing: false,
        }));
      };

      img.src = imageData;
    } catch (error) {
      console.error('Error processing image:', error);
      setGameState((prev) => ({
        ...prev,
        error: 'An error occurred while processing the image',
        isProcessing: false,
      }));
    }
  };

  const handlePlayAnimation = () => {
    setShowAnimation(true);
  };

  const handleReset = () => {
    setGameState({
      image: null,
      grid: null,
      solutionPath: [],
      isProcessing: false,
      error: null,
    });
    setShowAnimation(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LinkedIn Zip Solver
          </h1>
          <p className="text-gray-600">
            Upload a screenshot of the LinkedIn Zip game to detect the grid and find the solution
          </p>
        </div>

        {/* Canvas (hidden) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {!gameState.grid ? (
            // Upload Section
            <div className="space-y-6">
              <ImageUpload
                onImageUpload={handleImageUpload}
                isProcessing={gameState.isProcessing}
              />

              <button
                onClick={() => {
                  try {
                    // Load a sample grid for testing with numbered cells
                    const cells = Array.from({ length: 25 }).map((_, i) => {
                      const row = Math.floor(i / 5);
                      const col = i % 5;
                      let type: 'empty' | 'hurdle' | 'number' = 'empty';
                      let number: number | undefined = undefined;
                      
                      // Add some hurdles
                      if ((row === 1 && col === 1) || (row === 1 && col === 2) || 
                          (row === 2 && col === 1) || (row === 3 && col === 3) ||
                          (row === 3 && col === 4)) {
                        type = 'hurdle';
                      }
                      
                      // Add numbered cells: 1 at (0,0), 2 at (2,0), 3 at (4,2), 4 at (4,4)
                      if (row === 0 && col === 0) {
                        type = 'number';
                        number = 1;
                      } else if (row === 0 && col === 2) {
                        type = 'number';
                        number = 2;
                      } else if (row === 2 && col === 4) {
                        type = 'number';
                        number = 3;
                      } else if (row === 4 && col === 4) {
                        type = 'number';
                        number = 4;
                      }
                      
                      return { x: col, y: row, type, number };
                    });

                    const sampleGrid = {
                      rows: 5,
                      cols: 5,
                      cells,
                      hurdles: []
                    };

                    console.log('Sample grid created:', sampleGrid);
                    const path = findSolutionPath(sampleGrid);
                    console.log('Solution path found:', path);
                    
                    setGameState({
                      image: null,
                      grid: sampleGrid,
                      solutionPath: path,
                      isProcessing: false,
                      error: null,
                    });
                    setShowAnimation(false);
                  } catch (error) {
                    console.error('Error loading sample grid:', error);
                    setGameState((prev) => ({
                      ...prev,
                      error: `Error loading sample grid: ${error}`,
                    }));
                  }
                }}
                className="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
              >
                📋 Load Sample Grid (Test Animation)
              </button>

              {gameState.error && (
                <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="font-semibold text-red-900">Error</h3>
                    <p className="text-red-700 text-sm">{gameState.error}</p>
                    <p className="text-red-600 text-xs mt-2">💡 Tip: Open DevTools (F12 → Console) to see detection logs</p>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Take a screenshot of the LinkedIn Zip game board</li>
                  <li>Upload the image using the button above</li>
                  <li>The app will detect the grid and hurdles automatically</li>
                  <li>Click "Play Animation" to see the solution drawn</li>
                </ol>
              </div>
            </div>
          ) : (
            // Results Section
            <div className="space-y-6">
              <div className="flex gap-4">
                <button
                  onClick={handlePlayAnimation}
                  disabled={showAnimation}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play size={16} />
                  Play Animation
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 text-white font-semibold hover:bg-gray-700 transition-colors"
                >
                  <RotateCcw size={16} />
                  Upload New Game
                </button>
              </div>

              {/* Grid Display */}
              <GridDisplay
                grid={gameState.grid}
                solutionPath={gameState.solutionPath}
                showAnimation={showAnimation}
              />

              {/* Solution Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Solution Path</h3>
                <div className="text-sm text-gray-600">
                  <p className="mb-3">
                    <strong>Grid Points:</strong> {gameState.solutionPath
                      .filter((pos) => pos && pos[0] !== undefined && pos[1] !== undefined)
                      .map((pos) => `(${pos[0]}, ${pos[1]})`)
                      .join(' → ')}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-700">• Yellow</span>
                      <p className="text-xs text-gray-500">Numbered Cells (1-N)</p>
                    </div>
                    <div>
                      <span className="text-gray-700">• Gray</span>
                      <p className="text-xs text-gray-500">Empty Cells</p>
                    </div>
                    <div>
                      <span className="text-gray-700">• Dark Blue</span>
                      <p className="text-xs text-gray-500">Hurdles/Obstacles</p>
                    </div>
                    <div>
                      <span className="text-gray-700">• Light Blue</span>
                      <p className="text-xs text-gray-500">Solution Path</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
