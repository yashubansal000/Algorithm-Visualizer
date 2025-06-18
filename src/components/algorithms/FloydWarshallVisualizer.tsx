
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Globe, Code, Lightbulb } from "lucide-react";

interface Edge {
  from: number;
  to: number;
  weight: number;
  id: string;
}

interface FloydWarshallStep {
  step: number;
  description: string;
  distances: number[][];
  next: (number | null)[][];
  k: number;
  i?: number;
  j?: number;
  improvement?: boolean;
}

export const FloydWarshallVisualizer = () => {
  const [vertices, setVertices] = useState(4);
  const [edges, setEdges] = useState<Edge[]>([
    { from: 0, to: 1, weight: 3, id: "0-1" },
    { from: 0, to: 3, weight: 7, id: "0-3" },
    { from: 1, to: 0, weight: 8, id: "1-0" },
    { from: 1, to: 2, weight: 2, id: "1-2" },
    { from: 2, to: 0, weight: 5, id: "2-0" },
    { from: 2, to: 3, weight: 1, id: "2-3" },
    { from: 3, to: 0, weight: 2, id: "3-0" }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<FloydWarshallStep[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const floydWarshallAlgorithm = () => {
    const INF = 999;
    const distances: number[][] = Array(vertices).fill(null).map(() => Array(vertices).fill(INF));
    const next: (number | null)[][] = Array(vertices).fill(null).map(() => Array(vertices).fill(null));
    const steps: FloydWarshallStep[] = [];
    let stepCounter = 1;

    // Initialize distances
    for (let i = 0; i < vertices; i++) {
      distances[i][i] = 0;
    }

    edges.forEach(edge => {
      distances[edge.from][edge.to] = edge.weight;
      next[edge.from][edge.to] = edge.to;
    });

    steps.push({
      step: stepCounter++,
      description: "Initialize: Set distances from edges, diagonal to 0, others to ∞",
      distances: distances.map(row => [...row]),
      next: next.map(row => [...row]),
      k: -1
    });

    // Floyd-Warshall main algorithm
    for (let k = 0; k < vertices; k++) {
      steps.push({
        step: stepCounter++,
        description: `Iteration k=${k}: Using vertex ${k} as intermediate vertex`,
        distances: distances.map(row => [...row]),
        next: next.map(row => [...row]),
        k
      });

      for (let i = 0; i < vertices; i++) {
        for (let j = 0; j < vertices; j++) {
          if (i !== j && distances[i][k] + distances[k][j] < distances[i][j]) {
            const oldDistance = distances[i][j];
            distances[i][j] = distances[i][k] + distances[k][j];
            next[i][j] = next[i][k];

            steps.push({
              step: stepCounter++,
              description: `Update path from ${i} to ${j} via ${k}: ${oldDistance === INF ? '∞' : oldDistance} → ${distances[i][j]}`,
              distances: distances.map(row => [...row]),
              next: next.map(row => [...row]),
              k,
              i,
              j,
              improvement: true
            });
          }
        }
      }
    }

    steps.push({
      step: stepCounter++,
      description: "Floyd-Warshall complete! All-pairs shortest paths found.",
      distances: distances.map(row => [...row]),
      next: next.map(row => [...row]),
      k: vertices
    });

    setSteps(steps);
  };

  const runVisualization = () => {
    if (vertices > 1 && edges.length > 0) {
      floydWarshallAlgorithm();
      setCurrentStep(0);
      setIsRunning(true);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  useEffect(() => {
    if (isAutoPlaying && isRunning) {
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= steps.length - 1) {
            setIsAutoPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, isRunning, steps.length]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsRunning(false);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const reset = () => {
    setCurrentStep(0);
    setIsRunning(false);
    setIsAutoPlaying(false);
    setSteps([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const addEdge = () => {
    const from = Math.floor(Math.random() * vertices);
    const to = Math.floor(Math.random() * vertices);
    const weight = Math.floor(Math.random() * 10) + 1;
    
    if (from !== to && !edges.some(e => e.from === from && e.to === to)) {
      setEdges([...edges, { from, to, weight, id: `${from}-${to}` }]);
    }
  };

  const removeLastEdge = () => {
    if (edges.length > 0) {
      setEdges(edges.slice(0, -1));
    }
  };

  const renderGraph = () => {
    if (!isRunning || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const { k, i, j } = currentStepData;

    const centerX = 250;
    const centerY = 200;
    const radius = 120;
    
    const positions = Array.from({ length: vertices }, (_, idx) => ({
      x: centerX + (Math.cos((idx * 2 * Math.PI) / vertices) * radius),
      y: centerY + (Math.sin((idx * 2 * Math.PI) / vertices) * radius)
    }));

    return (
      <div className="relative">
        <svg width="500" height="400" className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
          {/* Render edges */}
          {edges.map((edge) => {
            const pos1 = positions[edge.from];
            const pos2 = positions[edge.to];
            
            return (
              <g key={edge.id}>
                <defs>
                  <marker
                    id={`arrowhead-${edge.id}`}
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="#6b7280"
                    />
                  </marker>
                </defs>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="#6b7280"
                  strokeWidth="2"
                  markerEnd={`url(#arrowhead-${edge.id})`}
                  className="transition-all duration-300"
                />
                <text
                  x={(pos1.x + pos2.x) / 2}
                  y={(pos1.y + pos2.y) / 2}
                  textAnchor="middle"
                  className="text-sm font-bold fill-blue-600 dark:fill-blue-400"
                  dy="-3"
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}
          
          {/* Render vertices */}
          {positions.map((pos, idx) => (
            <g key={idx}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="20"
                fill={idx === k ? "#ef4444" : (idx === i || idx === j) ? "#f59e0b" : "#3b82f6"}
                stroke={idx === k ? "#dc2626" : (idx === i || idx === j) ? "#d97706" : "#1e40af"}
                strokeWidth="3"
                className="transition-all duration-300"
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dy="0.3em"
                className="text-base font-bold fill-white"
              >
                {idx}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderDistanceMatrix = () => {
    if (!isRunning || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const { distances, k, i, j } = currentStepData;
    const INF = 999;

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="border p-1 text-center">From/To</th>
              {Array.from({ length: vertices }, (_, idx) => (
                <th key={idx} className="border p-1 text-center">{idx}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: vertices }, (_, row) => (
              <tr key={row}>
                <td className="border p-1 text-center font-bold bg-gray-100 dark:bg-gray-800">{row}</td>
                {Array.from({ length: vertices }, (_, col) => {
                  const isCurrentCell = (row === i && col === j);
                  const isKRow = row === k;
                  const isKCol = col === k;
                  const distance = distances[row][col];
                  
                  return (
                    <td
                      key={col}
                      className={`border p-1 text-center font-mono ${
                        isCurrentCell ? 'bg-yellow-200 dark:bg-yellow-800 font-bold' :
                        isKRow || isKCol ? 'bg-red-100 dark:bg-red-900' :
                        'bg-white dark:bg-gray-800'
                      }`}
                    >
                      {distance === INF ? '∞' : distance}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="space-y-3">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4" />
              Graph Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium">Vertices:</label>
                <Input
                  type="number"
                  min="3"
                  max="6"
                  value={vertices}
                  onChange={(e) => setVertices(parseInt(e.target.value) || 3)}
                  className="text-sm h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Edges: {edges.length}</label>
                <div className="flex gap-1">
                  <Button onClick={addEdge} size="sm" variant="outline" className="text-xs h-8">
                    Add
                  </Button>
                  <Button onClick={removeLastEdge} size="sm" variant="outline" className="text-xs h-8">
                    Remove
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 flex-wrap">
              <Button onClick={runVisualization} disabled={isRunning} size="sm" className="text-xs h-8">
                <Play className="w-3 h-3 mr-1" />
                Find All Paths
              </Button>
              <Button 
                onClick={toggleAutoPlay} 
                disabled={!isRunning || steps.length === 0}
                variant={isAutoPlaying ? "secondary" : "outline"}
                size="sm"
                className="text-xs h-8"
              >
                {isAutoPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                Auto
              </Button>
              <Button onClick={reset} variant="outline" size="sm" className="text-xs h-8">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
            
            {isRunning && (
              <div className="flex flex-wrap gap-1">
                <Button onClick={prevStep} disabled={currentStep === 0} size="sm" className="text-xs h-8">
                  Previous
                </Button>
                <Button onClick={nextStep} disabled={currentStep >= steps.length - 1} size="sm" className="text-xs h-8">
                  Next
                </Button>
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distance Matrix */}
        {isRunning && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distance Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              {renderDistanceMatrix()}
              {steps[currentStep] && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-red-100 dark:bg-red-900 border"></div>
                      <span>k-vertex row/col</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-800 border"></div>
                      <span>Current cell (i,j)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Algorithm Analysis */}
        {isRunning && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Algorithm Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-blue-600">{vertices}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Vertices</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-green-600">{edges.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Edges</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-purple-600">{steps[currentStep]?.k >= 0 ? steps[currentStep].k : '-'}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">K-vertex</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-orange-600">{vertices * vertices}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">All Pairs</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Time Complexity:</strong> O(V³) where V is number of vertices</p>
                <p><strong>Space Complexity:</strong> O(V²) for distance matrix storage</p>
                <p><strong>Algorithm Type:</strong> Dynamic programming approach</p>
                <p><strong>Output:</strong> Shortest paths between all pairs of vertices</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Code */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Code className="w-4 h-4" />
              Sample Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">
{`def floyd_warshall(graph):
    n = len(graph)
    # Initialize distance matrix
    dist = [[float('inf')] * n for _ in range(n)]
    
    # Set diagonal to 0
    for i in range(n):
        dist[i][i] = 0
    
    # Set direct edges
    for u, v, weight in graph:
        dist[u][v] = weight
    
    # Floyd-Warshall algorithm
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    
    return dist

# Example usage
edges = [(0, 1, 3), (0, 3, 7), (1, 0, 8), 
         (1, 2, 2), (2, 0, 5), (2, 3, 1)]
all_shortest_paths = floyd_warshall(edges)`}
            </pre>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {/* Graph Visualization */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Graph Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {renderGraph()}
            </div>
            {isRunning && steps.length > 0 && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                <p className="font-medium">{steps[currentStep].description}</p>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>K-vertex</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>i or j vertex</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Other vertices</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real Life Use Cases */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lightbulb className="w-4 h-4" />
              Real Life Use Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <strong>Transportation Networks:</strong> Finding shortest routes between all city pairs
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Network Analysis:</strong> Computing all-pairs connectivity in networks
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Game Theory:</strong> Finding transitive closure in game relationships
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Image Processing:</strong> Distance transforms in computer vision
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Social Networks:</strong> Computing influence paths between all users
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
