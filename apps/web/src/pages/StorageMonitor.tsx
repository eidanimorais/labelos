import { useEffect, useState } from 'react';
import { Cloud, AlertTriangle, CheckCircle2, RefreshCw, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { api } from '../lib/api';

interface StorageStat {
    usage_gb: number;
    limit_gb: number;
    percent: number;
}

interface StorageStats {
    [key: string]: StorageStat;
}

export function StorageMonitor() {
    const [stats, setStats] = useState<StorageStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const response = await api.get('/resources/storage/stats');
            setStats(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching storage stats:', err);
            setError('Não foi possível carregar as estatísticas de armazenamento.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const getStatusColor = (percent: number) => {
        if (percent >= 90) return 'text-red-500';
        if (percent >= 70) return 'text-yellow-500';
        return 'text-green-500';
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 90) return 'bg-red-500';
        if (percent >= 70) return 'bg-yellow-500';
        return 'bg-primary';
    };

    if (loading && !stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
                <p className="text-text-muted-light dark:text-text-muted-dark font-medium">Lendo nível do tanque...</p>
            </div>
        );
    }

    const totalUsage = stats ? Object.values(stats).reduce((acc, curr) => acc + curr.usage_gb, 0) : 0;
    const activeVersion = stats ? (
        stats.V1.percent < 99.9 ? 'V1' :
            stats.V2.percent < 99.9 ? 'V2' :
                stats.V3.percent < 99.9 ? 'V3' :
                    stats.V4.percent < 99.9 ? 'V4' : 'V5'
    ) : 'V1';

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section with summary */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Nível do Tanque</h1>
                    <p className="text-text-muted-light dark:text-text-muted-dark mt-2 font-medium">
                        Monitoramento de armazenamento multi-conta Cloudflare R2
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStats}
                        className="p-3 rounded-xl bg-white dark:bg-card-dark border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
                    </button>
                    <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold flex items-center gap-2 border border-primary/20">
                        <Zap className="h-4 w-4" /> Conta Ativa: {activeVersion}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">{error}</span>
                </div>
            )}

            {/* Total usage quick card */}
            <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-[32px] p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs mb-2">Espaço Total Ocupado</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black">{totalUsage.toFixed(2).replace('.', ',')}</span>
                            <span className="text-xl font-bold opacity-80 text-primary-light">GB</span>
                        </div>
                    </div>
                    <div className="h-16 w-px bg-white/20 hidden md:block"></div>
                    <div className="flex-1 max-w-md">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span>Eficiência de Custo</span>
                            <span>100% (Grátis)</span>
                        </div>
                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full w-full"></div>
                        </div>
                        <p className="text-xs mt-3 text-primary-foreground/70 font-medium">
                            Seu sistema está operando em modo "Custo Zero" usando múltiplas contas de camada gratuita.
                        </p>
                    </div>
                </div>
            </div>

            {/* Account breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {stats && Object.entries(stats).map(([version, data]) => (
                    <div key={version} className="bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800 hover:border-primary/20 transition-all group overflow-hidden relative">
                        {/* Decorative circle */}
                        <div className={cn(
                            "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
                            getProgressColor(data.percent)
                        )}></div>

                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-12 w-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                    data.percent >= 99.9 ? "bg-gray-100 dark:bg-gray-800 text-gray-400" : "bg-primary/10 text-primary"
                                )}>
                                    <Cloud className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-gray-900 dark:text-white">Cloudflare R2 {version}</h3>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {data.percent >= 99.9 ? (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest"><CheckCircle2 className="h-3 w-3" /> Esgotado</span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 uppercase tracking-widest"><Activity className="h-3 w-3" /> Em Operação</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn("text-3xl font-black", getStatusColor(data.percent))}>
                                    {data.percent.toFixed(1).replace('.', ',')}%
                                </p>
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Utilizado</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="w-full h-4 bg-gray-50 dark:bg-gray-800/50 rounded-full overflow-hidden border border-gray-100 dark:border-gray-800">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000 ease-out shadow-inner", getProgressColor(data.percent))}
                                    style={{ width: `${Math.min(data.percent, 100)}%` }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center text-sm font-semibold">
                                <div className="flex flex-col">
                                    <span className="text-text-muted-light dark:text-text-muted-dark text-[10px] uppercase tracking-tighter">Ocupado</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{data.usage_gb.toFixed(2).replace('.', ',')} GB</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-text-muted-light dark:text-text-muted-dark text-[10px] uppercase tracking-tighter">Limite Free</span>
                                    <span className="text-gray-900 dark:text-white font-bold">{data.limit_gb.toFixed(1).replace('.', ',')} GB</span>
                                </div>
                            </div>
                        </div>

                        {data.percent >= 90 && data.percent < 99.9 && (
                            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-500/5 rounded-2xl border border-orange-100 dark:border-orange-500/10 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400 tracking-tight">Capacidade Quase Esgotada</p>
                                    <p className="text-xs text-orange-600/80 dark:text-orange-400/60 mt-1 font-medium">O sistema mudará automaticamente para a próxima conta em breve.</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Hint for more accounts */}
            <div className="bg-white dark:bg-card-dark rounded-[32px] p-8 border border-gray-100 dark:border-gray-800 flex items-center gap-6 overflow-hidden relative">
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-3xl shrink-0">
                    <Zap className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">Expandir Armazenamento?</h4>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-1 font-medium leading-relaxed">
                        Quando todas as contas atingirem 9.9GB, você pode criar uma nova conta Cloudflare R2 e me passar os dados para gerar um novo nível e continuar com custo zero.
                    </p>
                </div>
            </div>
        </div>
    );
}

const Activity = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
