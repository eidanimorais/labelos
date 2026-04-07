import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, BarChart2, Music } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import { ComparisonModal } from '../components/ComparisonModal';

export function SongDetails() {
    const { name } = useParams(); // 'name' here is actually the slug
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Comparison State
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [comparisonData, setComparisonData] = useState<any>(null); // merged data for chart
    const [comparisonMeta, setComparisonMeta] = useState<any[]>([]); // metadata for legend/lines
    const [activePeriod, setActivePeriod] = useState(28);
    const [selectedMonthOffset, setSelectedMonthOffset] = useState(-1); // 0 = Current, 1 = Last, 2 = 2 Ago

    useEffect(() => {
        if (!name) return;
        loadData();
    }, [name]);

    const loadData = () => {
        api.get(`/stats/song/${name}`)
            .then(res => {
                setData(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load song details", err);
                setLoading(false);
            });
    };

    const handleToggleStatus = async (isrc: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Live' ? 'Takedown' : 'Live';
        try {
            await api.put(`/tracks/${isrc}`, { display_status: newStatus });
            // Optimistic update or reload
            const updatedVersions = data.versions.map((v: any) => {
                if (v.isrc === isrc) {
                    return { ...v, display_status: newStatus };
                }
                return v;
            });
            setData({ ...data, versions: updatedVersions });
        } catch (error) {
            console.error("Failed to update status", error);
            alert("Erro ao atualizar status.");
        }
    };

    const handleComparisonConfirm = async (selectedTracks: any[], period: number) => {
        setIsComparisonModalOpen(false);
        setActivePeriod(period);

        // Include current track in the request if not already there (though backend handles it)
        // We need the ID of the current track. data.id is available?
        // Wait, data.id might be available from loadData. 
        // Let's assume data.id exists.

        const ids = [data.id, ...selectedTracks.map(t => t.id)].join(",");

        try {
            const res = await api.get(`/stats/compare?track_ids=${ids}&period=${period}`);
            const results = res.data.results;

            // Merge Data for Recharts
            // Base array on the longest period data (usually all should match limit, but simpler to iterate period)
            const mergedData = [];
            for (let i = 0; i < period; i++) {
                const dayObj: any = { day: `Dia ${i + 1}`, index: i };
                results.forEach((trackRes: any) => {
                    if (trackRes.data[i]) {
                        dayObj[`track_${trackRes.track_id}`] = trackRes.data[i].value;
                        // Keep date label from the first track (or current) for reference? 
                        // Actually comparison is "Day 1", "Day 2", so real dates differ.
                    }
                });
                mergedData.push(dayObj);
            }

            setComparisonData(mergedData);
            setComparisonMeta(results.map((r: any) => ({
                id: r.track_id,
                title: r.title,
                artist: r.artist,
                color: r.track_id === data.id ? '#3B82F6' : undefined, // Main track blue, others auto
                total_period: r.total_period,
                cover: r.cover_image
            })));

        } catch (error) {
            console.error("Comparison failed", error);
            alert("Erro ao carregar comparativo.");
        }
    };

    const getFilteredHistory = () => {
        if (!data?.analytics_history) return [];

        if (selectedMonthOffset === -1) {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 28);

            const formatDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            const startStr = formatDate(startDate);
            const endStr = formatDate(endDate);

            return data.analytics_history.filter((d: any) => d.full_date >= startStr && d.full_date <= endStr);
        }

        const targetDate = new Date();
        targetDate.setDate(15); // Avoid edge cases when substracting months from 31st (e.g. Feb)
        targetDate.setMonth(targetDate.getMonth() - selectedMonthOffset);

        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;

        return data.analytics_history.filter((d: any) => d.full_date.startsWith(prefix));
    };

    const chartData = getFilteredHistory();

    const getMonthLabel = (offset: number) => {
        const date = new Date();
        date.setDate(15);
        date.setMonth(date.getMonth() - offset);
        return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' })
            .format(date)
            .replace('.', '')
            .toUpperCase();
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando detalhes da música...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Música não encontrada.</div>;

    const mainArtist = data?.artist || (data?.versions && data.versions[0]?.artist) || 'Unknown';

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => navigate('/songs')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{data.display_title || data.title}</h1>
                        <div className="flex items-center gap-3 mt-1 text-gray-500 dark:text-gray-400">
                            <span className="font-bold uppercase tracking-wider text-xs">{mainArtist}</span>
                            <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                            <span className="font-mono text-xs border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">
                                {data.versions.length} VERSÕES
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Section (2 cols) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* KPI Cards Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Receita Total */}
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Receita Total</span>
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_revenue)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg w-fit">
                                <span>Agregado de todas as versões</span>
                            </div>
                        </div>

                        {/* 2. Streams Totais */}
                        {/* 2. Streams Totais */}
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Streams Totais</span>
                                <span className="text-3xl font-extrabold text-[#8B5CF6]">
                                    {new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(data.total_streams)}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5 mt-auto">
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span>Spotify: {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(data.spotify_streams)}</span>
                                </div>
                            </div>
                        </div>

                        {/* 3. Versões Ativas */}
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
                            <div className="flex flex-col gap-1 relative z-10">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Versões Ativas</span>
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    {data.versions.filter((v: any) => (v.display_status || 'Live') === 'Live').length}
                                </span>
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-medium relative z-10">
                                de {data.versions.length} fonogramas cadastrados
                            </div>
                        </div>
                    </div>

                    {/* Spotify Analytics Chart (Daily) */}
                    {(chartData && chartData.length > 0) && (
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                            <div className="mb-6">
                                <div className="flex items-baseline justify-between">
                                    <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                        Streams
                                        {!comparisonData && (
                                            <span className="text-xs font-normal text-gray-400/70 dark:text-gray-500/70 ml-1">
                                                • {chartData.length > 0 ? `${chartData[0].date} - ${chartData[chartData.length - 1].date}` : ''}
                                            </span>
                                        )}
                                    </h3>
                                    <button
                                        onClick={() => setIsComparisonModalOpen(true)}
                                        className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-full transition-colors flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 duration-200"
                                    >
                                        <BarChart2 className="w-4 h-4" />
                                        Comparar músicas
                                    </button>
                                </div>
                            </div>

                            <div className="h-[300px] w-full mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    {comparisonData ? (
                                        <AreaChart data={comparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke="#E5E7EB" opacity={1} />
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                                minTickGap={30}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                                tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                                                                {payload.map((entry: any, idx: number) => {
                                                                    const meta = comparisonMeta.find(m => `track_${m.id}` === entry.dataKey);
                                                                    return (
                                                                        <div key={idx} className="flex items-center gap-2">
                                                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                                                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                                                {meta?.title}: {new Intl.NumberFormat('pt-BR').format(entry.value)}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            {comparisonMeta.map((meta, idx) => (
                                                <Area
                                                    key={meta.id}
                                                    type="monotone"
                                                    dataKey={`track_${meta.id}`}
                                                    stroke={meta.color || ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][idx % 4]}
                                                    strokeWidth={meta.id === data.id ? 3 : 2}
                                                    strokeDasharray={meta.id === data.id ? undefined : "4 4"}
                                                    fillOpacity={meta.id === data.id ? 1 : 0}
                                                    fill={meta.id === data.id ? "url(#colorMain)" : "transparent"}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            ))}
                                        </AreaChart>
                                    ) : (
                                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} stroke="#E5E7EB" opacity={1} />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                                dy={10}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                                tickFormatter={(value) => new Intl.NumberFormat('pt-BR').format(value)}
                                            />
                                            <Tooltip
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700">
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
                                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                                    {new Intl.NumberFormat('pt-BR').format(payload[0].value as number)}
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#3B82F6"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        </AreaChart>
                                    )}
                                </ResponsiveContainer>
                            </div>

                            {/* Footer Metrics - Adaptive */}
                            {comparisonData ? (
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Streams acumulados ({activePeriod} dias)
                                    </div>
                                    <div className="space-y-3">
                                        {comparisonMeta.map((meta) => (
                                            <div key={meta.id} className="flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    {meta.cover ? (
                                                        <img src={meta.cover} className="w-8 h-8 rounded bg-gray-100" />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                                            <Music className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                                            {meta.title}
                                                            {meta.id === data.id && <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Atual</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    {new Intl.NumberFormat('pt-BR').format(meta.total_period)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-gray-900 dark:text-white">Mundo</span>
                                    </div>

                                    <div className="flex gap-4 md:gap-8 text-right">
                                        <div
                                            className={`hidden md:block cursor-pointer transition-opacity ${selectedMonthOffset === 2 ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                            onClick={() => setSelectedMonthOffset(2)}
                                        >
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{getMonthLabel(2)}</p>
                                            <p className={`font-medium text-sm ${selectedMonthOffset === 2 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {new Intl.NumberFormat('pt-BR').format((data.analytics_period as any)?.two_months_ago || 0)}
                                            </p>
                                        </div>
                                        <div
                                            className={`hidden md:block cursor-pointer transition-opacity ${selectedMonthOffset === 1 ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                            onClick={() => setSelectedMonthOffset(1)}
                                        >
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{getMonthLabel(1)}</p>
                                            <p className={`font-medium text-sm ${selectedMonthOffset === 1 ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {new Intl.NumberFormat('pt-BR').format(data.analytics_period?.previous || 0)}
                                            </p>
                                        </div>
                                        <div
                                            className={`cursor-pointer transition-opacity ${selectedMonthOffset === 0 ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                            onClick={() => setSelectedMonthOffset(0)}
                                        >
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">{getMonthLabel(0)}</p>
                                            <p className={`font-bold text-sm ${selectedMonthOffset === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                {new Intl.NumberFormat('pt-BR').format(data.analytics_period?.current || 0)}
                                            </p>
                                        </div>
                                        <div
                                            className={`cursor-pointer transition-opacity ${selectedMonthOffset === -1 ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                                            onClick={() => setSelectedMonthOffset(-1)}
                                        >
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Últimos 28 Dias</p>
                                            <p className={`font-bold text-sm ${selectedMonthOffset === -1 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                {new Intl.NumberFormat('pt-BR').format((data.analytics_period as any)?.last_28_days || 0)}
                                            </p>
                                        </div>
                                        <div className="min-w-[70px]">
                                            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Crescimento</p>
                                            <p className={`font-bold text-sm ${(data.analytics_period?.change_pct || 0) >= 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-end gap-1`}>
                                                {(data.analytics_period?.change_pct || 0) >= 0 ? '▲' : '▼'}
                                                {Math.abs(data.analytics_period?.change_pct || 0).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Chart */}
                    <div className="bg-white dark:bg-card-dark p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <BarChart2 className="h-4 w-4 text-gray-400" />
                                Histórico de Receita
                            </h3>
                            <span className="text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-1 rounded-full">Trimestral</span>
                        </div>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.timeline} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        {data.timeline.map((_: any, index: number) => (
                                            <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'][index % 8]} stopOpacity={1} />
                                                <stop offset="100%" stopColor={['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#6366F1', '#14B8A6'][index % 8]} stopOpacity={0.4} />
                                            </linearGradient>
                                        ))}
                                    </defs>
                                    <XAxis
                                        dataKey="trimestre"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-gray-900 text-white p-4 rounded-xl shadow-xl border border-gray-800 min-w-[150px]">
                                                        <p className="text-gray-400 text-xs font-semibold uppercase mb-1">{label}</p>
                                                        <p className="text-xl font-bold text-white">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value as number)}
                                                        </p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                        {data.timeline.map((_: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={`url(#color-${index})`} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* ROI Status Card (Aggregated) */}
                    <div className="relative overflow-hidden rounded-[32px] p-8 shadow-xl">
                        {/* Purple Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9]"></div>

                        {/* Decorative Chart Icon Background */}
                        <div className="absolute top-0 right-0 p-6 opacity-20 transform scale-150 translate-x-4 -translate-y-4">
                            <BarChart2 className="w-32 h-32 text-white" />
                        </div>

                        <div className="relative z-10 text-white">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider opacity-90 mb-1">Streams Totais (Spotify)</p>
                                    <h3 className="text-4xl font-extrabold tracking-tight">
                                        {data.spotify_streams
                                            ? (data.spotify_streams >= 1000
                                                ? `${(data.spotify_streams / 1000).toFixed(1)}k`
                                                : data.spotify_streams)
                                            : '0'}
                                    </h3>
                                </div>
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <BarChart2 className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* ROI Calculations */}
                            {(() => {
                                const investment = data.total_production_cost || 0;
                                const spotifyStreams = data.spotify_streams || 0;
                                const streamValue = 0.007; // R$ 0,007 per stream
                                const labelShare = 0.40; // 40%

                                // Meta: Quando (Streams * 0.007 * 0.40) >= Investment
                                // Logo: StreamsNecessarios = Investment / (0.007 * 0.40)
                                const revenuePerStream = streamValue * labelShare;
                                const targetStreams = investment > 0 ? investment / revenuePerStream : 0;

                                const currentGeneratedRevenue = spotifyStreams * revenuePerStream;
                                const progress = targetStreams > 0 ? Math.min((spotifyStreams / targetStreams) * 100, 100) : (investment === 0 ? 100 : 0);

                                return (
                                    <>
                                        <div className="flex justify-between items-end mb-4 mt-8">
                                            <span className="text-sm font-medium opacity-90">Receita Gerada (Estimada)</span>
                                            <span className="text-xl font-bold">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentGeneratedRevenue)}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-3">
                                            <div
                                                className="h-full bg-white rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>

                                        <div className="flex justify-between items-center text-xs font-bold">
                                            <span className="opacity-70">
                                                Meta Agregada: {targetStreams >= 1000 ? `${(targetStreams / 1000).toFixed(0)}k` : targetStreams.toFixed(0)} streams
                                            </span>
                                            <span className="text-[#4ade80]">
                                                {progress >= 100 ? 'ROI Atingido!' : 'Atingir ROI'}
                                            </span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                </div>

                {/* Right Column: Versions List */}
                <div className="lg:col-span-1 bg-white dark:bg-card-dark p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <Music className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Versões do Fonograma</h3>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {data.versions.map((version: any) => (
                            <div key={version.id} className="bg-white dark:bg-gray-800/40 rounded-[24px] p-5 border border-gray-100 dark:border-gray-700/50 hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 transition-all group">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-500 uppercase tracking-wider">
                                                {version.version_type || 'Original'}
                                            </span>
                                            {/* Status Indicator */}
                                            <div className="flex items-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleToggleStatus(version.isrc, version.display_status || 'Live');
                                                    }}
                                                    className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ${version.display_status === 'Takedown' ? 'bg-red-200 dark:bg-red-900/30' : 'bg-green-200 dark:bg-green-900/30'}`}
                                                    title={version.display_status === 'Takedown' ? 'Takedown (Indisponível)' : 'Live (Disponível)'}
                                                >
                                                    <div className={`w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${version.display_status === 'Takedown' ? 'translate-x-0 bg-red-500' : 'translate-x-4 bg-green-500'}`} />
                                                </button>
                                            </div>
                                        </div>
                                        <Link
                                            to={`/tracks/${version.isrc}`}
                                            className="font-bold text-gray-900 dark:text-white text-base leading-tight hover:text-[#8B5CF6] transition-colors block mt-1"
                                        >
                                            {version.title}
                                        </Link>
                                        <p className="font-mono text-[10px] text-gray-400 mt-1">{version.isrc}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Receita</div>
                                        <div className="font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(version.revenue)}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-gray-50 dark:border-gray-700/50 flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Streams</span>
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                                            {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(version.streams)}
                                        </span>
                                    </div>
                                    <Link
                                        to={`/tracks/${version.isrc}`}
                                        className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-400 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4 rotate-180" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>


            <ComparisonModal
                isOpen={isComparisonModalOpen}
                onClose={() => setIsComparisonModalOpen(false)}
                onConfirm={handleComparisonConfirm}
                currentTrackId={data.id}
            />
        </div >
    );
}
