import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getAssetUrl } from '../lib/config';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, BarChart2, Edit2, Save, X, Info, Globe, Music, Image as ImageIcon, Upload, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { BarChart, Bar, Cell, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ModernAudioPlayer } from '../components/ModernAudioPlayer';
import { getCoverUrl } from '../utils/coverUtils';



export function TrackDetails() {
    const { isrc } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});
    const [artistSearch, setArtistSearch] = useState('');
    const [artistResults, setArtistResults] = useState<string[]>([]);
    const [showArtistDropdown, setShowArtistDropdown] = useState(false);
    const [uploadingAudio, setUploadingAudio] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);

    useEffect(() => {
        if (!isrc) return;
        api.get(`/stats/track/${isrc}`)
            .then(res => {
                setData(res.data);
                setEditData({
                    artist: res.data.artist,
                    composer: res.data.composer,
                    producer: res.data.producer,
                    audio_engineer: res.data.audio_engineer,
                    duration: res.data.duration,
                    genre: res.data.genre,
                    mixing_engineer: res.data.mixing_engineer,
                    mastering_engineer: res.data.mastering_engineer,
                    release_time_platforms: res.data.release_time_platforms,
                    release_time_youtube: res.data.release_time_youtube,
                    isrc_video: res.data.isrc_video,
                    explicit: res.data.explicit,
                    author_contact: res.data.author_contact
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [isrc]);

    // Artist search effect
    useEffect(() => {
        if (!artistSearch) {
            setArtistResults([]);
            return;
        }
        const timer = setTimeout(() => {
            api.get(`/artists/search?q=${artistSearch}`)
                .then(res => setArtistResults(res.data))
                .catch(() => setArtistResults([]));
        }, 300);
        return () => clearTimeout(timer);
    }, [artistSearch]);

    const handleSave = async () => {
        try {
            const res = await api.put(`/tracks/${isrc}`, editData);
            setData({ ...data, ...res.data }); // Update local state
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar alterações.");
        }
    };

    const handleUploadMasterAudio = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isrc) return;

        setUploadingAudio(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/tracks/${isrc}/upload-master-audio`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setData({ ...data, master_audio_url: res.data.url });
        } catch (err) {
            console.error(err);
            alert("Erro ao fazer upload da master de áudio.");
        } finally {
            setUploadingAudio(false);
        }
    };

    const handleUploadMasterCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !isrc) return;

        setUploadingCover(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await api.post(`/tracks/${isrc}/upload-master-cover`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setData({ ...data, master_cover_url: res.data.url });
        } catch (err) {
            console.error(err);
            alert("Erro ao fazer upload da capa master.");
        } finally {
            setUploadingCover(false);
        }
    };

    const handleDeleteMasterAudio = async () => {
        if (!isrc || !window.confirm("Tem certeza que deseja excluir a master de áudio? Esta ação não pode ser desfeita.")) return;

        try {
            await api.delete(`/tracks/${isrc}/master-audio`);
            setData({ ...data, master_audio_url: null });
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir a master de áudio.");
        }
    };

    const handleDeleteMasterCover = async () => {
        if (!isrc || !window.confirm("Tem certeza que deseja excluir a capa master? Esta ação não pode ser desfeita.")) return;

        try {
            await api.delete(`/tracks/${isrc}/master-cover`);
            setData({ ...data, master_cover_url: null });
        } catch (err) {
            console.error(err);
            alert("Erro ao excluir a capa master.");
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando detalhes da faixa...</div>;
    if (!data) return <div className="p-10 text-center text-red-500">Faixa não encontrada.</div>;

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={() => navigate('/isrc')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div className="flex-1 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="h-24 w-24 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <img
                            src={data.cover_image || getCoverUrl(data.title, data.artist)}
                            alt={data.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{data.title}</h1>
                        <div className="flex items-center gap-3 mt-1 text-gray-500 dark:text-gray-400">
                            <div className="flex flex-wrap items-center gap-2">
                                {(data.artist || '').split(',').map((a: string) => a.trim()).map((artist: string, index: number, arr: string[]) => (
                                    <div key={index} className="flex items-center">
                                        <Link
                                            to={`/artista/${encodeURIComponent(artist.toLowerCase().replace(/[^a-z0-9]/g, ''))}`}
                                            className="hover:text-purple-600 dark:hover:text-purple-400 hover:underline transition-colors"
                                        >
                                            {artist}
                                        </Link>
                                        {index < arr.length - 1 && (
                                            <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                            <span className="font-mono text-xs border border-gray-200 dark:border-gray-700 px-1.5 py-0.5 rounded">{data.isrc}</span>
                        </div>
                    </div>
                </div>
                {/* Export Buttons */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            window.open(`${api.defaults.baseURL}/tracks/${isrc}/export?format=pdf`, '_blank');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                    >
                        <ImageIcon className="h-4 w-4" />
                        PDF Ficha Técnica
                    </button>
                    <button
                        onClick={async () => {
                            try {
                                const res = await api.get(`/tracks/${isrc}/export?format=gdoc`);
                                window.open(res.data.url, '_blank');
                            } catch (e) {
                                console.error(e);
                                alert("Erro ao exportar para Google Docs.");
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Google Docs
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Section (2 cols) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* KPI Cards Strip */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 1. Receita Total */}
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Receita Total</span>
                                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.total_revenue)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                                <TrendingUp className="h-3 w-3" />
                                <span>+12.5% vs Mês Anterior</span>
                            </div>
                        </div>



                        {/* 3. Streams Totals */}
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Streams Totais</span>
                                <span className="text-3xl font-extrabold text-[#8B5CF6]">
                                    {data.total_streams
                                        ? (data.total_streams >= 1000000
                                            ? `${Math.floor(data.total_streams / 1000000)}M`
                                            : data.total_streams >= 1000
                                                ? `${(data.total_streams / 1000).toFixed(1)}k`
                                                : data.total_streams)
                                        : '0'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                <Globe className="h-3 w-3" />
                                <span>Distribuição em 48 lojas</span>
                            </div>
                        </div>

                        {/* 4. Rank */}
                        <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between h-32">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Rank</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-extrabold text-amber-500">#{data.revenue_rank || '-'}</span>
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">de {data.total_isrcs || '-'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                                <TrendingUp className="h-3 w-3 text-amber-500" />
                                <span>Posição no último trimestre</span>
                            </div>
                        </div>
                    </div>

                    {/* Metadata / Fonograma Info (Editable) */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <Info className="h-4 w-4 text-gray-400" />
                                Metadados da Música
                            </h3>
                            {!isEditing ? (
                                <div className="flex justify-end min-w-[200px]">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Editar
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-end gap-6 min-w-[200px]">
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditData({
                                                artist: data.artist,
                                                composer: data.composer,
                                                producer: data.producer,
                                                audio_engineer: data.audio_engineer,
                                                duration: data.duration,
                                                genre: data.genre,
                                                mixing_engineer: data.mixing_engineer,
                                                mastering_engineer: data.mastering_engineer,
                                                release_time_platforms: data.release_time_platforms,
                                                release_time_youtube: data.release_time_youtube,
                                                isrc_video: data.isrc_video,
                                                explicit: data.explicit,
                                                author_contact: data.author_contact
                                            });
                                        }}
                                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition font-bold text-sm"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all transform hover:scale-105 active:scale-95"
                                    >
                                        <Save className="h-4 w-4" />
                                        Salvar
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Artista</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <div className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl p-2 flex flex-wrap gap-2 min-h-[52px] focus-within:ring-2 focus-within:ring-purple-500/20">
                                            {(editData.artist || '').split(',').map((a: string) => a.trim()).filter(Boolean).map((a: string, i: number) => (
                                                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-bold rounded-lg shadow-sm">
                                                    {a}
                                                    <button
                                                        onClick={() => {
                                                            const artists = (editData.artist || '').split(',').map((x: string) => x.trim()).filter(Boolean);
                                                            const newArtists = artists.filter((_: string, idx: number) => idx !== i);
                                                            setEditData({ ...editData, artist: newArtists.join(', ') });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </span>
                                            ))}
                                            <input
                                                type="text"
                                                className="flex-1 bg-transparent border-none focus:ring-0 p-1 text-sm font-medium placeholder:text-gray-400"
                                                value={artistSearch}
                                                onChange={(e) => {
                                                    setArtistSearch(e.target.value);
                                                    setShowArtistDropdown(true);
                                                }}
                                                onFocus={() => setShowArtistDropdown(true)}
                                                placeholder={!(editData.artist || '').trim() ? "Digite para buscar artistas..." : ""}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && artistSearch.trim()) {
                                                        const artists = (editData.artist || '').split(',').map((x: string) => x.trim()).filter(Boolean);
                                                        if (!artists.includes(artistSearch.trim())) {
                                                            setEditData({ ...editData, artist: [...artists, artistSearch.trim()].join(', ') });
                                                        }
                                                        setArtistSearch('');
                                                    }
                                                }}
                                            />
                                        </div>
                                        {showArtistDropdown && artistResults.filter(r => !((editData.artist || '').split(',').map((x: string) => x.trim())).includes(r)).length > 0 && (
                                            <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                                {artistResults.filter(r => !((editData.artist || '').split(',').map((x: string) => x.trim())).includes(r)).map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                                                        onClick={() => {
                                                            const artists = (editData.artist || '').split(',').map((x: string) => x.trim()).filter(Boolean);
                                                            if (!artists.includes(result)) {
                                                                setEditData({ ...editData, artist: [...artists, result].join(', ') });
                                                            }
                                                            setArtistSearch('');
                                                            setShowArtistDropdown(false);
                                                        }}
                                                    >
                                                        {result}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                        {data.artist || '-'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Compositor(es)</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                        value={editData.composer || ''}
                                        onChange={(e) => setEditData({ ...editData, composer: e.target.value })}
                                        placeholder="Nomes dos Compositores"
                                    />
                                ) : (
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                        {data.composer || '-'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Produtor</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                        value={editData.producer || ''}
                                        onChange={(e) => setEditData({ ...editData, producer: e.target.value })}
                                        placeholder="Nome do Produtor"
                                    />
                                ) : (
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                        {data.producer || '-'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Engenheiro de Áudio</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                        value={editData.audio_engineer || ''}
                                        onChange={(e) => setEditData({ ...editData, audio_engineer: e.target.value })}
                                        placeholder="Nome do Engenheiro"
                                    />
                                ) : (
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                        {data.audio_engineer || '-'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Duração</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                        value={editData.duration || ''}
                                        onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                                        placeholder="Ex: 3:15"
                                    />
                                ) : (
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                        {data.duration || '-'}
                                    </span>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Gênero</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                        value={editData.genre || ''}
                                        onChange={(e) => setEditData({ ...editData, genre: e.target.value })}
                                        placeholder="Ex: Pop, Trap, Lo-fi"
                                    />
                                ) : (
                                    <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                        {data.genre || '-'}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Ficha Técnica Details */}
                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6">Detalhamento Técnico (Distribuição)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Mixagem</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.mixing_engineer || ''}
                                            onChange={(e) => setEditData({ ...editData, mixing_engineer: e.target.value })}
                                            placeholder="Nome do Engenheiro de Mix"
                                        />
                                    ) : (
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{data.mixing_engineer || '-'}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Masterização</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.mastering_engineer || ''}
                                            onChange={(e) => setEditData({ ...editData, mastering_engineer: e.target.value })}
                                            placeholder="Nome do Engenheiro de Master"
                                        />
                                    ) : (
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{data.mastering_engineer || '-'}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Horário Lançamento (Lojas)</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.release_time_platforms || ''}
                                            onChange={(e) => setEditData({ ...editData, release_time_platforms: e.target.value })}
                                            placeholder="Ex: 00h"
                                        />
                                    ) : (
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{data.release_time_platforms || '00h'}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Horário Lançamento (YouTube)</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.release_time_youtube || ''}
                                            onChange={(e) => setEditData({ ...editData, release_time_youtube: e.target.value })}
                                            placeholder="Ex: 12h"
                                        />
                                    ) : (
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{data.release_time_youtube || '12h'}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">ISRC Vídeo (YouTube)</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.isrc_video || ''}
                                            onChange={(e) => setEditData({ ...editData, isrc_video: e.target.value })}
                                            placeholder="BR-..."
                                        />
                                    ) : (
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{data.isrc_video || '-'}</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Conteúdo Explícito</label>
                                    {isEditing ? (
                                        <select
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.explicit || 'Não'}
                                            onChange={(e) => setEditData({ ...editData, explicit: e.target.value })}
                                        >
                                            <option value="Não">Não</option>
                                            <option value="Sim">Sim</option>
                                        </select>
                                    ) : (
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${data.explicit === 'Sim' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {data.explicit || 'Não'}
                                        </span>
                                    )}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Contato Autor/Editora</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3.5 text-sm font-medium focus:ring-2 focus:ring-purple-500/20"
                                            value={editData.author_contact || ''}
                                            onChange={(e) => setEditData({ ...editData, author_contact: e.target.value })}
                                            placeholder="E-mail ou Telefone de Contato"
                                        />
                                    ) : (
                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">{data.author_contact || '-'}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Masters Section (Cloudflare R2) */}
                    <div className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm">
                        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                            <Music className="h-4 w-4 text-gray-400" />
                            Arquivos Masters (Cloudflare R2)
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Audio Master */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <Music className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">Áudio Master</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Formato WAV (Lossless)</p>
                                        </div>
                                    </div>
                                    {data.master_audio_url ? (
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                    )}
                                </div>

                                {data.master_audio_url ? (
                                    <div className="space-y-4">
                                        <div className="bg-white dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
                                            <ModernAudioPlayer src={data.master_audio_url} />
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={data.master_audio_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 flex-1 py-2.5 bg-gray-900 dark:bg-gray-700 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                Baixar WAV Original
                                            </a>
                                            <button
                                                onClick={handleDeleteMasterAudio}
                                                className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                                                title="Excluir Master"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                        <input
                                            type="file"
                                            id="audio-upload"
                                            className="hidden"
                                            accept=".wav"
                                            onChange={handleUploadMasterAudio}
                                            disabled={uploadingAudio}
                                        />
                                        <label
                                            htmlFor="audio-upload"
                                            className={`flex flex-col items-center gap-2 cursor-pointer ${uploadingAudio ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                                <Upload className={`h-5 w-5 text-gray-400 ${uploadingAudio ? 'animate-bounce' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {uploadingAudio ? 'Enviando...' : 'Upload Master WAV'}
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            {/* Cover Master */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                                            <ImageIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">Capa Master</p>
                                            <p className="text-[10px] text-gray-500 font-medium">Resolução Máxima (PNG/JPG)</p>
                                        </div>
                                    </div>
                                    {data.master_cover_url ? (
                                        <CheckCircle className="h-5 w-5 text-emerald-500" />
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                                    )}
                                </div>

                                {data.master_cover_url ? (
                                    <div className="space-y-4">
                                        <div className="aspect-square relative rounded-xl overflow-hidden group">
                                            <img src={data.master_cover_url} alt="Master Cover" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a
                                                    href={data.master_cover_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-white text-black rounded-full"
                                                >
                                                    <ExternalLink className="h-5 w-5" />
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <a
                                                href={data.master_cover_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2 flex-1 py-2.5 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                Download Capa Full
                                            </a>
                                            <button
                                                onClick={handleDeleteMasterCover}
                                                className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                                                title="Excluir Capa"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl h-full">
                                        <input
                                            type="file"
                                            id="cover-upload"
                                            className="hidden"
                                            accept=".png,.jpg,.jpeg"
                                            onChange={handleUploadMasterCover}
                                            disabled={uploadingCover}
                                        />
                                        <label
                                            htmlFor="cover-upload"
                                            className={`flex flex-col items-center gap-2 cursor-pointer ${uploadingCover ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="p-3 bg-white dark:bg-gray-700 rounded-full shadow-sm">
                                                <Upload className={`h-5 w-5 text-gray-400 ${uploadingCover ? 'animate-bounce' : ''}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {uploadingCover ? 'Enviando...' : 'Upload Capa Master'}
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

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


                </div>

                {/* Split Breakdown Section (1 col) */}
                <div className="bg-white dark:bg-card-dark p-8 rounded-[32px] border border-gray-100 dark:border-gray-800 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Participação (Split)</h3>
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Level 1: Label Commission */}
                        {data.royalty_breakdown && (
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-gray-900 text-white rounded-xl flex items-center justify-center">
                                            <span className="font-bold text-xs">LBL</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">
                                                {data.royalty_breakdown.label_commission.name.split(' ')[0]}
                                            </p>
                                            <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg tracking-wider border border-gray-200 dark:border-gray-600 inline-block mt-1">
                                                Comissão fixa
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.royalty_breakdown.label_commission.amount)}
                                        </p>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                            {data.royalty_breakdown.label_commission.gross_percentage}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-gray-900 dark:bg-gray-400 w-full"></div>
                                </div>
                            </div>
                        )}

                        {/* Level 2: Collaborators */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                    Artistas
                                </h4>
                                <span className="text-xs font-medium text-gray-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                                    Royalties do digital
                                </span>
                            </div>

                            <div className="space-y-3">
                                {data.royalty_breakdown?.collaborators.map((split: any, idx: number) => {
                                    const styles = [
                                        { bg: 'bg-[#8B5CF6]/10', text: 'text-[#8B5CF6]', accent: '#8B5CF6' },
                                        { bg: 'bg-blue-500/10', text: 'text-blue-500', accent: '#3B82F6' },
                                        { bg: 'bg-pink-500/10', text: 'text-pink-500', accent: '#EC4899' },
                                        { bg: 'bg-orange-500/10', text: 'text-orange-500', accent: '#F97316' },
                                        { bg: 'bg-green-500/10', text: 'text-green-500', accent: '#10B981' },
                                    ][idx % 5];

                                    // Static images mapping (reused)
                                    const ARTIST_IMAGES: { [key: string]: string } = {
                                        'fuub': getAssetUrl('/static/media/profiles/fuub.webp'),
                                        'snif': getAssetUrl('/static/media/profiles/snif.webp'),
                                        'lil chainz': getAssetUrl('/static/media/profiles/lil-chainz.webp')
                                    };
                                    const lowerName = split.name?.toLowerCase().trim();
                                    const imageSrc = ARTIST_IMAGES[lowerName];

                                    return (
                                        <div key={idx} className="bg-white dark:bg-gray-800/40 rounded-[28px] p-5 border border-gray-100 dark:border-gray-700/50 flex items-start gap-4 transition-all hover:shadow-lg hover:border-gray-200 dark:hover:border-gray-600 group">
                                            {/* Avatar */}
                                            <div className={`w-12 h-12 rounded-2xl ${styles.bg} flex items-center justify-center font-bold text-sm ${styles.text} relative shadow-sm overflow-hidden flex-shrink-0 mt-1`}>
                                                {imageSrc ? (
                                                    <img src={imageSrc} alt={split.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    split.name ? split.name.substring(0, 2).toUpperCase() : '?'
                                                )}
                                            </div>

                                            {/* Middle: Name & Badge */}
                                            <div className="flex-1 flex flex-col justify-center min-w-0 gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 dark:text-white text-base leading-tight truncate" title={split.name}>
                                                        {split.name}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 flex-shrink-0 flex">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg tracking-wider border border-gray-200 dark:border-gray-600 truncate max-w-full text-center">
                                                            {split.role || 'Participante'}
                                                        </span>
                                                    </div>
                                                    {/* Small Progress Bar Next to Badge */}
                                                    <div className="h-1.5 flex-1 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden max-w-[100px]">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{ width: `${split.net_percentage}%`, backgroundColor: styles.accent }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Values Stacked */}
                                            <div className="text-right flex-shrink-0 flex flex-col items-end justify-center">
                                                <span className={`text-xl font-black ${styles.text} leading-none mb-1`}>
                                                    {split.net_percentage}%
                                                </span>
                                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(split.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!data.royalty_breakdown?.collaborators || data.royalty_breakdown?.collaborators.length === 0) && (
                                    <div className="text-center py-6 text-gray-400 text-sm italic">
                                        Nenhum colaborador definido para esta faixa.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                        <button
                            onClick={() => {
                                if (data.isrc) {
                                    navigate(`/splits/${data.isrc}/editor`);
                                } else {
                                    alert("Faixa sem ISRC. Não é possível gerenciar splits.");
                                }
                            }}
                            className="w-full py-4 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl font-bold text-gray-500 dark:text-gray-400 hover:text-[#8B5CF6] hover:border-[#8B5CF6] hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all flex items-center justify-center gap-2 group mt-4"
                        >
                            <Users className="h-5 w-5 group-hover:scale-110 transition-transform" />
                            Gerenciar Splits
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
}
