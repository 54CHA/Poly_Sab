import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

const NotFoundPage = () => {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-[90vw] sm:max-w-md">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary/50 to-primary opacity-75 blur" />
            <div className="relative rounded-full bg-card p-3 sm:p-4">
              <FileQuestion className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">404</h1>
          <h2 className="text-lg sm:text-xl font-semibold">
            Страница не найдена
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Упс! Кажется, вы забрели не туда.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link to="/">Вернуться на главную</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFoundPage;
