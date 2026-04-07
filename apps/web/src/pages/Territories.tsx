import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { ArrowLeft, Search, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRegionFlag } from '../utils/flags';
import { translateCountry } from '../utils/translations';

export function Territories() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/stats/territories').then(res => {
            setStats(res.data);
            setLoading(false);
        });
    }, []);

    if (loading || !stats) return <div className="p-10 text-center text-gray-500">Carregando territórios...</div>;

    const filteredTerritories = stats.territories.filter((t: any) => {
        const name = t.name || '';
        const translated = translateCountry(t.name);
        const term = searchTerm.toLowerCase();
        return name.toLowerCase().includes(term) || translated.toLowerCase().includes(term);
    });

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Territórios</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Desempenho detalhado por região.</p>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-card-dark rounded-[32px] shadow-sm border border-gray-100 dark:border-gray-800 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar país..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <Download className="h-4 w-4" /> Exportar CSV
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-500 uppercase font-bold tracking-wider">
                                <th className="px-6 py-4">Região</th>
                                <th className="px-6 py-4 text-right">Porcentagem</th>
                                <th className="px-6 py-4 text-right">Streams</th>
                                <th className="px-6 py-4 text-right">Receita Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {filteredTerritories.map((t: any, idx: number) => {
                                const percentage = (t.value / stats.total_revenue) * 100;
                                return (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <span className="text-2xl">{getRegionFlag(t.name)}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{translateCountry(t.name)}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full"
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className="font-mono font-medium text-gray-600 dark:text-gray-300 w-16">
                                                    {percentage.toFixed(2).replace('.', ',')}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-700 dark:text-gray-300">
                                            {new Intl.NumberFormat('pt-BR').format(t.streams || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
