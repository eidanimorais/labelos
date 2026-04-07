
import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Navbar } from '../components/layout/Navbar';
import ContractUpload from '../components/ContractUpload';
import { Plus, RefreshCw, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Contract {
    id: number;
    title: string;
    status: string;
    created_at: string;
    signers_info: string;
    assinafy_id: string;
}

const Contracts: React.FC = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [showUpload, setShowUpload] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const data = await api.getContracts();
            setContracts(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar contratos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handleSync = async (id: number) => {
        try {
            toast.loading("Sincronizando...", { id: "sync" });
            const updated = await api.syncContract(id);
            setContracts(prev => prev.map(c => c.id === id ? updated : c));
            toast.success("Status atualizado!", { id: "sync" });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao sincronizar", { id: "sync" });
        }
    };

    const getStatusColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'assinado': return 'text-green-400';
            case 'enviado': return 'text-yellow-400';
            case 'visualizado': return 'text-blue-400';
            case 'recusado': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            <Navbar />
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Contratos</h1>
                        <p className="text-gray-400 mt-1">Gerencie seus contratos e assinaturas digitais</p>
                    </div>
                    <button
                        onClick={() => setShowUpload(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={20} />
                        Novo Contrato
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-gray-500">Carregando...</div>
                ) : (
                    <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
                        <table className="w-full text-left">
                            <thead className="bg-gray-750 border-b border-gray-700">
                                <tr>
                                    <th className="p-4 font-semibold text-gray-300">Título</th>
                                    <th className="p-4 font-semibold text-gray-300">Data</th>
                                    <th className="p-4 font-semibold text-gray-300">Status</th>
                                    <th className="p-4 font-semibold text-gray-300 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {contracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-gray-750 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-700 rounded text-purple-400">
                                                    <FileText size={20} />
                                                </div>
                                                <span className="font-medium">{contract.title}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(contract.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-gray-900 border border-gray-700 ${getStatusColor(contract.status)}`}>
                                                {contract.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleSync(contract.id)}
                                                className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-700 transition-colors"
                                                title="Sincronizar Status"
                                            >
                                                <RefreshCw size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {contracts.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-500">
                                            Nenhum contrato encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showUpload && (
                <ContractUpload
                    onClose={() => setShowUpload(false)}
                    onUploadSuccess={fetchContracts}
                />
            )}
        </div>
    );
};

export default Contracts;
