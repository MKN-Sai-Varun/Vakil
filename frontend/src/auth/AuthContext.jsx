import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('vakil_token');
    if (!token) {
      setChecking(false);
      return;
    }
    getMe(token)
      .then((data) => {
        console.log('[auth] getMe succeeded:', data);
        setUser(data);
      })
      .catch((err) => {
        console.error('[auth] getMe failed:', err.response?.status, err.response?.data);
        localStorage.removeItem('vakil_token');
        localStorage.removeItem('vakil_user');
        setUser(null);
      })
      .finally(() => setChecking(false));
  }, []);

function loginUser(token, userData) {
    console.log('[auth] loginUser called with:', userData);
    localStorage.setItem('vakil_token', token);
    localStorage.setItem('vakil_user', JSON.stringify(userData));
    setUser(userData);
    console.log('[auth] localStorage after set:', localStorage.getItem('vakil_token'));
  }

  function logoutUser() {
    localStorage.removeItem('vakil_token');
    localStorage.removeItem('vakil_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, checking, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}