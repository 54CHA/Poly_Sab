import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-[1000px] mx-auto p-4">
        <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2024-{new Date().getFullYear()} Poly Saboteur. Права не защищены)
          </p>
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/54CHA/Poly_Saboteur"
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors duration-300 "
            >
              <FontAwesomeIcon icon={faGithub} className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
