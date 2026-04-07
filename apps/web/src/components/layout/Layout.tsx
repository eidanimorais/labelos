import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export function Layout() {
    const location = useLocation();
    const isBulkPage = location.pathname === '/bulk';

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark">
            <Navbar />
            <main className={`flex-1 overflow-y-auto relative scroll-smooth ${isBulkPage ? 'p-4' : 'p-8'}`}>
                <div className={`${isBulkPage ? 'w-full px-4' : 'max-w-7xl mx-auto w-full'}`}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
