import { useState } from "react";
import { Button } from "./ui/button";
import { X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import * as math from "mathjs";
import { motion, AnimatePresence } from "framer-motion";

const Calculator = ({ isOpen, onClose, isHidden }) => {
  const [display, setDisplay] = useState("0");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [degreeMode, setDegreeMode] = useState(true);
  const [shift, setShift] = useState(false);

  const evaluate = (expr) => {
    try {
      // Convert degrees to radians for trig functions if in degree mode
      let processedExpr = expr;
      if (degreeMode) {
        ['sin', 'cos', 'tan'].forEach(func => {
          processedExpr = processedExpr.replace(
            new RegExp(`${func}\\((.*?)\\)`, 'g'),
            (match, p1) => `${func}(${p1} * pi / 180)`
          );
        });
      }
      const result = math.evaluate(processedExpr);
      return math.format(result, { precision: 14 });
    } catch (error) {
      return "Error";
    }
  };

  const handleInput = (value) => {
    setDisplay(prev => prev === "0" || prev === "Error" ? value : prev + value);
  };

  const handleOperation = (operation) => {
    try {
      let result;
      const x = parseFloat(display);

      switch (operation) {
        case 'sin':
        case 'cos':
        case 'tan':
          result = evaluate(`${operation}(${display})`);
          break;
        case 'asin':
        case 'acos':
        case 'atan':
          result = evaluate(`${operation}(${display})`);
          if (degreeMode) result = math.multiply(result, 180/math.pi);
          break;
        case 'log':
          result = math.log10(x);
          break;
        case 'ln':
          result = math.log(x);
          break;
        case 'sqrt':
          result = math.sqrt(x);
          break;
        case 'square':
          result = math.pow(x, 2);
          break;
        case 'cube':
          result = math.pow(x, 3);
          break;
        case '1/x':
          result = 1 / x;
          break;
        case 'factorial':
          result = math.factorial(x);
          break;
        case 'exp':
          result = math.exp(x);
          break;
        default:
          result = "Error";
      }

      setDisplay(String(result));
      setHistory(prev => [...prev, { expression: display, result: String(result) }]);
    } catch (error) {
      setDisplay("Error");
    }
  };

  const handleEquals = () => {
    try {
      const result = evaluate(display);
      setHistory(prev => [...prev, { expression: display, result }]);
      setDisplay(result);
    } catch (error) {
      setDisplay("Error");
    }
  };

  const handleClear = () => {
    setDisplay("0");
  };

  const handleAllClear = () => {
    setDisplay("0");
    setHistory([]);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className={cn(
          "fixed inset-0 z-50 overflow-y-auto",
          isHidden && "opacity-0 pointer-events-none"
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="min-h-full flex items-start md:justify-end justify-center">
          <motion.div 
            className="w-[calc(100%-2rem)] md:w-[400px] rounded-lg border bg-card shadow-lg my-4 md:mr-4"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Scientific Calculator</h3>
                <motion.div
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setDegreeMode(!degreeMode)}
                  >
                    {degreeMode ? "DEG" : "RAD"}
                  </Button>
                </motion.div>
              </div>
              <motion.div whileTap={{ scale: 0.95 }}>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>

            <div className="p-4 space-y-4">
              {/* Display */}
              <motion.div 
                className="bg-muted p-4 rounded-lg"
                initial={false}
                animate={{ scale: display === "Error" ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-right space-y-1">
                  <div className="text-muted-foreground text-sm font-mono h-5">
                    {history[history.length - 1]?.expression || ""}
                  </div>
                  <motion.div 
                    className="text-2xl font-mono break-all"
                    key={display}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {display}
                  </motion.div>
                </div>
              </motion.div>

              {/* History Panel */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div 
                    className="border rounded-lg p-2 max-h-[200px] overflow-y-auto"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {history.map((item, index) => (
                      <motion.div 
                        key={index}
                        className="p-2 border-b last:border-0"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="text-sm text-muted-foreground">{item.expression}</div>
                        <div className="text-right">{item.result}</div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-10", shift && "bg-muted")}
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-10", shift && "bg-muted")}
                  onClick={() => setShift(!shift)}
                >
                  {shift ? "SHIFT" : "shift"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-destructive hover:text-destructive"
                  onClick={handleAllClear}
                >
                  AC
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 text-destructive hover:text-destructive"
                  onClick={handleClear}
                >
                  C
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10"
                  onClick={() => setDisplay(prev => prev.slice(0, -1) || "0")}
                >
                  ⌫
                </Button>

                {/* Scientific functions */}
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => handleOperation(shift ? 'asin' : 'sin')}
                >
                  {shift ? "asin" : "sin"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => handleOperation(shift ? 'acos' : 'cos')}
                >
                  {shift ? "acos" : "cos"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => handleOperation(shift ? 'atan' : 'tan')}
                >
                  {shift ? "atan" : "tan"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => handleOperation(shift ? 'exp' : 'log')}
                >
                  {shift ? "exp" : "log"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-10"
                  onClick={() => handleOperation('ln')}
                >
                  ln
                </Button>

                {/* Numbers and basic operations */}
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("7")}>7</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("8")}>8</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("9")}>9</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleInput("/")}>/</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleOperation('sqrt')}>√</Button>

                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("4")}>4</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("5")}>5</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("6")}>6</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleInput("*")}>×</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleOperation('square')}>x²</Button>

                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("1")}>1</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("2")}>2</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("3")}>3</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleInput("-")}>−</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleOperation('cube')}>x³</Button>

                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("0")}>0</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput(".")}>.</Button>
                <Button variant="outline" size="sm" className="h-10" onClick={() => handleInput("π")}>π</Button>
                <Button variant="secondary" size="sm" className="h-10" onClick={() => handleInput("+")}>+</Button>
                <Button variant="default" size="sm" className="h-10" onClick={handleEquals}>=</Button>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Calculator; 