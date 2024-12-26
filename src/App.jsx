import "./App.css";
import "./index.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import "toastr/build/toastr.min.css";
import PolySaboteur from "./pages/PolySaboteur";
import AdminPage from "./pages/AdminPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import { useState, useCallback } from "react";
import { cn } from "./lib/utils";

function App() {
  const [isHidden, setIsHidden] = useState(false);

  const handleMouseClick = useCallback((e) => {
    if (e.ctrlKey && e.button === 0) {
      e.preventDefault();
      setIsHidden((h) => !h);
    }
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div
          className="min-h-screen flex flex-col relative"
          onMouseDown={handleMouseClick}
        >
          <div
            className={cn(
              "absolute inset-0 z-50 transition-opacity duration-100",
              "bg-[Canvas]",
              isHidden ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          />
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<PolySaboteur />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
          <Footer />
        </div>
        <Toaster position="top-center" richColors duration={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
