import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ModernProfileForm } from '../components/ModernProfileForm';

interface Profile {
    id: number;
    name: string;
    type: string;
    photo_url: string | null;
    active: boolean;
}

export function Profiles() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfileId, setEditingProfileId] = useState<number | null>(null);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const res = await api.get('/profiles/');
            setProfiles(res.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const openEdit = (profile: Profile) => {
        setEditingProfileId(profile.id);
        setIsModalOpen(true);
    };

    const openNew = () => {
        setEditingProfileId(null);
        setIsModalOpen(true);
    };

    const handleSave = () => {
        fetchProfiles();
        setIsModalOpen(false);
    };

    const filteredProfiles = profiles.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesType = filterType === '' || p.type === filterType;
        return matchesSearch && matchesType;
    });

    if (loading) return <div className="h-full flex items-center justify-center text-slate-400">Carregando perfis...</div>;

    return (
        <div className="max-w-[1600px] mx-auto p-6 md:p-10 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                        <span className="material-symbols-rounded text-primary text-5xl">group</span>
                        Perfis e Beneficiários
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg font-medium">Gerencie artistas, produtores e selos em um só lugar.</p>
                </div>
                <button
                    onClick={openNew}
                    className="bg-primary hover:bg-primary-hover text-white px-8 py-4 rounded-[24px] font-bold flex items-center gap-3 shadow-xl shadow-primary/20 transition-all transform hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-rounded">add</span>
                    Novo Perfil
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-10">
                <div className="relative flex-1 group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-rounded text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border-none rounded-[20px] pl-14 pr-6 py-4 shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-sm font-medium"
                    />
                </div>
                <div className="flex gap-2">
                    {['', 'artist', 'producer', 'label'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-6 py-4 rounded-[20px] font-bold text-sm transition-all shadow-sm ${filterType === type ? 'bg-primary text-white shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                        >
                            {type === '' ? 'Todos' : type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
                {filteredProfiles.map(profile => (
                    <div
                        key={profile.id}
                        onClick={() => openEdit(profile)}
                        className="bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group relative cursor-pointer border border-slate-100 dark:border-slate-800/50"
                    >
                        <div className="absolute top-6 right-6 text-slate-300 group-hover:text-primary transition-colors">
                            <span className="material-symbols-rounded text-2xl">edit_note</span>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 rounded-[30px] overflow-hidden mb-6 shadow-xl border-4 border-white dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                                {profile.photo_url ? (
                                    <img src={profile.photo_url} alt={profile.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                        <span className="material-symbols-rounded text-4xl">person</span>
                                    </div>
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{profile.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] mb-4 bg-primary/5 px-3 py-1 rounded-full">{profile.type}</p>

                            <div className="w-full pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-center">
                                <span className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${profile.active ? 'text-green-500' : 'text-slate-400'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${profile.active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`}></span>
                                    {profile.active ? 'Online' : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Full-Screen Modern Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-background-light dark:bg-background-dark animate-in slide-in-from-bottom-8 duration-500">
                        <ModernProfileForm
                            initialProfileId={editingProfileId}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSave}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
