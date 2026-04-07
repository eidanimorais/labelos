import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';

interface ModernProfileFormProps {
    initialProfileId?: number | null;
    onClose?: () => void;
    onSave?: () => void;
}

export function ModernProfileForm({ initialProfileId, onClose, onSave }: ModernProfileFormProps) {
    // Utilities
    const formatCpfCnpj = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits.length <= 11) {
            return digits
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else {
            return digits
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
    };

    // State
    const [profiles, setProfiles] = useState<any[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>(initialProfileId ? initialProfileId.toString() : "");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showBankList, setShowBankList] = useState(false);
    const [banks, setBanks] = useState<{ code: string, name: string, label: string }[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        full_name: '',
        pix: '',
        type: 'artist',
        active: true,
        photo_url: '',
        bio: '',
        cpf: '',
        email: '',
        address: '',
        neighborhood: '',
        city: '',
        state: '',
        zip_code: '',
        publisher: '',
        label_name: '',
        association: '',
        publisher_extra: '',
        bank: '',
        agency: '',
        account: '',
        spotify_url: '',
        apple_music_url: '',
        instagram_url: '',
        youtube_url: '',
        website_url: ''
    });

    // Refs for scrolling
    const basicRef = useRef<HTMLDivElement>(null);
    const socialRef = useRef<HTMLDivElement>(null);
    const financialRef = useRef<HTMLDivElement>(null);

    const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Effects
    useEffect(() => {
        fetchProfiles();
        fetchBanks();
    }, []);

    useEffect(() => {
        if (initialProfileId) {
            setSelectedProfileId(initialProfileId.toString());
        }
    }, [initialProfileId]);

    useEffect(() => {
        if (selectedProfileId && profiles.length > 0) {
            const profile = profiles.find(p => p.id === Number(selectedProfileId));
            if (profile) {
                setFormData({
                    name: profile.name || '',
                    full_name: profile.full_name || '',
                    pix: profile.pix || '',
                    type: profile.type || 'artist',
                    active: profile.active !== false,
                    photo_url: profile.photo_url || '',
                    bio: profile.bio || '',
                    cpf: profile.cpf || '',
                    email: profile.email || '',
                    address: profile.address || '',
                    neighborhood: profile.neighborhood || '',
                    city: profile.city || '',
                    state: profile.state || '',
                    zip_code: profile.zip_code || '',
                    publisher: profile.publisher || '',
                    label_name: profile.label_name || '',
                    association: profile.association || '',
                    publisher_extra: profile.publisher_extra || '',
                    bank: profile.bank || '',
                    agency: profile.agency || '',
                    account: profile.account || '',
                    spotify_url: profile.spotify_url || '',
                    apple_music_url: profile.apple_music_url || '',
                    instagram_url: profile.instagram_url || '',
                    youtube_url: profile.youtube_url || '',
                    website_url: profile.website_url || ''
                });
            }
        } else if (!selectedProfileId && !loading) {
            setFormData({
                name: '', full_name: '', pix: '', type: 'artist', active: true, photo_url: '', bio: '',
                cpf: '', email: '', address: '', neighborhood: '', city: '', state: '', zip_code: '', publisher: '',
                label_name: '', association: '', publisher_extra: '',
                bank: '', agency: '', account: '', spotify_url: '', apple_music_url: '', instagram_url: '', youtube_url: '', website_url: ''
            });
        }
    }, [selectedProfileId, profiles, loading]);

    // Data Fetching
    const fetchBanks = async () => {
        try {
            const res = await api.get('/resources/banks');
            setBanks(res.data);
        } catch (error) {
            console.error("Failed to fetch banks", error);
        }
    };

    const fetchProfiles = async () => {
        try {
            const res = await api.get('/profiles/');
            setProfiles(res.data);
            if (res.data.length > 0 && !selectedProfileId && !initialProfileId) {
                setSelectedProfileId(res.data[0].id.toString());
            }
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch profiles", error);
            setLoading(false);
        }
    };

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (newType: string) => {
        setFormData(prev => ({ ...prev, type: newType }));
    };

    const handleCreateNew = () => {
        setSelectedProfileId("");
        setFormData({
            name: '', full_name: '', pix: '', type: 'artist', active: true, photo_url: '', bio: '',
            cpf: '', email: '', address: '', neighborhood: '', city: '', state: '', zip_code: '', publisher: '',
            label_name: '', association: '', publisher_extra: '',
            bank: '', agency: '', account: '', spotify_url: '', apple_music_url: '', instagram_url: '', youtube_url: '', website_url: ''
        });
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            if (selectedProfileId) {
                await api.put(`/profiles/${selectedProfileId}`, formData);
                setProfiles(prev => prev.map(p => p.id === Number(selectedProfileId) ? { ...p, ...formData } : p));
                setNotification({ type: 'success', message: 'Perfil atualizado!' });
            } else {
                const res = await api.post('/profiles/', formData);
                setProfiles(prev => [...prev, res.data]);
                setSelectedProfileId(res.data.id.toString());
                setNotification({ type: 'success', message: 'Perfil criado!' });
            }
            setTimeout(() => {
                setNotification(null);
                if (onSave) onSave();
            }, 1500);
        } catch (error) {
            setNotification({ type: 'error', message: 'Erro ao salvar.' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedProfileId) return;
        try {
            await api.delete(`/profiles/${selectedProfileId}`);
            setNotification({ type: 'success', message: 'Perfil excluído.' });
            setShowDeleteConfirm(false);
            const remaining = profiles.filter(p => p.id !== Number(selectedProfileId));
            setProfiles(remaining);
            if (remaining.length > 0) setSelectedProfileId(remaining[0].id.toString());
            else handleCreateNew();
            setTimeout(() => {
                setNotification(null);
                if (onSave) onSave();
                if (onClose) onClose();
            }, 1000);
        } catch (error) {
            setNotification({ type: 'error', message: 'Erro ao excluir.' });
        }
    };

    const handlePdfImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const upFormData = new FormData();
        upFormData.append('file', file);
        try {
            setSaving(true);
            const res = await api.post('/profiles/upload-pdf', upFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const data = res.data;
            setFormData(prev => ({
                ...prev,
                full_name: data.full_name || prev.full_name,
                cpf: data.cpf || prev.cpf,
                bank: data.bank || prev.bank,
                agency: data.agency || prev.agency,
                account: data.account || prev.account,
                pix: data.pix || prev.pix
            }));
            setNotification({ type: 'success', message: 'Dados do PDF importados!' });
            setTimeout(() => setNotification(null), 3000);
        } catch (err) {
            setNotification({ type: 'error', message: 'Falha ao ler PDF.' });
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center bg-background-light dark:bg-background-dark text-slate-500">Carregando...</div>;

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 p-4 md:p-6 flex items-center justify-center font-sans h-full overflow-hidden">
            {/* Notification Toast */}
            {notification && (
                <div className={`absolute top-4 right-4 z-[60] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 border ${notification.type === 'success' ? 'bg-white dark:bg-slate-900 border-green-500/20 text-green-600' : 'bg-white dark:bg-slate-900 border-red-500/20 text-red-600'}`}>
                    <span className="material-symbols-rounded text-xl">{notification.type === 'success' ? 'check_circle' : 'error'}</span>
                    <span className="font-bold text-sm">{notification.message}</span>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100 dark:border-red-900/30" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                <span className="material-symbols-rounded text-3xl">delete_forever</span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Excluir Perfil?</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Tem certeza que deseja excluir <strong>{formData.name}</strong>?</p>
                            <div className="flex gap-3 w-full mt-4">
                                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                                <button onClick={handleDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all">Excluir</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full h-full bg-surface-light dark:bg-surface-dark rounded-[32px] shadow-sm overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-slate-800">
                {/* Sidebar */}
                <aside className="w-full md:w-72 bg-slate-50 dark:bg-slate-900/50 p-8 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col relative">
                    {onClose && (
                        <button onClick={onClose} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <span className="material-symbols-rounded">arrow_back</span>
                        </button>
                    )}
                    <div className="mb-8 mt-4">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Editar Perfil</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Gerencie dados artísticos, financeiros e contratuais.</p>
                    </div>

                    <div className="mb-8 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Perfil Selecionado</label>
                        <select
                            value={selectedProfileId}
                            onChange={(e) => {
                                if (e.target.value === "") handleCreateNew();
                                else setSelectedProfileId(e.target.value);
                            }}
                            className="w-full bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 border-none p-0 focus:ring-0 cursor-pointer"
                        >
                            <option value="">+ Criar Novo</option>
                            {profiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <nav className="space-y-2">
                        <button onClick={() => scrollToSection(basicRef)} className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 text-primary rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 font-bold text-sm transition-all hover:scale-[1.02]">
                            <span className="material-symbols-rounded text-xl">person</span>
                            Dados Básicos
                        </button>
                        <button onClick={() => scrollToSection(socialRef)} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-sm font-medium">
                            <span className="material-symbols-rounded text-xl">share</span>
                            Redes Sociais
                        </button>
                        <button onClick={() => scrollToSection(financialRef)} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all text-sm font-medium">
                            <span className="material-symbols-rounded text-xl">account_balance</span>
                            Financeiro
                        </button>
                    </nav>

                    <div className="mt-auto p-4 bg-primary/10 rounded-2xl border border-primary/20">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-rounded text-primary">info</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Dica</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">Perfis completos com dados bancários facilitam processos de pagamentos.</p>
                    </div>
                </aside>

                <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                    {/* Header */}
                    <header className="p-6 md:px-10 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                        {onClose && <button onClick={onClose} className="md:hidden p-2 -ml-2 text-slate-500"><span className="material-symbols-rounded">arrow_back</span></button>}
                        <div className="hidden md:block">
                            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${formData.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-slate-100 text-slate-400'}`}>
                                STATUS DO PERFIL: {formData.active ? 'ATIVO' : 'INATIVO'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors cursor-pointer">
                                <span className="material-symbols-rounded text-lg">upload_file</span>
                                <span className="hidden sm:inline">Importar PDF</span>
                                <input type="file" className="hidden" accept=".pdf" onChange={handlePdfImport} />
                            </label>
                            {onClose && <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><span className="material-symbols-rounded">close</span></button>}
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar scroll-smooth pb-32">
                        <div className="max-w-4xl mx-auto space-y-16">
                            {/* Section 01: Basic */}
                            <section ref={basicRef} id="basic" className="space-y-8">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold">01</span>
                                    Informações Básicas
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
                                    <div className="md:col-span-3 flex flex-col items-center gap-4">
                                        <div className="relative group w-40 h-40">
                                            <div className="w-full h-full rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-800">
                                                {formData.photo_url ? <img src={formData.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><span className="material-symbols-rounded text-6xl">person</span></div>}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700">
                                                <input type="text" placeholder="URL da Foto..." value={formData.photo_url} onChange={e => setFormData({ ...formData, photo_url: e.target.value })} className="text-[10px] w-32 border-none bg-transparent focus:ring-0 p-0" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-9 space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome Artístico</label>
                                                <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/50 font-bold text-lg" placeholder="EX: MC EXEMPLO" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nome Completo</label>
                                                <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/50" placeholder="NOME CIVIL" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Biografia</label>
                                            <textarea name="bio" value={formData.bio} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/50 text-sm h-32 resize-none" placeholder="Conte um pouco sobre a trajetória musical..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Perfil</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                                        {[
                                            { id: 'artist', label: 'Artista', icon: 'mic' },
                                            { id: 'producer', label: 'Produtor', icon: 'graphic_eq' },
                                            { id: 'feat', label: 'Feat', icon: 'person_add' },
                                            { id: 'label', label: 'Selo', icon: 'album' },
                                            { id: 'manager', label: 'Empresário', icon: 'business_center' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => handleRoleChange(type.id)}
                                                className={`group flex flex-col items-center justify-center p-5 rounded-[24px] border-2 transition-all ${formData.type === type.id ? 'border-primary bg-primary/5 shadow-inner' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary/20'}`}
                                            >
                                                <span className={`material-symbols-rounded mb-2 text-2xl transition-colors ${formData.type === type.id ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>{type.icon}</span>
                                                <span className={`text-[11px] font-bold ${formData.type === type.id ? 'text-primary' : 'text-slate-500'}`}>{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Gravadora</label><input name="label_name" value={formData.label_name} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Editora</label><input name="publisher" value={formData.publisher} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3" /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Associação</label>
                                        <select name="association" value={formData.association} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3">
                                            <option value="">SELECIONE...</option>
                                            {["ABRAMUS", "AMAR", "ASSIM", "SBACEM", "SICAM", "SOCINPRO", "UBC"].map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">E-mail de Contato</label><input name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl px-4 py-3" placeholder="email@exemplo.com" /></div>
                                </div>
                            </section>

                            {/* Section 02: Social */}
                            <section ref={socialRef} id="social" className="space-y-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                                <h3 className="text-xl font-bold flex items-center gap-3">
                                    <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold">02</span>
                                    Presença Digital
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { name: 'spotify_url', label: 'Link Spotify', icon: 'graphic_eq', placeholder: 'https://open.spotify.com/artist/...' },
                                        { name: 'instagram_url', label: 'Instagram (@)', icon: 'alternate_email', placeholder: 'usuario' },
                                        { name: 'youtube_url', label: 'Canal YouTube', icon: 'smart_display', placeholder: 'https://youtube.com/...' },
                                        { name: 'website_url', label: 'Website Oficial', icon: 'language', placeholder: 'www.site.com' },
                                    ].map(social => (
                                        <div key={social.name} className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">{social.label}</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-rounded text-slate-400">{social.icon}</span>
                                                <input name={social.name} value={(formData as any)[social.name]} onChange={handleChange} className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-primary/50 transition-all text-sm" placeholder={social.placeholder} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section 03: Financial */}
                            <section ref={financialRef} id="financial" className="space-y-8 border-t border-slate-100 dark:border-slate-800 pt-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold flex items-center gap-3">
                                        <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-base font-bold">03</span>
                                        Informações Financeiras
                                    </h3>
                                    <span className="material-symbols-rounded text-slate-400">keyboard_arrow_up</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-900/40 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2 relative">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Banco</label>
                                            <input name="bank" value={formData.bank} onFocus={() => setShowBankList(true)} onBlur={() => setTimeout(() => setShowBankList(false), 200)} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/50" autoComplete="off" />
                                            {showBankList && banks.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-h-56 overflow-y-auto border border-slate-100 dark:border-slate-700 z-20 custom-scrollbar">
                                                    {banks.filter(b => (b.name || '').toLowerCase().includes(formData.bank.toLowerCase())).map(bank => (
                                                        <button key={bank.code} type="button" onClick={() => setFormData({ ...formData, bank: `${bank.code} - ${bank.name}` })} className="w-full text-left px-5 py-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 font-medium">
                                                            <span className="font-bold text-primary mr-3">{bank.code}</span>{bank.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CPF / CNPJ</label><input name="cpf" value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: formatCpfCnpj(e.target.value) })} maxLength={18} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/50 font-mono" placeholder="000.000.000-00" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Agência</label><input name="agency" value={formData.agency} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/50" /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Conta Corrente</label><input name="account" value={formData.account} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/50 font-mono" /></div>
                                        <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Chave PIX</label><input name="pix" value={formData.pix} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4 focus:ring-2 focus:ring-primary/50 font-bold text-primary" placeholder="CPF, EMAIL OU CHAVE ALEATÓRIA" /></div>
                                    </div>
                                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800/50">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Logradouro</label><input name="address" value={formData.address} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4" placeholder="RUA, NÚMERO, COMPLEMENTO" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Bairro</label><input name="neighborhood" value={formData.neighborhood} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Cidade</label><input name="city" value={formData.city} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Estado (UF)</label><input name="state" value={formData.state} onChange={handleChange} maxLength={2} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4 uppercase" /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CEP</label><input name="zip_code" value={formData.zip_code} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-4" /></div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="p-6 md:px-10 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0 flex items-center justify-between gap-4 sticky bottom-0 z-10">
                        <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-2xl transition-all"><span className="material-symbols-rounded">delete</span><span className="hidden sm:inline">Excluir Perfil</span></button>
                        <div className="flex items-center gap-4">
                            <button onClick={onClose || handleCreateNew} className="px-8 py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-200 transition-all">Cancelar</button>
                            <button onClick={handleSaveProfile} disabled={saving} className="bg-primary hover:bg-primary-hover text-white font-bold px-12 py-3.5 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-95">
                                {saving ? <span className="material-symbols-rounded animate-spin">refresh</span> : <span className="material-symbols-rounded">check</span>}
                                {saving ? "Salvando..." : "Salvar Perfil"}
                            </button>
                        </div>
                    </footer>
                </main>
            </div>
        </div>
    );
}
