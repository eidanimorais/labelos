import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Download, TrendingUp, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import { getCoverUrl } from '../utils/coverUtils';

export function Songs() {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string | null, direction: 'asc' | 'desc' | null }>({
        key: 'total_revenue', // Default sort
        direction: 'desc'
    });

    // Filter States
    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [selectedDSP, setSelectedDSP] = useState<string>('');
    const [availablePeriods, setAvailablePeriods] = useState<string[]>([]);
    const [availableDSPs, setAvailableDSPs] = useState<string[]>([]);
    const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
    const [showDSPDropdown, setShowDSPDropdown] = useState(false);

    // Pagination State
    const [page, setPage] = useState(0);
    const LIMIT = 50;

    // Stats State
    const [stats, setStats] = useState({
        totalTracks: 0,
        totalStreams: 0,
        totalRevenue: 0
    });

    const toggleExpand = (id: number) => {
        if (expandedTrackId === id) setExpandedTrackId(null);
        else setExpandedTrackId(id);
    };

    // Initial Load
    useEffect(() => {
        loadStats();
        loadTracks(0);
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            const [qRes, pRes] = await Promise.all([
                api.get('/tracks/quarters'),
                api.get('/tracks/platforms')
            ]);
            setAvailablePeriods(qRes.data);
            setAvailableDSPs(pRes.data);
        } catch (err) {
            console.error("Erro ao carregar filtros", err);
        }
    };

    const loadStats = (p = selectedPeriod, d = selectedDSP) => {
        const params: any = {};
        if (p) params.trimestre = p;
        if (d) params.platform = d;

        api.get('/tracks/count', { params }).then(res => {
            setStats({
                totalTracks: res.data.total_tracks,
                totalStreams: res.data.total_streams,
                totalRevenue: res.data.total_revenue
            });
        }).catch(err => console.error("Erro ao carregar stats", err));
    }

    const loadTracks = (pageIndex: number, newSortConfig = sortConfig, p = selectedPeriod, d = selectedDSP, q = searchQuery) => {
        setLoading(true);
        const skip = pageIndex * LIMIT;

        const params: any = {
            skip,
            limit: LIMIT,
            sort_by: newSortConfig.key || "total_revenue",
            sort_order: newSortConfig.direction || "desc"
        };

        if (p) params.trimestre = p;
        if (d) params.platform = d;
        if (q) params.q = q;

        api.get('/tracks/grouped', { params }).then(res => {
            setTracks(res.data);
            setLoading(false);
        }).catch(err => {
            console.error("Erro ao carregar catálogo:", err);
            setLoading(false);
        });
    }

    // Effect to reload when searchQuery changes
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(0);
            loadTracks(0);
        }, 300); // Small debounce
        return () => clearTimeout(timer);
    }, [searchQuery]);

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

    // Sorting Logic
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'desc';
        if (sortConfig.key === key) {
            if (sortConfig.direction === 'desc') direction = 'asc';
            else if (sortConfig.direction === 'asc') direction = 'desc'; // Cycle: Desc -> Asc -> Desc (per user request "one time top-down, second time bottom-up")
            // Note: USER said "third time undoes it". Let's implement that.
            if (sortConfig.direction === 'asc') direction = null;
        }

        const newConfig = { key: direction ? key : null, direction };
        setSortConfig(newConfig);
        setPage(0);
        loadTracks(0, newConfig);
    };

    const handlePeriodChange = (period: string) => {
        const newValue = period === selectedPeriod ? '' : period;
        setSelectedPeriod(newValue);
        setShowPeriodDropdown(false);
        setPage(0);
        loadTracks(0, sortConfig, newValue, selectedDSP);
        loadStats(newValue, selectedDSP);
    };

    const handleDSPChange = (dsp: string) => {
        const newValue = dsp === selectedDSP ? '' : dsp;
        setSelectedDSP(newValue);
        setShowDSPDropdown(false);
        setPage(0);
        loadTracks(0, sortConfig, selectedPeriod, newValue);
        loadStats(selectedPeriod, newValue);
    };

    const filteredTracks = tracks;

    const getTrackInitial = (name: string) => name.substring(0, 2).toUpperCase();
    const getTrackColor = (idx: number) => {
        const colors = ['bg-pink-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500'];
        return colors[idx % colors.length];
    };

    const slugify = (text: string) => {
        return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
    };

    const handleExport = () => {
        const headers = ['Artista', 'Música', 'ISRC', 'Status', 'Streams', 'Receita'];
        const csvRows = [headers.join(',')];

        // Export only current page to avoid memory issues, or fetch all?
        // User expects all usually. But strictly for performance on UI, we use the loaded tracks.
        // Ideally export should be a backend streaming endpoint.
        // For MVP, we export what is visible or disable.
        // Let's rely on standard 'tracks' (current page) to prevent browser crash.

        filteredTracks.forEach(track => {
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
        link.setAttribute('download', 'catalogo_royalties.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading && page === 0) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando catálogo...</div>;
    return (
        <div className="space-y-6 pb-10">
            {/* Header Removed as per user request */}

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
                            placeholder="Pesquisar nesta página..."
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative">
                            <button
                                onClick={() => { setShowDSPDropdown(!showDSPDropdown); setShowPeriodDropdown(false); }}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all",
                                    selectedDSP ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                )}
                            >
                                <Filter className="h-4 w-4" />
                                {selectedDSP || "DSP"}
                            </button>
                            {showDSPDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                                    <button
                                        onClick={() => handleDSPChange('')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-bold"
                                    >
                                        Todas as DSPs
                                    </button>
                                    {availableDSPs.map(dsp => (
                                        <button
                                            key={dsp}
                                            onClick={() => handleDSPChange(dsp)}
                                            className={clsx(
                                                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                                selectedDSP === dsp ? "text-primary font-bold bg-primary/5" : "text-gray-600 dark:text-gray-400"
                                            )}
                                        >
                                            {dsp}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => { setShowPeriodDropdown(!showPeriodDropdown); setShowDSPDropdown(false); }}
                                className={clsx(
                                    "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all",
                                    selectedPeriod ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                                )}
                            >
                                <ArrowUpDown className="h-4 w-4" />
                                {selectedPeriod || "Período"}
                            </button>
                            {showPeriodDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-50 py-1">
                                    <button
                                        onClick={() => handlePeriodChange('')}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-600 dark:text-gray-400 font-bold"
                                    >
                                        Todo o Período
                                    </button>
                                    {availablePeriods.map(p => (
                                        <button
                                            key={p}
                                            onClick={() => handlePeriodChange(p)}
                                            className={clsx(
                                                "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50",
                                                selectedPeriod === p ? "text-primary font-bold bg-primary/5" : "text-gray-600 dark:text-gray-400"
                                            )}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
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
                                <th className="px-6 py-5">Versões</th>
                                <th className="px-6 py-5">Status</th>
                                <th
                                    className="px-6 py-5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => handleSort('total_streams')}
                                >
                                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                        Streams Totais
                                        <ArrowUpDown className={clsx("h-3 w-3", sortConfig.key === 'total_streams' ? "text-primary" : "text-gray-300")} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => handleSort('total_revenue')}
                                >
                                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                        Receita Total
                                        <ArrowUpDown className={clsx("h-3 w-3", sortConfig.key === 'total_revenue' ? "text-primary" : "text-gray-300")} />
                                    </div>
                                </th>
                                <th
                                    className="px-6 py-5 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                                    onClick={() => handleSort('trend')}
                                >
                                    <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                        Tendência
                                        <ArrowUpDown className={clsx("h-3 w-3", sortConfig.key === 'trend' ? "text-primary" : "text-gray-300")} />
                                    </div>
                                </th>
                                <th className="px-6 py-5 text-center">Detalhes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredTracks.map((track, idx) => (
                                <React.Fragment key={track.id}>
                                    <tr
                                        onClick={() => toggleExpand(track.id)}
                                        className={`cursor-pointer transition-colors group ${expandedTrackId === track.id ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
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
                                                <div>
                                                    <Link
                                                        to={`/songs/${slugify(track.musica_normalizada || track.musica_display)}`}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="font-bold text-sm text-gray-900 dark:text-white truncate max-w-[200px] hover:text-[#8B5CF6] hover:underline transition-colors block"
                                                    >
                                                        {track.musica_display}
                                                    </Link>
                                                    <div className="flex flex-wrap items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                        {(track.artist || 'Unknown').split(', ').map((artistName: string, i: number, arr: string[]) => (
                                                            <React.Fragment key={i}>
                                                                <span className="text-gray-600 dark:text-gray-400">{artistName}</span>
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
                                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                                {track.children ? track.children.length : 1}
                                            </span>
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
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <span className={clsx(
                                                    "text-sm font-bold",
                                                    track.trend === null ? "text-gray-400" : track.trend > 0 ? "text-green-500" : track.trend < 0 ? "text-red-500" : "text-gray-400"
                                                )}>
                                                    {track.trend === null ? '-' : `${track.trend > 0 ? '+' : ''}${track.trend.toFixed(1)}%`}
                                                </span>
                                                {track.trend !== null && (
                                                    <TrendingUp className={clsx(
                                                        "h-4 w-4",
                                                        track.trend > 0 ? "text-green-500" : track.trend < 0 ? "text-red-500 rotate-180" : "text-gray-400"
                                                    )} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center text-gray-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(track.id); }}
                                                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                                >
                                                    {expandedTrackId === track.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </button>
                                                <Link
                                                    to={`/songs/${slugify(track.musica_normalizada || track.musica_display)}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                    title="Ver Detalhes da Música"
                                                >
                                                    <TrendingUp className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Versions List */}
                                    {expandedTrackId === track.id && track.children && (
                                        <tr className="bg-gray-50 dark:bg-gray-800/30">
                                            <td colSpan={6} className="px-8 py-6">
                                                <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                                    <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Versões Disponíveis ({track.children.length})</span>
                                                    </div>
                                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                        {track.children.map((version: any, i: number) => (
                                                            <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="bg-gray-200 dark:bg-gray-700 w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                        V{i + 1}
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center gap-2">
                                                                            <Link
                                                                                to={`/tracks/${version.isrc}`}
                                                                                className="font-mono text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary hover:underline transition-colors"
                                                                            >
                                                                                {version.isrc}
                                                                            </Link>
                                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-500 uppercase">ISRC</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-10">
                                                                    <div className="text-right">
                                                                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Streams</span>
                                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{new Intl.NumberFormat('pt-BR').format(version.total_streams)}</span>
                                                                    </div>
                                                                    <div className="text-right w-24">
                                                                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Receita</span>
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(version.total_revenue)}</span>
                                                                    </div>
                                                                    <div className="text-right w-16">
                                                                        <span className="block text-[10px] text-gray-400 uppercase font-bold">Tend.</span>
                                                                        <div className="flex items-center justify-end gap-0.5">
                                                                            <span className={clsx(
                                                                                "text-[11px] font-bold",
                                                                                version.trend === null ? "text-gray-400" : version.trend > 0 ? "text-green-500" : version.trend < 0 ? "text-red-500" : "text-gray-400"
                                                                            )}>
                                                                                {version.trend === null ? '-' : `${version.trend > 0 ? '+' : ''}${Math.round(version.trend)}%`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Página <span className="font-bold">{page + 1}</span> ({LIMIT} itens/pág). Total Catálogo: <span className="font-bold">{stats.totalTracks}</span> ISRCs</p>
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
        </div>
    );
}
