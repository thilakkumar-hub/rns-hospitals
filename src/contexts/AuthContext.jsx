import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStaffProfile = async (userId) => {
    try {
      const fetchPromise = supabase
        .from('staff')
        .select('*')
        .eq('id', userId)
        .single();
        
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timed out')), 3000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!error && data) {
        setStaffProfile(data);
      } else {
        console.error('Profile fetch failed:', error);
      }
    } catch (err) {
      console.error('fetchStaffProfile timeout/error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    // Strict emergency timeout
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth check timed out. Forcing load completion.');
        setLoading(false);
      }
    }, 3000);

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (isMounted) setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchStaffProfile(session.user.id);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        if (isMounted) setLoading(false);
        clearTimeout(timeoutId);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchStaffProfile(session.user.id);
        } else {
          setStaffProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (identifier, password) => {
    // Check if identifier is an email or username
    let email = identifier;
    if (!identifier.includes('@')) {
      // It's a username — look up the email
      const { data, error } = await supabase
        .from('staff')
        .select('email')
        .eq('username', identifier)
        .single();
      if (error || !data) {
        return { error: { message: 'Username not found' } };
      }
      email = data.email;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signUp = async (email, password, metadata) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata }
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setStaffProfile(null);
  };

  const refreshProfile = async () => {
    if (user) await fetchStaffProfile(user.id);
  };

  const isAdmin = staffProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      user,
      staffProfile,
      loading,
      isAdmin,
      signIn,
      signUp,
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}
