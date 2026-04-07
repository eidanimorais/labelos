import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { X, FileText, Download, Loader2 } from 'lucide-react';

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    track: any;
}

export function ContractModal({ isOpen, onClose, track }: ContractModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        artist_name: '',
        artist_cpf: '',
        track_title: '',
        isrc: '',
        payment_amount: 'R$ 200,00',
        bank_details: '',
        witness1_name: '',
        witness1_cpf: '',
        witness2_name: '',
        witness2_cpf: ''
    });

    useEffect(() => {
        if (track && isOpen) {
            setFormData(prev => ({
                ...prev,
                artist_name: track.artist || '',
                track_title: track.title || '',
                isrc: track.isrc || '',
                // Reset others or keep default
            }));
        }
    }, [track, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await api.post('/contracts/generate', formData, {
                responseType: 'blob' // Important for PDF download
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const safeTitle = formData.track_title.replace(/\s+/g, '_');
            link.setAttribute('download', `Contrato_${safeTitle}.html`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            onClose();
        } catch (error) {
            console.error("Error generating contract:", error);
            alert("Erro ao gerar contrato. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-700">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gerar Contrato</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Termo de Licenciamento de Fonograma</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">Dados do Artista</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo (Licenciante)</label>
                                <input
                                    name="artist_name"
                                    value={formData.artist_name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: João da Silva"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">CPF</label>
                                <input
                                    name="artist_cpf"
                                    value={formData.artist_cpf}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Dados Bancários</label>
                                <input
                                    name="bank_details"
                                    value={formData.bank_details}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Banco Nome, Ag 0000, CC 00000-0"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2">Dados da Obra</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Título da Faixa</label>
                                <input
                                    name="track_title"
                                    value={formData.track_title}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">ISRC</label>
                                <input
                                    name="isrc"
                                    value={formData.isrc}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor do Pagamento</label>
                                <input
                                    name="payment_amount"
                                    value={formData.payment_amount}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500 font-bold text-green-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Testemunhas (Opcional)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <input
                                    name="witness1_name"
                                    value={formData.witness1_name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none mb-2"
                                    placeholder="Nome Testemunha 1"
                                />
                                <input
                                    name="witness1_cpf"
                                    value={formData.witness1_cpf}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none"
                                    placeholder="CPF Testemunha 1"
                                />
                            </div>
                            <div>
                                <input
                                    name="witness2_name"
                                    value={formData.witness2_name}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none mb-2"
                                    placeholder="Nome Testemunha 2"
                                />
                                <input
                                    name="witness2_cpf"
                                    value={formData.witness2_cpf}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 dark:bg-gray-700 rounded-xl px-4 py-2 text-sm border-none"
                                    placeholder="CPF Testemunha 2"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading}
                        className="px-6 py-3 bg-gray-900 hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200 text-white rounded-xl font-bold flex items-center gap-2 transition disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        {loading ? 'Gerando...' : 'Baixar Contrato PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
