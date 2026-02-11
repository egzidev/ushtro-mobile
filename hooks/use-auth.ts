import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { UserRole } from '@/types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface UseAuthReturn {
  user: SupabaseUser | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isTrainer: boolean;
  isClient: boolean;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session?.user) {
          setUser(null);
          setRole(null);
          setLoading(false);
          return;
        }

        const currentUser = session.user;
        setUser(currentUser);

        let userRole: UserRole | null = (currentUser.user_metadata?.role as UserRole) || null;

        if (!userRole) {
          const { data: trainer } = await supabase
            .from('trainers')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (trainer) {
            userRole = 'trainer';
          } else {
            const { data: client } = await supabase
              .from('clients')
              .select('id')
              .eq('user_id', currentUser.id)
              .maybeSingle();

            if (client) {
              userRole = 'client';
            }
          }
        }

        setRole(userRole);
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      let userRole: UserRole | null = (currentUser.user_metadata?.role as UserRole) || null;

      if (!userRole && currentUser) {
        try {
          const { data: trainer } = await supabase
            .from('trainers')
            .select('id')
            .eq('user_id', currentUser.id)
            .maybeSingle();

          if (trainer) {
            userRole = 'trainer';
          } else {
            const { data: client } = await supabase
              .from('clients')
              .select('id')
              .eq('user_id', currentUser.id)
              .maybeSingle();

            if (client) {
              userRole = 'client';
            }
          }
        } catch (error) {
          console.error('Error checking role:', error);
        }
      }

      setRole(userRole);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isTrainer: role === 'trainer',
    isClient: role === 'client',
  };
}
