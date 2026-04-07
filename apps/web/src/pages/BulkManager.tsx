import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Search, Filter, ArrowUpDown, Upload, Save, FileAudio } from 'lucide-react';
import clsx from 'clsx';
import { getCoverUrl } from '../utils/coverUtils';
import Papa from 'papaparse';

const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    // If already YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
    // If YYYY-MM-DDTHH:mm:ss...
    if (dateString.includes('T')) return dateString.split('T')[0];
    // If DD/MM/YYYY
    if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month}-${day}`;
    }
    return '';
};

export function BulkManager() {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>(''); // '' = All, 'Live' = Ativo, 'Pending' = Pendente
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const LIMIT = 10000;

    // Stats State
    const [stats, setStats] = useState({
        totalTracks: 0,
        complete_registration_count: 0,
        complete_split_count: 0
    });

    // Initial Load: Stats + First Page
    useEffect(() => {
        loadStats();
        loadTracks();
    }, []);

    const loadStats = () => {
        api.get('/tracks/count').then(res => {
            setStats({
                totalTracks: res.data.total_tracks,
                complete_registration_count: res.data.complete_registration_count,
                complete_split_count: res.data.complete_split_count
            });
        }).catch(err => console.error("Erro ao carregar stats", err));
    }

    const loadTracks = () => {
        setLoading(true);
        const skip = 0;

        let endpoint = '/tracks';
        let params: any = { skip, limit: LIMIT };

        if (searchQuery.trim()) {
            endpoint = '/tracks/search';
            params = { q: searchQuery };
        }

        api.get(endpoint, { params }).then(res => {
            let data = res.data;
            if (selectedStatus) {
                data = data.filter((t: any) => t.status === selectedStatus);
            }
            setTracks(data);
            setLoading(false);
        });
    }

    // State to track modified fields: { trackId: { field: value, ... } }
    const [modifiedTracks, setModifiedTracks] = useState<Record<number, Record<string, any>>>({});
    const [isSaving, setIsSaving] = useState(false);

    const handleTrackChange = (trackId: number, field: string, value: any) => {
        setModifiedTracks(prev => ({
            ...prev,
            [trackId]: {
                ...prev[trackId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        if (Object.keys(modifiedTracks).length === 0) {
            toast('Nenhuma alteração para salvar.', { icon: 'ℹ️' });
            return;
        }

        setIsSaving(true);
        try {
            const promises = Object.entries(modifiedTracks).map(([trackId, changes]) =>
                api.patch(`/tracks/${trackId}`, changes)
            );

            await Promise.all(promises);

            toast.success('Alterações salvas com sucesso!');
            setModifiedTracks({}); // Clear changes
            loadTracks(); // Refresh data
        } catch (error) {
            console.error('Erro ao salvar alterações:', error);
            toast.error('Erro ao salvar algumas alterações.');
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        loadTracks();
    }, [selectedStatus, searchQuery]);


    const handleExport = () => {
        const headers = [
            'Capa (URL)',
            'Título',
            'Álbum',
            'Faixa',
            'Formato',
            'Artista Principal',
            'Compositores',
            'Produtor',
            'ISRC',
            'Gênero',
            'Duração',
            'Lançamento',
            'Áudio (URL)'
        ];
        const csvRows = [headers.join(',')];

        tracks.forEach(track => {
            const escape = (text: any) => {
                if (text === null || text === undefined) return '';
                const stringValue = String(text);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            };

            const row = [
                escape(track.cover_image || track.master_cover_url),
                escape(track.musica_display),
                escape(track.album),
                escape(track.track_number),
                escape(track.format),
                escape(track.artist),
                escape(track.composer),
                escape(track.producer),
                escape(track.isrc),
                escape(track.genre),
                escape(track.duration),
                escape(track.release_date ? formatDateForInput(track.release_date) : ''),
                escape(track.master_audio_url)
            ];

            csvRows.push(row.join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'catalogo_completo.csv');
        document.body.appendChild(link);
        link.click();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as any[];
                let updateCount = 0;
                let errorCount = 0;

                const loadingToast = toast.loading(`Processando ${rows.length} linhas...`);

                try {
                    const promises = rows.map(async (row) => {
                        // 1. Find Track by ISRC
                        const isrc = row['ISRC'];
                        if (!isrc) return; // Skip invalid rows

                        const track = tracks.find(t => t.isrc === isrc);
                        if (!track) {
                            console.warn(`Track not found for ISRC: ${isrc}`);
                            return;
                        }

                        // 2. Prepare Update Payload (Map CSV Columns -> DB Fields)
                        const updates: any = {};

                        // Helper to only update if value exists and is different
                        const checkAndUpdate = (field: string, csvValue: any) => {
                            if (csvValue && csvValue != track[field]) { // Loose equality for number/string mismatches
                                updates[field] = csvValue;
                            }
                        };

                        checkAndUpdate('musica_display', row['Título']);
                        checkAndUpdate('album', row['Álbum']);
                        if (row['Faixa']) checkAndUpdate('track_number', parseInt(row['Faixa']));
                        checkAndUpdate('format', row['Formato']);
                        checkAndUpdate('parent_artist', row['Artista Principal']); // Note: Field is 'artist' in local but 'artist_name' in DB update usually
                        // Let's stick to what update_track expects. 
                        // The track object has 'artist' (string name) from the list endpoint.

                        if (row['Artista Principal'] && row['Artista Principal'] !== track.artist) updates.artist = row['Artista Principal'];

                        checkAndUpdate('composer', row['Compositores']);
                        checkAndUpdate('producer', row['Produtor']);
                        checkAndUpdate('genre', row['Gênero']);
                        checkAndUpdate('duration', row['Duração']);
                        checkAndUpdate('release_date', row['Lançamento']);

                        if (Object.keys(updates).length > 0) {
                            try {
                                await api.patch(`/tracks/${track.id}`, updates);
                                updateCount++;
                            } catch (err) {
                                console.error(`Failed to update ${isrc}`, err);
                                errorCount++;
                            }
                        }
                    });

                    await Promise.all(promises);

                    toast.success(`Importação concluída! ${updateCount} atualizados.`);
                    if (errorCount > 0) toast.error(`${errorCount} erros durante a importação.`);

                    loadTracks(); // Refresh UI
                } catch (error) {
                    console.error("Critical import error", error);
                    toast.error("Erro crítico na importação.");
                } finally {
                    toast.dismiss(loadingToast);
                    // Reset input
                    event.target.value = '';
                }
            }
        });
    };

    const getTrackInitial = (name: string) => name.substring(0, 2).toUpperCase();
    const getTrackColor = (idx: number) => {
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500'];
        return colors[idx % colors.length];
    };

    if (loading && !searchQuery) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando catálogo...</div>;

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Catálogo</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTracks}</span>
                        <span className="text-xs font-medium text-gray-500">ISRCs</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cadastro Completo</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.complete_registration_count}
                        </span>
                        <span className="text-xs font-medium text-gray-500">Faixas</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Split Completo</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats.complete_split_count}
                        </span>
                        <span className="text-xs font-medium text-gray-500">Faixas</span>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Custom Toolbar */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary text-gray-900 dark:text-white placeholder-gray-400 outline-none transition-all"
                            placeholder="Pesquisar (use ';' para múltiplos termos)..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto relative">
                        <div className="relative">
                            <button
                                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                className={clsx(
                                    "flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all",
                                    selectedStatus ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                )}
                            >
                                <Filter className="h-4 w-4" />
                                {selectedStatus === 'Live' ? 'Ativo' : selectedStatus === 'Pending' ? 'Pendente' : 'Status'}
                            </button>
                            {showStatusDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-40 bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 py-1">
                                    <button onClick={() => { setSelectedStatus(''); setShowStatusDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">Todos</button>
                                    <button onClick={() => { setSelectedStatus('Live'); setShowStatusDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-green-600 font-bold">Ativo</button>
                                    <button onClick={() => { setSelectedStatus('Pending'); setShowStatusDropdown(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-orange-600 font-bold">Pendente</button>
                                </div>
                            )}
                        </div>
                        <button className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all">
                            <ArrowUpDown className="h-4 w-4" />
                            Ordenar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || Object.keys(modifiedTracks).length === 0}
                            className={clsx(
                                "flex-1 md:flex-none px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm",
                                isSaving || Object.keys(modifiedTracks).length === 0
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                    : "bg-primary text-white hover:bg-primary/90 shadow-primary/20"
                            )}
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            Exportar
                        </button>
                        <label className="flex-1 md:flex-none px-4 py-2 bg-gray-900 dark:bg-white rounded-xl text-sm font-bold text-white dark:text-gray-900 flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all cursor-pointer shadow-lg shadow-gray-900/20">
                            <Upload className="h-4 w-4" />
                            Importar CSV
                            <input
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={handleImport}
                            />
                        </label>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold border-b border-gray-100 dark:border-gray-800">
                                <th className="px-2 py-4 text-center w-14 border-r border-gray-100 dark:border-gray-800/50">#</th>
                                <th className="px-2 py-4 text-center w-20 border-r border-gray-100 dark:border-gray-800/50">Capa</th>
                                <th className="px-4 py-4 w-64 border-r border-gray-100 dark:border-gray-800/50">Título</th>
                                <th className="px-4 py-4 w-48 border-r border-gray-100 dark:border-gray-800/50">Álbum</th>
                                <th className="px-2 py-4 text-center w-14 border-r border-gray-100 dark:border-gray-800/50">Faixa</th>
                                <th className="px-4 py-4 w-20 border-r border-gray-100 dark:border-gray-800/50">Formato</th>
                                <th className="px-4 py-4 w-56 border-r border-gray-100 dark:border-gray-800/50">Artista Principal</th>
                                <th className="px-4 py-4 w-56 border-r border-gray-100 dark:border-gray-800/50">Compositores</th>
                                <th className="px-4 py-4 w-40 border-r border-gray-100 dark:border-gray-800/50">Produtor</th>
                                <th className="px-4 py-4 w-36 border-r border-gray-100 dark:border-gray-800/50">ISRC</th>
                                <th className="px-4 py-4 w-40 border-r border-gray-100 dark:border-gray-800/50">Gênero</th>
                                <th className="px-4 py-4 w-24 border-r border-gray-100 dark:border-gray-800/50">Duração</th>
                                <th className="px-4 py-4 w-40 border-r border-gray-100 dark:border-gray-800/50">Lançamento</th>
                                <th className="px-4 py-4 w-40 text-center">Áudio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tracks.map((track, idx) => (
                                <tr key={track.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-800/50">
                                        <span className="text-xs font-mono text-gray-400 font-medium">
                                            {idx + 1}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-800/50">
                                        <label className="relative block w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 shadow-sm bg-gray-100 dark:bg-gray-800 mx-auto group cursor-pointer hover:ring-2 hover:ring-primary hover:ring-offset-1 dark:hover:ring-offset-card-dark transition-all">
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        console.log(`Upload capa para track ${track.id}:`, file);
                                                        // TODO: Implement actual upload logic
                                                    }
                                                }}
                                            />
                                            {(track.cover_image || track.master_cover_url || track.cover_url || getCoverUrl(track.musica_display)) ? (
                                                <img
                                                    src={track.cover_image || track.master_cover_url || track.cover_url || getCoverUrl(track.musica_display, track.artist)}
                                                    alt={track.musica_display}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : (
                                                <div className={`w-full h-full ${getTrackColor(idx)} flex items-center justify-center`}>
                                                    <span className="text-white font-bold text-[10px]">{getTrackInitial(track.musica_display)}</span>
                                                </div>
                                            )}

                                            {/* Fallback hidden div for error handling reference */}
                                            <div className={`hidden w-full h-full ${getTrackColor(idx)} flex items-center justify-center absolute inset-0`}>
                                                <span className="text-white font-bold text-[10px]">{getTrackInitial(track.musica_display)}</span>
                                            </div>

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]">
                                                <Upload className="w-4 h-4 text-white drop-shadow-md" />
                                            </div>
                                        </label>
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <div className="px-4 py-3">
                                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate" title={track.musica_display}>
                                                {track.musica_display}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <input
                                            type="text"
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-gray-600 dark:text-gray-300 focus:bg-primary/5 focus:ring-0 outline-none transition-colors"
                                            placeholder="-"
                                            defaultValue={track.album || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'album', e.target.value)}
                                        />
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0 text-center">
                                        <input
                                            type="number"
                                            className="w-full h-full bg-transparent border-none px-2 py-3 text-sm text-center text-gray-500 font-mono focus:bg-primary/5 focus:ring-0 outline-none transition-colors appearance-none"
                                            placeholder="-"
                                            defaultValue={track.track_number || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'track_number', parseInt(e.target.value))}
                                        />
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0 text-center">
                                        <select
                                            className="w-full h-full bg-transparent border-none px-2 py-3 text-xs font-bold uppercase text-gray-600 dark:text-gray-300 text-center focus:bg-primary/5 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                                            defaultValue={track.format || 'Single'}
                                            onChange={(e) => handleTrackChange(track.id, 'format', e.target.value)}
                                        >
                                            <option value="Single">Single</option>
                                            <option value="XP">EP</option>
                                            <option value="Album">Album</option>
                                        </select>
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <input
                                            type="text"
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 focus:bg-primary/5 focus:ring-0 outline-none transition-colors"
                                            placeholder="Nome do Artista"
                                            defaultValue={track.artist || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'artist_name', e.target.value)}
                                        />
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <input
                                            type="text"
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 focus:bg-primary/5 focus:ring-0 outline-none transition-colors"
                                            placeholder="Nome Completo"
                                            defaultValue={track.composer || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'composer', e.target.value)}
                                        />
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <input
                                            type="text"
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-gray-600 dark:text-gray-300 placeholder-gray-300 dark:placeholder-gray-600 focus:bg-primary/5 focus:ring-0 outline-none transition-colors"
                                            placeholder="Produtor"
                                            defaultValue={track.producer || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'producer', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 border-r border-gray-100 dark:border-gray-800/50">
                                        <span className="text-sm text-gray-600 dark:text-gray-300 px-2 py-1">
                                            {track.isrc}
                                        </span>
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <select
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-gray-600 dark:text-gray-300 focus:bg-primary/5 focus:ring-0 outline-none transition-colors appearance-none cursor-pointer"
                                            defaultValue={track.genre || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'genre', e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Trap">Trap</option>
                                            <option value="Hip Hop/Rap">Hip Hop/Rap</option>
                                            <option value="Hip-Hop">Hip-Hop</option>
                                            <option value="Funk">Funk</option>
                                            <option value="Rap">Rap</option>
                                            <option value="Pop">Pop</option>
                                            <option value="R&B">R&B</option>
                                        </select>
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0 text-center">
                                        <input
                                            type="text"
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-center text-gray-600 dark:text-gray-300 focus:bg-primary/5 focus:ring-0 outline-none transition-colors"
                                            placeholder=""
                                            defaultValue={track.duration || ''}
                                            onChange={(e) => handleTrackChange(track.id, 'duration', e.target.value)}
                                        />
                                    </td>
                                    <td className="border-r border-gray-100 dark:border-gray-800/50 p-0">
                                        <input
                                            type="date"
                                            className="w-full h-full bg-transparent border-none px-4 py-3 text-sm text-gray-600 dark:text-gray-300 focus:bg-primary/5 focus:ring-0 outline-none transition-colors"
                                            defaultValue={formatDateForInput(track.release_date)}
                                            onChange={(e) => handleTrackChange(track.id, 'release_date', e.target.value)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {track.master_audio_url ? (
                                            <a
                                                href={track.master_audio_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                                                title="Áudio disponível (WAV)"
                                            >
                                                <FileAudio className="w-4 h-4" />
                                            </a>
                                        ) : (
                                            <button className="w-full py-2 px-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2">
                                                Upload
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total: <span className="font-bold">{tracks.length}</span> faixas carregadas</p>
                </div>
            </div>
        </div >
    );
}
