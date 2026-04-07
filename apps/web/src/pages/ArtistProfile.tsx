import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getAssetUrl } from '../lib/config';
import { ArrowLeft, Play, DollarSign, ChevronDown, ChevronUp, FileText, X, Check, Share2, Download, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PlatformStat {
    name: string;
    streams: number;
    revenue: number;
}

interface ArtistTrack {
    id: number;
    musica: string;
    isrc: string;
    role: string;
    percentage: number;
    label_share?: number;
    total_track_streams: number;
    total_track_revenue: number;
    artist_revenue: number;
    platforms: PlatformStat[];
    history?: { [key: string]: { streams: number; revenue: number } };
}

interface ArtistChartData {
    name: string;
    value: number;
}

interface ArtistProfileData {
    name: string;
    total_revenue: number;
    total_streams: number;
    tracks_count: number;
    revenue_by_quarter: ArtistChartData[];
    payment_history: ArtistChartData[];
    tracks: ArtistTrack[];
    bank?: string;
    photo_url?: string;
}

// Payment Modal Component
const PaymentReceiptModal = ({ payment, artistName, onClose }: { payment: ArtistChartData, artistName: string, onClose: () => void }) => {
    const getPaymentDate = (q: string) => {
        if (!q || !q.includes('-Q')) return new Date();
        const [yearStr, qStr] = q.split('-');
        const year = parseInt(yearStr);
        const quarter = parseInt(qStr.replace('Q', ''));

        // Q1 -> 01/06 (Same Year)
        // Q2 -> 01/09 (Same Year)
        // Q3 -> 01/12 (Same Year)
        // Q4 -> 01/03 (Next Year)

        if (quarter === 1) return new Date(year, 5, 1); // June 1st
        if (quarter === 2) return new Date(year, 8, 1); // Sept 1st
        if (quarter === 3) return new Date(year, 11, 1); // Dec 1st
        if (quarter === 4) return new Date(year + 1, 2, 1); // Mar 1st
        return new Date();
    };

    const paymentDate = getPaymentDate(payment.name);
    // Generate transaction ID
    const transactionId = `E00${payment.name.replace('-', '')}${Math.floor(payment.value * 100)}BR`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                {/* Inter Header Style */}
                <div className="p-6 pb-2">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-1">
                            <div className="h-6 w-16 bg-orange-500/20 flex items-center justify-center text-orange-600 font-bold text-sm rounded">inter</div>
                        </div>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                        </button>
                    </div>
                </div>

                <div className="px-6 pb-8 border-b border-gray-100">
                    <div className="mb-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Check className="h-6 w-6 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Pix enviado</h2>
                        <div className="text-3xl font-extrabold text-gray-900 mt-1">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.value)}
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Sobre a transação</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Data do pagamento</span>
                                <span className="font-bold text-gray-900">{paymentDate.toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Horário</span>
                                <span className="font-bold text-gray-900">10:00</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">ID da transação</span>
                                <span className="font-bold text-gray-900 break-all text-right max-w-[200px]">{transactionId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Descrição</span>
                                <span className="font-bold text-gray-900">Royalties - {payment.name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Quem recebeu</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Nome</span>
                                <span className="font-bold text-gray-900 text-right">{artistName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">CPF/CNPJ</span>
                                <span className="font-bold text-gray-900">***.***.***-**</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Instituição</span>
                                <span className="font-bold text-gray-900">Nu Pagamentos - Ip</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Quem pagou</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Nome</span>
                                <span className="font-bold text-gray-900 text-right">GRAV PRODUCAO MUSICAL LTDA</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">CPF/CNPJ</span>
                                <span className="font-bold text-gray-900">41.902.124/0001-40</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Instituição</span>
                                <span className="font-bold text-gray-900">Banco Inter S.A.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors">
                        <Share2 className="h-4 w-4" /> Compartilhar
                    </button>
                    <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded text-sm flex items-center justify-center gap-2 transition-colors">
                        <Download className="h-4 w-4" /> Salvar PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export function ArtistProfile() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ArtistProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedTrackId, setExpandedTrackId] = useState<number | null>(null);
    const [imageError, setImageError] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<ArtistChartData | null>(null);
    const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);

    useEffect(() => {
        if (name) {
            loadProfile(decodeURIComponent(name));
        }
    }, [name]);

    const loadProfile = async (artistName: string) => {
        setLoading(true);
        try {
            const res = await api.get(`/artists/${encodeURIComponent(artistName)}`);
            setProfile(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleTrack = (id: number) => {
        if (expandedTrackId === id) setExpandedTrackId(null);
        else setExpandedTrackId(id);
    };

    if (loading) return <div className="p-10 text-center text-gray-400">Carregando perfil...</div>;
    if (!profile) return <div className="p-10 text-center text-gray-400">Artista não encontrado</div>;

    const getInitials = (n: string) => n.substring(0, 2).toUpperCase();

    // Helper for colors
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

    // Custom Tooltip for Chart
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl text-xs">
                    <p className="font-semibold mb-1">{label}</p>
                    <p>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div>
                <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-sm text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl overflow-hidden relative">
                            {!imageError ? (
                                <img
                                    src={profile.photo_url || getAssetUrl(`/static/media/profiles/${profile.name.toLowerCase().replace(/\s+/g, '-')}.webp`)}
                                    alt={profile.name}
                                    className="w-full h-full object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <span className="text-4xl font-bold text-white">{getInitials(profile.name)}</span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">{profile.name}</h1>
                            <div className="flex gap-3">
                                <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                    {profile.tracks_count} Faixas
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Revenue Card */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Receita Total (Share)</p>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <DollarSign className="h-4 w-4 text-[#8B5CF6]" />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profile.total_revenue)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Baseado na porcentagem de split</p>
                    </div>
                </div>

                {/* Streams Card */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Streams Totais</p>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <Play className="h-4 w-4 text-green-500 fill-current" />
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(profile.total_streams)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Em faixas participantes</p>
                    </div>
                </div>

                {/* Chart Card */}
                <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Histórico da Receita</p>
                            {selectedQuarter && (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
                                        Filtro: {selectedQuarter}
                                    </span>
                                    <button
                                        onClick={() => setSelectedQuarter(null)}
                                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        Limpar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={profile.revenue_by_quarter || []}>
                                <defs>
                                    {(profile.revenue_by_quarter || []).map((_, index) => (
                                        <linearGradient key={`grad-${index}`} id={`color-${index}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={1} />
                                            <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.4} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                                    dy={5}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[4, 4, 0, 0]}
                                    onClick={(data) => {
                                        if (data && data.name) {
                                            setSelectedQuarter(selectedQuarter === data.name ? null : data.name);
                                        }
                                    }}
                                    cursor="pointer"
                                >
                                    {(profile.revenue_by_quarter || []).map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={`url(#color-${index})`}
                                            opacity={selectedQuarter && selectedQuarter !== entry.name ? 0.3 : 1}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {selectedPayment && profile && (
                <PaymentReceiptModal
                    payment={selectedPayment}
                    artistName={profile.name}
                    onClose={() => setSelectedPayment(null)}
                />
            )}

            {/* Content Area */}
            <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-lg">Catálogo de Participações</h3>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-5">Faixa</th>
                                <th className="px-6 py-5">Função</th>
                                <th className="px-6 py-5 text-center">Split %</th>
                                <th className="px-6 py-5 text-right">Streams Totais</th>
                                <th className="px-6 py-5 text-right">Sua Receita</th>
                                <th className="px-6 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {profile.tracks.map((track) => (
                                <>
                                    <tr
                                        key={track.id}
                                        onClick={() => toggleTrack(track.id)}
                                        className={`cursor-pointer transition-colors ${expandedTrackId === track.id ? 'bg-gray-50 dark:bg-gray-800/50' : 'hover:bg-gray-50/50 dark:hover:bg-gray-800/30'}`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-sm text-gray-900 dark:text-white">{track.musica}</div>
                                            <div className="text-xs text-gray-500 font-mono">{track.isrc}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 uppercase">
                                                {track.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-[#8B5CF6]">
                                                {(() => {
                                                    const lblShare = track.label_share ?? 0.40;
                                                    const netPct = track.percentage / (1 - lblShare);
                                                    return netPct > 10 ? Math.round(netPct) : parseFloat(netPct.toFixed(2));
                                                })()}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {new Intl.NumberFormat('pt-BR').format(
                                                    selectedQuarter
                                                        ? (track.history?.[selectedQuarter]?.streams || 0)
                                                        : track.total_track_streams
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                                    selectedQuarter
                                                        ? (track.history?.[selectedQuarter]?.revenue || 0)
                                                        : track.artist_revenue
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-400">
                                            {expandedTrackId === track.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </td>
                                    </tr>
                                    {/* Expanded Row */}
                                    {expandedTrackId === track.id && (
                                        <tr className="bg-gray-50 dark:bg-gray-800/30">
                                            <td colSpan={6} className="px-8 py-6">
                                                <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Breakdown por Plataforma (Sua Parte)</span>
                                                    </div>
                                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                                        {track.platforms.map((plat, i) => (
                                                            <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{plat.name}</span>
                                                                </div>
                                                                <div className="flex items-center gap-6">
                                                                    <div className="text-right">
                                                                        <span className="block text-xs text-gray-400 uppercase">Streams</span>
                                                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{new Intl.NumberFormat('pt-BR').format(plat.streams)}</span>
                                                                    </div>
                                                                    <div className="text-right w-24">
                                                                        <span className="block text-xs text-gray-400 uppercase">Receita</span>
                                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plat.revenue)}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {track.platforms.length === 0 && (
                                                            <div className="p-4 text-center text-sm text-gray-400 italic">Sem dados detalhados.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Payment History Section */}
            <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-bold text-lg">Pagamentos & Extratos</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-[11px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold border-b border-gray-100 dark:border-gray-800">
                                <th className="px-6 py-5">Trimestre</th>
                                <th className="px-6 py-5">Data do Pagamento</th>
                                <th className="px-6 py-5">Banco</th>
                                <th className="px-6 py-5">ID da Transação</th>
                                <th className="px-6 py-5 text-right">Valor</th>
                                <th className="px-6 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {(profile.payment_history || []).map((payment, idx) => {
                                let payDate: Date;
                                let transactionId: string;
                                let isPaid: boolean;

                                // Hardcoded fix for 2024-Q3 based on receipt
                                if (payment.name === '2024-Q3') {
                                    payDate = new Date(2025, 0, 6); // Jan 6, 2025
                                    transactionId = 'E004169682025010620255jBtmiNvLIy';
                                    isPaid = true;
                                } else {
                                    const getPaymentDate = (q: string) => {
                                        if (!q || !q.includes('-Q')) return new Date();
                                        const [yearStr, qStr] = q.split('-');
                                        const year = parseInt(yearStr);
                                        const quarter = parseInt(qStr.replace('Q', ''));
                                        if (quarter === 1) return new Date(year, 5, 1);
                                        if (quarter === 2) return new Date(year, 8, 1);
                                        if (quarter === 3) return new Date(year, 11, 1);
                                        if (quarter === 4) return new Date(year + 1, 2, 1);
                                        return new Date();
                                    };
                                    payDate = getPaymentDate(payment.name);
                                    isPaid = payDate <= new Date();
                                    transactionId = `E00${payment.name.replace('-', '')}${Math.floor(payment.value * 100)}BR`;
                                }

                                return (
                                    <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{payment.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {isPaid ? <Check className="h-3 w-3 text-green-500" /> : <Clock className="h-3 w-3 text-gray-400" />}
                                                <span className={`text-sm font-medium ${isPaid ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                                    {payDate.toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPaid ? (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">{profile.bank || 'Nu Pagamentos - Ip'}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {isPaid ? (
                                                <span className="font-mono text-xs text-gray-500">{transactionId}</span>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`text-sm font-bold ${isPaid ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.value)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {isPaid && (
                                                <button
                                                    onClick={() => setSelectedPayment(payment)}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/10 hover:bg-orange-100 dark:hover:bg-orange-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    Comprovante
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {(!profile.payment_history || profile.payment_history.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        Nenhum pagamento registrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
