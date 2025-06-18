
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Zap, Code, Lightbulb } from "lucide-react";

interface NaiveStep {
  step: number;
  description: string;
  textIndex: number;
  patternIndex: number;
  windowStart: number;
  isMatch: boolean;
  isCompleteMatch: boolean;
  matches: number[];
  comparisons: number;
}

export const NaiveVisualizer = () => {
  const [text, setText] = useState("ABABCABABA");
  const [pattern, setPattern] = useState("ABABA");
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<NaiveStep[]>([]);
  const [matches, setMatches] = useState<number[]>([]);
  const [totalComparisons, setTotalComparisons] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const naiveSearch = (text: string, pattern: string) => {
    const n = text.length;
    const m = pattern.length;
    const steps: NaiveStep[] = [];
    const foundMatches: number[] = [];
    let stepCounter = 1;
    let comparisons = 0;

    steps.push({
      step: stepCounter++,
      description: "Initialize: Start brute force pattern matching from position 0",
      textIndex: 0,
      patternIndex: 0,
      windowStart: 0,
      isMatch: false,
      isCompleteMatch: false,
      matches: [],
      comparisons: 0
    });

    for (let i = 0; i <= n - m; i++) {
      let j = 0;
      
      steps.push({
        step: stepCounter++,
        description: `Starting new window at position ${i}`,
        textIndex: i,
        patternIndex: 0,
        windowStart: i,
        isMatch: false,
        isCompleteMatch: false,
        matches: [...foundMatches],
        comparisons
      });

      while (j < m && text[i + j] === pattern[j]) {
        comparisons++;
        steps.push({
          step: stepCounter++,
          description: `Match: '${text[i + j]}' = '${pattern[j]}' at position ${i + j}`,
          textIndex: i + j,
          patternIndex: j,
          windowStart: i,
          isMatch: true,
          isCompleteMatch: false,
          matches: [...foundMatches],
          comparisons
        });
        j++;
      }

      if (j === m) {
        foundMatches.push(i);
        steps.push({
          step: stepCounter++,
          description: `Complete match found at position ${i}!`,
          textIndex: i + j - 1,
          patternIndex: j - 1,
          windowStart: i,
          isMatch: true,
          isCompleteMatch: true,
          matches: [...foundMatches],
          comparisons
        });
      } else if (i + j < n) {
        comparisons++;
        steps.push({
          step: stepCounter++,
          description: `Mismatch: '${text[i + j]}' ≠ '${pattern[j]}' at position ${i + j}`,
          textIndex: i + j,
          patternIndex: j,
          windowStart: i,
          isMatch: false,
          isCompleteMatch: false,
          matches: [...foundMatches],
          comparisons
        });
      }

      if (i < n - m) {
        steps.push({
          step: stepCounter++,
          description: `Shift pattern one position right`,
          textIndex: i + 1,
          patternIndex: 0,
          windowStart: i + 1,
          isMatch: false,
          isCompleteMatch: false,
          matches: [...foundMatches],
          comparisons
        });
      }
    }

    steps.push({
      step: stepCounter++,
      description: `Search complete! Found ${foundMatches.length} matches using ${comparisons} comparisons.`,
      textIndex: n - 1,
      patternIndex: 0,
      windowStart: n - m,
      isMatch: false,
      isCompleteMatch: false,
      matches: foundMatches,
      comparisons
    });

    setSteps(steps);
    setMatches(foundMatches);
    setTotalComparisons(comparisons);
  };

  const runVisualization = () => {
    if (text.trim() && pattern.trim()) {
      naiveSearch(text.trim(), pattern.trim());
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
    setTotalComparisons(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const renderBruteForceVisualization = () => {
    if (!isRunning || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const { textIndex, patternIndex, windowStart, isMatch, isCompleteMatch } = currentStepData;

    return (
      <div className="space-y-3">
        <div className="text-xs font-medium">Text:</div>
        <div className="flex flex-wrap gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono">
          {text.split('').map((char, i) => (
            <span
              key={i}
              className={`px-1 py-1 rounded text-center min-w-[24px] text-xs ${
                matches.some(pos => i >= pos && i < pos + pattern.length)
                  ? 'bg-green-200 dark:bg-green-800'
                  : i === textIndex
                  ? isMatch
                    ? isCompleteMatch
                      ? 'bg-green-300 dark:bg-green-700 ring-1 ring-green-500'
                      : 'bg-blue-300 dark:bg-blue-700 ring-1 ring-blue-500'
                    : 'bg-red-300 dark:bg-red-700 ring-1 ring-red-500'
                  : i >= windowStart && i < windowStart + pattern.length && i < textIndex
                  ? 'bg-blue-200 dark:bg-blue-800'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {char}
            </span>
          ))}
        </div>

        <div className="text-xs font-medium">Pattern (current window position):</div>
        <div className="flex gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono">
          <div style={{ marginLeft: `${windowStart * 28}px`}} className="flex gap-1">
            {pattern.split('').map((char, i) => (
              <span
                key={i}
                className={`px-1 py-1 rounded text-center min-w-[24px] text-xs ${
                  i === patternIndex
                    ? isMatch
                      ? 'bg-blue-300 dark:bg-blue-700 ring-1 ring-blue-500'
                      : 'bg-red-300 dark:bg-red-700 ring-1 ring-red-500'
                    : i < patternIndex
                    ? 'bg-green-200 dark:bg-green-800'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span>Window: {windowStart}</span>
            <span>Comparing: Text[{textIndex}] vs Pattern[{patternIndex}]</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMatch ? "default" : "destructive"} className="text-xs">
              {isMatch ? "Match" : "Mismatch"}
            </Badge>
            {isCompleteMatch && <Badge variant="default" className="text-xs">Complete Match!</Badge>}
          </div>
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
              <Zap className="w-4 h-4" />
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

        {/* Algorithm Analysis */}
        {matches.length >= 0 && isRunning && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Algorithm Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-blue-600">{matches.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Matches found</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-green-600">{totalComparisons}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Total comparisons</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-purple-600">{steps.length}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Total steps</div>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-lg font-bold text-orange-600">
                    {text.length - pattern.length + 1}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Windows checked</div>
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
                <p><strong>Time Complexity:</strong> O(nm)</p>
                <p><strong>Space Complexity:</strong> O(1)</p>
                <p><strong>Worst Case:</strong> When pattern almost matches at every position</p>
                <p><strong>Disadvantage:</strong> Inefficient for large texts</p>
              </div>
              
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <p className="text-xs font-medium mb-1">Performance Comparison:</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  This brute force approach makes {totalComparisons} comparisons. 
                  More efficient algorithms like KMP would make fewer comparisons.
                </p>
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
{`def naive_string_search(text, pattern):
    n = len(text)
    m = len(pattern)
    matches = []
    
    for i in range(n - m + 1):
        j = 0
        
        # Check if pattern matches at position i
        while j < m and text[i + j] == pattern[j]:
            j += 1
        
        # If we matched the entire pattern
        if j == m:
            matches.append(i)
    
    return matches

# Example usage
text = "ABABCABABA"
pattern = "ABABA"
result = naive_string_search(text, pattern)
print(f"Pattern found at positions: {result}")  # [0, 5]`}
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
                <strong>Simple Text Search:</strong> Basic find functionality in small documents
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Educational Purpose:</strong> Teaching basic string matching concepts
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Prototype Development:</strong> Quick implementation for proof of concept
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Small Data Sets:</strong> When performance is not a concern
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Algorithm Comparison:</strong> Baseline for comparing advanced algorithms
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {/* Brute Force Visualization */}
        {isRunning && steps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Brute Force Matching Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <p className="font-medium">{steps[currentStep].description}</p>
                </div>
                
                {renderBruteForceVisualization()}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold text-sm">{steps[currentStep].comparisons}</div>
                    <div className="text-gray-600 dark:text-gray-300">Comparisons so far</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold text-sm">{steps[currentStep].windowStart}</div>
                    <div className="text-gray-600 dark:text-gray-300">Current window</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="font-bold text-sm">{steps[currentStep].matches.length}</div>
                    <div className="text-gray-600 dark:text-gray-300">Matches found</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
