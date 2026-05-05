import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './lib/api';

interface User {
  id: number;
  name: string;
  username: string;
  avatar: string;
}

interface AuthContextType {
  currentUser: User | null;
  accounts: User[];
  login: (userData: User) => void;
  logout: (userId: number) => void;
  switchAccount: (userId: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedAccounts = localStorage.getItem('twitter_clone_accounts');
    const savedActiveId = localStorage.getItem('twitter_clone_active_id');

    if (savedAccounts) {
      const parsed = JSON.parse(savedAccounts);
      setAccounts(parsed);
      if (savedActiveId) {
        const active = parsed.find((a: User) => a.id === parseInt(savedActiveId));
        if (active) setCurrentUser(active);
      } else if (parsed.length > 0) {
        setCurrentUser(parsed[0]);
      }
    } else {
        // Fallback to default user for first-time session
        apiFetch('/api/me').then(res => res.json()).then(user => {
            if (user && user.id) {
                const defaultUser = { id: user.id, name: user.name, username: user.username, avatar: user.avatar };
                setAccounts([defaultUser]);
                setCurrentUser(defaultUser);
                localStorage.setItem('twitter_clone_accounts', JSON.stringify([defaultUser]));
                localStorage.setItem('twitter_clone_active_id', String(user.id));
            }
        }).catch(() => {});
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User) => {
    const existing = accounts.find(a => a.id === userData.id);
    let newAccounts = accounts;
    if (!existing) {
      newAccounts = [...accounts, userData];
      setAccounts(newAccounts);
    }
    setCurrentUser(userData);
    localStorage.setItem('twitter_clone_accounts', JSON.stringify(newAccounts));
    localStorage.setItem('twitter_clone_active_id', String(userData.id));
  };

  const logout = (userId: number) => {
    const newAccounts = accounts.filter(a => a.id !== userId);
    setAccounts(newAccounts);
    localStorage.setItem('twitter_clone_accounts', JSON.stringify(newAccounts));
    
    if (currentUser?.id === userId) {
      if (newAccounts.length > 0) {
        setCurrentUser(newAccounts[0]);
        localStorage.setItem('twitter_clone_active_id', String(newAccounts[0].id));
      } else {
        setCurrentUser(null);
        localStorage.removeItem('twitter_clone_active_id');
      }
    }
  };

  const switchAccount = (userId: number) => {
    const account = accounts.find(a => a.id === userId);
    if (account) {
      setCurrentUser(account);
      localStorage.setItem('twitter_clone_active_id', String(userId));
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, accounts, login, logout, switchAccount, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
