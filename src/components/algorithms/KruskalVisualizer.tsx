import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Network, Code, Lightbulb } from "lucide-react";

interface Edge {
  from: number;
  to: number;
  weight: number;
  id: string;
}

interface KruskalStep {
  step: number;
  description: string;
  sortedEdges: Edge[];
  currentEdge?: Edge;
  mstEdges: Edge[];
  parent: number[];
  isValidEdge: boolean;
  totalWeight: number;
}

export const KruskalVisualizer = () => {
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
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<KruskalStep[]>([]);
  const [mstWeight, setMstWeight] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const find = (parent: number[], i: number): number => {
    if (parent[i] !== i) {
      parent[i] = find(parent, parent[i]);
    }
    return parent[i];
  };

  const union = (parent: number[], rank: number[], x: number, y: number) => {
    const xroot = find(parent, x);
    const yroot = find(parent, y);

    if (rank[xroot] < rank[yroot]) {
      parent[xroot] = yroot;
    } else if (rank[xroot] > rank[yroot]) {
      parent[yroot] = xroot;
    } else {
      parent[yroot] = xroot;
      rank[xroot]++;
    }
  };

  const kruskalMST = () => {
    const sortedEdges = [...edges].sort((a, b) => a.weight - b.weight);
    const parent = Array.from({ length: vertices }, (_, i) => i);
    const rank = new Array(vertices).fill(0);
    const mstEdges: Edge[] = [];
    const steps: KruskalStep[] = [];
    let totalWeight = 0;
    let stepCounter = 1;

    steps.push({
      step: stepCounter++,
      description: "Initialize: Sort all edges by weight in ascending order",
      sortedEdges: [...sortedEdges],
      mstEdges: [],
      parent: [...parent],
      isValidEdge: false,
      totalWeight: 0
    });

    for (const edge of sortedEdges) {
      const rootX = find(parent, edge.from);
      const rootY = find(parent, edge.to);

      steps.push({
        step: stepCounter++,
        description: `Examining edge (${edge.from}, ${edge.to}) with weight ${edge.weight}`,
        sortedEdges: [...sortedEdges],
        currentEdge: edge,
        mstEdges: [...mstEdges],
        parent: [...parent],
        isValidEdge: false,
        totalWeight
      });

      if (rootX !== rootY) {
        union(parent, rank, rootX, rootY);
        mstEdges.push(edge);
        totalWeight += edge.weight;

        steps.push({
          step: stepCounter++,
          description: `Edge (${edge.from}, ${edge.to}) added to MST. No cycle formed.`,
          sortedEdges: [...sortedEdges],
          currentEdge: edge,
          mstEdges: [...mstEdges],
          parent: [...parent],
          isValidEdge: true,
          totalWeight
        });
      } else {
        steps.push({
          step: stepCounter++,
          description: `Edge (${edge.from}, ${edge.to}) rejected. Would create a cycle.`,
          sortedEdges: [...sortedEdges],
          currentEdge: edge,
          mstEdges: [...mstEdges],
          parent: [...parent],
          isValidEdge: false,
          totalWeight
        });
      }

      if (mstEdges.length === vertices - 1) {
        break;
      }
    }

    steps.push({
      step: stepCounter++,
      description: `Minimum Spanning Tree complete! Total weight: ${totalWeight}`,
      sortedEdges: [...sortedEdges],
      mstEdges: [...mstEdges],
      parent: [...parent],
      isValidEdge: false,
      totalWeight
    });

    setSteps(steps);
    setMstWeight(totalWeight);
  };

  const runVisualization = () => {
    if (vertices > 1 && edges.length > 0) {
      kruskalMST();
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
    const { mstEdges, currentEdge } = currentStepData;

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
            const isCurrent = currentEdge?.id === edge.id;
            
            return (
              <g key={edge.id}>
                <line
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={isMST ? "#10b981" : isCurrent ? "#f59e0b" : "#6b7280"}
                  strokeWidth={isMST ? "4" : isCurrent ? "4" : "2"}
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
                fill="#3b82f6"
                stroke="#1e40af"
                strokeWidth="3"
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
              <Network className="w-4 h-4" />
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
                  max="8"
                  value={vertices}
                  onChange={(e) => setVertices(parseInt(e.target.value) || 3)}
                  className="text-sm h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Edges: {edges.length}</label>
                <div className="flex gap-1">
                  <Button onClick={addEdge} size="sm" variant="outline" className="text-xs h-8">
                    Add Edge
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
                    const isMST = isRunning && steps[currentStep]?.mstEdges.some(e => e.id === edge.id);
                    const isCurrent = isRunning && steps[currentStep]?.currentEdge?.id === edge.id;
                    
                    return (
                      <tr key={edge.id}>
                        <td className="border p-1 font-mono">{edge.from}</td>
                        <td className="border p-1 font-mono">{edge.to}</td>
                        <td className="border p-1 font-mono">{edge.weight}</td>
                        <td className="border p-1">
                          {isMST ? (
                            <Badge variant="default" className="text-xs">In MST</Badge>
                          ) : isCurrent ? (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Pending</Badge>
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
                  <div className="text-base font-bold text-purple-600">{steps[currentStep]?.mstEdges.length || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">MST Edges</div>
                </div>
                <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-base font-bold text-orange-600">{steps[currentStep]?.totalWeight || 0}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Total Weight</div>
                </div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Time Complexity:</strong> O(E log E) where E is number of edges</p>
                <p><strong>Space Complexity:</strong> O(V) where V is number of vertices</p>
                <p><strong>Algorithm Type:</strong> Greedy approach with Union-Find</p>
                <p><strong>Output:</strong> Minimum Spanning Tree with minimum total weight</p>
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
{`class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
    
    def find(self, x):
        if self.parent[x] != x:
            self.parent[x] = self.find(self.parent[x])
        return self.parent[x]
    
    def union(self, x, y):
        px, py = self.find(x), self.find(y)
        if px == py:
            return False
        if self.rank[px] < self.rank[py]:
            px, py = py, px
        self.parent[py] = px
        if self.rank[px] == self.rank[py]:
            self.rank[px] += 1
        return True

def kruskal_mst(n, edges):
    edges.sort(key=lambda x: x[2])  # Sort by weight
    uf = UnionFind(n)
    mst = []
    total_weight = 0
    
    for u, v, weight in edges:
        if uf.union(u, v):
            mst.append((u, v, weight))
            total_weight += weight
            if len(mst) == n - 1:
                break
    
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
                <strong>Network Design:</strong> Connecting cities with minimum cable cost
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Circuit Design:</strong> Minimizing wire length in electronic circuits
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Transportation:</strong> Building road networks with minimum cost
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Water Supply:</strong> Designing efficient pipeline systems
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Clustering:</strong> Data mining and machine learning applications
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
