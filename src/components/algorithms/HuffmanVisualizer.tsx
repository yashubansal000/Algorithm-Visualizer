
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Activity, Code, Lightbulb } from "lucide-react";

interface HuffmanNode {
  char: string | null;
  freq: number;
  left: HuffmanNode | null;
  right: HuffmanNode | null;
  id: string;
}

interface HuffmanStep {
  step: number;
  description: string;
  nodes: HuffmanNode[];
  codes?: { [key: string]: string };
}

export const HuffmanVisualizer = () => {
  const [input, setInput] = useState("ABRACADABRA");
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<HuffmanStep[]>([]);
  const [frequencies, setFrequencies] = useState<{ [key: string]: number }>({});
  const [codes, setCodes] = useState<{ [key: string]: string }>({});
  const [encodedText, setEncodedText] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const calculateFrequencies = (text: string) => {
    const freq: { [key: string]: number } = {};
    for (const char of text) {
      freq[char] = (freq[char] || 0) + 1;
    }
    return freq;
  };

  const generateHuffmanCodes = (root: HuffmanNode, code = "", codes: { [key: string]: string } = {}) => {
    if (!root) return codes;
    
    if (root.char !== null) {
      codes[root.char] = code || "0";
      return codes;
    }
    
    generateHuffmanCodes(root.left, code + "0", codes);
    generateHuffmanCodes(root.right, code + "1", codes);
    
    return codes;
  };

  const buildHuffmanTree = (text: string) => {
    const freq = calculateFrequencies(text);
    setFrequencies(freq);
    
    const nodes: HuffmanNode[] = Object.entries(freq).map(([char, frequency], index) => ({
      char,
      freq: frequency,
      left: null,
      right: null,
      id: `node-${index}`
    }));

    const steps: HuffmanStep[] = [];
    let stepCounter = 1;
    let nodeIdCounter = nodes.length;

    steps.push({
      step: stepCounter++,
      description: "Initialize leaf nodes with character frequencies",
      nodes: [...nodes]
    });

    const queue = [...nodes].sort((a, b) => a.freq - b.freq);

    while (queue.length > 1) {
      const left = queue.shift()!;
      const right = queue.shift()!;
      
      const merged: HuffmanNode = {
        char: null,
        freq: left.freq + right.freq,
        left,
        right,
        id: `node-${nodeIdCounter++}`
      };

      queue.push(merged);
      queue.sort((a, b) => a.freq - b.freq);

      steps.push({
        step: stepCounter++,
        description: `Merge nodes with frequencies ${left.freq} and ${right.freq} → ${merged.freq}`,
        nodes: [...queue]
      });
    }

    const root = queue[0];
    const huffmanCodes = generateHuffmanCodes(root);
    setCodes(huffmanCodes);

    const encoded = text.split('').map(char => huffmanCodes[char]).join('');
    setEncodedText(encoded);

    steps.push({
      step: stepCounter++,
      description: "Huffman tree construction complete! Generate character codes.",
      nodes: [root],
      codes: huffmanCodes
    });

    setSteps(steps);
  };

  const runVisualization = () => {
    if (input.trim()) {
      buildHuffmanTree(input.trim());
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
    setCodes({});
    setEncodedText("");
    setFrequencies({});
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const renderNode = (node: HuffmanNode, level = 0) => {
    if (!node) return null;

    return (
      <div key={node.id} className="flex flex-col items-center space-y-1">
        <div className={`px-2 py-1 rounded-lg border-2 text-xs ${
          node.char ? 'bg-green-100 dark:bg-green-900 border-green-400' : 'bg-blue-100 dark:bg-blue-900 border-blue-400'
        }`}>
          <div className="text-center">
            <div className="font-bold">{node.char || "•"}</div>
            <div className="text-xs text-gray-600 dark:text-gray-300">{node.freq}</div>
          </div>
        </div>
        
        {(node.left || node.right) && (
          <div className="flex space-x-4">
            {node.left && (
              <div className="flex flex-col items-center">
                <div className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">0</div>
                {renderNode(node.left, level + 1)}
              </div>
            )}
            {node.right && (
              <div className="flex flex-col items-center">
                <div className="text-xs bg-gray-200 dark:bg-gray-700 px-1 rounded">1</div>
                {renderNode(node.right, level + 1)}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const calculateCompressionRatio = () => {
    if (!input || !encodedText) return 0;
    const originalBits = input.length * 8;
    const compressedBits = encodedText.length;
    return ((originalBits - compressedBits) / originalBits * 100).toFixed(1);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="space-y-4">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-4 h-4" />
              Input & Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Enter text to encode"
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              className="text-sm"
            />
            <div className="flex gap-2 flex-wrap">
              <Button onClick={runVisualization} disabled={isRunning} size="sm">
                <Play className="w-3 h-3 mr-1" />
                Start
              </Button>
              <Button 
                onClick={toggleAutoPlay} 
                disabled={!isRunning || steps.length === 0}
                variant={isAutoPlaying ? "secondary" : "outline"}
                size="sm"
              >
                {isAutoPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
                Auto
              </Button>
              <Button onClick={reset} variant="outline" size="sm">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>
            
            {isRunning && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={prevStep} disabled={currentStep === 0} size="sm">
                  Previous
                </Button>
                <Button onClick={nextStep} disabled={currentStep >= steps.length - 1} size="sm">
                  Next
                </Button>
                <Badge variant="outline" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Character Frequencies */}
        {Object.keys(frequencies).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Character Frequencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {Object.entries(frequencies).map(([char, freq]) => (
                  <div key={char} className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold text-sm">{char}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">{freq}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Character Codes */}
        {Object.keys(codes).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Huffman Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {Object.entries(codes).map(([char, code]) => (
                  <div key={char} className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="font-bold text-sm">{char}</div>
                    <div className="text-xs font-mono">{code}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Algorithm Analysis */}
        {encodedText && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Algorithm Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-blue-600">{input.length * 8}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Original bits</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-green-600">{encodedText.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Compressed bits</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-purple-600">{calculateCompressionRatio()}%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Compression ratio</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-xs font-medium">Original Text:</div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs break-all">{input}</div>
                
                <div className="text-xs font-medium">Encoded Text:</div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono text-xs break-all">{encodedText}</div>
              </div>
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Time Complexity:</strong> O(n log n)</p>
                <p><strong>Space Complexity:</strong> O(n)</p>
                <p><strong>Algorithm:</strong> Greedy approach</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        {/* Steps Visualization */}
        {steps.length > 0 && currentStep < steps.length && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Construction Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <p className="font-medium">{steps[currentStep].description}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <div className="flex flex-wrap gap-2 justify-center min-w-max p-2">
                    {steps[currentStep].nodes.map((node) => renderNode(node))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sample Code */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Code className="w-4 h-4" />
              Sample Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
{`class Node:
    def __init__(self, char, freq):
        self.char = char
        self.freq = freq
        self.left = None
        self.right = None

def huffman_encoding(text):
    # Calculate frequencies
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    
    # Build tree
    heap = [Node(char, f) for char, f in freq.items()]
    heapq.heapify(heap)
    
    while len(heap) > 1:
        left = heapq.heappop(heap)
        right = heapq.heappop(heap)
        merged = Node(None, left.freq + right.freq)
        merged.left = left
        merged.right = right
        heapq.heappush(heap, merged)
    
    return heap[0]  # root`}
            </pre>
          </CardContent>
        </Card>

        {/* Real Life Use Cases */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-4 h-4" />
              Real Life Use Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <strong>File Compression:</strong> ZIP, RAR, and other compression tools
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Image Formats:</strong> JPEG compression algorithms
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Data Transmission:</strong> Network protocols for efficient data transfer
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Multimedia:</strong> MP3 audio and video compression
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Databases:</strong> Data compression in storage systems
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
