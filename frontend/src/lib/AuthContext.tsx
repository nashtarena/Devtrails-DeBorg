import React, { createContext, useContext, useState } from "react";
import { setToken } from "./api";

interface AuthState {
  token: string | null;
  partnerId: string | null;
}

interface AuthContextType extends AuthState {
  login: (token: string, partnerId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null, partnerId: null,
  login: () => {}, logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({ token: null, partnerId: null });

  const login = (token: string, partnerId: string) => {
    setToken(token);
    console.log("[Auth] token set, length:", token?.length);
    setAuth({ token, partnerId });
  };

  const logout = () => {
    setToken(null);
    setAuth({ token: null, partnerId: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
