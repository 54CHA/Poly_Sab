import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send, Brain, Maximize2, Minimize2, Bot, Copy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGeminiResponse } from "@/lib/aimodels";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const LoadingDots = () => (
  <div className="flex gap-1 items-center">
    <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
    <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
    <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" />
  </div>
);

const Message = ({ message, onCopy }) => {
  return (
    <div
      className={cn(
        "group flex flex-col max-w-[85%]",
        message.role === "user" ? "ml-auto items-end" : "items-start"
      )}
    >
      <div className="flex items-start gap-2">
        {message.role === "assistant" && (
          <div className="mt-0.5 rounded-md bg-primary/10 p-1">
            <Bot className="h-4 w-4 text-primary" />
          </div>
        )}
        <div
          className={cn(
            "rounded-xl px-3 py-1 text-sm shadow-sm overflow-hidden min-h-[30px] flex items-center",
            message.role === "user"
              ? "bg-primary text-primary-foreground prose-headings:text-primary-foreground prose-p:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground"
              : "bg-muted prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground"
          )}
        >
          {message.content === null ? (
            <LoadingDots />
          ) : (
            <div className="w-full">
              <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    pre({ node, ...props }) {
                      return (
                        <pre
                          {...props}
                          className="overflow-x-auto p-3 rounded-lg bg-muted/50 text-foreground max-w-full"
                        />
                      );
                    },
                    p({ node, ...props }) {
                      return (
                        <p
                          {...props}
                          className="my-2 leading-relaxed break-words"
                        />
                      );
                    },
                    code({ node, inline, ...props }) {
                      return inline ? (
                        <code
                          {...props}
                          className="px-1.5 py-0.5 rounded-md bg-muted/50 text-foreground font-mono text-sm"
                        />
                      ) : (
                        <code
                          {...props}
                          className="block p-3 rounded-lg bg-muted/50 text-foreground font-mono text-sm whitespace-pre-wrap break-words"
                        />
                      );
                    },
                    ul({ node, ...props }) {
                      return <ul {...props} className="my-2 ml-4 list-disc" />;
                    },
                    ol({ node, ...props }) {
                      return (
                        <ol {...props} className="my-2 ml-4 list-decimal" />
                      );
                    },
                    li({ node, ...props }) {
                      return <li {...props} className="my-1" />;
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.role === "assistant" && message.content && (
                <div className="mt-2 flex items-center border-t border-border/40 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => onCopy(message.content)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Копировать
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AiChatPopup = ({ isOpen, onClose, initialQuery = "" }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Привет! Я помогу вам найти ответы на ваши вопросы. Что вас интересует?",
    },
    ...[
      initialQuery
        ? {
            role: "user",
            content: initialQuery,
          }
        : null,
    ].filter(Boolean),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("mixtral");
  const messagesEndRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Скопировано", {
      description: "Текст скопирован в буфер обмена",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: null,
      },
    ]);

    try {
      const response = await getGeminiResponse(input.trim(), selectedModel);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: response,
        },
      ]);
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1));
      toast.error("Ошибка", {
        description: "Не удалось получить ответ от AI. Возможно, превышен лимит запросов для этой модели",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          className={cn(
            "fixed bg-card rounded-lg border shadow-xl flex flex-col transition-all duration-200",
            isFullscreen
              ? "inset-4"
              : "right-4 bottom-4 md:right-8 md:bottom-8 w-[calc(100%-2rem)] md:w-[500px] h-[600px]"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">AI Ассистент</h3>
                <div className="flex items-center gap-2">
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-6 px-2 text-xs hover:bg-muted/50 flex items-center gap-1"
                      >
                        {selectedModel === "deepseek" && "DeepSeek"}
                        {selectedModel === "mixtral" && "Mixtral"}
                        {selectedModel === "llama" && "Llama"}
                        <ChevronDown className="h-3 w-3 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-[140px]" forceMount>
                    <DropdownMenuItem onClick={() => setSelectedModel("mixtral")}>
                        Mixtral 8x7B
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedModel("deepseek")}>
                        DeepSeek R1 70B
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSelectedModel("llama")}>
                        Llama 3.3 70B
                      </DropdownMenuItem>
                      
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="hover:bg-primary/10 hover:text-primary"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
            {messages.map((message, i) => (
              <Message key={i} message={message} onCopy={handleCopy} />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t bg-muted/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isLoading ? "AI думает..." : "Напишите сообщение..."
                }
                disabled={isLoading}
                className="bg-background"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="shadow-none"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AiChatPopup;
