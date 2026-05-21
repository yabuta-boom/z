import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  signUp: (email: string, pass: string, name: string, phoneNumber: string, role: 'renter' | 'host') => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  demoSignIn: (email: string, pass: string) => Promise<void>;
  updateVerification: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_KEY = 'zoe_demo_session';
const USERS_KEY = 'zoe_registered_users';

interface StoredUser {
  email: string;
  password: string;
  profile: UserProfile;
}

function getStoredUsers(): StoredUser[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch { return []; }
}

function saveUser(user: StoredUser) {
  const users = getStoredUsers().filter(u => u.email !== user.email);
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem(DEMO_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setProfile(parsed.profile);
        setUser({
          uid: parsed.profile.id,
          email: parsed.profile.email,
          displayName: parsed.profile.name,
          photoURL: null,
          emailVerified: true,
        });
      } catch {
        localStorage.removeItem(DEMO_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async () => {
    throw new Error('Google login is disabled in demo mode. Use email/password or demo credentials.');
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_KEY);
    setUser(null);
    setProfile(null);
  };

  const signUp = async (email: string, pass: string, name: string, phoneNumber: string, role: 'renter' | 'host') => {
    const existing = getStoredUsers().find(u => u.email === email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }
    const uid = 'user-' + Date.now();
    const newProfile: UserProfile = {
      id: uid,
      name,
      email,
      phoneNumber,
      role,
      verificationStatus: 'unverified',
      phoneVerified: false,
      createdAt: new Date().toISOString(),
    };
    saveUser({ email, password: pass, profile: newProfile });
    localStorage.setItem(DEMO_KEY, JSON.stringify({ email, role, profile: newProfile }));
    setUser({ uid, email, displayName: name, photoURL: null, emailVerified: true });
    setProfile(newProfile);
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email);
    if (!found) {
      throw new Error('No account found with this email.');
    }
    if (found.password !== pass) {
      throw new Error('Incorrect password.');
    }
    localStorage.setItem(DEMO_KEY, JSON.stringify({ email, role: found.profile.role, profile: found.profile }));
    setUser({ uid: found.profile.id, email, displayName: found.profile.name, photoURL: null, emailVerified: true });
    setProfile(found.profile);
  };

  const demoSignIn = async (email: string, pass: string) => {
    if (email !== 'yeabseramekbeb@gmail.com') {
      throw new Error('Invalid demo email');
    }
    const isRenter = pass === '#1renter';
    const isHost = pass === '#1Host';
    if (!isRenter && !isHost) {
      throw new Error('Invalid demo password');
    }
    const role = isRenter ? 'renter' : 'host';
    const uid = role === 'renter' ? 'demo-renter-id' : 'demo-host-id';
    const demoProfile: UserProfile = {
      id: uid,
      name: role === 'renter' ? 'Demo Renter' : 'Demo Host',
      email,
      role,
      phoneNumber: '+251911111111',
      verificationStatus: 'unverified',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(DEMO_KEY, JSON.stringify({ email, role, profile: demoProfile }));
    setUser({ uid, email, displayName: demoProfile.name, photoURL: null, emailVerified: true });
    setProfile(demoProfile);
  };

  const updateVerification = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);
    const stored = localStorage.getItem(DEMO_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.assign(parsed.profile, data);
      localStorage.setItem(DEMO_KEY, JSON.stringify(parsed));
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, signUp, signInWithEmail, demoSignIn, updateVerification }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
