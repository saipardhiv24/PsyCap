import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { setAuthToken } from "../utils/api.js";
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const currentSession = supabase.auth.getSession();
    currentSession.then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user || null);
      if (data.session?.access_token) {
        setAuthToken(data.session.access_token);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setSession(session || null);
        setAuthToken(session?.access_token || null);
        if (event === "SIGNED_OUT") {
          navigate("/login");
        }
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  async function signUp(email, password, username) {
    try {
      const { data, error } = await supabase.auth.signUp(
        { email, password },
        { data: { username } },
      );
      if (error) throw error;
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch" || err.status === 0) {
        throw new Error(
          "Unable to connect to Supabase Auth service. Please check VITE_SUPABASE_URL in your .env file or your network connection.",
        );
      }
      throw err;
    }
  }

  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setUser(data.user);
      setSession(data.session);
      return data;
    } catch (err) {
      if (err.message === "Failed to fetch" || err.status === 0) {
        throw new Error(
          "Unable to connect to Supabase Auth service. Please check VITE_SUPABASE_URL in your .env file or your network connection.",
        );
      }
      throw err;
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setAuthToken(null);
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
