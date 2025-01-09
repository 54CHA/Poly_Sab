import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Lock, User, KeyRound } from "lucide-react";

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
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
      <div className="relative w-full max-w-[400px] p-6">
        {/* Background blur effect */}
        <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-xl" />

        {/* Login form */}
        <div className="rounded-xl border bg-card/50 p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary/50 to-primary opacity-75 blur" />
                  <div className="relative rounded-full bg-card p-4">
                    <Lock className="h-8 w-8 text-primary" />
                  </div>
                </div>
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Вход в админ-панель
              </h1>
              <p className="text-sm text-muted-foreground">
                Введите учетные данные для доступа
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Имя пользователя"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
