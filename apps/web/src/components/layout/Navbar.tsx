import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    Library,
    PieChart,
    Music,
    FileText,
    Hash,
    ChevronDown,
    HelpCircle,
    LogOut,
} from 'lucide-react';
import { cn } from '../../lib/utils';
export function Navbar() {
    const [isRoyaltiesOpen, setIsRoyaltiesOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Auth system removed - defaulting to Admin
    const user = { name: 'Admin', is_admin: 'admin' };
    const logout = () => { console.log('Logout disabled'); };


    const navItemClasses = ({ isActive }: { isActive: boolean }) => cn(
        "px-4 py-5 text-xs font-bold tracking-widest transition-all duration-200 border-b-2 flex items-center gap-2",
        isActive
            ? "border-primary text-white"
            : "border-transparent text-gray-400 hover:text-white hover:border-gray-600"
    );

    const isAdmin = user?.is_admin === 'admin';

    return (
        <nav className="bg-[#0a051e] border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-50">
            {/* Left: Logo */}
            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="bg-primary h-8 w-8 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <Library className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-white">LabelOS</span>
                </div>

                {/* Center: Main Links */}
                <div className="hidden lg:flex items-center">
                    <NavLink to="/" className={navItemClasses}>
                        HOME
                    </NavLink>

                    <div
                        className="relative group"
                        onMouseEnter={() => setIsRoyaltiesOpen(true)}
                        onMouseLeave={() => setIsRoyaltiesOpen(false)}
                    >
                        <button className={cn(
                            "px-4 py-5 text-xs font-bold tracking-widest transition-all duration-200 border-b-2 flex items-center gap-1",
                            isRoyaltiesOpen ? "text-white" : "border-transparent text-gray-400"
                        )}>
                            ROYALTIES <ChevronDown className="h-3 w-3" />
                        </button>

                        <div className={cn(
                            "absolute top-full left-0 w-64 bg-[#1a162e] border border-white/10 rounded-b-xl shadow-2xl py-2 transition-all duration-200",
                            isRoyaltiesOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                        )}>
                            <NavLink to="/isrc" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                                <Library className="h-4 w-4" /> ISRC
                            </NavLink>
                            <NavLink to="/songs" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                                <Music className="h-4 w-4" /> MÚSICAS
                            </NavLink>
                            <NavLink to="/works" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                                <Hash className="h-4 w-4" /> OBRAS
                            </NavLink>
                            {isAdmin && (
                                <NavLink to="/splits" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                                    <PieChart className="h-4 w-4" /> SPLITS
                                </NavLink>
                            )}
                            <NavLink to="/contracts" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors">
                                <FileText className="h-4 w-4" /> CONTRATOS
                            </NavLink>
                        </div>
                    </div>

                    {isAdmin && (
                        <>
                            <NavLink to="/monitor" className={navItemClasses}>
                                INSIGHTS
                            </NavLink>

                            <NavLink to="/import" className={navItemClasses}>
                                SALES
                            </NavLink>
                        </>
                    )}

                    <NavLink to="/payments" className={navItemClasses}>
                        PAYMENTS
                    </NavLink>

                </div>

            </div>

            {/* Right: Actions/Profile */}
            <div className="flex items-center gap-4">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <HelpCircle className="h-5 w-5" />
                </button>
                <div className="h-8 w-px bg-white/10 mx-2" />

                <div
                    className="relative"
                    onMouseEnter={() => setIsUserMenuOpen(true)}
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                    <button
                        className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full border border-white/10 hover:border-white/30 transition-all bg-white/5"
                    >
                        <div className="bg-gradient-to-br from-primary to-purple-600 h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase">
                            {user?.name?.substring(0, 2) || 'UA'}
                        </div>
                        <span className="text-xs font-bold text-gray-300 group-hover:text-white">
                            {user?.name}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>

                    {/* User Dropdown */}
                    <div className={cn(
                        "absolute top-full right-0 w-48 bg-[#1a162e] border border-white/10 rounded-xl shadow-2xl py-2 mt-1 transition-all duration-200",
                        isUserMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                    )}>
                        {isAdmin && (
                            <NavLink to="/profiles" className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-gray-300 hover:text-white transition-colors text-xs font-bold">
                                PERFIS
                            </NavLink>
                        )}
                        <button
                            onClick={logout}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors text-xs font-bold"
                        >
                            <LogOut className="h-4 w-4" /> SAIR
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
