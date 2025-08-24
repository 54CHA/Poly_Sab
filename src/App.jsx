import "./App.css";
import "./index.css";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import "toastr/build/toastr.min.css";
import PolySaboteur from "./pages/PolySaboteur";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "sonner";
import { useState, useCallback, useEffect } from "react";
import { cn } from "./lib/utils";
import Loader from "./components/Loader";
import CustomToaster from "./components/CustomToaster";
import NotFoundPage from "./pages/NotFoundPage";

function App() {
  const [isHidden, setIsHidden] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.altKey) {
      setIsHidden((h) => !h);
    }
  }, []);

  return (
    <Router>
      <div
        className="min-h-screen flex flex-col relative"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {isLoading && <Loader />}
        <div
          className={cn(
            "fixed inset-0 transition-opacity duration-100",
            "bg-[Canvas]",
            "z-[9999]",
            isHidden ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />
        <div className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-xl" />
        <Navbar />
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<PolySaboteur />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
        <Footer />
        <CustomToaster
          position="top-center"
          richColors
          duration={3000}
          isHidden={isHidden}
        />
      </div>
    </Router>
  );
}

export default App;
