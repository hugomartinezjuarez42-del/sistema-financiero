import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    let result = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (result.error) {
      if (result.error.message.includes('Invalid login credentials')) {
        const signUpResult = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpResult.error) {
          throw signUpResult.error;
        }

        if (signUpResult.data.user) {
          setUser(signUpResult.data.user);
          setIsAuthenticated(true);

          const { data: invitations } = await supabase
            .from('organization_invitations')
            .select('invitation_code')
            .eq('invited_email', email.toLowerCase())
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString())
            .limit(1);

          if (invitations && invitations.length > 0) {
            await supabase.rpc('accept_invitation', {
              invitation_code_param: invitations[0].invitation_code
            });
          }

          return;
        }
      }
      throw result.error;
    }

    if (result.data.user) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  }

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}
