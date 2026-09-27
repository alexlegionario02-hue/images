import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  getUserProfile,
  saveUserProfile,
  UserProfileData,
} from '../firebase';
import { GameMode } from '../game/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfileData | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncCloudSave: (data: {
    currentLevel: number;
    currentMode: GameMode;
    completedLevels: string[];
    soundEnabled: boolean;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfileData | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userProf = await getUserProfile(currentUser.uid);
          if (userProf) {
            setProfile(userProf);
          } else {
            // Create initial profile
            const newProf: UserProfileData = {
              id: currentUser.uid,
              displayName: currentUser.displayName || 'Armonista',
              currentLevel: 1,
              currentMode: 'challenging',
              soundEnabled: true,
              completedLevels: [],
              totalSolved: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await saveUserProfile(newProf);
            setProfile(newProf);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    try {
      const u = await loginWithGoogle();
      if (u) {
        const userProf = await getUserProfile(u.uid);
        if (userProf) {
          setProfile(userProf);
        }
      }
    } catch (err) {
      console.error('Google Sign In failed:', err);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await logoutUser();
      setProfile(null);
    } catch (err) {
      console.error('Sign Out failed:', err);
    }
  }, []);

  const syncCloudSave = useCallback(
    async (data: {
      currentLevel: number;
      currentMode: GameMode;
      completedLevels: string[];
      soundEnabled: boolean;
    }) => {
      if (!user) return;

      try {
        const updated: UserProfileData = {
          id: user.uid,
          displayName: user.displayName || 'Armonista',
          currentLevel: data.currentLevel,
          currentMode: data.currentMode,
          soundEnabled: data.soundEnabled,
          completedLevels: Array.from(new Set(data.completedLevels)).slice(0, 500),
          totalSolved: data.completedLevels.length,
          createdAt: profile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveUserProfile(updated);
        setProfile(updated);
      } catch (err) {
        console.error('Cloud save failed:', err);
      }
    },
    [user, profile]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profile,
        signIn,
        signOut: handleSignOut,
        syncCloudSave,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
