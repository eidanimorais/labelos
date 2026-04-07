import { useEffect, useState } from 'react';
import { ArrowLeft, Download, Filter, Music, Users, BarChart2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../lib/api';

interface ChartData {
    name: string;
    value: number;
}

interface ArtistData {
    name: string;
    value: number;
    streams: number;
}

interface TrackData {
    title: string;
    artist: string;
    isrc: string;
    value: number;
    streams: number;
}

interface FullReport {
    revenue_history: ChartData[];
    by_artist: ArtistData[];
    by_track: TrackData[];
}

export function RevenueReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<FullReport | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'artists' | 'tracks'>('overview');
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        try {
            const res = await api.get('/stats/full_report');
            setReport(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !report) {
        return <div className="p-10 text-center text-gray-400">Carregando relatório...</div>;
    }

    const totalRevenue = report.revenue_history.reduce((acc, curr) => acc + curr.value, 0);

    // Filters for tables
    const filteredArtists = report.by_artist.filter(a =>
        a.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredTracks = report.by_track.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.artist.toLowerCase().includes(search.toLowerCase()) ||
        t.isrc.toLowerCase().includes(search.toLowerCase())
    );

    const exportCSV = () => {
        let content = '';
        let filename = '';

        if (activeTab === 'overview') {
            content = "Trimestre,Receita\n" + report.revenue_history.map(r => `${r.name},${r.value.toFixed(2)}`).join('\n');
            filename = 'relatorio_receita_trimestral.csv';
        } else if (activeTab === 'artists') {
            content = "Artista,Streams,Receita\n" + report.by_artist.map(r => `"${r.name}",${r.streams},${r.value.toFixed(2)}`).join('\n');
            filename = 'relatorio_receita_artistas.csv';
        } else {
            content = "Faixa,Artista,ISRC,Streams,Receita\n" + report.by_track.map(r => `"${r.title}","${r.artist}",${r.isrc},${r.streams},${r.value.toFixed(2)}`).join('\n');
            filename = 'relatorio_receita_faixas.csv';
        }

        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/')}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Relatório Completo</h1>
                        <p className="text-gray-500">Análise detalhada de todas as receitas e métricas.</p>
                    </div>
                </div>
                <button
                    onClick={exportCSV}
                    className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    <Download className="h-5 w-5" />
                    Exportar {activeTab === 'overview' ? 'Trimestres' : activeTab === 'artists' ? 'Artistas' : 'Faixas'}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
                    { id: 'artists', label: 'Por Artista', icon: Users },
                    { id: 'tracks', label: 'Por Faixa', icon: Music },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-500/20'
                            : 'bg-white dark:bg-[#1E293B] text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                    >
                        <tab.icon className="h-5 w-5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Big Chart */}
                    <div className="bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Histórico de Receita</h3>
                            <p className="text-sm text-gray-500">Total acumulado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}</p>
                        </div>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={report.revenue_history} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} tickFormatter={(value) => `R$${value / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1F2937', color: '#fff' }}
                                        formatter={(value: any) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Receita']}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Simple Quarter Table */}
                    <div className="bg-white dark:bg-card-dark rounded-[32px] overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase">Trimestre</th>
                                    <th className="px-8 py-5 text-xs font-bold text-gray-500 uppercase text-right">Receita Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {[...report.revenue_history].reverse().map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-8 py-4 font-bold text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-8 py-4 text-right font-mono text-gray-600 dark:text-gray-300">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.value)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'artists' && (
                <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtrar artistas..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-[#8B5CF6] dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase">Artista</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase text-right">Streams</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase text-right">Receita Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredArtists.map((artist, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{artist.name || 'Desconhecido'}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {new Intl.NumberFormat('pt-BR').format(artist.streams)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(artist.value)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'tracks' && (
                <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <div className="relative">
                            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filtrar por nome, artista ou ISRC..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border-none focus:ring-2 focus:ring-[#8B5CF6] dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                <tr>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase">Faixa</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase">Artista</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase">ISRC</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase text-right">Streams</th>
                                    <th className="px-6 py-5 text-xs font-bold text-gray-500 uppercase text-right">Receita Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredTracks.map((track, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{track.title}</td>
                                        <td className="px-6 py-4 text-gray-500">{track.artist}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-400">{track.isrc}</td>
                                        <td className="px-6 py-4 text-right text-gray-500">
                                            {new Intl.NumberFormat('pt-BR').format(track.streams)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(track.value)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
