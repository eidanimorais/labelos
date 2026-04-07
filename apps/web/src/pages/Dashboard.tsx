import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, ArrowRight, Activity, Music, Filter, Download, ArrowUp, ArrowDown, FileText } from 'lucide-react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import { getRegionFlag } from '../utils/flags';
import { getCoverUrl } from '../utils/coverUtils';
import { useData } from '../contexts/DataProvider';

const COLORS = [
    '#8B5CF6', // Violet
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#14B8A6'  // Teal
];

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 text-white p-4 rounded-xl shadow-xl border border-gray-800 min-w-[150px]">
                <p className="text-gray-400 text-xs font-semibold uppercase mb-1">{payload[0].payload.name || label}</p>
                <p className="text-xl font-bold text-white">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
                </p>
            </div>
        );
    }
    return null;
};

export function Dashboard() {
    const { dashboardStats, loadDashboard, loadingDashboard } = useData();
    const [tracksToShow, setTracksToShow] = React.useState(10);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [showFilter, setShowFilter] = React.useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loadingDashboard && !dashboardStats) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando dashboard...</div>;
    if (!dashboardStats) return null;

    const stats = dashboardStats;

    // Data Preparation
    const topTrack = stats.charts.top_tracks[0] || { name: 'Nenhuma', artist: '-', value: 0 };
    const totalRevenue = stats.kpis.total_royalties || 1;
    const topTrackShare = Math.round((topTrack.value / totalRevenue) * 100);

    // Map top 5 regions with percentage
    const topRegions = stats.charts.by_territory.slice(0, 5).map((region: any) => ({
        ...region,
        percentage: (region.value / totalRevenue) * 100
    }));

    // Chart Data: Revenue by Quarter (Last 5)
    // Fallback to top tracks if backend isn't updated instantly (just safety check)
    const chartData = stats.charts.revenue_by_quarter || [];

    // Calculate Footer Metrics
    const totalPeriodRevenue = chartData.reduce((acc: number, curr: any) => acc + curr.value, 0);
    const averageRevenue = chartData.length > 0 ? totalPeriodRevenue / chartData.length : 0;
    const startRev = chartData.length > 0 ? chartData[0].value : 0;
    const endRev = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
    const growth = startRev > 0 ? ((endRev - startRev) / startRev) * 100 : 0;

    const getTrackInitial = (name: string) => name.substring(0, 2).toUpperCase();
    const getTrackColor = (idx: number) => {
        const colors = [
            'bg-violet-500',
            'bg-blue-500',
            'bg-emerald-500',
            'bg-amber-500',
            'bg-red-500',
            'bg-pink-500',
            'bg-indigo-500',
            'bg-teal-500'
        ];
        return colors[idx % colors.length];
    };

    const exportToCSV = () => {
        if (!stats.charts.top_tracks) return;

        const headers = ["Faixa", "Artista", "Status", "Streams Totais", "Receita (R$)"];
        const rows = stats.charts.top_tracks.map((t: any) => [
            t.name,
            t.artist,
            "Ativo",
            t.streams,
            t.value.toFixed(2)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `royalties_tracks_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTracks = stats.charts.top_tracks.filter((t: any) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedTracks = filteredTracks.slice(0, tracksToShow);

    return (
        <div className="space-y-8 pb-10">
            {/* Top Row: KPI Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Total Gross Revenue Card (6 cols) */}
                <div className="lg:col-span-6 bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group flex flex-col justify-between">
                    <div className="absolute -top-10 -right-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500"></div>

                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receita Bruta Total</h2>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <span className="text-gray-400 dark:text-gray-500 font-bold text-lg">$</span>
                            </div>
                        </div>
                        <div className="flex items-baseline gap-4 mt-1">
                            <span className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.kpis.total_royalties)}
                            </span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +12,4%
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">em relação ao último trimestre</span>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 relative z-10">
                        <button className="flex-1 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-primary/25 transition-all active:scale-95 flex items-center justify-center gap-2">
                            Financeiro <ArrowRight className="h-5 w-5" />
                        </button>
                        <Link
                            to="/conciliacao"
                            className="flex-1 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <FileText className="h-5 w-5" /> Conciliação
                        </Link>
                    </div>
                </div>

                {/* Top Track Card (3 cols) */}
                <div className="lg:col-span-3 md:col-span-6 bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Faixa</h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <Activity className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                        <h4 className="font-bold text-lg leading-tight line-clamp-2 text-gray-900 dark:text-white">{topTrack.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{topTrack.artist}</p>
                    </div>
                    <div className="mt-6">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(topTrack.value)}
                        </span>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${topTrackShare}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">{((topTrack.value / totalRevenue) * 100).toFixed(2).replace('.', ',')}% da receita total</p>
                    </div>
                </div>

                {/* Active Tracks Card (3 cols) */}
                <div className="lg:col-span-3 md:col-span-6 bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">FONOGRAMAS ATIVOS</h3>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <Music className="h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{stats.kpis.unique_tracks}</span>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Fonogramas ativos nas plataformas</p>
                    </div>
                </div>
            </div>

            {/* Middle Row: Charts & Regions */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Revenue Overview Chart (Top 5 Tracks) - 8 Cols */}
                <div className="lg:col-span-8 bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Visão Geral da Receita Por Trimestre</h3>
                        <Link
                            to="/revenue-report"
                            className="text-sm text-primary font-semibold hover:underline"
                        >
                            Ver Relatório
                        </Link>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    {chartData.map((_: any, index: number) => (
                                        <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                                            <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                                    dy={10}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {chartData.map((_: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={`url(#color-${index})`} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-6 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Total no Período</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPeriodRevenue)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Média Trimestral</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(averageRevenue)}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Crescimento</p>
                            <div className={`text-lg font-bold flex items-center gap-1 ${growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {growth >= 0 ? '+' : ''}{growth.toFixed(1).replace('.', ',')}%
                                {growth >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            </div>
                        </div>
                    </div>
                </div>                    {/* Top Regions - 4 Cols */}
                <div className="lg:col-span-4 bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Top Regiões</h3>
                    </div>

                    <div className="flex-1 space-y-5">
                        {topRegions.map((region: any, idx: number) => (
                            <div key={idx}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{getRegionFlag(region.name)}</span>
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">{region.name}</span>
                                    </div>
                                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                                        {region.percentage.toFixed(2).replace('.', ',')}%
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-red-500' : idx === 2 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                        style={{ width: `${region.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/territories" className="w-full mt-6 py-2.5 text-sm font-semibold text-gray-500 hover:text-primary transition-colors border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 block text-center">
                        Ver todas as regiões
                    </Link>
                </div>
            </div>

            {/* Bottom Row: Track Breakdown Table */}
            <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Detalhamento de Faixas</h3>
                        <span className="bg-gray-100 dark:bg-gray-800 text-xs font-bold px-3 py-1 rounded-full text-gray-500">Lista Completa</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFilter(!showFilter)}
                            className={clsx(
                                "p-2 rounded-lg transition-colors",
                                showFilter ? "bg-primary/10 text-primary" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                        >
                            <Filter className="h-5 w-5" />
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <Download className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {showFilter && (
                    <div className="px-6 pb-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-rounded text-gray-400 text-lg">search</span>
                            <input
                                type="text"
                                placeholder="Filtrar por nome ou artista..."
                                className="w-full bg-gray-50 dark:bg-gray-800/80 border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                <th className="px-6 py-4">Nome da Faixa</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">STREAMS TOTAIS</th>
                                <th className="px-6 py-4 text-right">Receita</th>
                                <th className="px-6 py-4 text-right">Tendência</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {paginatedTracks.map((track: any, idx: number) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 shadow-md bg-gray-100 dark:bg-gray-800 relative group">
                                                <img
                                                    src={getCoverUrl(track.name, track.artist)}
                                                    alt={track.name}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                {/* Fallback Initials */}
                                                <div className={`absolute inset-0 w-full h-full ${getTrackColor(idx)} flex items-center justify-center hidden`}>
                                                    <span className="text-white font-bold text-xs">{getTrackInitial(track.name)}</span>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white truncate min-w-0 max-w-[150px] md:max-w-xs">{track.name}</p>
                                                <p className="text-xs text-gray-500 truncate max-w-[150px] md:max-w-xs">{track.artist}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                            Ativo
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                                            {new Intl.NumberFormat('pt-BR').format(track.streams)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-bold text-sm text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(track.value)}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`text-xs font-bold ${track.trend >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-end gap-0.5`}>
                                            {track.trend > 0 ? <ArrowUp className="h-3 w-3" /> : track.trend < 0 ? <ArrowDown className="h-3 w-3" /> : <div className="h-3 w-3" />}
                                            {Math.abs(track.trend).toFixed(1).replace('.', ',')}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {tracksToShow < filteredTracks.length && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => setTracksToShow(prev => prev + 12)}
                            className="w-full py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-sm font-medium text-gray-500 transition-colors"
                        >
                            Mostrar mais {Math.min(12, filteredTracks.length - tracksToShow)} faixas
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
