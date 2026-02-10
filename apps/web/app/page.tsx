"use client";

import { AuthIsland } from "@saltwise/ui/auth/auth-island";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <main className="flex min-h-screen items-center justify-center">
      <AuthIsland
        loading={loading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        open
        user={
          user
            ? {
                name: user.user_metadata?.full_name ?? user.email ?? "Unknown",
                email: user.email ?? "",
                avatarUrl: user.user_metadata?.avatar_url,
              }
            : null
        }
      />
    </main>
  );
}
