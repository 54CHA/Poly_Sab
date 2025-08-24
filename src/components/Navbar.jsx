import { BookOpen } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import ContactForm from "./ContactForm";

const Navbar = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 ">
      <div className="max-w-[1136px] mx-auto px-8 pt-4 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 bg-white rounded-lg p-1.5 sm:p-2 pr-2 sm:pr-4 shadow-sm border min-w-0 flex-shrink">
            <div className="bg-secondary p-2 rounded-lg flex-shrink-0">
              <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-secondary-foreground" />
            </div>
            <h1 className="text-sm sm:text-lg font-semibold bg-gradient-to-r from-primary to-primary/50 text-transparent bg-clip-text whitespace-nowrap">
              Poly Sab
            </h1>
          </Link>
          <div className="bg-white rounded-lg shadow-sm border flex-shrink-0">
            <ContactForm />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
