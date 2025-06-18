
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, RotateCcw, Search, Code, Lightbulb } from "lucide-react";

interface KMPStep {
  step: number;
  description: string;
  textIndex: number;
  patternIndex: number;
  isMatch: boolean;
  matches: number[];
}

export const KMPVisualizer = () => {
  const [text, setText] = useState("ABABCABABA");
  const [pattern, setPattern] = useState("ABABA");
  const [isRunning, setIsRunning] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState<KMPStep[]>([]);
  const [failureFunction, setFailureFunction] = useState<number[]>([]);
  const [matches, setMatches] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const buildFailureFunction = (pattern: string) => {
    const lps = new Array(pattern.length).fill(0);
    let len = 0;
    let i = 1;

    while (i < pattern.length) {
      if (pattern[i] === pattern[len]) {
        len++;
        lps[i] = len;
        i++;
      } else {
        if (len !== 0) {
          len = lps[len - 1];
        } else {
          lps[i] = 0;
          i++;
        }
      }
    }
    return lps;
  };

  const kmpSearch = (text: string, pattern: string) => {
    const lps = buildFailureFunction(pattern);
    setFailureFunction(lps);

    const steps: KMPStep[] = [];
    const foundMatches: number[] = [];
    
    let textIndex = 0;
    let patternIndex = 0;
    let stepCounter = 1;

    steps.push({
      step: stepCounter++,
      description: "Initialize: Start comparing from the beginning",
      textIndex: 0,
      patternIndex: 0,
      isMatch: false,
      matches: []
    });

    while (textIndex < text.length) {
      const isCharMatch = text[textIndex] === pattern[patternIndex];
      
      if (isCharMatch) {
        steps.push({
          step: stepCounter++,
          description: `Match found: '${text[textIndex]}' at position ${textIndex}`,
          textIndex,
          patternIndex,
          isMatch: true,
          matches: [...foundMatches]
        });
        
        textIndex++;
        patternIndex++;
        
        if (patternIndex === pattern.length) {
          foundMatches.push(textIndex - patternIndex);
          steps.push({
            step: stepCounter++,
            description: `Complete pattern match found at position ${textIndex - patternIndex}!`,
            textIndex: textIndex - 1,
            patternIndex: patternIndex - 1,
            isMatch: true,
            matches: [...foundMatches]
          });
          
          patternIndex = lps[patternIndex - 1];
        }
      } else {
        steps.push({
          step: stepCounter++,
          description: `Mismatch: '${text[textIndex]}' ≠ '${pattern[patternIndex]}' at position ${textIndex}`,
          textIndex,
          patternIndex,
          isMatch: false,
          matches: [...foundMatches]
        });
        
        if (patternIndex !== 0) {
          patternIndex = lps[patternIndex - 1];
          steps.push({
            step: stepCounter++,
            description: `Using failure function: shift pattern to position ${patternIndex}`,
            textIndex,
            patternIndex,
            isMatch: false,
            matches: [...foundMatches]
          });
        } else {
          textIndex++;
        }
      }
    }

    steps.push({
      step: stepCounter++,
      description: `Search complete! Found ${foundMatches.length} matches.`,
      textIndex: text.length - 1,
      patternIndex: 0,
      isMatch: false,
      matches: foundMatches
    });

    setSteps(steps);
    setMatches(foundMatches);
  };

  const runVisualization = () => {
    if (text.trim() && pattern.trim()) {
      kmpSearch(text.trim(), pattern.trim());
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
    setFailureFunction([]);
    setMatches([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const renderTextComparison = () => {
    if (!isRunning || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const { textIndex, patternIndex, isMatch } = currentStepData;

    return (
      <div className="space-y-3">
        <div className="text-xs font-medium">Text:</div>
        <div className="flex flex-wrap gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono">
          {text.split('').map((char, i) => (
            <span
              key={i}
              className={`px-1 py-1 rounded text-center min-w-[24px] text-xs ${
                matches.includes(i - pattern.length + 1) && i >= pattern.length - 1 && i <= textIndex
                  ? 'bg-green-200 dark:bg-green-800'
                  : i === textIndex
                  ? isMatch
                    ? 'bg-green-300 dark:bg-green-700 ring-1 ring-green-500'
                    : 'bg-red-300 dark:bg-red-700 ring-1 ring-red-500'
                  : 'hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {char}
            </span>
          ))}
        </div>

        <div className="text-xs font-medium">Pattern:</div>
        <div className="flex gap-1 p-3 bg-gray-50 dark:bg-gray-800 rounded font-mono">
          <div style={{ marginLeft: `${(textIndex - patternIndex) * 28}px` }} className="flex gap-1">
            {pattern.split('').map((char, i) => (
              <span
                key={i}
                className={`px-1 py-1 rounded text-center min-w-[24px] text-xs ${
                  i === patternIndex
                    ? isMatch
                      ? 'bg-green-300 dark:bg-green-700 ring-1 ring-green-500'
                      : 'bg-red-300 dark:bg-red-700 ring-1 ring-red-500'
                    : i < patternIndex
                    ? 'bg-blue-200 dark:bg-blue-800'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {char}
              </span>
            ))}
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
              <Search className="w-4 h-4" />
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

        {/* Failure Function Table */}
        {failureFunction.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Failure Function (LPS Array)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <td className="border p-1 bg-gray-100 dark:bg-gray-800 font-medium">Index</td>
                      {pattern.split('').map((_, i) => (
                        <td key={i} className="border p-1 bg-gray-100 dark:bg-gray-800 text-center font-mono">
                          {i}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border p-1 bg-gray-100 dark:bg-gray-800 font-medium">Character</td>
                      {pattern.split('').map((char, i) => (
                        <td key={i} className="border p-1 text-center font-mono">
                          {char}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="border p-1 bg-gray-100 dark:bg-gray-800 font-medium">LPS Value</td>
                      {failureFunction.map((value, i) => (
                        <td key={i} className="border p-1 text-center font-mono bg-blue-50 dark:bg-blue-900/20">
                          {value}
                        </td>
                      ))}
                    </tr>
                  </thead>
                </table>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                LPS values help skip characters during mismatch
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
                  <div className="text-lg font-bold text-purple-600">{failureFunction.reduce((a, b) => a + b, 0)}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">Characters skipped</div>
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
                <p><strong>Time Complexity:</strong> O(n + m)</p>
                <p><strong>Space Complexity:</strong> O(m)</p>
                <p><strong>Preprocessing:</strong> O(m)</p>
                <p><strong>Advantage:</strong> Never re-examines text characters</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        {/* Pattern Matching Visualization */}
        {isRunning && steps.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Pattern Matching Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                  <p className="font-medium">{steps[currentStep].description}</p>
                </div>
                
                {renderTextComparison()}
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
{`def kmp_search(text, pattern):
    def build_lps(pattern):
        lps = [0] * len(pattern)
        length = 0
        i = 1
        
        while i < len(pattern):
            if pattern[i] == pattern[length]:
                length += 1
                lps[i] = length
                i += 1
            else:
                if length != 0:
                    length = lps[length - 1]
                else:
                    lps[i] = 0
                    i += 1
        return lps
    
    lps = build_lps(pattern)
    i = j = 0
    matches = []
    
    while i < len(text):
        if pattern[j] == text[i]:
            i += 1
            j += 1
        
        if j == len(pattern):
            matches.append(i - j)
            j = lps[j - 1]
        elif i < len(text) and pattern[j] != text[i]:
            if j != 0:
                j = lps[j - 1]
            else:
                i += 1
    
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
                <strong>Text Editors:</strong> Find and replace functionality in IDEs
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                <strong>Web Search:</strong> Search engines for pattern matching
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                <strong>Bioinformatics:</strong> DNA sequence analysis and matching
              </div>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                <strong>Network Security:</strong> Intrusion detection systems
              </div>
              <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded">
                <strong>Compilers:</strong> Lexical analysis and token recognition
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
