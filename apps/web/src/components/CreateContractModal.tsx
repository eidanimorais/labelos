import { useState } from 'react';
import { api } from '../lib/api';
import { X, Save, FileText } from 'lucide-react';

interface CreateContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function CreateContractModal({ isOpen, onClose, onSuccess }: CreateContractModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        contract_type: 'Licenciamento',
        party_a: 'GRAV Produção Musical Ltda.',
        party_b: '',
        status: 'Draft'
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/contracts/', formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create contract", error);
            alert("Erro ao criar contrato");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-900 dark:bg-white rounded-xl text-white dark:text-black">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Novo Contrato</h2>
                            <p className="text-xs text-gray-500 font-medium">Preencha os dados iniciais</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto">
                    <form id="create-contract-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título do Contrato</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ex: Termo de Licenciamento - Artista X"
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tipo de Contrato</label>
                            <select
                                value={formData.contract_type}
                                onChange={e => setFormData({ ...formData, contract_type: e.target.value })}
                                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="Licenciamento">Licenciamento de Direitos</option>
                                <option value="Cessão">Cessão de Direitos</option>
                                <option value="Agenciamento">Agenciamento (Management)</option>
                                <option value="Edição">Edição (Publishing)</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contratante (Parte A)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.party_a}
                                    onChange={e => setFormData({ ...formData, party_a: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contratado (Parte B)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.party_b}
                                    onChange={e => setFormData({ ...formData, party_b: e.target.value })}
                                    placeholder="Nome do Artista/Parte"
                                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="create-contract-form"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Save className="h-4 w-4" />
                        {loading ? 'Criando...' : 'Criar Contrato'}
                    </button>
                </div>
            </div>
        </div>
    );
}
