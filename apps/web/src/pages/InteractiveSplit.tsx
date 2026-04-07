import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getAssetUrl } from '../lib/config';
import { Plus, X, ChevronsUpDown, CheckCircle, Music, ChevronDown, Calendar, Clock, GripVertical } from 'lucide-react';

interface Split {
    participant_name: string;
    role: string;
    percentage: number | string;
    is_verified?: boolean;
}

interface Track {
    id: number;
    isrc: string;
    musica_display: string;
    artist: string;
    label_share?: number;
    label_name?: string;
    release_date?: string; // Format: "Dec 15, 2023"
    duration?: string;     // Format: "3:42"
}

const ARTIST_IMAGES: { [key: string]: string } = {
    'fuub': getAssetUrl('/static/media/profiles/fuub.webp'),
    'snif': getAssetUrl('/static/media/profiles/snif.webp'),
    'lil chainz': getAssetUrl('/static/media/profiles/lil-chainz.webp')
};

export function InteractiveSplit() {
    const { isrc } = useParams();

    const [track, setTrack] = useState<Track | null>(null);
    const [splits, setSplits] = useState<Split[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    // Configuração Padrão da Gravadora
    const labelShareInfo = {
        name: track?.label_name || 'GRAV Produção Musical Ltda.',
        share: track?.label_share ?? 0.40
    };
    const netShareMultiplier = 1 - labelShareInfo.share;

    const [searchResults, setSearchResults] = useState<{ [key: number]: any[] }>({});
    const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;

        // duplicate items
        const _splits = [...splits];

        // remove and save the dragged item content
        const draggedItemContent = _splits.splice(dragItem.current, 1)[0];

        // switch the position
        _splits.splice(dragOverItem.current, 0, draggedItemContent);

        // reset the position ref
        dragItem.current = null;
        dragOverItem.current = null;

        // update the actual array
        setSplits(_splits);
    };

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (isrc) {
            loadData(isrc);
        }
    }, [isrc]);

    const loadData = async (trackIsrc: string) => {
        setLoading(true);
        try {
            // Fetch specific track directly
            const tracksRes = await api.get(`/tracks/${trackIsrc}`);
            const foundTrack = tracksRes.data;

            if (!foundTrack) {
                console.error("Track not found for ISRC:", trackIsrc);
                setLoading(false);
                return;
            }

            // Now fetch splits using the ID
            const splitsRes = await api.get(`/splits/${foundTrack.id}`);

            setTrack(foundTrack);
            const lblShare = foundTrack?.label_share ?? 0.40;
            const multiplier = 1 - lblShare;

            if (splitsRes.data.length > 0) {
                const netSplits = splitsRes.data.map((s: any) => ({
                    ...s,
                    percentage: multiplier > 0 ? (s.percentage / multiplier) : 0,
                    is_verified: true
                }));
                setSplits(netSplits);
            } else {
                const artistNames = (foundTrack?.artist || 'Artista').split(',').map((s: string) => s.trim());
                setSplits(artistNames.map((name: string) => ({
                    participant_name: name,
                    role: 'ARTISTA',
                    percentage: artistNames.length > 0 ? (100 / artistNames.length) : 100,
                    is_verified: true
                })));
            }

        } catch (e) {
            console.error("Error loading data", e);
        } finally {
            setLoading(false);
        }
    };

    const addParticipant = () => {
        setSplits([...splits, { participant_name: '', role: 'ARTISTA', percentage: 0, is_verified: false }]);
    };

    const removeParticipant = (index: number) => {
        const newSplits = [...splits];
        newSplits.splice(index, 1);
        setSplits(newSplits);
    };

    const updateSplit = (index: number, field: keyof Split, value: any) => {
        const newSplits = [...splits];

        if (field === 'percentage') {
            if (typeof value === 'number') {
                if (value > 100) value = 100;
                if (value < 0) value = 0;
                // Force 2 decimal places
                value = Math.round(value * 100) / 100;
            }
        }

        // If changing name, mark as unverified until selected
        if (field === 'participant_name') {
            // We handle is_verified in the onChange handler specifically for name, 
            // but here we ensure specific updates logic if needed.
            // Actually, the component onChange handles the verification logic implicitly by calling this.
            // We will update the component onChange to pass is_verified: false key separately or update explicit logic there.
            // To simplify, let's allow passing partial updates.
        }

        newSplits[index] = { ...newSplits[index], [field]: value };
        setSplits(newSplits);
    };

    const totalNetUsed = splits.reduce((sum, s) => sum + Number(s.percentage || 0), 0);
    const isValid = Math.abs(totalNetUsed - 100) < 0.1 && splits.every(s => s.participant_name && s.is_verified);

    const getRoleColorStyles = (idx: number) => {
        const styles = [
            { bg: 'bg-[#8B5CF6]/20', text: 'text-[#8B5CF6]', accent: '#8B5CF6' },
            { bg: 'bg-blue-500/10', text: 'text-blue-500', accent: '#3B82F6' },
            { bg: 'bg-pink-500/10', text: 'text-pink-500', accent: '#EC4899' },
            { bg: 'bg-orange-500/10', text: 'text-orange-500', accent: '#F97316' },
            { bg: 'bg-green-500/10', text: 'text-green-500', accent: '#10B981' },
        ];
        return styles[idx % styles.length];
    };

    const handleSave = async () => {
        if (!track || !isValid) return;
        try {
            const lblShare = track.label_share ?? 0.40;
            const multiplier = 1 - lblShare;

            const payload = splits.map(s => ({
                ...s,
                percentage: Number(s.percentage) * multiplier
            }));

            await api.post(`/splits/${track.id}`, payload);
            setNotification({ message: 'Splits salvos com sucesso!', type: 'success' });
            loadData(track.isrc);

        } catch (e) {
            setNotification({ message: 'Erro ao salvar as alterações.', type: 'error' });
        }
    };

    if (loading) return <div className="p-10 text-center">Carregando...</div>;
    if (!track) return <div className="p-10 text-center text-red-500">Faixa não encontrada</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] bg-[#f3f4f6] dark:bg-[#0F172A] -m-8 relative font-sans overflow-y-auto">

            {/* Toast Notification */}
            <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 transition-all duration-300 transform ${notification ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'}`}>
                {notification && (
                    <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border ${notification.type === 'success'
                        ? 'bg-white dark:bg-gray-800 text-green-600 border-green-100 dark:border-green-900/30'
                        : 'bg-white dark:bg-gray-800 text-red-600 border-red-100 dark:border-red-900/30'
                        }`}>
                        <div className={`p-1 rounded-full ${notification.type === 'success' ? 'bg-green-100 dark:bg-green-900/50' : 'bg-red-100 dark:bg-red-900/50'}`}>
                            {notification.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </div>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-100">{notification.message}</span>
                    </div>
                )}
            </div>

            <div className="flex-1 p-8 relative z-10 max-w-4xl mx-auto w-full space-y-8">

                {/* 0. Track Info Card */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[24px] p-8 shadow-lg border border-gray-200 dark:border-gray-800 text-center relative overflow-hidden">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-[#8B5CF6] text-white rounded-2xl text-2xl font-bold mb-4 shadow-lg shadow-purple-500/30">
                        {track.musica_display.substring(0, 2).toUpperCase()}
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{track.musica_display}</h1>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-bold tracking-wide">ISRC: {track.isrc}</span>
                        <span>•</span>
                        <span>{track.artist}</span>
                    </div>

                    {/* New Metadata Row */}
                    <div className="flex justify-center items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300">
                            <Calendar className="h-4 w-4 text-[#8B5CF6]" />
                            <span>Lançamento: {track.release_date}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300">
                            <Clock className="h-4 w-4 text-[#8B5CF6]" />
                            <span>{track.duration} Duração</span>
                        </div>
                    </div>
                </div>

                {/* Connector Arrow */}
                <div className="flex justify-center -my-3 relative z-0">
                    <ChevronDown className="h-6 w-6 text-gray-400 dark:text-gray-600 animate-bounce" />
                </div>

                {/* 1. Label Commission Card */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[24px] p-8 shadow-lg border border-gray-200 dark:border-gray-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4">
                        <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Não Editável</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Comissão da Gravadora</h3>
                    <p className="text-sm text-gray-500 mb-6">Porcentagem bruta fixa alocada para a gravadora.</p>

                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center">
                                <Music className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-lg">{labelShareInfo.name}</p>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Distribuição Padrão de Contrato</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="block text-4xl font-extrabold text-gray-900 dark:text-white">{(labelShareInfo.share * 100).toFixed(0)}%</span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Receita Bruta</span>
                        </div>
                    </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center -my-2 opacity-20">
                    <ChevronDown className="h-8 w-8 text-gray-500" />
                </div>

                {/* 2. Collaborator Net Split */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[32px] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Divisão Líquida dos Colaboradores
                                {isValid &&
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                        Totalmente Alocado
                                    </span>
                                }
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Os <span className="font-bold text-gray-900 dark:text-white">{(netShareMultiplier * 100).toFixed(0)}%</span> restantes representam os novos 100% para artistas e produtores.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Distribuição Atual</p>
                            <p className={`text-2xl font-extrabold ${isValid ? 'text-green-500' : 'text-orange-500'}`}>
                                {totalNetUsed.toFixed(1)}% <span className="text-sm text-gray-300">/ 100%</span>
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar Header */}
                    <div className="mb-10">
                        <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex ring-4 ring-white dark:ring-[#1E293B] shadow-inner">
                            {splits.map((split, idx) => {
                                const styles = getRoleColorStyles(idx);
                                const visualPct = Number(split.percentage);
                                return visualPct > 0 && (
                                    <div
                                        key={idx}
                                        className={`${styles.bg} transition-all duration-500 relative group border-r border-white/20 last:border-0`}
                                        style={{ width: `${visualPct}%`, backgroundColor: styles.accent }}
                                    >
                                        {visualPct > 5 && (
                                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                {visualPct.toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 px-2">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    {/* Collaborator List */}
                    <div className="space-y-6">
                        {splits.map((split, idx) => {
                            const styles = getRoleColorStyles(idx);
                            // Ensure we handle both string (while typing) and number
                            const visualPct = split.percentage;

                            // Check if this row has an active dropdown
                            const hasActiveDropdown = searchResults[idx] && searchResults[idx].length > 0;

                            return (
                                <div
                                    key={idx}
                                    className={`bg-white dark:bg-gray-900/30 rounded-[20px] p-2 pr-6 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center gap-6 group hover:shadow-lg hover:border-purple-100 dark:hover:border-purple-900/30 transition-all duration-300 relative ${hasActiveDropdown ? 'z-50' : 'z-20'}`}
                                    draggable={draggedIdx === idx}
                                    onDragStart={(e) => {
                                        dragItem.current = idx;
                                        e.dataTransfer.effectAllowed = "move";
                                        // Slight transparency when dragging
                                        e.currentTarget.style.opacity = "0.5";
                                    }}
                                    onDragEnter={(e) => {
                                        dragOverItem.current = idx;
                                        e.preventDefault();
                                    }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDragEnd={(e) => {
                                        e.currentTarget.style.opacity = "1";
                                        setDraggedIdx(null);
                                        handleSort();
                                    }}
                                >
                                    {/* Drag Handle */}
                                    <div
                                        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 z-30 p-2 md:block transition-colors"
                                        onMouseDown={() => setDraggedIdx(idx)}
                                        onMouseUp={() => setDraggedIdx(null)}
                                    >
                                        <GripVertical className="h-5 w-5" />
                                    </div>

                                    {/* Artist Avatar & Name */}
                                    <div className="flex items-center gap-4 min-w-[240px] pl-8 relative z-20">
                                        <div className={`w-14 h-14 rounded-2xl ${styles.bg} flex items-center justify-center font-bold text-lg ${styles.text} relative shadow-sm overflow-hidden flex-shrink-0`}>
                                            {(() => {
                                                const lowerName = split.participant_name?.toLowerCase().trim();
                                                const imageSrc = ARTIST_IMAGES[lowerName] || (split as any).profile_photo;

                                                if (imageSrc) {
                                                    return (
                                                        <img
                                                            src={imageSrc}
                                                            alt={split.participant_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    );
                                                } else {
                                                    return split.participant_name ? split.participant_name.substring(0, 2).toUpperCase() : '?';
                                                }
                                            })()}
                                        </div>

                                        <div className="flex flex-col relative w-full group/input">
                                            <input
                                                value={split.participant_name}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    // Mark unverified when typing
                                                    const newSplits = [...splits];
                                                    newSplits[idx] = { ...newSplits[idx], participant_name: val, is_verified: false };
                                                    setSplits(newSplits);

                                                    if (val.length > 0) {
                                                        api.get(`/profiles?search=${val}`).then(res => {
                                                            setSearchResults(prev => ({ ...prev, [idx]: res.data }));
                                                        });
                                                    } else {
                                                        setSearchResults(prev => ({ ...prev, [idx]: [] }));
                                                    }
                                                }}
                                                onBlur={() => {
                                                    // Strict check on blur: If not verified, try to verify with exact match
                                                    if (!split.is_verified && split.participant_name) {
                                                        api.get(`/profiles?search=${split.participant_name}`).then(res => {
                                                            const exactMatch = res.data.find((p: any) => p.name.toLowerCase() === split.participant_name.toLowerCase());
                                                            if (exactMatch) {
                                                                const newSplits = [...splits];
                                                                newSplits[idx].is_verified = true;
                                                                // Also update photo if available
                                                                (newSplits[idx] as any).profile_photo = exactMatch.photo_url;
                                                                setSplits(newSplits);
                                                            } else {
                                                                // Could show error or clear. For now, leave unverified (blocks save)
                                                            }
                                                        });
                                                    }
                                                }}
                                                onFocus={() => {
                                                    api.get('/profiles').then(res => {
                                                        setSearchResults(prev => ({ ...prev, [idx]: res.data }));
                                                    });
                                                }}
                                                // Removed onBlur to allow clicking on dropdown items. 
                                                // We will handle closing via click outside or selection.
                                                className={`bg-transparent font-bold border-b-2 p-0 focus:ring-0 w-full text-lg placeholder-gray-300 relative z-20 ${!split.is_verified && split.participant_name ? 'text-red-500 border-red-500' : 'text-gray-900 dark:text-white border-transparent'}`}
                                                placeholder="Nome do Artista"
                                            />

                                            {/* Autocomplete Dropdown */}
                                            {searchResults[idx] && searchResults[idx].length > 0 && (
                                                <>
                                                    {/* Invisible backdrop to close on click outside */}
                                                    <div className="fixed inset-0 z-10" onClick={() => setSearchResults(prev => ({ ...prev, [idx]: [] }))}></div>

                                                    <div className="absolute top-full left-0 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-30 mt-2 overflow-hidden max-h-60 overflow-y-auto">
                                                        {searchResults[idx].map((p: any) => (
                                                            <button
                                                                key={p.id}
                                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0"
                                                                onClick={(e) => {
                                                                    e.stopPropagation(); // Prevent closing immediately

                                                                    const newSplits = [...splits];
                                                                    // Update name directly here instead of relying on async updateSplit
                                                                    newSplits[idx] = {
                                                                        ...newSplits[idx],
                                                                        participant_name: p.name,
                                                                        is_verified: true,
                                                                        // @ts-ignore - Adding profile_photo dynamically
                                                                        profile_photo: p.photo_url
                                                                    };

                                                                    // Auto select role
                                                                    if (p.type === 'artist') newSplits[idx].role = 'ARTISTA';
                                                                    if (p.type === 'producer') newSplits[idx].role = 'PRODUTOR';
                                                                    if (p.type === 'feat') newSplits[idx].role = 'FEAT';
                                                                    if (p.type === 'label') newSplits[idx].role = 'SELO';

                                                                    setSplits(newSplits);
                                                                    setSearchResults(prev => ({ ...prev, [idx]: [] }));
                                                                }}
                                                            >
                                                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden flex-shrink-0">
                                                                    {p.photo_url ? <img src={p.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-400">{p.name[0]}</div>}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-sm text-gray-900 dark:text-white leading-tight">{p.name}</p>
                                                                    <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{p.type}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </>
                                            )}

                                            <button
                                                onClick={() => {
                                                    const roles = ['ARTISTA', 'FEAT', 'PRODUTOR', 'SELO'];
                                                    const next = roles[(roles.indexOf(split.role) + 1) % roles.length];
                                                    updateSplit(idx, 'role', next);
                                                }}
                                                className="text-[10px] uppercase font-bold text-gray-400 hover:text-purple-600 transition-colors text-left flex items-center gap-1 group/role w-fit mt-0.5 relative z-20"
                                            >
                                                {split.role}
                                                <ChevronsUpDown className="h-3 w-3 opacity-0 group-hover/role:opacity-100 transition-opacity" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Slider Control */}
                                    <div className="flex-1 w-full px-4 py-2">
                                        <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase mb-2">
                                            <span>Participação</span>
                                        </div>
                                        <div className="relative h-3 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer group/slider">
                                            {/* Track Fill */}
                                            <div
                                                className="absolute h-full rounded-full transition-all duration-75"
                                                style={{ width: `${Number(visualPct)}%`, backgroundColor: styles.accent }}
                                            ></div>

                                            {/* Native Slider (Opacity 0) */}
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={Number(visualPct)}
                                                onChange={e => updateSplit(idx, 'percentage', parseFloat(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />

                                            {/* Visual Thumb */}
                                            <div
                                                className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-[3px] rounded-full shadow-md pointer-events-none transition-all duration-75 group-hover/slider:scale-110"
                                                style={{ left: `${Number(visualPct)}%`, borderColor: styles.accent, transform: 'translate(-50%, -50%)' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Percentage Input & Delete */}
                                    <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-end md:justify-start pl-2 border-l border-gray-100 dark:border-gray-800">
                                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-3 py-2 shadow-sm w-[140px] focus-within:ring-2 focus-within:ring-purple-100">
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={visualPct}
                                                onChange={e => updateSplit(idx, 'percentage', e.target.value)}
                                                onBlur={e => {
                                                    let val = parseFloat(e.target.value);
                                                    if (isNaN(val)) val = 0;
                                                    if (val > 100) val = 100;
                                                    if (val < 0) val = 0;
                                                    // updating with formatted number on blur
                                                    updateSplit(idx, 'percentage', parseFloat(val.toFixed(2)));
                                                }}
                                                className="w-full text-right bg-transparent border-none p-0 font-bold text-gray-900 dark:text-white focus:ring-0 text-lg"
                                            />
                                            <span className="text-gray-400 font-bold ml-1 text-sm">%</span>
                                        </div>
                                        <button
                                            onClick={() => removeParticipant(idx)}
                                            className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all"
                                            title="Remover"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Dropzone for new collaborator */}
                        <button
                            onClick={addParticipant}
                            className="w-full py-5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl text-gray-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all font-bold text-sm flex items-center justify-center gap-2 group"
                        >
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                                <Plus className="h-5 w-5" />
                            </div>
                            <span>Adicionar Colaborador</span>
                        </button>
                    </div>
                </div>

                {/* Finalize Button */}
                <div className="flex justify-center pt-8 pb-12">
                    <button
                        onClick={handleSave}
                        disabled={!isValid}
                        className={`px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-purple-500/20 flex items-center gap-2 transition-all transform hover:scale-105 active:scale-95 ${isValid
                            ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED]'
                            : 'bg-gray-200 text-gray-400 dark:bg-gray-800 cursor-not-allowed'}`}
                    >
                        {isValid && <CheckCircle className="h-6 w-6" />}
                        Finalizar Divisão
                    </button>
                </div>

                <p className="text-center text-xs text-gray-400 pb-8 flex items-center justify-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    Todos os colaboradores receberão uma notificação para aprovar esta divisão.
                </p>

            </div>
        </div>
    );
}
