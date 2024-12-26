import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      const from = location.state?.from?.pathname || "/admin";
      navigate(from);
    } else {
      toast.error("Ошибка", {
        description: "Неверные учетные данные",
        duration: 3000
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <div className="w-full max-w-[400px] p-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Вход в админ-панель
              </h1>
              <p className="text-sm text-muted-foreground">
                Введите учетные данные для доступа
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Имя пользователя"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Войти
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
