"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { type Session } from "@supabase/supabase-js";
import {
  authStorageKeys,
  demoAccounts,
  type AccountProfile,
  isPatientRole,
  type UserRole
} from "@/lib/account-directory";
import {
  getSupabaseBrowserClient,
  getSupabaseAuthHeaders,
  isSupabaseBrowserConfigured,
  isSupabaseRequiredInBrowser
} from "@/lib/supabase-browser";

type SignInInput = {
  email: string;
  password: string;
};

type SignUpInput = {
  name: string;
  email: string;
  password: string;
  practiceId: string;
  role: UserRole;
  title: string;
  phone: string;
  bio: string;
  avatarDataUrl?: string;
};

type ProfileUpdateInput = Partial<
  Pick<AccountProfile, "name" | "title" | "phone" | "bio" | "avatarDataUrl" | "avatarColor">
>;

type AuthResult = Promise<{ ok: boolean; message: string; redirectTo?: string }>;

type AuthContextValue = {
  currentUser: AccountProfile | null;
  accounts: AccountProfile[];
  isReady: boolean;
  authMode: "supabase" | "local" | "unconfigured";
  signIn: (input: SignInInput) => AuthResult;
  signUp: (input: SignUpInput) => AuthResult;
  signOut: () => Promise<void>;
  updateProfile: (input: ProfileUpdateInput) => AuthResult;
};

