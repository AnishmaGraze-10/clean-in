import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/axios.js';
import socket from '../socket.js';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasJoined = useRef(false);
  const hasInitialized = useRef(false);

  // Load token from localStorage and fetch fresh user data on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initAuth = async () => {
      const stored = localStorage.getItem('cleanin_auth');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.token) {
            setToken(parsed.token);
            // Fetch fresh user data from backend
            const res = await api.get('/auth/me');
            setUser(res.data);
          }
        } catch (err) {
          // Token invalid or expired
          localStorage.removeItem('cleanin_auth');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Socket connection management
  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      if (socket.connected) {
        socket.disconnect();
        hasJoined.current = false;
      }
      return;
    }

    // Connect socket if not already connected
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      if (!hasJoined.current) {
        socket.emit('join', userId);
        hasJoined.current = true;
        console.log('Socket joined room for user:', userId);
      }
    };

    const handleDisconnect = () => {
      hasJoined.current = false;
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Listen for notifications
    const handleNotification = (data) => {
      if (data.type === 'report_verified') {
        toast.success(data.message, { icon: '🎉', autoClose: 5000 });
      } else {
        toast.info(data.message);
      }
    };

    socket.on('notification', handleNotification);

    // If already connected, join immediately
    if (socket.connected && !hasJoined.current) {
      handleConnect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification', handleNotification);
    };
  }, [user?.id]);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    // Only store token in localStorage, not user data
    localStorage.setItem(
      'cleanin_auth',
      JSON.stringify({ token: userToken })
    );
  };

  const logout = () => {
    if (socket.connected) {
      socket.disconnect();
    }
    hasJoined.current = false;
    setUser(null);
    setToken(null);
    localStorage.removeItem('cleanin_auth');
  };

  // Function to refresh user data
  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      return res.data;
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
      }
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

