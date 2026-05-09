import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStaffProfile = async (userId) => {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error && data) {
      setStaffProfile(data);
    }
  };

  useEffect(() => {
    // Emergency timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('Auth check timed out after 5 seconds. Forcing load completion.');
        setLoading(false);
      }
    }, 5000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchStaffProfile(session.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.error('Unhandled exception in getSession:', err);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchStaffProfile(session.user.id);
          } else {
            setStaffProfile(null);
          }
        } catch (err) {
          console.error('Error in onAuthStateChange:', err);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => {
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
