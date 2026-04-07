import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Save, User, Search, X, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SplitSummary {
    name: string;
    percentage: number;
    role?: string;
}

interface Track {
    id: number;
    isrc: string;
    musica_display: string;
    artist: string;
    split_count: number;
    split_summary: SplitSummary[];
    status: string;
    label_share?: number;
}

interface Split {
    participant_name: string;
    participant_role: string;
    percentage: number;
}

export function SplitBuilder() {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Editor State
    const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
    const [splits, setSplits] = useState<Split[]>([]);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [searchResults, setSearchResults] = useState<{ [key: number]: any[] }>({});

    // Load Tracks
    useEffect(() => {
        loadTracks();
    }, []);

    const loadTracks = () => {
        setLoading(true);
        api.get('/tracks').then(res => {
            // Show all tracks so user can create splits for Pending ones too
            setTracks(res.data);
            setFilteredTracks(res.data);
            setLoading(false);
        });
    };

    // Search
    // Server-side Search with Debounce
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                setLoading(true);
                api.get(`/tracks/search?q=${searchQuery}`)
                    .then(res => {
                        setFilteredTracks(res.data);
                        setLoading(false);
                    })
                    .catch(e => {
                        console.error("Search error", e);
                        setLoading(false);
                    });
            } else {
                // Reset to original list when search is cleared
                setFilteredTracks(tracks);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, tracks]);

    const handleQuickEdit = (e: React.MouseEvent, track: Track) => {
        e.stopPropagation(); // Stop propagation to card click
        setSelectedTrack(track);
        setSidebarOpen(true);
        // Fetch Splits
        api.get(`/splits/${track.id}`).then(res => {
            if (res.data.length > 0) {
                setSplits(res.data);
            } else {
                setSplits([{ participant_name: track.artist, participant_role: 'Artista Principal', percentage: 100 }]);
            }
        }).catch(e => {
            console.error(e);
            setSplits([{ participant_name: track.artist, participant_role: 'Artista Principal', percentage: 100 }]);
        });
    };

    const handleCardClick = (track: Track) => {
        navigate(`/splits/${track.isrc}/editor`);
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
        setTimeout(() => setSelectedTrack(null), 300);
    };

    // Editor Logic
    const addParticipant = () => {
        setSplits([...splits, { participant_name: '', participant_role: 'Colaborador', percentage: 0 }]);
    };

    const removeParticipant = (index: number) => {
        const newSplits = [...splits];
        newSplits.splice(index, 1);
        setSplits(newSplits);
    };

    const updateSplit = (index: number, field: keyof Split, value: any) => {
        const newSplits = [...splits];
        newSplits[index] = { ...newSplits[index], [field]: value };
        setSplits(newSplits);
    };

    const totalPercentage = splits.reduce((sum, s) => sum + Number(s.percentage), 0);
    const isValid = Math.abs(totalPercentage - 100) < 0.1;

    const handleSave = async () => {
        if (!selectedTrack || !isValid) return;
        try {
            await api.post(`/splits/${selectedTrack.id}`, splits);
            alert('Splits salvos com sucesso!');
            loadTracks(); // Refresh list to update summaries
            closeSidebar();
        } catch (e) {
            alert('Erro ao salvar');
        }
    };

    const getSplitColor = (idx: number) => {
        const colors = ['bg-[#8B5CF6]', 'bg-[#10B981]', 'bg-[#F59E0B]', 'bg-[#EC4899]', 'bg-[#3B82F6]'];
        return colors[idx % colors.length];
    };

    // For text colors matching the background
    const getSplitTextColor = (idx: number) => {
        const colors = ['text-[#8B5CF6]', 'text-[#10B981]', 'text-[#F59E0B]', 'text-[#EC4899]', 'text-[#3B82F6]'];
        return colors[idx % colors.length];
    }


    const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : '??';

    return (
        <div className="flex h-[calc(100vh-100px)] -mb-8 overflow-hidden relative">
            {/* Main Area */}
            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'mr-0' : ''}`}>
                <div className="flex-none mb-8 px-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Visão Geral de Royalties</h2>
                        <div className="flex gap-3">
                            {/* Search Bar Inline */}
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <input
                                    className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-card-dark border-none shadow-sm rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    placeholder="Buscar faixas, artistas..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/25 transition-all active:scale-95">
                                <Plus className="h-4 w-4" />
                                Novo Split
                            </button>
                        </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 -mt-4 mb-6">Gerencie e monitore a distribuição de receita de todas as faixas.</p>
                </div>

                {/* Grid Content */}
                <div className="flex-1 overflow-y-auto pb-20 px-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-64 text-gray-400">Carregando faixas...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredTracks.map((track, idx) => (
                                <div
                                    key={track.id}
                                    onClick={() => handleCardClick(track)}
                                    className="bg-white dark:bg-card-dark rounded-[24px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-800/50 group relative"
                                >
                                    {/* Quick Edit Button */}
                                    <button
                                        onClick={(e) => handleQuickEdit(e, track)}
                                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                                        title="Edição Rápida"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>

                                    {/* Header */}
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`w-14 h-14 rounded-2xl ${getSplitColor(idx)} text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-black/5`}>
                                            {getInitials(track.musica_display)}
                                        </div>
                                        <div className="min-w-0 flex-1 pt-1">
                                            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white truncate leading-tight uppercase tracking-tight">{track.musica_display}</h3>
                                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate mt-1 uppercase tracking-wider">
                                                {(track.split_summary && track.split_summary.length > 0)
                                                    ? track.split_summary.map(s => s.name).join(' • ')
                                                    : track.artist}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-gray-700 dark:text-gray-300">Divisão de Royalties</span>
                                            <span className={`${getSplitTextColor(idx)} font-bold`}>
                                                {(track.split_count || 1)} Colaborador{(track.split_count || 1) > 1 ? 'es' : ''}
                                            </span>
                                        </div>

                                        <div className="h-10 w-full bg-gray-100 dark:bg-gray-800 rounded-2xl flex relative shadow-inner">
                                            {(track.split_summary || [{ percentage: 100 }]).map((item, i) => {
                                                const grossPct = item.percentage || 100;
                                                const lblShare = track.label_share ?? 0.40;
                                                // Convert Gross to Net for Display:
                                                // Net = Gross / (1 - LabelShare)
                                                // e.g. 15 / 0.6 = 25
                                                const netPct = grossPct / (1 - lblShare);

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`h-full flex items-center justify-center text-[12px] font-bold text-white transition-all duration-500 border-r border-white/20 last:border-0 first:rounded-l-2xl last:rounded-r-2xl ${i === 0 ? getSplitColor(idx) : (i % 2 === 0 ? 'bg-[#10B981]' : (i % 3 === 0 ? 'bg-[#F59E0B]' : 'bg-[#EC4899]'))}`}
                                                        style={{ width: `${netPct}%` }}
                                                    >
                                                        {netPct > 12 && `${Math.round(netPct)}%`}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidebar Editor (Drawer) */}
            <div className={`fixed inset-y-0 right-0 w-96 bg-white dark:bg-card-dark border-l border-gray-200 dark:border-gray-800 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedTrack && (
                    <>
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/20">
                            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white">Editar Split</h3>
                            <button onClick={closeSidebar} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-500">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-8">
                            {/* Header Info */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[#8B5CF6]/20">
                                    {getInitials(selectedTrack.musica_display)}
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-lg leading-tight text-gray-900 dark:text-white line-clamp-2">{selectedTrack.musica_display}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono">{selectedTrack.isrc}</p>
                                </div>
                            </div>

                            {/* Collaborators */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold uppercase tracking-widest text-gray-500">Colaboradores ({splits.length})</h5>
                                    <button onClick={addParticipant} className="text-xs font-bold text-[#8B5CF6] hover:underline flex items-center gap-1">
                                        <Plus className="h-3 w-3" /> Adicionar
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {splits.map((split, idx) => (
                                        <div key={idx} className={`p-4 rounded-2xl border transition-colors space-y-4 ${idx === 0 ? 'border-[#8B5CF6]/20 bg-[#8B5CF6]/5' : 'border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="relative">
                                                            <input
                                                                className="block w-full text-sm font-bold bg-transparent border-none p-0 focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                                                                placeholder="Nome do Artista"
                                                                value={split.participant_name}
                                                                onChange={e => {
                                                                    const val = e.target.value;
                                                                    updateSplit(idx, 'participant_name', val);
                                                                    if (val.length > 0) {
                                                                        api.get(`/profiles?search=${val}`).then(res => {
                                                                            setSearchResults(prev => ({ ...prev, [idx]: res.data }));
                                                                        });
                                                                    } else {
                                                                        setSearchResults(prev => ({ ...prev, [idx]: [] }));
                                                                    }
                                                                }}
                                                                onFocus={() => {
                                                                    if (split.participant_name) {
                                                                        api.get(`/profiles?search=${split.participant_name}`).then(res => {
                                                                            setSearchResults(prev => ({ ...prev, [idx]: res.data }));
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            {/* Autocomplete Dropdown */}
                                                            {searchResults[idx] && searchResults[idx].length > 0 && (
                                                                <>
                                                                    <div className="fixed inset-0 z-10" onClick={() => setSearchResults(prev => ({ ...prev, [idx]: [] }))}></div>
                                                                    <div className="absolute top-full left-0 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 mt-1 overflow-hidden max-h-48 overflow-y-auto">
                                                                        {searchResults[idx].map((p: any) => (
                                                                            <button
                                                                                key={p.id}
                                                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    const newSplits = [...splits];
                                                                                    newSplits[idx] = {
                                                                                        ...newSplits[idx],
                                                                                        participant_name: p.name,
                                                                                        participant_role: p.type === 'artist' ? 'ARTISTA' : (p.type === 'producer' ? 'PRODUTOR' : 'COLABORADOR')
                                                                                    };
                                                                                    setSplits(newSplits);
                                                                                    setSearchResults(prev => ({ ...prev, [idx]: [] }));
                                                                                }}
                                                                            >
                                                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                                                    {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-gray-400">{p.name[0]}</div>}
                                                                                </div>
                                                                                <div>
                                                                                    <p className="font-bold text-xs text-gray-900 dark:text-white leading-tight">{p.name}</p>
                                                                                    <p className="text-[9px] text-gray-500 uppercase font-bold">{p.type}</p>
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <input
                                                            className="block w-full text-[10px] font-bold uppercase text-[#8B5CF6] bg-transparent border-none p-0 focus:ring-0 placeholder-[#8B5CF6]/50"
                                                            placeholder="FUNÇÃO"
                                                            value={split.participant_role}
                                                            onChange={e => updateSplit(idx, 'participant_role', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="relative">
                                                        <input
                                                            className="w-24 h-9 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-right text-sm font-bold focus:ring-[#8B5CF6] focus:border-[#8B5CF6] pr-6 text-gray-900 dark:text-white"
                                                            type="number"
                                                            step="0.01"
                                                            value={split.percentage}
                                                            onChange={e => updateSplit(idx, 'percentage', e.target.value)}
                                                            onBlur={e => {
                                                                let val = parseFloat(e.target.value);
                                                                if (isNaN(val)) val = 0;
                                                                if (val > 100) val = 100;
                                                                if (val < 0) val = 0;
                                                                updateSplit(idx, 'percentage', parseFloat(val.toFixed(2)));
                                                            }}
                                                        />
                                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">%</span>
                                                    </div>
                                                    {idx > 0 && (
                                                        <button onClick={() => removeParticipant(idx)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total Bar */}
                            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-500">Total Alocado</span>
                                    <span className={`text-sm font-extrabold ${isValid ? 'text-green-500' : 'text-red-500'}`}>{totalPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
                                    {splits.map((s, i) => (
                                        <div key={i} className={`h-full ${i === 0 ? 'bg-[#8B5CF6]' : 'bg-gray-400'}`} style={{ width: `${s.percentage}%`, opacity: 1 - (i * 0.15) }}></div>
                                    ))}
                                </div>
                                {!isValid && <p className="text-xs text-red-500 mt-2 font-bold">O total deve ser 100%</p>}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 mt-auto">
                            <button
                                onClick={handleSave}
                                disabled={!isValid}
                                className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 text-white ${isValid ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-[#8B5CF6]/25' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}
                            >
                                <Save className="h-5 w-5" />
                                Salvar Alterações
                            </button>
                            <button
                                onClick={closeSidebar}
                                className="w-full mt-2 text-gray-500 hover:text-red-500 transition-colors py-2 text-xs font-bold uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Overlay for Sidebar on Mobile */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden" onClick={closeSidebar}></div>
            )}
        </div>
    );
}
