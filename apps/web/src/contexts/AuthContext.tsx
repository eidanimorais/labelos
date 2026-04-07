import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';

interface User {
    id: number;
    name: string;
    full_name: string;
    type: string;
    is_admin: 'admin' | 'artist';
    photo_url?: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            loadUser();
        } else {
            localStorage.removeItem('token');
            setUser(null);
            setIsLoading(false);
        }
    }, [token]);

    const loadUser = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (e) {
            console.error('Failed to load user', e);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string) => {
        setToken(newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
