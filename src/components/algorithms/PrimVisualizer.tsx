import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, TreePine, Code, Lightbulb } from "lucide-react";

interface Edge {
  from: number;
  to: number;
  weight: number;
  id: string;
}

interface PrimStep {
  step: number;
  description: string;
  visited: boolean[];
  mstEdges: Edge[];
  currentVertex?: number;
  minEdge?: Edge;
  totalWeight: number;
  availableEdges: Edge[];
}

export const PrimVisualizer = () => {
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
  const [steps, setSteps] = useState<PrimStep[]>([]);
  const [mstWeight, setMstWeight] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const primMST = () => {
    const visited = new Array(vertices).fill(false);
    const mstEdges: Edge[] = [];
    const steps: PrimStep[] = [];
    let totalWeight = 0;
    let stepCounter = 1;

    // Create adjacency list
    const adjList: { [key: number]: Edge[] } = {};
    for (let i = 0; i < vertices; i++) {
      adjList[i] = [];
    }
    edges.forEach(edge => {
      adjList[edge.from].push(edge);
      adjList[edge.to].push({ ...edge, from: edge.to, to: edge.from });
    });

    // Start with the selected vertex
    visited[startVertex] = true;
    const getAvailableEdges = () => {
      const available: Edge[] = [];
      for (let i = 0; i < vertices; i++) {
        if (visited[i]) {
          adjList[i].forEach(edge => {
            if (!visited[edge.to]) {
              available.push(edge);
            }
          });
        }
      }
      return available.sort((a, b) => a.weight - b.weight);
    };

    steps.push({
      step: stepCounter++,
      description: `Start with vertex ${startVertex}`,
      visited: [...visited],
      mstEdges: [],
      currentVertex: startVertex,
      totalWeight: 0,
      availableEdges: getAvailableEdges()
    });

    while (mstEdges.length < vertices - 1) {
      const availableEdges = getAvailableEdges();
      
      if (availableEdges.length === 0) break;

      const minEdge = availableEdges[0];
      
      steps.push({
        step: stepCounter++,
        description: `Find minimum weight edge: (${minEdge.from}, ${minEdge.to}) with weight ${minEdge.weight}`,
        visited: [...visited],
        mstEdges: [...mstEdges],
        minEdge,
        totalWeight,
        availableEdges
      });

      // Add vertex to MST
      visited[minEdge.to] = true;
      mstEdges.push(minEdge);
      totalWeight += minEdge.weight;

      steps.push({
        step: stepCounter++,
        description: `Add vertex ${minEdge.to} to MST. Edge (${minEdge.from}, ${minEdge.to}) added.`,
        visited: [...visited],
        mstEdges: [...mstEdges],
        currentVertex: minEdge.to,
        totalWeight,
        availableEdges: getAvailableEdges()
      });
    }

    steps.push({
      step: stepCounter++,
      description: `Minimum Spanning Tree complete! Total weight: ${totalWeight}`,
      visited: [...visited],
      mstEdges: [...mstEdges],
      totalWeight,
      availableEdges: []
    });

    setSteps(steps);
    setMstWeight(totalWeight);
  };

  const runVisualization = () => {
    if (vertices > 1 && edges.length > 0) {
      primMST();
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
    setMstWeight(0);
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
    const { visited, mstEdges, minEdge, currentVertex } = currentStepData;

    // Enhanced positioning for better visibility
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
            const isMST = mstEdges.some(e => e.id === edge.id);
            const isMin = minEdge?.id === edge.id;
            
            return (
              <g key={edge.id}>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={isMST ? "#10b981" : isMin ? "#f59e0b" : "#6b7280"}
                  strokeWidth={isMST ? "4" : isMin ? "4" : "2"}
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
                fill={visited[i] ? "#10b981" : i === currentVertex ? "#f59e0b" : "#3b82f6"}
                stroke={visited[i] ? "#059669" : i === currentVertex ? "#d97706" : "#1e40af"}
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
              <TreePine className="w-4 h-4" />
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
                <label className="text-xs font-medium">Start Vertex:</label>
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
                Start MST
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

        {/* Available Edges Table */}
        {isRunning && steps[currentStep]?.availableEdges && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Available Edges (Sorted by Weight)</CardTitle>
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
                    {steps[currentStep].availableEdges.slice(0, 6).map((edge, idx) => {
                      const isMin = idx === 0;
                      
                      return (
                        <tr key={edge.id}>
                          <td className="border p-1 font-mono">{edge.from}</td>
                          <td className="border p-1 font-mono">{edge.to}</td>
                          <td className="border p-1 font-mono">{edge.weight}</td>
                          <td className="border p-1">
                            {isMin ? (
                              <Badge variant="default" className="text-xs">Minimum</Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">Available</Badge>
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
                  <div className="text-base font-bold text-green-600">{steps[currentStep]?.visited.filter(v => v).length || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Visited</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-purple-600">{steps[currentStep]?.mstEdges.length || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">MST Edges</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-orange-600">{steps[currentStep]?.totalWeight || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Total Weight</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Time Complexity:</strong> O(V²) with adjacency matrix, O(E log V) with binary heap</p>
                <p><strong>Space Complexity:</strong> O(V) for visited array and priority queue</p>
                <p><strong>Algorithm Type:</strong> Greedy approach with cut property</p>
                <p><strong>Key Idea:</strong> Grow MST one vertex at a time, always adding minimum weight edge</p>
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

def prim_mst(graph, start=0):
    n = len(graph)
    visited = [False] * n
    min_heap = [(0, start, -1)]  # (weight, vertex, parent)
    mst = []
    total_weight = 0
    
    while min_heap and len(mst) < n - 1:
        weight, u, parent = heapq.heappop(min_heap)
        
        if visited[u]:
            continue
            
        visited[u] = True
        if parent != -1:
            mst.append((parent, u, weight))
            total_weight += weight
        
        # Add all adjacent edges to heap
        for v, w in graph[u]:
            if not visited[v]:
                heapq.heappush(min_heap, (w, v, u))
    
    return mst, total_weight`}
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
                <strong>Network Broadcasting:</strong> Minimum cost to broadcast data to all nodes
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Approximation Algorithms:</strong> Traveling Salesman Problem approximation
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Cluster Analysis:</strong> Single-linkage clustering in data mining
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Image Segmentation:</strong> Computer vision and medical imaging
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Network Reliability:</strong> Finding most reliable paths in networks
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
