import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { TrendingUp, Search, Filter, ArrowUpDown, Edit, BarChart2, Download } from 'lucide-react';
import clsx from 'clsx';
import { getCoverUrl } from '../utils/coverUtils';

export function Tracks() {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<string>(''); // '' = All, 'Live' = Ativo, 'Pending' = Pendente
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const LIMIT = 50;

    // Stats State
    const [stats, setStats] = useState({
        totalTracks: 0,
        totalStreams: 0,
        totalRevenue: 0
    });

    // Initial Load: Stats + First Page
    useEffect(() => {
        loadStats();
        loadTracks(0);
    }, []);

    const loadStats = () => {
        api.get('/tracks/count').then(res => {
            setStats({
                totalTracks: res.data.total_tracks,
                totalStreams: res.data.total_streams,
                totalRevenue: res.data.total_revenue
            });
        }).catch(err => console.error("Erro ao carregar stats", err));
    }

    const loadTracks = (pageIndex: number) => {
        setLoading(true);
        const skip = pageIndex * LIMIT;

        // If searching, we might need a different approach or just filter client side?
        // Ideally search should be server-side if paginated.
        // For now, let's keep search client-side ONLY if user is searching (tricky with pagination).
        // BUT user asked for performance. 
        // Simplification: If invalid search, use server pagination. If search, use server search endpoint.

        let endpoint = '/tracks/';
        let params: any = { skip, limit: LIMIT };

        if (searchQuery.trim()) {
            endpoint = '/tracks/search';
            params = { q: searchQuery }; // Search endpoint usually returns list without pagination meta in this MVP
        }

        api.get(endpoint, { params }).then(res => {
            let data = res.data;
            // Client-side status filter if needed (API might not support it directly yet or for simplicity)
            if (selectedStatus) {
                // If status is 'Live', track.status should be 'Live'. If 'Pending', track.status should be 'Pending' (or not 'Live')
                data = data.filter((t: any) => t.status === selectedStatus);
            }
            setTracks(data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar catálogo", err);
            setLoading(false);
        });
    }

    // Effect to reload when selections change
    useEffect(() => {
        loadTracks(0);
    }, [selectedStatus, searchQuery]);

    const handleNext = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        loadTracks(nextPage);
    };

    const handlePrev = () => {
        if (page > 0) {
            const prevPage = page - 1;
            setPage(prevPage);
            loadTracks(prevPage);
        }
    };

    const handleExport = () => {
        const headers = ['Artista', 'Música', 'ISRC', 'Status', 'Streams', 'Receita'];
        const csvRows = [headers.join(',')];

        tracks.forEach(track => {
            let artists = track.artist || 'Unknown';
            if (track.split_summary && track.split_summary.length > 0) {
                artists = track.split_summary.map((s: any) => s.name).join(', ');
            }

            const escape = (text: any) => {
                if (text === null || text === undefined) return '';
                const stringValue = String(text);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            };

            const row = [
                escape(artists),
                escape(track.musica_display),
                escape(track.isrc),
                escape(track.status === 'Live' ? 'Ativo' : 'Pendente'),
                track.total_streams,
                track.total_revenue.toFixed(2)
            ];

            csvRows.push(row.join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'relatorio_isrc.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTrackInitial = (name: string) => name.substring(0, 2).toUpperCase();
    const getTrackColor = (idx: number) => {
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500'];
        return colors[idx % colors.length];
    };

    if (loading && page === 0 && !searchQuery) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando catálogo...</div>;

    return (
        <div className="space-y-6 pb-10">
            {/* Header Removed as per user request for simplicity */}

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
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Streams Mensais</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(stats.totalStreams)}
                        </span>
                        <span className="text-xs font-bold text-green-500 flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3" /> +8.4%
                        </span>
                    </div>
                </div>
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Receita Total</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
                        </span>
                        {/* Avg calculation if needed: stats.totalRevenue / stats.totalTracks */}
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
                            onClick={handleExport}
                            className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                            <Download className="h-4 w-4" />
                            Exportar
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-5">Detalhes da Faixa</th>
                                <th className="px-6 py-5">ISRC</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-6 py-5 text-right whitespace-nowrap">Streams Totais</th>
                                <th className="px-6 py-5 text-right whitespace-nowrap">Receita Total</th>
                                <th className="px-6 py-5 text-center">SPLIT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {tracks.map((track, idx) => (
                                <tr key={track.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            {getCoverUrl(track.musica_display) ? (
                                                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md bg-gray-100 dark:bg-gray-800 relative group">
                                                    <img
                                                        src={getCoverUrl(track.musica_display, track.artist)}
                                                        alt={track.musica_display}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <div className={`absolute inset-0 w-full h-full ${getTrackColor(idx)} flex items-center justify-center hidden`}>
                                                        <span className="text-white font-bold text-xs">{getTrackInitial(track.musica_display)}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={`w-12 h-12 rounded-xl ${getTrackColor(idx)} overflow-hidden flex-shrink-0 shadow-md flex items-center justify-center`}>
                                                    <span className="text-white font-bold text-xs">{getTrackInitial(track.musica_display)}</span>
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{track.musica_display}</p>
                                                <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {(track.artist || 'Unknown').split(', ').map((artistName: string, i: number, arr: string[]) => (
                                                        <React.Fragment key={i}>
                                                            <a
                                                                href={`/artista/${encodeURIComponent(artistName.toLowerCase().replace(/[^a-z0-9]/g, ''))}`}
                                                                className="hover:text-primary hover:underline transition-colors cursor-pointer"
                                                                onClick={(e) => { e.stopPropagation(); }}
                                                            >
                                                                {artistName}
                                                            </a>
                                                            {i < arr.length - 1 && (
                                                                <span className="text-gray-400 dark:text-gray-500 mr-1">,</span>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 font-mono">{track.isrc}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={clsx(
                                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold",
                                            track.status === 'Live' ? "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400"
                                        )}>
                                            <span className={clsx("w-1.5 h-1.5 rounded-full", track.status === 'Live' ? "bg-green-500" : "bg-orange-500")}></span>
                                            {track.status === 'Live' ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR').format(track.total_streams)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(track.total_revenue)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-3">
                                            <a
                                                href={`/isrc/${track.isrc}`}
                                                className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-primary"
                                                title="Ver Gráfico e Splits"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <BarChart2 className="h-4 w-4" />
                                            </a>
                                            <a
                                                href={`/splits/${track.isrc}/editor`}
                                                className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                                title="Editar Splits"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Página <span className="font-bold">{page + 1}</span> ({LIMIT} itens/pág). Total: <span className="font-bold">{stats.totalTracks}</span> faixas</p>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={page === 0}
                            className="px-4 py-2 text-sm font-bold border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={tracks.length < LIMIT}
                            className="px-4 py-2 text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 text-gray-600 dark:text-gray-300"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
}
