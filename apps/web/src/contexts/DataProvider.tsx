
import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '../lib/api';

interface DataContextType {
    dashboardStats: any;
    tracks: any[];
    loadingDashboard: boolean;
    loadingTracks: boolean;
    loadDashboard: (force?: boolean) => Promise<void>;
    loadTracks: (force?: boolean) => Promise<void>;
    refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    const [dashboardStats, setDashboardStats] = useState<any>(null);
    const [tracks, setTracks] = useState<any[]>([]);

    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [loadingTracks, setLoadingTracks] = useState(false);

    // Load Dashboard
    const loadDashboard = async (force = false) => {
        if (dashboardStats && !force) return; // Cache hit
        setLoadingDashboard(true);
        try {
            const res = await api.get('/stats/dashboard');
            setDashboardStats(res.data);
        } catch (e) {
            console.error("Failed to load dashboard", e);
        } finally {
            setLoadingDashboard(false);
        }
    };

    // Load Tracks
    const loadTracks = async (force = false) => {
        if (tracks.length > 0 && !force) return; // Cache hit
        setLoadingTracks(true);
        try {
            const res = await api.get('/tracks', { params: { limit: 2000 } }); // Fetch all for clientside Search
            setTracks(res.data);
        } catch (e) {
            console.error("Failed to load tracks", e);
        } finally {
            setLoadingTracks(false);
        }
    };

    const refreshAll = async () => {
        await Promise.all([loadDashboard(true), loadTracks(true)]);
    };

    return (
        <DataContext.Provider value={{
            dashboardStats,
            tracks,
            loadingDashboard,
            loadingTracks,
            loadDashboard,
            loadTracks,
            refreshAll
        }}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}
