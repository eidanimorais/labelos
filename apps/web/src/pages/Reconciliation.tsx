import React, { useState } from 'react';
import { ArrowLeft, Upload, CheckCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Reconciliation() {
    const navigate = useNavigate();
    const [beneficiaries, setBeneficiaries] = useState([
        { id: 1, name: 'GRAV Produção Musical Ltda.', role: 'Label', balance: 5449.17, payment: '' },
        { id: 2, name: 'Lil Chainz', role: 'Artist', balance: 3240.50, payment: '' },
        { id: 3, name: 'Chusk Beats', role: 'Producer', balance: 1050.00, payment: '' },
        { id: 4, name: 'Snif', role: 'Feat', balance: 800.00, payment: '' },
    ]);

    const [files, setFiles] = useState<{ [key: number]: File | null }>({});

    const handlePaymentChange = (id: number, value: string) => {
        setBeneficiaries(prev => prev.map(b =>
            b.id === id ? { ...b, payment: value } : b
        ));
    };

    const handleFileChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setFiles(prev => ({ ...prev, [id]: event.target.files![0] }));
        }
    };

    const handleConciliate = () => {
        alert("Conciliação realizada com sucesso! (Simulação)");
        navigate('/');
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                </button>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Conciliação de Pagamentos</h1>
            </div>

            <div className="bg-white dark:bg-card-dark rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pagamentos Pendentes</h3>
                        <p className="text-sm text-gray-500">Registre os pagamentos realizados e anexe os comprovantes.</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-xl flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-300">Trimestre Atual</span>
                    </div>
                </div>

                <div className="space-y-6">
                    {beneficiaries.map((b) => (
                        <div key={b.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center gap-6">
                            {/* Beneficiary Info */}
                            <div className="flex-1">
                                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{b.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        {b.role}
                                    </span>
                                    <span className="text-sm text-gray-500">Saldo: <b>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(b.balance)}</b></span>
                                </div>
                            </div>

                            {/* Payment Input */}
                            <div className="w-full md:w-64">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Valor Pago</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                                    <input
                                        type="number"
                                        placeholder="0,00"
                                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border-none rounded-xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 transition-all placeholder-gray-300"
                                        value={b.payment}
                                        onChange={(e) => handlePaymentChange(b.id, e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Upload Proof */}
                            <div className="w-full md:w-auto flex flex-col gap-2">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 text-center md:text-left opacity-0">Comprovante</label>
                                <label className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-all ${files[b.id] ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-300 dark:border-gray-600 text-gray-400 hover:border-purple-400 hover:text-purple-500'}`}>
                                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={(e) => handleFileChange(b.id, e)} />
                                    {files[b.id] ? (
                                        <>
                                            <CheckCircle className="h-5 w-5" />
                                            <span className="text-xs font-bold truncate max-w-[100px]">{files[b.id]?.name}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-5 w-5" />
                                            <span className="text-xs font-bold">Anexar PDF</span>
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <button
                        onClick={handleConciliate}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-green-500/20 flex items-center gap-2 transition-all transform active:scale-95"
                    >
                        <CheckCircle className="h-5 w-5" />
                        Confirmar Conciliação
                    </button>
                </div>
            </div>
        </div>
    );
}
