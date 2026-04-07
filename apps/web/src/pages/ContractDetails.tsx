import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function ContractDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchContract();
    }, [id]);

    const fetchContract = async () => {
        try {
            const res = await api.get('/contracts/');
            const found = res.data.find((c: any) => c.id === Number(id));
            setContract(found);
        } catch (error) {
            console.error("Failed", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Carregando...</div>;
    if (!contract) return <div className="p-10 text-center">Contrato não encontrado</div>;

    return (
        <div className="min-h-screen font-body bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900 text-slate-800 dark:text-slate-100 p-4 md:p-8 antialiased selection:bg-primary selection:text-white transition-colors duration-300">
            <style>{`
        .glass-panel {
            background: rgba(255, 255, 255, 0.65);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }
        .dark .glass-panel {
            background: rgba(15, 23, 42, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .glass-card {
            background: rgba(255, 255, 255, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.6);
        }
        .dark .glass-card {
            background: rgba(30, 41, 59, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
      `}</style>

            <main className="max-w-6xl mx-auto">
                <button onClick={() => navigate('/contracts')} className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
                    <span className="material-icons-round text-base">arrow_back</span>
                    Voltar
                </button>

                <div className="glass-panel rounded-3xl shadow-2xl overflow-hidden p-6 md:p-10 relative">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary opacity-20 blur-3xl rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-pink-500 opacity-20 blur-3xl rounded-full pointer-events-none"></div>

                    <header className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center mb-10 border-b border-slate-200/50 dark:border-white/10 pb-6 gap-4">
                        <div>
                            <div className="bg-black text-white dark:bg-white dark:text-black font-display font-bold text-xl px-3 py-1 inline-block tracking-widest mb-2 uppercase">GRAV</div>
                            <h1 className="font-display font-bold text-2xl md:text-3xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                                {contract.title}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{contract.contract_type} - Participação e Direitos Artísticos</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/5 rounded-full border border-white/40 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            <span className={`w-2 h-2 rounded-full ${contract.status === 'Signed' ? 'bg-green-500' : 'bg-green-500'} animate-pulse`}></span>
                            ACTIVE CONTRACT
                        </div>
                    </header>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-6 glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4 text-primary">
                                <span className="material-icons-round text-3xl">business</span>
                                <h2 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white">Licenciada</h2>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">Nome Fantasia</p>
                                    <p className="font-semibold text-lg text-slate-800 dark:text-slate-100">GRAV</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">GRAV Producao Musical Ltda</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">CNPJ</p>
                                    <p className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-black/20 px-2 py-1 rounded inline-block border border-slate-200 dark:border-white/10">45.164.216/0001-20</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <span className="material-icons-round text-slate-400 text-sm mt-0.5">place</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                                        Avenida Paulista, 1636, Conjunto 4<br />
                                        Bela Vista, São Paulo – SP<br />
                                        CEP 01310-200
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-6 glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                            <div className="flex items-center gap-3 mb-4 text-pink-500">
                                <span className="material-icons-round text-3xl">person</span>
                                <h2 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white">Licenciante</h2>
                            </div>
                            <div className="space-y-4 relative z-10">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase">Nome Artístico</p>
                                        <p className="font-semibold text-xl text-slate-800 dark:text-slate-100">{contract.party_b}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">Manoel Medeiros Falcão</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="material-icons-round text-slate-300 dark:text-slate-600 text-4xl">mic_external_on</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase">CPF</p>
                                    <p className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100/50 dark:bg-black/20 px-2 py-1 rounded inline-block border border-slate-200 dark:border-white/10">187.765.947-93</p>
                                </div>
                                <div className="flex gap-2 items-start">
                                    <span className="material-icons-round text-slate-400 text-sm mt-0.5">home</span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">
                                        Al. Minuano, 23 - Quadra 42<br />
                                        Jardim Primavera, Duque de Caxias - RJ<br />
                                        CEP 25214-360
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-4 glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-4 text-emerald-500">
                                <span className="material-icons-round">account_balance_wallet</span>
                                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200">Dados de Pagamento</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-2">
                                    <span className="text-xs text-slate-500 uppercase font-medium">Banco</span>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white flex items-center gap-1">
                                        <span className="w-2 h-2 bg-purple-600 rounded-full"></span> Nubank (260)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-2">
                                    <span className="text-xs text-slate-500 uppercase font-medium">Agência</span>
                                    <span className="font-mono text-sm text-slate-700 dark:text-slate-300">0001</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-white/5 pb-2">
                                    <span className="text-xs text-slate-500 uppercase font-medium">Conta</span>
                                    <span className="font-mono text-sm text-slate-700 dark:text-slate-300">43816991-3</span>
                                </div>
                                <div className="pt-1">
                                    <span className="text-xs text-slate-500 block mb-1">Titular</span>
                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Manoel Medeiros Falcão</span>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-8 glass-card p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-white/40 to-indigo-50/40 dark:from-white/5 dark:to-indigo-900/10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2 text-indigo-500">
                                    <span className="material-icons-round">album</span>
                                    <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-700 dark:text-slate-200">Produto Fonográfico</h3>
                                </div>
                                <div className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded uppercase">Digital</div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Título do Fonograma</p>
                                    <p className="font-display font-bold text-2xl text-slate-900 dark:text-white leading-tight mb-4">"PRECISO SAIR DO LOOP"</p>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="material-icons-round text-slate-400 text-base">mic</span>
                                            <span className="text-slate-500 dark:text-slate-400">Intérprete:</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">Lil Chainz</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="material-icons-round text-slate-400 text-base">piano</span>
                                            <span className="text-slate-500 dark:text-slate-400">Músico:</span>
                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{contract.party_b}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col justify-between">
                                    <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 border border-white/40 dark:border-white/5">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-2">Data de Lançamento</p>
                                        <div className="flex items-center gap-2">
                                            <span className="material-icons-round text-primary">calendar_today</span>
                                            <span className="font-mono text-lg font-medium text-slate-800 dark:text-slate-100">12/09/2025</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 sm:mt-0">
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Título Provisório</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 italic">PRECISO SAIR DO LOOP</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center bg-gradient-to-b from-transparent to-green-50/50 dark:to-green-900/10">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-3">
                                    <span className="material-icons-round text-2xl">payments</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Pagamento Único</p>
                                <p className="font-display font-bold text-3xl text-slate-800 dark:text-white mb-2">R$ 200,00</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">Cessão total e definitiva de direitos patrimoniais sobre o fonograma.</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                                    <span className="material-icons-round text-2xl">badge</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Artista Principal</p>
                                <p className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">{contract.party_b}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Referente à parte do artista</p>
                            </div>
                            <div className="glass-card p-6 rounded-2xl flex flex-col justify-center items-center text-center">
                                <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                                    <span className="material-icons-round text-2xl">all_inclusive</span>
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Prazo Contratual</p>
                                <p className="font-display font-bold text-xl text-slate-800 dark:text-white mb-1">Indeterminado</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Vigência perpétua</p>
                            </div>
                        </div>
                    </div>

                    <footer className="mt-12 pt-8 border-t border-slate-200/50 dark:border-white/10 text-center relative z-10">
                        <p className="font-display text-lg md:text-xl font-medium text-slate-800 dark:text-slate-200 mb-6">
                            Resolvem a <span className="text-primary font-bold">LICENCIANTE</span> e a <span className="text-primary font-bold">LICENCIADA</span> (“Partes”) firmar a presente Autorização
                        </p>
                        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-8">
                            <button className="bg-primary hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
                                <span className="material-icons-round">draw</span>
                                Assinar Digitalmente
                            </button>
                            <button className="bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold py-3 px-6 rounded-xl border border-slate-200 dark:border-slate-600 transition-all flex items-center gap-2">
                                <span className="material-icons-round">download</span>
                                Baixar PDF
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-10 max-w-2xl mx-auto">
                            Esta é parte integrante do contrato firmado entre GRAV Producao Musical Ltda e Manoel Medeiros Falcão, da qual é a p 1.
                            Documento gerado digitalmente em conformidade com as leis vigentes.
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
