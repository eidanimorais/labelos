import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Library, PieChart, Upload, Music, Users, FileText, Hash, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Sidebar() {
    return (
        <aside className="hidden md:flex w-64 flex-col bg-card-light dark:bg-card-dark border-r border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="p-6 flex items-center gap-3">
                <div className="bg-primary h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <Library className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">LabelOS</h1>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                <NavLink
                    to="/"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <LayoutDashboard className="h-5 w-5" />
                    Dashboard
                </NavLink>

                <NavLink
                    to="/isrc"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Library className="h-5 w-5" />
                    ISRC
                </NavLink>

                <NavLink
                    to="/songs"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Music className="h-5 w-5" />
                    Músicas
                </NavLink>

                <NavLink
                    to="/works"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Hash className="h-5 w-5" />
                    Obras
                </NavLink>

                <NavLink
                    to="/splits"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <PieChart className="h-5 w-5" />
                    Splits
                </NavLink>

                <NavLink
                    to="/contracts"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <FileText className="h-5 w-5" />
                    Contratos
                </NavLink>

                <NavLink
                    to="/import"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Upload className="h-5 w-5" />
                    Gestão de Extratos
                </NavLink>
                <NavLink
                    to="/profiles"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Users className="h-5 w-5" />
                    Perfil
                </NavLink>

                <NavLink
                    to="/monitor"
                    className={({ isActive }) => cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold",
                        isActive
                            ? "bg-primary/10 text-primary"
                            : "text-text-muted-light dark:text-text-muted-dark hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                >
                    <Activity className="h-5 w-5" />
                    Monitoramento
                </NavLink>
            </nav>

            <div className="p-4 mt-auto">
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-16 h-16 rounded-full blur-xl"></div>
                    <p className="text-xs font-medium text-gray-300 mb-1">Local Mode</p>
                    <p className="text-sm font-semibold mb-3">LabelOS</p>
                </div>
            </div>
        </aside>
    );
}
