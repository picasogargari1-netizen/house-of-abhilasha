import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata: { first_name: string; last_name: string; address?: string; contact_no?: string }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    metadata: { first_name: string; last_name: string; address?: string; contact_no?: string }
  ) => {
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("signup", {
        body: {
          email,
          password,
          firstName: metadata.first_name,
          lastName: metadata.last_name,
          address: metadata.address,
          contactNo: metadata.contact_no,
        },
      });

      if (fnError) {
        return { error: { message: fnError.message || "Failed to create account" } };
      }

      if (fnData?.error) {
        return { error: { message: fnData.error } };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      return { error: signInError };
    } catch (err: any) {
      return { error: { message: err.message || "An unexpected error occurred" } };
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { data, error: fnError } = await supabase.functions.invoke("send-password-reset-email", {
      body: { email: email.trim().toLowerCase() },
    });
    if (fnError) return { error: fnError };
    if (data?.error) return { error: new Error(data.error) };
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
