import { useState } from "react";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import * as math from "mathjs";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "./ui/textarea";
import { Separator } from "./ui/separator";

const Calculator = ({ isOpen, onClose, isHidden }) => {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("Результат будет здесь");

  const formatOutput = (value) => {
    try {
      if (Array.isArray(value)) {
        if (Array.isArray(value[0])) {
          return value.map(row => 
            row.map(num => formatNumber(num)).join('\t')
          ).join('\n');
        }
        return value.map(num => formatNumber(num)).join('\t');
      }

      if (typeof value === 'number') {
        return formatNumber(value);
      }

      return String(value);
    } catch (error) {
      return String(value);
    }
  };

  const formatNumber = (num) => {
    if (!isFinite(num)) return String(num);
    
    try {
      return math.format(num, {
        precision: 64,
        notation: 'auto',
        lowerExp: -12,
        upperExp: 12
      });
    } catch (error) {
      return String(num);
    }
  };

  const evaluate = (text) => {
    if (!text.trim()) {
      setResult("Результат будет здесь");
      return;
    }

    try {
      if (text.includes('=')) {
        const equations = text.split('\n').filter(line => line.trim());
        
        if (equations.length > 1) {
          try {
            const vars = [...new Set(text.match(/[a-zA-Z]/g))].sort();
            const n = equations.length;
            
            if (vars.length !== n) {
              setResult("Количество уравнений должно совпадать с количеством переменных");
              return;
            }

            const A = [];
            const b = [];

            equations.forEach(eq => {
              const [left, right] = eq.split('=').map(side => side.trim());
              
              const row = new Array(vars.length).fill(0);
              
              left.split(/(?=[-+])|(?<=[-+])/).forEach(term => {
                term = term.trim();
                if (!term) return;
                
                let coef = 1;
                let variable = null;
                
                if (term.startsWith('+')) term = term.substring(1);
                if (term === '-') coef = -1;
                else if (term.startsWith('-')) {
                  coef = -1;
                  term = term.substring(1);
                }

                const match = term.match(/^(\d*\.?\d*)?([a-zA-Z])?$/);
                if (match) {
                  if (match[1] && match[1] !== '') coef *= parseFloat(match[1]);
                  if (match[2]) variable = match[2];
                  else coef = parseFloat(term);
                }

                if (variable) {
                  const varIndex = vars.indexOf(variable);
                  if (varIndex !== -1) {
                    row[varIndex] = coef;
                  }
                }
              });
              
              A.push(row);
              b.push(parseFloat(right) || 0);
            });

            const solution = math.lusolve(A, b);
            
            const formattedResult = vars
              .map((variable, index) => 
                `${variable} = ${Number(solution[index]).toFixed(2)}`)
              .join('\n');
            
            setResult(formattedResult);
            return;
          } catch (error) {
            console.error(error);
            setResult("Не удалось решить систему уравнений");
            return;
          }
        }
      }

      const config = {
        precision: 64,
        number: 'BigNumber'
      };

      const mathInstance = math.create(math.all, config);
      
      const result = mathInstance.evaluate(text);
      
      if (result && result.constructor.name === 'BigNumber') {
        setResult(result.toString());
      } else {
        setResult(formatOutput(result));
      }
    } catch (error) {
      setResult("Некорректное выражение");
    }
  };

  const handleInputChange = (e) => {
    const newInput = e.target.value;
    setInput(newInput);
    evaluate(newInput);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={cn(
            "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto",
            isHidden && "opacity-0 pointer-events-none"
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <div className="min-h-screen flex items-start justify-center p-2 sm:p-4">
            <motion.div 
              className="w-full max-w-[500px] rounded-xl border bg-card shadow-xl overflow-hidden my-2"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3">
                <h3 className="text-lg font-semibold">Калькулятор</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-destructive/10 hover:text-destructive" 
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="p-3 space-y-3">
                <Textarea
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Введите выражение"
                  className="min-h-[80px] max-h-[150px] font-mono text-sm resize-y shadow-sm focus-visible:ring-primary"
                />

                <div className="bg-muted rounded-lg p-2 shadow-inner">
                  <pre className="text-left whitespace-pre-wrap font-mono text-sm overflow-y-auto max-h-[120px] scrollbar-thin scrollbar-thumb-border">
                    {result}
                  </pre>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h3 className="text-base font-semibold">Примеры:</h3>
                  <div className="grid gap-2 text-sm">
                    <div className="space-y-1">
                      <strong className="block text-sm">Основные операции:</strong>
                      <code className="block p-1.5 rounded-md bg-muted text-xs">2+2, 5-3, 7*8, 9/3</code>
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-sm">Функции:</strong>
                      <code className="block p-1.5 rounded-md bg-muted text-xs">sqrt(16), log(100, 10), sin(pi/2)</code>
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-sm">Матрицы:</strong>
                      <code className="block p-1.5 rounded-md bg-muted text-xs">det([[1,2],[3,4]]), inv([[1,2],[3,4]])</code>
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-sm">Константы:</strong>
                      <code className="block p-1.5 rounded-md bg-muted text-xs">pi, e</code>
                    </div>
                    <div className="space-y-1">
                      <strong className="block text-sm">Системы уравнений:</strong>
                      <code className="block p-1.5 rounded-md bg-muted text-xs">
                        2x + y = 5 <br/>
                        x - y = 1
                      </code>
                      <span className="block text-xs text-muted-foreground mt-1">
                        (Введите каждое уравнение с новой строки)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Calculator; 