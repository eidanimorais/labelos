import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Lock, User, ArrowRight, Music } from 'lucide-react';

export function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const res = await api.post('/auth/login', formData);
            await login(res.data.access_token);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Falha na autenticação. Verifique suas credenciais.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a051e] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary shadow-2xl shadow-primary/40 mb-6 group transition-transform hover:scale-110">
                        <Music className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter text-white mb-2">LabelOS</h1>
                    <p className="text-gray-400 font-medium">Portal de Royalties & Catálogo</p>
                </div>

                <div className="bg-[#1a162e] border border-white/10 p-10 rounded-[40px] shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-2xl text-sm font-bold text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Usuário</label>
                            <div className="relative">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#0a051e] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    placeholder="Seu nome artístico ou usuário"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0a051e] border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary-hover text-white font-black py-5 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {isLoading ? 'ACESSANDO...' : 'ENTRAR NO PORTAL'}
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>
                </div>

                <p className="text-center mt-8 text-gray-500 text-sm font-medium">
                    Esqueceu sua senha? <span className="text-primary hover:underline cursor-pointer">Entre em contato</span>
                </p>
            </div>
        </div>
    );
}
