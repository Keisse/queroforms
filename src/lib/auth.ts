import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}

function hasAdminRole(session: Session | null) {
  return session?.user?.app_metadata?.role === 'admin';
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  const current = data.session;
  if (!current || hasAdminRole(current)) return current;

  // App metadata de autorização pode mudar no servidor. Uma atualização da sessão
  // traz as claims atuais sem confiar em user_metadata editável pelo usuário.
  const refreshed = await supabase.auth.refreshSession();
  return refreshed.data.session ?? current;
}

export function onAuthChange(cb: (session: Session | null) => void) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}
