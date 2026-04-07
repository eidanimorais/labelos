
import React, { useState } from 'react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast'; // Assuming toast is available
import { X, Upload } from 'lucide-react';

interface ContractUploadProps {
    onClose: () => void;
    onUploadSuccess: () => void;
}

const ContractUpload: React.FC<ContractUploadProps> = ({ onClose, onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [signers, setSigners] = useState([{ name: '', email: '' }]);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSignerChange = (index: number, field: 'name' | 'email', value: string) => {
        const newSigners = [...signers];
        newSigners[index][field] = value;
        setSigners(newSigners);
    };

    const addSigner = () => {
        setSigners([...signers, { name: '', email: '' }]);
    };

    const removeSigner = (index: number) => {
        const newSigners = signers.filter((_, i) => i !== index);
        setSigners(newSigners);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        // Validate signers
        if (signers.some(s => !s.name || !s.email)) {
            toast.error("Preencha todos os campos dos signatários");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('title', title);
        formData.append('file', file);
        formData.append('signers', JSON.stringify(signers));

        try {
            await api.uploadContract(formData);
            toast.success("Contrato enviado com sucesso!");
            onUploadSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error("Erro ao enviar contrato");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg relative border border-gray-700">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 text-white">Novo Contrato</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Título do Contrato</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white focus:outline-none focus:border-blue-500"
                            placeholder="Ex: Contrato de Cessão - Artista X"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Arquivo (PDF)</label>
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center cursor-pointer hover:border-gray-500 transition-colors relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <span className="text-green-400">{file.name}</span>
                            ) : (
                                <div className="text-gray-400 flex flex-col items-center">
                                    <Upload size={24} className="mb-2" />
                                    <span>Clique para selecionar o PDF</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-300">Signatários</label>
                        {signers.map((signer, index) => (
                            <div key={index} className="flex gap-2 mb-2 items-start">
                                <div className="flex-1 space-y-2">
                                    <input
                                        type="text"
                                        placeholder="Nome"
                                        value={signer.name}
                                        onChange={(e) => handleSignerChange(index, 'name', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email"
                                        value={signer.email}
                                        onChange={(e) => handleSignerChange(index, 'email', e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-sm text-white"
                                    />
                                </div>
                                {signers.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeSigner(index)}
                                        className="text-red-400 hover:text-red-300 mt-2"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addSigner}
                            className="text-sm text-blue-400 hover:text-blue-300 mt-1"
                        >
                            + Adicionar Signatário
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Enviando...' : 'Criar Contrato'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContractUpload;
