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
      <div className="max-w-[1135px] mx-auto p-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 bg-white rounded-xl p-2 pr-4 shadow-sm border">
            <div className="bg-secondary p-3 rounded-lg">
              <BookOpen className="h-5 w-5 text-secondary-foreground" />
            </div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/50 text-transparent bg-clip-text">
              Poly Sab
            </h1>
          </Link>
          <div className="bg-white rounded-lg shadow-sm border">
            <ContactForm />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
