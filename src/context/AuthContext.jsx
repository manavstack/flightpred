import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, login as apiLogin, register as apiRegister, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => getCurrentUser());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const authenticated = isAuthenticated();

    async function login(email, password) {
        setLoading(true);
        setError(null);
        try {
            const data = await apiLogin(email, password);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    async function register(name, email, password) {
        setLoading(true);
        setError(null);
        try {
            const data = await apiRegister(name, email, password);
            setUser(data.user);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }

    function logout() {
        apiLogout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, authenticated, loading, error, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
