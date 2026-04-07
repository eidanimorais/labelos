import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { Search, Edit3 } from 'lucide-react';

export function Catalog() {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async () => {
        try {
            const res = await api.get('/tracks');
            setTracks(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8">Carregando catálogo...</div>;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Catálogo</h2>
                    <p className="text-text-muted-light mt-1">Gerencie suas faixas e splits.</p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-light h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Buscar por ISRC ou nome..."
                        className="pl-10 pr-4 py-2 border rounded-xl bg-card-light dark:bg-card-dark focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>
            </div>

            <div className="bg-card-light dark:bg-card-dark rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-text-muted-light uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">ISRC</th>
                            <th className="px-6 py-4">Música</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {tracks.map((track) => (
                            <tr key={track.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 text-sm font-mono text-text-muted-light">{track.isrc}</td>
                                <td className="px-6 py-4 font-medium">{track.musica_display}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                        Pendente
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => navigate('/splits', { state: { trackId: track.id } })}
                                        className="text-primary hover:text-primary-hover font-semibold text-sm inline-flex items-center gap-1"
                                    >
                                        <Edit3 className="h-4 w-4" />
                                        Editar Split
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
