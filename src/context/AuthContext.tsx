
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { mockUsers } from '../data/mockData';

interface AuthContextType {
  user: User | null;
  users: User[]; // Expose all users for Admin panel
  login: (userId: string) => void;
  logout: () => void;
  checkDealerAccess: () => boolean;
  approveDealer: (userId: string) => void; // Admin Action
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Manage all users in state to allow modifications (like approval)
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [user, setUser] = useState<User | null>(mockUsers[0]); 

  const login = (userId: string) => {
    const foundUser = users.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
    }
  };

  const logout = () => {
    setUser(null);
  };

  /**
   * Admin Action: Approve a pending dealer.
   * Updates the main user list and the current session if the approved user is logged in.
   */
  const approveDealer = (userId: string) => {
    setUsers(prevUsers => {
      const updatedUsers = prevUsers.map(u => 
        u.id === userId ? { ...u, is_approved: true } : u
      );
      
      // If the currently logged-in user is the one being approved, update session
      if (user && user.id === userId) {
        setUser({ ...user, is_approved: true });
      }
      
      return updatedUsers;
    });
  };

  const checkDealerAccess = (): boolean => {
    if (!user) return false;
    return user.role === UserRole.DEALER && user.is_approved;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      users,
      login, 
      logout, 
      checkDealerAccess,
      approveDealer
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
