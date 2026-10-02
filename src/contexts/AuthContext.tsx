import React, { createContext, useContext, useState, useEffect } from 'react';

export type User = {
  id: string;
  email: string;
  name?: string;
  isPremium: boolean;
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock initial check
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const login = async (email: string) => {
    setIsLoading(true);
    // Mock login
    setTimeout(() => {
      setUser({ id: '1', email, isPremium: false });
      setIsLoading(false);
    }, 1000);
  };

  const logout = async () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
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
