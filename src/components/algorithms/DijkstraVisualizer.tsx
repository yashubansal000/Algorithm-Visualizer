
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Route, Code, Lightbulb } from "lucide-react";

interface Edge {
  from: number;
  to: number;
  weight: number;
  id: string;
}

interface DijkstraStep {
  step: number;
  description: string;
  distances: number[];
  visited: boolean[];
  previous: (number | null)[];
  currentVertex?: number;
  minVertex?: number;
  shortestPaths: { [key: number]: number[] };
}

export const DijkstraVisualizer = () => {
  const [vertices, setVertices] = useState(6);
  const [edges, setEdges] = useState<Edge[]>([
    { from: 0, to: 1, weight: 4, id: "0-1" },
    { from: 0, to: 2, weight: 2, id: "0-2" },
    { from: 1, to: 2, weight: 1, id: "1-2" },
    { from: 1, to: 3, weight: 5, id: "1-3" },
    { from: 2, to: 3, weight: 8, id: "2-3" },
    { from: 2, to: 4, weight: 10, id: "2-4" },
    { from: 3, to: 4, weight: 2, id: "3-4" },
    { from: 3, to: 5, weight: 6, id: "3-5" },
    { from: 4, to: 5, weight: 3, id: "4-5" }
  ]);
  const [startVertex, setStartVertex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<DijkstraStep[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const dijkstraAlgorithm = () => {
    const distances = new Array(vertices).fill(Infinity);
    const visited = new Array(vertices).fill(false);
    const previous = new Array(vertices).fill(null);
    const steps: DijkstraStep[] = [];
    let stepCounter = 1;

    distances[startVertex] = 0;

    // Create adjacency list
    const adjList: { [key: number]: Edge[] } = {};
    for (let i = 0; i < vertices; i++) {
      adjList[i] = [];
    }
    edges.forEach(edge => {
      adjList[edge.from].push(edge);
      adjList[edge.to].push({ ...edge, from: edge.to, to: edge.from });
    });

    const getShortestPaths = () => {
      const paths: { [key: number]: number[] } = {};
      for (let i = 0; i < vertices; i++) {
        if (distances[i] !== Infinity) {
          const path = [];
          let current = i;
          while (current !== null) {
            path.unshift(current);
            current = previous[current];
          }
          paths[i] = path;
        }
      }
      return paths;
    };

    steps.push({
      step: stepCounter++,
      description: `Initialize: Set distance to source (${startVertex}) as 0, all others as ∞`,
      distances: [...distances],
      visited: [...visited],
      previous: [...previous],
      shortestPaths: getShortestPaths()
    });

    for (let count = 0; count < vertices; count++) {
      // Find minimum distance vertex
      let minDistance = Infinity;
      let minVertex = -1;
      
      for (let v = 0; v < vertices; v++) {
        if (!visited[v] && distances[v] < minDistance) {
          minDistance = distances[v];
          minVertex = v;
        }
      }

      if (minVertex === -1) break;

      steps.push({
        step: stepCounter++,
        description: `Select vertex ${minVertex} with minimum distance ${distances[minVertex]}`,
        distances: [...distances],
        visited: [...visited],
        previous: [...previous],
        minVertex,
        shortestPaths: getShortestPaths()
      });

      visited[minVertex] = true;

      steps.push({
        step: stepCounter++,
        description: `Mark vertex ${minVertex} as visited`,
        distances: [...distances],
        visited: [...visited],
        previous: [...previous],
        currentVertex: minVertex,
        shortestPaths: getShortestPaths()
      });

      // Update distances of adjacent vertices
      adjList[minVertex].forEach(edge => {
        const neighbor = edge.to;
        if (!visited[neighbor]) {
          const newDistance = distances[minVertex] + edge.weight;
          
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
            previous[neighbor] = minVertex;
            
            steps.push({
              step: stepCounter++,
              description: `Update distance to vertex ${neighbor}: ${newDistance} (via vertex ${minVertex})`,
              distances: [...distances],
              visited: [...visited],
              previous: [...previous],
              currentVertex: minVertex,
              shortestPaths: getShortestPaths()
            });
          }
        }
      });
    }

    steps.push({
      step: stepCounter++,
      description: "Dijkstra's algorithm complete! All shortest paths found.",
      distances: [...distances],
      visited: [...visited],
      previous: [...previous],
      shortestPaths: getShortestPaths()
    });

    setSteps(steps);
  };

  const runVisualization = () => {
    if (vertices > 1 && edges.length > 0) {
      dijkstraAlgorithm();
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
    
    if (from !== to && !edges.some(e => (e.from === from && e.to === to) || (e.from === to && e.to === from))) {
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
    const { visited, currentVertex, minVertex } = currentStepData;

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
            
            return (
              <g key={edge.id}>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke="#6b7280"
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <text
                  x={(pos1.x + pos2.x) / 2}
                  y={(pos1.y + pos2.y) / 2}
                  textAnchor="middle"
                  className="text-sm font-bold fill-red-600 dark:fill-red-400"
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
                fill={i === startVertex ? "#ef4444" : visited[i] ? "#10b981" : i === currentVertex || i === minVertex ? "#f59e0b" : "#3b82f6"}
                stroke={i === startVertex ? "#dc2626" : visited[i] ? "#059669" : i === currentVertex || i === minVertex ? "#d97706" : "#1e40af"}
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
              <Route className="w-4 h-4" />
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
                      const visited = steps[currentStep]?.visited[i];
                      const previous = steps[currentStep]?.previous[i];
                      const isCurrent = steps[currentStep]?.currentVertex === i || steps[currentStep]?.minVertex === i;
                      
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
                            ) : visited ? (
                              <Badge variant="default" className="text-xs">Visited</Badge>
                            ) : isCurrent ? (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Unvisited</Badge>
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
                  <div className="text-base font-bold text-purple-600">{steps[currentStep]?.visited.filter(v => v).length || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Visited</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-orange-600">{startVertex}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Source</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Time Complexity:</strong> O(V²) with array, O((V + E) log V) with priority queue</p>
                <p><strong>Space Complexity:</strong> O(V) for distance and visited arrays</p>
                <p><strong>Algorithm Type:</strong> Greedy approach for single-source shortest path</p>
                <p><strong>Limitation:</strong> Cannot handle negative edge weights</p>
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
{`import heapq

def dijkstra(graph, start):
    n = len(graph)
    distances = [float('inf')] * n
    distances[start] = 0
    visited = [False] * n
    previous = [None] * n
    
    # Priority queue: (distance, vertex)
    pq = [(0, start)]
    
    while pq:
        current_dist, u = heapq.heappop(pq)
        
        if visited[u]:
            continue
            
        visited[u] = True
        
        for v, weight in graph[u]:
            if not visited[v]:
                new_dist = current_dist + weight
                if new_dist < distances[v]:
                    distances[v] = new_dist
                    previous[v] = u
                    heapq.heappush(pq, (new_dist, v))
    
    return distances, previous

# Reconstruct path
def get_path(previous, start, end):
    path = []
    current = end
    while current is not None:
        path.append(current)
        current = previous[current]
    return path[::-1] if path[-1] == start else []`}
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
                <span>Source</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Visited</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Unvisited</span>
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
                <strong>GPS Navigation:</strong> Finding shortest routes in road networks
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Network Routing:</strong> Optimal packet routing in computer networks
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Flight Planning:</strong> Finding cheapest flight connections
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Social Networks:</strong> Finding shortest connection paths
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Supply Chain:</strong> Optimizing delivery routes and costs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
