
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Hash, Code, Lightbulb } from "lucide-react";

interface RabinKarpStep {
  step: number;
  description: string;
  windowStart: number;
  currentWindow: string;
  windowHash: number;
  patternHash: number;
  isHashMatch: boolean;
  isExactMatch: boolean;
  matches: number[];
}

export const RabinKarpVisualizer = () => {
  const [text, setText] = useState("ABABCABABA");
  const [pattern, setPattern] = useState("ABABA");
  const [prime, setPrime] = useState(101);
  const [base, setBase] = useState(256);
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<RabinKarpStep[]>([]);
  const [matches, setMatches] = useState<number[]>([]);
  const [hashTable, setHashTable] = useState<{ [key: string]: number }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const charToNum = (char: string) => char.charCodeAt(0);

  const calculateHash = (str: string, length: number) => {
    let hash = 0;
    for (let i = 0; i < length; i++) {
      hash = (hash * base + charToNum(str[i])) % prime;
    }
    return hash;
  };

  const calculateRollingHash = (oldHash: number, oldChar: string, newChar: string, pow: number) => {
    let newHash = oldHash - (charToNum(oldChar) * pow) % prime;
    newHash = (newHash * base + charToNum(newChar)) % prime;
    return newHash < 0 ? newHash + prime : newHash;
  };

  const rabinKarpSearch = (text: string, pattern: string) => {
    const n = text.length;
    const m = pattern.length;
    const steps: RabinKarpStep[] = [];
    const foundMatches: number[] = [];
    const hashes: { [key: string]: number } = {};
    
    if (m > n) {
      setSteps([]);
      setMatches([]);
      return;
    }

    // Calculate pattern hash
    const patternHash = calculateHash(pattern, m);
    hashes[pattern] = patternHash;
    
    // Calculate power for rolling hash
    let pow = 1;
    for (let i = 0; i < m - 1; i++) {
      pow = (pow * base) % prime;
    }

    let stepCounter = 1;
    let windowHash = calculateHash(text, m);
    const firstWindow = text.substring(0, m);
    hashes[firstWindow] = windowHash;

    steps.push({
      step: stepCounter++,
      description: `Initialize: Calculate pattern hash (${patternHash}) and first window hash (${windowHash})`,
      windowStart: 0,
      currentWindow: firstWindow,
      windowHash,
      patternHash,
      isHashMatch: windowHash === patternHash,
      isExactMatch: false,
      matches: []
    });

    // Check first window
    if (windowHash === patternHash) {
      const isExact = firstWindow === pattern;
      if (isExact) {
        foundMatches.push(0);
      }
      steps.push({
        step: stepCounter++,
        description: isExact 
          ? `Hash match and exact match found at position 0!` 
          : `Hash collision at position 0 - not an exact match`,
        windowStart: 0,
        currentWindow: firstWindow,
        windowHash,
        patternHash,
        isHashMatch: true,
        isExactMatch: isExact,
        matches: [...foundMatches]
      });
    }

    // Rolling hash for remaining windows
    for (let i = 1; i <= n - m; i++) {
      const oldChar = text[i - 1];
      const newChar = text[i + m - 1];
      const currentWindow = text.substring(i, i + m);
      
      windowHash = calculateRollingHash(windowHash, oldChar, newChar, pow);
      hashes[currentWindow] = windowHash;

      const isHashMatch = windowHash === patternHash;
      
      steps.push({
        step: stepCounter++,
        description: `Rolling hash: Remove '${oldChar}', add '${newChar}' → hash = ${windowHash}`,
        windowStart: i,
        currentWindow,
        windowHash,
        patternHash,
        isHashMatch,
        isExactMatch: false,
        matches: [...foundMatches]
      });

      if (isHashMatch) {
        const isExact = currentWindow === pattern;
        if (isExact) {
          foundMatches.push(i);
        }
        steps.push({
          step: stepCounter++,
          description: isExact 
            ? `Hash match and exact match found at position ${i}!` 
            : `Hash collision at position ${i} - not an exact match`,
          windowStart: i,
          currentWindow,
          windowHash,
          patternHash,
          isHashMatch: true,
          isExactMatch: isExact,
          matches: [...foundMatches]
        });
      }
    }

    steps.push({
      step: stepCounter++,
      description: `Search complete! Found ${foundMatches.length} matches.`,
      windowStart: n - m,
      currentWindow: text.substring(n - m, n),
      windowHash,
      patternHash,
      isHashMatch: false,
      isExactMatch: false,
      matches: foundMatches
    });

    setSteps(steps);
    setMatches(foundMatches);
    setHashTable(hashes);
  };

  const runVisualization = () => {
    if (text.trim() && pattern.trim() && prime > 0 && base > 0) {
      rabinKarpSearch(text.trim(), pattern.trim());
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
    setMatches([]);
    setHashTable({});
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const renderRollingHashVisualization = () => {
    if (!isRunning || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const { windowStart, currentWindow, windowHash, patternHash, isHashMatch, isExactMatch } = currentStepData;

    return (
      <div className="space-y-3">
        <div className="text-xs font-medium">Text with sliding window:</div>
        <div className="flex flex-wrap gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono">
          {text.split('').map((char, i) => (
            <span
              key={i}
              className={`px-1 py-1 rounded text-center min-w-[24px] text-xs ${
                matches.includes(i - pattern.length + 1) && i >= pattern.length - 1
                  ? 'bg-green-200 dark:bg-green-800'
                  : i >= windowStart && i < windowStart + pattern.length
                  ? isExactMatch
                    ? 'bg-green-300 dark:bg-green-700 ring-1 ring-green-500'
                    : isHashMatch
                    ? 'bg-yellow-300 dark:bg-yellow-700 ring-1 ring-yellow-500'
                    : 'bg-blue-300 dark:bg-blue-700 ring-1 ring-blue-500'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {char}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="text-xs font-medium">Current Window:</div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="font-mono text-sm">{currentWindow}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Hash: {windowHash}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs font-medium">Pattern:</div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <div className="font-mono text-sm">{pattern}</div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Hash: {patternHash}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={isHashMatch ? "default" : "secondary"} className="text-xs">
            Hash {isHashMatch ? "Match" : "No Match"}
          </Badge>
          {isHashMatch && (
            <Badge variant={isExactMatch ? "default" : "destructive"} className="text-xs">
              {isExactMatch ? "Exact Match" : "Hash Collision"}
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="space-y-4">
        {/* Input Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Hash className="w-4 h-4" />
              Input & Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Text:</label>
                <Input
                  placeholder="Enter main text"
                  value={text}
                  onChange={(e) => setText(e.target.value.toUpperCase())}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Pattern:</label>
                <Input
                  placeholder="Enter pattern to search"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value.toUpperCase())}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium">Prime Number:</label>
                <Input
                  type="number"
                  placeholder="Prime for modulo"
                  value={prime}
                  onChange={(e) => setPrime(parseInt(e.target.value) || 101)}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium">Base:</label>
                <Input
                  type="number"
                  placeholder="Base for hash"
                  value={base}
                  onChange={(e) => setBase(parseInt(e.target.value) || 256)}
                  className="text-sm"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Button onClick={runVisualization} disabled={isRunning} size="sm">
                <Play className="w-3 h-3 mr-1" />
                Start Search
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

        {/* Algorithm Parameters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Algorithm Parameters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-sm">{base}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Base</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-sm">{prime}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Prime</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-sm">{text.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Text length</div>
              </div>
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="font-bold text-sm">{pattern.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-300">Pattern length</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hash Function Table */}
        {Object.keys(hashTable).length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Hash Function Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="border p-1 text-left">String</th>
                      <th className="border p-1 text-left">Hash Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(hashTable).slice(0, 6).map(([str, hash]) => (
                      <tr key={str}>
                        <td className="border p-1 font-mono">{str}</td>
                        <td className="border p-1 font-mono">{hash}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                Hash function: h(s) = (s[0] × base^(m-1) + ... + s[m-1]) mod prime
              </p>
            </CardContent>
          </Card>
        )}

        {/* Algorithm Analysis */}
        {matches.length >= 0 && isRunning && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Algorithm Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-blue-600">{matches.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Matches found</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-green-600">{steps.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Total steps</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-purple-600">
                    {steps.filter(s => s.isHashMatch).length}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Hash matches</div>
                </div>
              </div>
              
              {matches.length > 0 && (
                <div>
                  <div className="text-xs font-medium mb-2">Match positions:</div>
                  <div className="flex gap-1 flex-wrap">
                    {matches.map((pos, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">Position {pos}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                <p><strong>Average Time:</strong> O(n + m)</p>
                <p><strong>Worst Case:</strong> O(nm)</p>
                <p><strong>Space Complexity:</strong> O(1)</p>
                <p><strong>Advantage:</strong> Fast average case performance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        {/* Rolling Hash Visualization */}
        {isRunning && steps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Rolling Hash Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <p className="font-medium">{steps[currentStep].description}</p>
                </div>
                
                {renderRollingHashVisualization()}
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
{`def rabin_karp_search(text, pattern, prime=101, base=256):
    n, m = len(text), len(pattern)
    pattern_hash = 0
    window_hash = 0
    h = 1
    
    # Calculate h = base^(m-1) % prime
    for i in range(m - 1):
        h = (h * base) % prime
    
    # Calculate hash of pattern and first window
    for i in range(m):
        pattern_hash = (base * pattern_hash + ord(pattern[i])) % prime
        window_hash = (base * window_hash + ord(text[i])) % prime
    
    matches = []
    
    for i in range(n - m + 1):
        # Check if hash values match
        if pattern_hash == window_hash:
            # Check character by character
            if text[i:i+m] == pattern:
                matches.append(i)
        
        # Calculate hash for next window
        if i < n - m:
            window_hash = (base * (window_hash - ord(text[i]) * h) + ord(text[i + m])) % prime
            if window_hash < 0:
                window_hash += prime
    
    return matches`}
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
                <strong>Plagiarism Detection:</strong> Document similarity checking systems
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Version Control:</strong> Git diff algorithms for file comparison
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Malware Detection:</strong> Signature-based antivirus scanning
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Data Deduplication:</strong> Storage systems finding duplicate files
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Image Processing:</strong> Template matching in computer vision
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
