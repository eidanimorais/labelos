import { useState, useEffect } from 'react';
import { X, Search, Check, Music } from 'lucide-react';
import { api } from '../lib/api';

interface Track {
    id: number;
    title: string;
    artist: string;
    cover_image?: string;
}

interface ComparisonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (selectedTracks: Track[], period: number) => void;
    currentTrackId?: number; // To exclude current track from search
}

export function ComparisonModal({ isOpen, onClose, onConfirm, currentTrackId }: ComparisonModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [selectedTracks, setSelectedTracks] = useState<Track[]>([]);
    const [period, setPeriod] = useState<number>(28);
    const [, setLoading] = useState(false);



    useEffect(() => {
        if (searchQuery.length > 2) {
            const delayDebounceFn = setTimeout(() => {
                handleSearch();
            }, 500);
            return () => clearTimeout(delayDebounceFn);
        }
    }, [searchQuery]);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/tracks/search?q=${searchQuery}`);
            // Filter out current track and already selected tracks from results (optional, but good UX)
            const filtered = res.data.filter((t: any) => t.id !== currentTrackId);
            setSearchResults(filtered);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTrackSelection = (track: Track) => {
        if (selectedTracks.find(t => t.id === track.id)) {
            setSelectedTracks(selectedTracks.filter(t => t.id !== track.id));
        } else {
            if (selectedTracks.length >= 4) {
                alert("Você pode comparar no máximo 5 músicas (incluindo a atual).");
                return;
            }
            setSelectedTracks([...selectedTracks, track]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-card-dark rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Comparar músicas</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-500 mb-4">Você pode comparar qualquer música dentro dos dois últimos anos.</p>

                    {/* Search Input */}
                    <div className="mb-6">
                        <label className="block text-base font-bold text-gray-900 dark:text-white mb-3">Escolha uma música</label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Busque por nome..."
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none transition-all font-medium text-gray-900 dark:text-white placeholder-gray-400"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Results List */}
                    {(searchResults.length > 0 || selectedTracks.length > 0) && (
                        <div className="mb-6 max-h-48 overflow-y-auto">
                            {/* Selected Tracks First */}
                            {selectedTracks.map(track => (
                                <div key={track.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl cursor-pointer mb-2 border border-blue-100 dark:border-blue-800" onClick={() => toggleTrackSelection(track)}>
                                    <div className="flex items-center gap-4">
                                        {track.cover_image ? (
                                            <img src={track.cover_image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"><Music className="w-6 h-6 text-gray-400" /></div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-base leading-tight">{track.title}</p>
                                            <p className="text-sm text-gray-500 font-medium">{track.artist}</p>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md transform scale-100 transition-transform">
                                        <Check className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            ))}

                            {/* Search Results */}
                            {searchResults.filter(r => !selectedTracks.find(s => s.id === r.id)).map(track => (
                                <div key={track.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl cursor-pointer group transition-all" onClick={() => toggleTrackSelection(track)}>
                                    <div className="flex items-center gap-4">
                                        {track.cover_image ? (
                                            <img src={track.cover_image} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="" />
                                        ) : (
                                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center"><Music className="w-6 h-6 text-gray-400" /></div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-base leading-tight group-hover:text-blue-600 transition-colors">
                                                {/* Fallback to musica_display if title is missing (backend compat) */}
                                                {(track as any).musica_display || track.title || "Sem título"}
                                            </p>
                                            <p className="text-sm text-gray-500 font-medium">{track.artist}</p>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 rounded-full group-hover:border-blue-500 transition-colors"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Period Selector */}
                    <div className="mb-8">
                        <label className="block text-base font-bold text-gray-900 dark:text-white mb-3">Período de Comparação</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { label: '7 dias', val: 7 },
                                { label: '28 dias', val: 28 },
                                { label: '12 meses', val: 365 }
                            ].map((pItem) => (
                                <button
                                    key={pItem.val}
                                    onClick={() => setPeriod(pItem.val)}
                                    className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${period === pItem.val
                                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md'
                                        : 'bg-transparent border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500'
                                        }`}
                                >
                                    {pItem.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button onClick={onClose} className="px-6 py-2 font-bold text-gray-500 hover:text-gray-900 transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirm(selectedTracks, period)}
                            className="px-8 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-full font-bold shadow-lg shadow-indigo-500/20 transition-all transform hover:scale-105"
                        >
                            Pronto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
