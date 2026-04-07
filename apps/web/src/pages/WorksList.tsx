import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Search, Music, ExternalLink, Hash } from 'lucide-react';

export default function WorksList() {
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        api.get('/works')
            .then(res => {
                setWorks(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const filteredWorks = works.filter(work =>
        work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (work.iswc && work.iswc.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return <div className="p-10 text-center animate-pulse text-gray-500">Carregando catálogo de obras...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Catálogo de Obras</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Gerenciamento de ISWCs e registros autorais</p>
                </div>

                <div className="relative group max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-[#8B5CF6] transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar por Título ou ISWC..."
                        className="w-full bg-white dark:bg-card-dark border border-gray-100 dark:border-gray-800 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/20 transition-all shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredWorks.map((work) => (
                    <div key={work.id} className="bg-white dark:bg-card-dark p-6 rounded-[24px] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                        <div className="space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="h-10 w-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Music className="h-5 w-5 text-[#8B5CF6]" />
                                </div>
                                {work.iswc_link && (
                                    <a
                                        href={work.iswc_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-400 hover:text-[#8B5CF6] transition-colors"
                                        title="Ver no ECAD"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </a>
                                )}
                            </div>

                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 min-h-[3rem] text-lg leading-tight">
                                    {work.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-2 text-gray-400">
                                    <Hash className="h-3 w-3" />
                                    <span className="text-xs font-mono font-bold tracking-wider">
                                        {work.iswc || 'Sem ISWC'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-800 flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-300 dark:text-gray-600 uppercase tracking-widest">Registrada</span>
                            <div className="flex -space-x-2">
                                <span className="h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-card-dark flex items-center justify-center text-[10px] font-bold text-gray-400">LC</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredWorks.length === 0 && (
                <div className="py-20 text-center space-y-3">
                    <div className="h-16 w-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                        <Search className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Nenhuma obra encontrada para "{searchTerm}"</p>
                </div>
            )}
        </div>
    );
}
