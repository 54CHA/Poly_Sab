import "./App.css";
import "./index.css";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import "toastr/build/toastr.min.css";
import PolySaboteur from "./pages/PolySaboteur";
import V2Page from "./pages/V2Page";
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
      <AppContent 
        isHidden={isHidden}
        isLoading={isLoading}
        handleKeyDown={handleKeyDown}
      />
    </Router>
  );
}

function AppContent({ isHidden, isLoading, handleKeyDown }) {
  const location = useLocation();
  const isV2 = location.pathname === '/v2';

  return (
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
      {!isV2 && <div className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-xl" />}
      <Navbar />
      <div className={cn("flex-1", isV2 ? "pt-0" : "")}>
        <Routes>
          <Route path="/" element={<PolySaboteur />} />
          <Route path="/v2" element={<V2Page />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
      {!isV2 && <Footer />}
      <CustomToaster
        position="top-center"
        richColors
        duration={3000}
        isHidden={isHidden}
      />
    </div>
  );
}

export default App;
