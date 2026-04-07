import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a051e] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
