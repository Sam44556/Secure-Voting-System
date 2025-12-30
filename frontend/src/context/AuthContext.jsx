import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Persistence Check
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Session restoration failed", error);
            localStorage.clear();
        }
        setLoading(false);
    }, []);

    const login = (data) => {
        // Add a derived username if it doesn't exist to prevent UI crashes
        const userData = {
            ...data.user,
            username: data.user.email.split('@')[0]
        };

        setUser(userData);
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('user', JSON.stringify(userData));
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
    };

    const register = async (data) => {
        return api.post('/auth/register', data);
    };

    const logout = () => {
        setUser(null);
        localStorage.clear();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
