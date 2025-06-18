
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, TrendingDown, Code, Lightbulb } from "lucide-react";

interface Edge {
  from: number;
  to: number;
  weight: number;
  id: string;
}

interface BellmanFordStep {
  step: number;
  description: string;
  distances: number[];
  previous: (number | null)[];
  currentEdge?: Edge;
  relaxationCount: number;
  hasNegativeCycle: boolean;
}

export const BellmanFordVisualizer = () => {
  const [vertices, setVertices] = useState(5);
  const [edges, setEdges] = useState<Edge[]>([
    { from: 0, to: 1, weight: 4, id: "0-1" },
    { from: 0, to: 2, weight: 2, id: "0-2" },
    { from: 1, to: 3, weight: 3, id: "1-3" },
    { from: 2, to: 1, weight: -2, id: "2-1" },
    { from: 2, to: 3, weight: 4, id: "2-3" },
    { from: 3, to: 4, weight: 1, id: "3-4" },
    { from: 1, to: 4, weight: 6, id: "1-4" }
  ]);
  const [startVertex, setStartVertex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<BellmanFordStep[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const bellmanFordAlgorithm = () => {
    const distances = new Array(vertices).fill(Infinity);
    const previous = new Array(vertices).fill(null);
    const steps: BellmanFordStep[] = [];
    let stepCounter = 1;
    let relaxationCount = 0;
    let hasNegativeCycle = false;

    distances[startVertex] = 0;

    steps.push({
      step: stepCounter++,
      description: `Initialize: Set distance to source (${startVertex}) as 0, all others as ∞`,
      distances: [...distances],
      previous: [...previous],
      relaxationCount: 0,
      hasNegativeCycle: false
    });

    // Relax edges V-1 times
    for (let i = 0; i < vertices - 1; i++) {
      let relaxed = false;
      
      steps.push({
        step: stepCounter++,
        description: `Iteration ${i + 1}: Relax all edges`,
        distances: [...distances],
        previous: [...previous],
        relaxationCount,
        hasNegativeCycle: false
      });

      for (const edge of edges) {
        if (distances[edge.from] !== Infinity && 
            distances[edge.from] + edge.weight < distances[edge.to]) {
          
          distances[edge.to] = distances[edge.from] + edge.weight;
          previous[edge.to] = edge.from;
          relaxed = true;
          relaxationCount++;

          steps.push({
            step: stepCounter++,
            description: `Relax edge (${edge.from}, ${edge.to}): Update distance to ${edge.to} = ${distances[edge.to]}`,
            distances: [...distances],
            previous: [...previous],
            currentEdge: edge,
            relaxationCount,
            hasNegativeCycle: false
          });
        }
      }

      if (!relaxed) {
        steps.push({
          step: stepCounter++,
          description: `No edges relaxed in iteration ${i + 1}. Algorithm can terminate early.`,
          distances: [...distances],
          previous: [...previous],
          relaxationCount,
          hasNegativeCycle: false
        });
        break;
      }
    }

    // Check for negative cycles
    steps.push({
      step: stepCounter++,
      description: "Check for negative cycles by attempting one more relaxation",
      distances: [...distances],
      previous: [...previous],
      relaxationCount,
      hasNegativeCycle: false
    });

    for (const edge of edges) {
      if (distances[edge.from] !== Infinity && 
          distances[edge.from] + edge.weight < distances[edge.to]) {
        hasNegativeCycle = true;
        
        steps.push({
          step: stepCounter++,
          description: `Negative cycle detected! Edge (${edge.from}, ${edge.to}) can still be relaxed.`,
          distances: [...distances],
          previous: [...previous],
          currentEdge: edge,
          relaxationCount,
          hasNegativeCycle: true
        });
        break;
      }
    }

    if (!hasNegativeCycle) {
      steps.push({
        step: stepCounter++,
        description: "No negative cycle found. All shortest paths are correct!",
        distances: [...distances],
        previous: [...previous],
        relaxationCount,
        hasNegativeCycle: false
      });
    }

    setSteps(steps);
  };

  const runVisualization = () => {
    if (vertices > 1 && edges.length > 0) {
      bellmanFordAlgorithm();
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
    const weight = Math.floor(Math.random() * 20) - 10; // Allow negative weights
    
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
    const { currentEdge, hasNegativeCycle } = currentStepData;

    const centerX = 250;
    const centerY = 200;
    const radius = 150;
    
    const positions = Array.from({ length: vertices }, (_, i) => ({
      x: centerX + (Math.cos((i * 2 * Math.PI) / vertices) * radius),
      y: centerY + (Math.sin((i * 2 * Math.PI) / vertices) * radius)
    }));

    return (
      <div className="relative">
        <svg width="500" height="400" className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
          {/* Render edges */}
          {edges.map((edge) => {
            const pos1 = positions[edge.from];
            const pos2 = positions[edge.to];
            const isCurrent = currentEdge?.id === edge.id;
            const isNegative = edge.weight < 0;
            
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
                      fill={isCurrent ? "#f59e0b" : isNegative ? "#ef4444" : "#6b7280"}
                    />
                  </marker>
                </defs>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={isCurrent ? "#f59e0b" : isNegative ? "#ef4444" : "#6b7280"}
                  strokeWidth={isCurrent ? "4" : "2"}
                  markerEnd={`url(#arrowhead-${edge.id})`}
                  className="transition-all duration-300"
                />
                <text
                  x={(pos1.x + pos2.x) / 2}
                  y={(pos1.y + pos2.y) / 2}
                  textAnchor="middle"
                  className={`text-sm font-bold ${isNegative ? 'fill-red-600 dark:fill-red-400' : 'fill-blue-600 dark:fill-blue-400'}`}
                  dy="-3"
                >
                  {edge.weight}
                </text>
              </g>
            );
          })}
          
          {/* Render vertices */}
          {positions.map((pos, i) => (
            <g key={i}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r="20"
                fill={i === startVertex ? "#ef4444" : hasNegativeCycle ? "#f59e0b" : "#3b82f6"}
                stroke={i === startVertex ? "#dc2626" : hasNegativeCycle ? "#d97706" : "#1e40af"}
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
                {i}
              </text>
              <text
                x={pos.x}
                y={pos.y + 35}
                textAnchor="middle"
                className="text-xs font-bold fill-gray-800 dark:fill-gray-200"
              >
                {currentStepData.distances[i] === Infinity ? "∞" : currentStepData.distances[i]}
              </text>
            </g>
          ))}
        </svg>
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
              <TrendingDown className="w-4 h-4" />
              Graph Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium">Vertices:</label>
                <Input
                  type="number"
                  min="3"
                  max="8"
                  value={vertices}
                  onChange={(e) => setVertices(parseInt(e.target.value) || 3)}
                  className="text-sm h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Source:</label>
                <Input
                  type="number"
                  min="0"
                  max={vertices - 1}
                  value={startVertex}
                  onChange={(e) => setStartVertex(parseInt(e.target.value) || 0)}
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
                Find Paths
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

        {/* Distance Table */}
        {isRunning && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distance Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border p-1 text-left">Vertex</th>
                      <th className="border p-1 text-left">Distance</th>
                      <th className="border p-1 text-left">Previous</th>
                      <th className="border p-1 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: vertices }, (_, i) => {
                      const distance = steps[currentStep]?.distances[i];
                      const previous = steps[currentStep]?.previous[i];
                      
                      return (
                        <tr key={i}>
                          <td className="border p-1 font-mono">{i}</td>
                          <td className="border p-1 font-mono">
                            {distance === Infinity ? "∞" : distance}
                          </td>
                          <td className="border p-1 font-mono">
                            {previous === null ? "-" : previous}
                          </td>
                          <td className="border p-1">
                            {i === startVertex ? (
                              <Badge variant="default" className="text-xs">Source</Badge>
                            ) : distance === Infinity ? (
                              <Badge variant="outline" className="text-xs">Unreachable</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">Reachable</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edge List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Edge List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border p-1 text-left">From</th>
                    <th className="border p-1 text-left">To</th>
                    <th className="border p-1 text-left">Weight</th>
                    <th className="border p-1 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {edges.slice(0, 8).map((edge) => {
                    const isCurrent = isRunning && steps[currentStep]?.currentEdge?.id === edge.id;
                    const isNegative = edge.weight < 0;
                    
                    return (
                      <tr key={edge.id}>
                        <td className="border p-1 font-mono">{edge.from}</td>
                        <td className="border p-1 font-mono">{edge.to}</td>
                        <td className={`border p-1 font-mono ${isNegative ? 'text-red-600 font-bold' : ''}`}>
                          {edge.weight}
                        </td>
                        <td className="border p-1">
                          {isCurrent ? (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          ) : isNegative ? (
                            <Badge variant="destructive" className="text-xs">Negative</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

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
                  <div className="text-base font-bold text-purple-600">{steps[currentStep]?.relaxationCount || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Relaxations</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className={`text-base font-bold ${steps[currentStep]?.hasNegativeCycle ? 'text-red-600' : 'text-green-600'}`}>
                    {steps[currentStep]?.hasNegativeCycle ? "Yes" : "No"}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Neg. Cycle</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Time Complexity:</strong> O(VE) where V is vertices and E is edges</p>
                <p><strong>Space Complexity:</strong> O(V) for distance and predecessor arrays</p>
                <p><strong>Algorithm Type:</strong> Dynamic programming approach</p>
                <p><strong>Advantage:</strong> Can detect negative cycles and handle negative weights</p>
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
{`def bellman_ford(graph, start):
    n = len(graph)
    distances = [float('inf')] * n
    distances[start] = 0
    previous = [None] * n
    
    # Relax edges V-1 times
    for _ in range(n - 1):
        for u, v, weight in graph:
            if distances[u] != float('inf'):
                if distances[u] + weight < distances[v]:
                    distances[v] = distances[u] + weight
                    previous[v] = u
    
    # Check for negative cycles
    for u, v, weight in graph:
        if distances[u] != float('inf'):
            if distances[u] + weight < distances[v]:
                return None, None  # Negative cycle detected
    
    return distances, previous

# Example usage
edges = [(0, 1, 4), (0, 2, 2), (1, 3, 3), 
         (2, 1, -2), (2, 3, 4), (3, 4, 1)]
distances, previous = bellman_ford(edges, 0)`}
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
              <div className={`mt-2 p-2 rounded text-sm ${steps[currentStep]?.hasNegativeCycle ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                <p className="font-medium">{steps[currentStep].description}</p>
              </div>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>Source</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Negative Cycle</span>
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
                <strong>Currency Exchange:</strong> Detecting arbitrage opportunities in currency markets
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Network Routing:</strong> Finding shortest paths with negative costs
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Game Theory:</strong> Finding Nash equilibria in competitive scenarios
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Resource Allocation:</strong> Optimizing resource distribution with constraints
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Circuit Analysis:</strong> Finding optimal paths in electrical circuits
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