const AuthContext = createContext<AuthContextValue | null>(null);
type AuthMode = AuthContextValue["authMode"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const authMode: AuthMode = isSupabaseBrowserConfigured()
    ? "supabase"
    : isSupabaseRequiredInBrowser()
      ? "unconfigured"
      : "local";
  const [accounts, setAccounts] = useState<AccountProfile[]>(readStoredAccounts);
  const [currentUser, setCurrentUser] = useState<AccountProfile | null>(() =>
    authMode === "local" ? readInitialLocalCurrentUser() : null
  );
  const [isReady, setIsReady] = useState(authMode === "local" || authMode === "unconfigured");

  useEffect(() => {
    if (authMode !== "supabase") {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    let mounted = true;

    async function hydrateFromSession(session: Session | null) {
      if (!mounted) {
        return;
      }

      if (!session?.user) {
        setCurrentUser(null);
        setIsReady(true);
        return;
      }

      const profile = await fetchServerProfile({
        authUserId: session.user.id,
        email: session.user.email || undefined
      });

      if (!mounted) {
        return;
      }

      setCurrentUser(profile);
      if (profile) {
        setAccounts((current) => mergeProfiles(current, profile));
      }
      setIsReady(true);
    }

    void supabase.auth.getSession().then(({ data }) => hydrateFromSession(data.session));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrateFromSession(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [authMode]);

  useEffect(() => {
    if (authMode !== "local") {
      return;
    }

    window.localStorage.setItem(authStorageKeys.profiles, JSON.stringify(accounts));
  }, [accounts, authMode]);

  useEffect(() => {
    if (authMode !== "local") {
      return;
    }

    if (currentUser?.id) {
      window.localStorage.setItem(authStorageKeys.sessionUserId, currentUser.id);
    } else {
      window.localStorage.removeItem(authStorageKeys.sessionUserId);
    }
  }, [currentUser, authMode]);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser,
      accounts,
      isReady,
      authMode,
      async signIn(input) {
        if (authMode === "unconfigured") {
          return {
            ok: false,
            message:
              "Production auth is not configured yet. Add the Supabase environment variables in Vercel before pilot use."
          };
        }

        if (authMode === "local") {
          const match = accounts.find(
            (account) =>
              account.email.toLowerCase() === input.email.trim().toLowerCase() &&
              account.password === input.password
          );

          if (!match) {
            return {
              ok: false,
              message: "We could not find a ClearPath account with that email and password."
            };
          }

          setCurrentUser(match);
          return {
            ok: true,
            message: `Signed in as ${match.name}.`,
            redirectTo: isPatientRole(match.role) ? "/patient" : "/"
          };
        }

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          return { ok: false, message: "Supabase auth is not configured yet." };
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: input.email.trim(),
          password: input.password
        });

        if (error || !data.user) {
          return {
            ok: false,
            message: error?.message || "Unable to sign in with Supabase."
          };
        }

        const profile = await fetchServerProfile({
          authUserId: data.user.id,
          email: data.user.email || input.email.trim()
        });

        if (!profile) {
          return {
            ok: false,
            message:
              "Supabase sign-in worked, but no office profile exists for this user yet."
          };
        }

        setCurrentUser(profile);
        setAccounts((current) => mergeProfiles(current, profile));
        return {
          ok: true,
          message: `Signed in as ${profile.name}.`,
          redirectTo: isPatientRole(profile.role) ? "/patient" : "/"
        };
      },
      async signUp(input) {
        if (authMode === "unconfigured") {
          return {
            ok: false,
            message:
              "Production auth is not configured yet. Add the Supabase environment variables in Vercel before creating accounts."
          };
        }

        if (authMode === "local") {
          const existing = accounts.find(
            (account) => account.email.toLowerCase() === input.email.trim().toLowerCase()
          );

          if (existing) {
            return { ok: false, message: "That email is already being used by a ClearPath account." };
          }

          const newAccount: AccountProfile = {
            id: `acct-${crypto.randomUUID()}`,
            practiceId: input.practiceId,
            name: input.name.trim(),
            email: input.email.trim(),
            password: input.password,
            role: input.role,
            title: input.title.trim() || (isPatientRole(input.role) ? "Patient" : "Office team member"),
            phone: input.phone.trim(),
            bio: input.bio.trim(),
            avatarColor: pickAvatarColor(input.name),
            avatarDataUrl: input.avatarDataUrl
          };

          setAccounts((current) => [...current, newAccount]);
          setCurrentUser(newAccount);
          return {
            ok: true,
            message: isPatientRole(input.role)
              ? "Your patient account has been created."
              : "Your office account has been created.",
            redirectTo: isPatientRole(input.role) ? "/vault" : "/profile"
          };
        }

        const supabase = getSupabaseBrowserClient();
        if (!supabase) {
          return { ok: false, message: "Supabase auth is not configured yet." };
        }

        const { data, error } = await supabase.auth.signUp({
          email: input.email.trim(),
          password: input.password
        });

        if (error || !data.user) {
          return {
            ok: false,
            message: error?.message || "Unable to create the Supabase account."
          };
        }

        const profileResult = await saveServerProfile({
          authUserId: data.user.id,
          practiceId: input.practiceId,
          name: input.name.trim(),
          email: input.email.trim(),
          role: input.role,
          title: input.title.trim() || (isPatientRole(input.role) ? "Patient" : "Office team member"),
          phone: input.phone.trim(),
          bio: input.bio.trim(),
          avatarColor: pickAvatarColor(input.name),
          avatarDataUrl: input.avatarDataUrl
        });

        if (!profileResult.profile) {
          return {
            ok: false,
            message:
              profileResult.message || "Supabase auth user was created, but office profile save failed."
          };
        }

        setCurrentUser(profileResult.profile);
        setAccounts((current) => mergeProfiles(current, profileResult.profile!));
        return {
          ok: true,
          message: isPatientRole(profileResult.profile.role)
            ? "Your patient account has been created."
            : "Your office account has been created in Supabase.",
          redirectTo: isPatientRole(profileResult.profile.role) ? "/vault" : "/profile"
        };
      },
      async signOut() {
        if (authMode === "unconfigured") {
          setCurrentUser(null);
          return;
        }

        if (authMode === "local") {
          setCurrentUser(null);
          return;
        }

        const supabase = getSupabaseBrowserClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
        setCurrentUser(null);
      },
      async updateProfile(input) {
        if (authMode === "unconfigured") {
          return {
            ok: false,
            message:
              "Production auth is not configured yet. Profile updates are disabled until Supabase is connected."
          };
        }

        if (!currentUser) {
          return { ok: false, message: "There is no signed-in profile to update." };
        }

        const nextProfile: AccountProfile = {
          ...currentUser,
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.title !== undefined ? { title: input.title.trim() } : {}),
          ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
          ...(input.bio !== undefined ? { bio: input.bio.trim() } : {}),
          ...(input.avatarDataUrl !== undefined ? { avatarDataUrl: input.avatarDataUrl } : {}),
          ...(input.avatarColor !== undefined ? { avatarColor: input.avatarColor } : {})
        };

        if (authMode === "local") {
          setAccounts((current) => mergeProfiles(current, nextProfile));
          setCurrentUser(nextProfile);
          return { ok: true, message: "Profile updated." };
        }

        const supabase = getSupabaseBrowserClient();
        const session = supabase ? (await supabase.auth.getSession()).data.session : null;
        if (!session?.user) {
          return { ok: false, message: "Supabase session was not found." };
        }

        const profileResult = await saveServerProfile({
          authUserId: session.user.id,
          practiceId: nextProfile.practiceId,
          name: nextProfile.name,
          email: nextProfile.email,
          role: nextProfile.role,
          title: nextProfile.title,
          phone: nextProfile.phone,
          bio: nextProfile.bio,
          avatarColor: nextProfile.avatarColor,
          avatarDataUrl: nextProfile.avatarDataUrl
        });

        if (!profileResult.profile) {
          return {
            ok: false,
            message: profileResult.message || "Unable to save the Supabase office profile."
          };
        }

        setCurrentUser(profileResult.profile);
        setAccounts((current) => mergeProfiles(current, profileResult.profile!));
        return { ok: true, message: "Profile updated in Supabase." };
      }
    }),
    [accounts, authMode, currentUser, isReady]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

