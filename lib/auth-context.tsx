import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { endBlockActivity } from "@/lib/liveActivity";
import { supabase } from "./supabase";
import { Profile } from "./types";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  /** The profile couldn't be loaded, so we don't know the onboarding state. */
  profileError: boolean;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Signed in without an account yet (start first, save later). */
  isAnonymous: boolean;
  /** Starts a guest session so onboarding can begin before any account. */
  startAnonymous: () => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** How long to wait for the profile before showing the retry screen. */
const PROFILE_TIMEOUT_MS = 10000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .abortSignal(controller.signal)
        .single();

      if (data && !error) {
        setProfile(data as Profile);
        setProfileError(false);
      } else if (error && error.code === "PGRST116") {
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({ id: userId, onboarding_complete: false })
          .select()
          .single();
        if (newProfile && !insertError) {
          setProfile(newProfile as Profile);
          setProfileError(false);
        } else {
          setProfileError(true);
        }
      } else {
        setProfileError(true);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
      setProfileError(true);
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user) {
        fetchProfile(s.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setIsLoading(true);
        fetchProfile(s.user.id).finally(() => setIsLoading(false));
      } else {
        setProfile(null);
        endBlockActivity();
        setProfileError(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error?.message || null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message || null };
  };

  const startAnonymous = async () => {
    const { error } = await supabase.auth.signInAnonymously();
    return { error: error?.message || null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        profileError,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        isAnonymous: !!session?.user?.is_anonymous,
        startAnonymous,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
