import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { X, Send, Brain, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getGeminiResponse } from "@/lib/gemini";
import { toast } from "sonner";

const LoadingDots = () => (
  <div className="flex gap-1 items-center">
    <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
    <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
    <div className="w-1 h-1 rounded-full bg-muted-foreground animate-bounce" />
  </div>
);

const AiChatPopup = ({ isOpen, onClose, initialQuery = "" }) => {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Используется API Gemini Flash 2.0 Experimental",
    },
    ...[initialQuery ? { role: "user", content: initialQuery } : null].filter(
      Boolean
    ),
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { role: "assistant", content: null }]);

    try {
      const response = await getGeminiResponse(input.trim());
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      setMessages((prev) => prev.slice(0, -1));
      toast.error("Ошибка", {
        description: "Не удалось получить ответ от AI",
      });
      console.error("AI Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 shadow-lg z-50 md:p-8"
      onClick={handleBackdropClick}
    >
      <div
        className={cn(
          "fixed bg-card rounded-lg border shadow-lg flex flex-col transition-all duration-200",
          isFullscreen
            ? "inset-4"
            : "right-4 bottom-4 md:right-8 md:bottom-8 w-[calc(100%-2rem)] md:w-[400px] h-[600px]"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <h3 className="font-semibold">Задать вопрос ИИ</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col max-w-[80%] space-y-1",
                message.role === "user" ? "ml-auto items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-3 py-2 text-sm",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content === null ? <LoadingDots /> : message.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading ? "AI думает..." : "Напишите сообщение..."}
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiChatPopup;
