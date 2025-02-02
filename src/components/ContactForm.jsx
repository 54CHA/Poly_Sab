import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { MessageSquare } from "lucide-react";

const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

const CONTACT_REASONS = [
  { value: "bug", label: "Сообщить об ошибке" },
  { value: "complaint", label: "Жалоба" },
  { value: "suggestion", label: "Предложение" },
  { value: "other", label: "Другое" },
];

const ContactForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    reason: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim() || !formData.reason) {
      toast.error("Ошибка", {
        description: "Выберите причину обращения и введите сообщение",
      });
      return;
    }

    setIsLoading(true);
    try {
      const reasonLabel = CONTACT_REASONS.find(r => r.value === formData.reason)?.label || formData.reason;
      const text = `🔔 Новое сообщение\n\n📝 Тип: ${reasonLabel}\n📧 Email: ${
        formData.email || "Не указан"
      }\n\n💬 Сообщение:\n${formData.message}`;

      const response = await fetch(
        `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text,
            parse_mode: "HTML",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to send message");

      toast.success("Успешно", {
        description: "Ваше сообщение отправлено",
      });

      setFormData({
        email: "",
        reason: "",
        message: "",
      });
      setIsOpen(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Ошибка", {
        description: "Не удалось отправить сообщение",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[400px] h-full sm:h-auto" side="right">
        <SheetHeader>
          <SheetTitle>Связаться с нами</SheetTitle>
          <SheetDescription>
            Отправьте нам сообщение, и мы ответим вам как можно скорее
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Select
              value={formData.reason}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, reason: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Выберите причину обращения" />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="email"
              placeholder="Ваш email (необязательно)"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <div>
            <Textarea
              placeholder="Ваше сообщение"
              value={formData.message}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              rows={4}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Отправка..." : "Отправить"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default ContactForm; 
