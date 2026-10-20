import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const user = {
    id: 1,
    name: 'MD'
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token: 'md_direct_token',
        loading: false,
        refreshUser: () => {}
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
