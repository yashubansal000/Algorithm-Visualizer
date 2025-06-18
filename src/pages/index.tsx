
import { useState } from "react";
import { Moon, Sun, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HuffmanVisualizer } from "@/components/algorithms/HuffmanVisualizer";
import { KMPVisualizer } from "@/components/algorithms/KMPVisualizer";
import { RabinKarpVisualizer } from "@/components/algorithms/RabinKarpVisualizer";
import { NaiveVisualizer } from "@/components/algorithms/NaiveVisualizer";
import { KruskalVisualizer } from "@/components/algorithms/KruskalVisualizer";
import { PrimVisualizer } from "@/components/algorithms/PrimVisualizer";
import { DijkstraVisualizer } from "@/components/algorithms/DijkstraVisualizer";
import { BellmanFordVisualizer } from "@/components/algorithms/BellmanFordVisualizer";
import { FloydWarshallVisualizer } from "@/components/algorithms/FloydWarshallVisualizer";

const algorithms = [
  {
    id: "huffman",
    name: "Huffman Coding",
    description: "Lossless data compression algorithm using variable-length codes",
    icon: "🌳"
  },
  {
    id: "kmp",
    name: "KMP Pattern Matching",
    description: "Efficient string matching using failure function",
    icon: "🔍"
  },
  {
    id: "rabinkarp",
    name: "Rabin-Karp Algorithm",
    description: "String matching using rolling hash technique",
    icon: "🔢"
  },
  {
    id: "naive",
    name: "Naive String Matching",
    description: "Brute force pattern matching approach",
    icon: "💪"
  },
  {
    id: "kruskal",
    name: "Kruskal's Algorithm",
    description: "Minimum spanning tree using union-find",
    icon: "🔗"
  },
  {
    id: "prim",
    name: "Prim's Algorithm",
    description: "Minimum spanning tree using greedy approach",
    icon: "🌲"
  },
  {
    id: "dijkstra",
    name: "Dijkstra's Algorithm",
    description: "Shortest path from single source",
    icon: "🛤️"
  },
  {
    id: "bellmanford",
    name: "Bellman-Ford Algorithm",
    description: "Shortest path with negative weights",
    icon: "⚖️"
  },
  {
    id: "floydwarshall",
    name: "Floyd-Warshall Algorithm",
    description: "All-pairs shortest path algorithm",
    icon: "🌐"
  }
];

const Index = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const renderAlgorithmVisualizer = () => {
    switch (selectedAlgorithm) {
      case "huffman":
        return <HuffmanVisualizer />;
      case "kmp":
        return <KMPVisualizer />;
      case "rabinkarp":
        return <RabinKarpVisualizer />;
      case "naive":
        return <NaiveVisualizer />;
      case "kruskal":
        return <KruskalVisualizer />;
      case "prim":
        return <PrimVisualizer />;
      case "dijkstra":
        return <DijkstraVisualizer />;
      case "bellmanford":
        return <BellmanFordVisualizer />;
      case "floydwarshall":
        return <FloydWarshallVisualizer />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Algorithm Visualizer
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hidden md:flex"
              >
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-full justify-start mb-2"
              >
                {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                {isDarkMode ? "Light Mode" : "Dark Mode"}
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-2 md:px-4 py-3">
        {!selectedAlgorithm ? (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h2 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-white">
                Choose an Algorithm to Visualize
              </h2>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Explore and understand different algorithms through interactive visualizations
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
              {algorithms.map((algorithm) => (
                <Card
                  key={algorithm.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 hover:border-blue-400"
                  onClick={() => setSelectedAlgorithm(algorithm.id)}
                >
                  <CardHeader className="text-center p-2 md:p-4">
                    <div className="text-xl md:text-3xl mb-1">{algorithm.icon}</div>
                    <CardTitle className="text-xs md:text-base">{algorithm.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-1 md:p-4 pt-0">
                    <CardDescription className="text-center text-xs">
                      {algorithm.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-2xl font-bold text-gray-800 dark:text-white">
                  {algorithms.find(a => a.id === selectedAlgorithm)?.name}
                </h2>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                  {algorithms.find(a => a.id === selectedAlgorithm)?.description}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedAlgorithm("")}
                className="shrink-0 text-xs"
              >
                ← Back to Algorithms
              </Button>
            </div>
            
            {renderAlgorithmVisualizer()}
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