function pickAvatarColor(name: string) {
  const palette = ["#0f766e", "#2563eb", "#9333ea", "#d97706", "#be123c", "#0f766e"];
  const index = Math.abs(
    name.split("").reduce((sum, character) => sum + character.charCodeAt(0), 0)
  ) % palette.length;

  return palette[index];
}

function readStoredAccounts() {
  if (typeof window === "undefined") {
    return demoAccounts;
  }

  const storedProfiles = window.localStorage.getItem(authStorageKeys.profiles);
  if (!storedProfiles) {
    return demoAccounts;
  }

  try {
    const parsed = JSON.parse(storedProfiles) as AccountProfile[];
    return mergeAccountLists(demoAccounts, parsed);
  } catch {
    return demoAccounts;
  }
}

function readStoredSessionUserId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(authStorageKeys.sessionUserId);
}

function readInitialLocalCurrentUser() {
  const accounts = readStoredAccounts();
  const storedSessionUserId = readStoredSessionUserId();
  return accounts.find((account) => account.id === storedSessionUserId) ?? null;
}

function mergeProfiles(accounts: AccountProfile[], nextProfile: AccountProfile) {
  const withoutExisting = accounts.filter((account) => account.id !== nextProfile.id);
  return [...withoutExisting, nextProfile];
}

function mergeAccountLists(baseAccounts: AccountProfile[], storedAccounts: AccountProfile[]) {
  const byId = new Map<string, AccountProfile>();

  for (const account of baseAccounts) {
    byId.set(account.id, account);
  }

  for (const account of storedAccounts) {
    byId.set(account.id, account);
  }

  return Array.from(byId.values());
}

async function fetchServerProfile(input: { authUserId?: string; email?: string }) {
  const params = new URLSearchParams();
  if (input.authUserId) {
    params.set("authUserId", input.authUserId);
  }
  if (input.email) {
    params.set("email", input.email);
  }

  const headers = await getSupabaseAuthHeaders();
  const response = await fetch(`/api/account-profiles?${params.toString()}`, { headers });
  const data = (await response.json()) as {
    profile?: AccountProfile | null;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(data.error || "Unable to load the office profile.");
  }
  return data.profile ?? null;
}

async function saveServerProfile(input: {
  authUserId: string;
  practiceId: string;
  name: string;
  email: string;
  role: AccountProfile["role"];
  title: string;
  phone: string;
  bio: string;
  avatarColor: string;
  avatarDataUrl?: string;
}) {
  const headers = await getSupabaseAuthHeaders();
  const response = await fetch("/api/account-profiles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(input)
  });

  const data = (await response.json()) as {
    mode?: "supabase" | "mock";
    message?: string;
    profile?: AccountProfile | null;
    error?: string;
  };

  if (!response.ok) {
    return {
      profile: null,
      message: data.error || "Unable to save the office profile."
    };
  }

  return {
    profile: data.profile ?? null,
    message: data.message || ""
  };
}
