import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { RefreshCw, CheckCircle, AlertCircle, FolderOpen, Trash2, FileText, Database } from 'lucide-react';
import { clsx } from 'clsx';

export function ImportData() {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [syncResult, setSyncResult] = useState<any>(null);
    const [imports, setImports] = useState<any[]>([]);

    useEffect(() => {
        fetchImports();
    }, [status]);

    const fetchImports = () => {
        api.get('/imports').then(res => setImports(res.data));
    };

    const handleSync = async () => {
        setStatus('syncing');
        setSyncResult(null);
        try {
            const res = await api.post('/imports/sync');
            setSyncResult(res.data);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/imports/${deleteId}`);
            fetchImports();
            setDeleteId(null);
        } catch (e) {
            alert('Erro ao excluir');
        }
    };

    const confirmDeleteAll = async () => {
        try {
            await api.delete('/imports/all');
            fetchImports();
            setShowDeleteAllConfirm(false);
        } catch (e) {
            alert('Erro ao excluir tudo');
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Gestão de Extratos</h2>
                <p className="text-text-muted-light mt-2">Gerencie os arquivos de royalties processados pelo sistema.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sync Card */}
                <div className="bg-card-light dark:bg-card-dark rounded-3xl p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                            <FolderOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">Sincronização Local</h3>
                            <p className="text-sm text-text-muted-light">Lê arquivos da pasta <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">extratos</code></p>
                        </div>
                    </div>

                    <p className="text-text-muted-light mb-8 text-sm leading-relaxed">
                        Coloque seus arquivos CSV (ex: 2025-Q4.csv) na pasta <b>extratos</b> localizada na raiz do projeto.
                        O sistema irá ler automaticamente novos arquivos e adicionar ao dashboard.
                    </p>

                    <button
                        onClick={handleSync}
                        disabled={status === 'syncing'}
                        className={clsx(
                            "w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2",
                            status === 'syncing' ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-hover shadow-primary/25"
                        )}
                    >
                        <RefreshCw className={clsx("h-5 w-5", status === 'syncing' && "animate-spin")} />
                        {status === 'syncing' ? 'Processando arquivos...' : 'Sincronizar Pasta Agora'}
                    </button>

                    {status === 'success' && syncResult && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 font-bold">
                                <CheckCircle className="h-5 w-5" />
                                {syncResult.message}
                            </div>
                            {syncResult.errors && syncResult.errors.length > 0 && (
                                <div className="mt-2 p-2 bg-white dark:bg-gray-900 rounded border border-red-200 text-red-600 text-xs">
                                    <p className="font-bold mb-1">Erros encontrados:</p>
                                    <ul className="list-disc pl-4">{syncResult.errors.map((e: any, i: number) => <li key={i}>{e}</li>)}</ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Stats Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 text-white flex flex-col justify-between">
                    <div>
                        <h3 className="font-bold text-lg opacity-80 mb-1">Total de Importações</h3>
                        <span className="text-5xl font-extrabold">{imports.length}</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 opacity-60">
                            <Database className="h-5 w-5" />
                            <span className="text-sm">Dados armazenados localmente (SQLite)</span>
                        </div>
                        <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">Última Sincronização</p>
                            <p className="font-mono text-sm">{new Date().toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-bold">Histórico de Arquivos</h3>
                    {imports.length > 0 && (
                        <button
                            onClick={() => setShowDeleteAllConfirm(true)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors text-sm font-bold flex items-center gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Apagar Tudo
                        </button>
                    )}
                </div>
                <div className="bg-card-light dark:bg-card-dark rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                    {imports.length === 0 ? (
                        <div className="p-10 text-center text-text-muted-light">
                            Nenhum arquivo importado ainda.
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs text-text-muted-light uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Arquivo</th>
                                    <th className="px-6 py-4">Data Importação</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {imports.map((imp) => (
                                    <tr key={imp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-text-muted-light" />
                                            <span className="font-medium">{imp.filename}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-muted-light font-mono">
                                            {new Date(imp.imported_at).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setDeleteId(imp.id)}
                                                className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir importação"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Excluir Importação?
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Você está prestes a excluir este arquivo. Isso removerá <b>todas as estatísticas</b> associadas a ele. Esta ação não pode ser desfeita.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setDeleteId(null)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 transition-colors"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete All Confirmation Modal */}
            {showDeleteAllConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 w-full max-w-sm shadow-2xl relative border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-500 mb-4">
                                <AlertCircle className="h-6 w-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Apagar TUDO?
                            </h3>
                            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                                Tem certeza que deseja apagar <b>TODOS</b> os extratos e <b>TODAS</b> as estatísticas do sistema? <br /><br />
                                <span className="font-bold text-red-500">Isso vai zerar seu dashboard.</span>
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowDeleteAllConfirm(false)}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDeleteAll}
                                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/20 transition-colors"
                                >
                                    SIM, APAGAR TUDO
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
