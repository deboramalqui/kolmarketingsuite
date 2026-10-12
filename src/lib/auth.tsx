import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Role = "viewer" | "editor" | "admin";
export const ROLE_LABEL: Record<Role, string> = { viewer: "Ve", editor: "Hace campañas y ve", admin: "Sincroniza, hace campañas y ve" };

interface AuthState {
  loading: boolean;
  error: string | null;
  authEnabled: boolean;
  user: { email: string; role: Role } | null;
  /** Qué puede hacer la persona (sin inicio de sesión activo, todo está abierto) */
  can: { sync: boolean; edit: boolean };
  logout: () => Promise<void>;
}

const OPEN: AuthState = { loading: true, error: null, authEnabled: false, user: null, can: { sync: false, edit: false }, logout: async () => {} };
const AuthContext = createContext<AuthState>(OPEN);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: (s: AuthState) => React.ReactNode }> = ({ children }) => {
  const [st, setSt] = useState<Omit<AuthState, "logout">>({ loading: true, error: null, authEnabled: false, user: null, can: { sync: false, edit: false } });

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`El servidor respondió ${r.status}`))))
      .then((j: { authEnabled: boolean; user: { email: string; role: Role } | null }) => {
        const role = j.user?.role;
        setSt({
          loading: false,
          error: null,
          authEnabled: j.authEnabled,
          user: j.user,
          can: { sync: role === "admin", edit: role === "admin" || role === "editor" },
        });
      })
      .catch((e) => setSt((s) => ({ ...s, loading: false, error: e instanceof Error ? e.message : "No se pudo consultar el servidor" })));
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } finally {
      location.reload();
    }
  }, []);

  const value: AuthState = { ...st, logout };
  return <AuthContext.Provider value={value}>{children(value)}</AuthContext.Provider>;
};
