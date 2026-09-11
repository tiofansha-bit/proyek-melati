import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";

import { ADMIN_PIN_KEY } from "@/src/api";
import { storage } from "@/src/utils/storage";

export type Role = "employee" | "admin";

export type Session = {
  role: Role;
  employeeId?: string;
  employeeName?: string;
  avatarUrl?: string | null;
};

type AuthContextValue = {
  session: Session | null;
  ready: boolean;
  signInEmployee: (employeeId: string, name: string, avatarUrl?: string | null) => Promise<void>;
  signInAdmin: (pin: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SESSION_KEY = "session_v1";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await storage.getItem<Session | null>(SESSION_KEY, null);
      setSession(stored ?? null);
      setReady(true);
    })();
  }, []);

  const signInEmployee = async (employeeId: string, name: string, avatarUrl?: string | null) => {
    const s: Session = { role: "employee", employeeId, employeeName: name, avatarUrl };
    await storage.setItem(SESSION_KEY, s);
    setSession(s);
  };

  const signInAdmin = async (pin: string) => {
    await storage.secureSet(ADMIN_PIN_KEY, pin);
    const s: Session = { role: "admin" };
    await storage.setItem(SESSION_KEY, s);
    setSession(s);
  };

  const signOut = async () => {
    await storage.removeItem(SESSION_KEY);
    await storage.secureRemove(ADMIN_PIN_KEY);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ session, ready, signInEmployee, signInAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
