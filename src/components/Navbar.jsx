import { BookOpen } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1000px] mx-auto p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-secondary p-2 rounded-lg">
              <BookOpen className="h-6 w-6 text-secondary-foreground" />
            </div>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/50 text-transparent bg-clip-text">
              Poly Sab
            </h1>
          </Link>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Button variant="ghost" size="icon" onClick={logout}>
                <FontAwesomeIcon
                  icon={faRightFromBracket}
                  className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                />
              </Button>
            )}
            <Button variant="ghost" size="icon" asChild>
              <a
                href="https://t.me/+2CBygI6Rdj0xNjJi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
