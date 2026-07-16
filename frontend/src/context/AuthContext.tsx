import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockDb, UserProfile } from '../services/mockDb';

interface AuthContextType {
  user: UserProfile | null;
  login: (username: string, password?: string, role?: 'customer' | 'admin') => Promise<UserProfile>;
  register: (username: string, name: string, password?: string) => Promise<UserProfile>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load from local storage on init
    const storedUser = localStorage.getItem('ss_current_user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as UserProfile;
      // Refresh user details from DB to reflect suspended status
      const dbUsers = mockDb.getUsers();
      const currentDbUser = dbUsers.find(u => u.id === parsed.id);
      if (currentDbUser) {
        if (currentDbUser.status === 'suspended') {
          setUser(null);
          localStorage.removeItem('ss_current_user');
        } else {
          setUser(currentDbUser);
        }
      } else {
        setUser(parsed);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password?: string, role: 'customer' | 'admin' = 'customer'): Promise<UserProfile> => {
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = mockDb.getUsers();
        const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

        if (!foundUser || foundUser.password !== password) {
          setError('Invalid username or password.');
          reject(new Error('Invalid credentials.'));
          return;
        }

        if (foundUser.status === 'suspended') {
          setError('Your account has been suspended by the administrator.');
          reject(new Error('Account suspended.'));
          return;
        }

        const isRoleMatch = 
          (role === 'customer' && foundUser.role === 'customer') ||
          (role === 'admin' && (foundUser.role === 'primary_admin' || foundUser.role === 'secondary_admin'));

        if (!isRoleMatch) {
          setError(`User does not have ${role} privileges.`);
          reject(new Error('Unauthorized role.'));
          return;
        }

        setUser(foundUser);
        localStorage.setItem('ss_current_user', JSON.stringify(foundUser));
        resolve(foundUser);
      }, 500);
    });
  };

  const register = async (username: string, name: string, password?: string): Promise<UserProfile> => {
    setError(null);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = mockDb.getUsers();
        const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase());

        if (exists) {
          setError('Username already registered.');
          reject(new Error('Username exists.'));
          return;
        }

        const newUser = mockDb.addUser(username, name, 'customer', password);
        setUser(newUser);
        localStorage.setItem('ss_current_user', JSON.stringify(newUser));
        resolve(newUser);
      }, 500);
    });
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('ss_current_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, error }}>
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
