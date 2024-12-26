import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Cookies.get("isAuthenticated") === "true";
  });

  useEffect(() => {
    if (isAuthenticated) {
      Cookies.set("isAuthenticated", "true", { expires: 7 });
    } else {
      Cookies.remove("isAuthenticated");
    }
  }, [isAuthenticated]);

  const login = (username, password) => {
    if (
      username === import.meta.env.VITE_ADMIN_USERNAME &&
      password === import.meta.env.VITE_ADMIN_PASSWORD
    ) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    Cookies.remove("isAuthenticated");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
