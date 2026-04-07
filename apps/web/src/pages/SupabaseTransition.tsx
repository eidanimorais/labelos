import { Database, Layers3, ShieldCheck, Sparkles } from "lucide-react";
import { APP_BACKEND, HAS_SUPABASE_CONFIG, SUPABASE_URL } from "../lib/config";

const migrationSteps = [
    "Autenticacao com Supabase Auth",
    "Perfis e catalogo principal",
    "Tracks, splits e obras",
    "Contratos, imports e relatorios",
];

export function SupabaseTransition() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(62,207,142,0.18),_transparent_35%),linear-gradient(180deg,_#06110d_0%,_#081813_45%,_#03100b_100%)] text-white">
            <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
                <div className="flex flex-col gap-6 rounded-[32px] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-emerald-200">
                        <Sparkles className="h-4 w-4" />
                        LabelOS em simplificacao
                    </div>

                    <div className="max-w-3xl space-y-4">
                        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                            O core do LabelOS agora vai viver em Vercel + Supabase.
                        </h1>
                        <p className="text-base leading-7 text-emerald-50/80 sm:text-lg">
                            A API Python deixou de ser o caminho principal. A partir daqui, a migracao vai
                            acontecer modulo por modulo para manter a operacao mais simples, barata e facil de manter.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="rounded-[28px] border border-white/10 bg-black/20 p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <Layers3 className="h-5 w-5 text-emerald-300" />
                            <h2 className="text-xl font-bold">Ordem da migracao</h2>
                        </div>

                        <div className="space-y-4">
                            {migrationSteps.map((step, index) => (
                                <div
                                    key={step}
                                    className="flex items-center gap-4 rounded-2xl border border-white/8 bg-white/5 px-5 py-4"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-sm font-black text-emerald-200">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{step}</p>
                                        <p className="text-sm text-white/60">
                                            Vamos trocar as telas mais centrais primeiro, sem forcar uma reescrita cega.
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-white/10 bg-black/20 p-8">
                        <div className="mb-6 flex items-center gap-3">
                            <Database className="h-5 w-5 text-emerald-300" />
                            <h2 className="text-xl font-bold">Status do frontend</h2>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                                <p className="mb-1 text-white/60">Backend ativo</p>
                                <p className="font-mono text-emerald-200">{APP_BACKEND}</p>
                            </div>

                            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
                                <p className="mb-1 text-white/60">Supabase configurado</p>
                                <p className="font-semibold text-white">
                                    {HAS_SUPABASE_CONFIG ? "Sim" : "Ainda faltam variaveis de ambiente"}
                                </p>
                                <p className="mt-2 break-all font-mono text-xs text-white/50">
                                    {SUPABASE_URL || "Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel."}
                                </p>
                            </div>

                            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-amber-100">
                                As telas antigas ainda existem no codigo, mas ficam desativadas enquanto a base Supabase
                                nao assume esses modulos. Isso evita depender de uma API Python so para manter a interface viva.
                            </div>

                            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                                <div className="mb-2 flex items-center gap-2 font-semibold text-emerald-100">
                                    <ShieldCheck className="h-4 w-4" />
                                    Proximo foco
                                </div>
                                <p className="text-emerald-50/85">
                                    Criar o esquema inicial no Supabase e substituir primeiro os modulos de autenticacao,
                                    perfis e tracks.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
