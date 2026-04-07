import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';

export function AssetHub() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [statusText, setStatusText] = useState([
        '_SISTEMA_DE_NAVEGACAO_INICIALIZADO...',
        '_PRONTO_PARA_EDICAO.'
    ]);

    // Navigation State
    const [isrcList, setIsrcList] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [trackData, setTrackData] = useState({
        title: '',
        artist: '',
        release_date: '',
        isrc: '',
        producer: '',
        audio_engineer: '',
        upc: '',
        label_name: 'GRAV Produção Musical Ltda.',
        publisher: '',
        copyright_holder: '',
        notes: ''
    });

    const [splits, setSplits] = useState([
        { participant: 'Rodrigo Zin', role: 'ARTISTA', share: '65.00', color: 'text-[#999]' },
        { participant: 'PRODUTOR', role: 'PRODUTOR', share: '20.00', color: 'text-[#999]' },
        { participant: 'SELO', role: 'SELO', share: '10.00', color: 'text-[#999]' },
        { participant: 'RESERVE FUND', role: 'RESERVE', share: '05.00', color: 'text-[#00FF41]' }
    ]);

    // Initial Load: All ISRCs
    useEffect(() => {
        api.get('/tracks/isrcs').then(res => {
            const list = res.data;
            setIsrcList(list);
            if (list.length > 0) {
                setCurrentIndex(0);
                loadTrack(list[0]);
            }
        });
    }, []);

    const addStatus = (text: string) => {
        setStatusText(prev => [...prev.slice(-3), `_ ${text}`]);
    };

    const loadTrack = async (isrc: string) => {
        setLoading(true);
        addStatus(`CARREGANDO_ISRC: ${isrc}`);
        try {
            const res = await api.get(`/tracks/search`, { params: { q: isrc } });
            if (res.data.length > 0) {
                const t = res.data[0];
                setTrackData({
                    title: t.musica_display || '',
                    artist: t.artist || '',
                    release_date: t.release_date || '',
                    isrc: t.isrc || '',
                    producer: t.producer || '',
                    audio_engineer: t.audio_engineer || '',
                    upc: t.upc || '',
                    label_name: t.label_name || 'GRAV Produção Musical Ltda.',
                    publisher: t.publisher || '',
                    copyright_holder: t.composer || '', // Using composer as fallback for holder if empty
                    notes: '' // Placeholder for notes if not in basic schema
                });
                // Update splits if available
                if (t.split_summary && t.split_summary.length > 0) {
                    setSplits(t.split_summary.map((s: any) => ({
                        participant: s.name.toUpperCase(),
                        role: s.role?.toUpperCase() || 'ARTISTA',
                        share: parseFloat(s.percentage).toFixed(2),
                        color: s.name.toUpperCase().includes('RESERVE') ? 'text-[#00FF41]' : 'text-[#999]'
                    })));
                } else {
                    // Default splits
                    setSplits([
                        { participant: 'Rodrigo Zin', role: 'ARTISTA', share: '65.00', color: 'text-[#999]' },
                        { participant: 'PRODUTOR', role: 'PRODUTOR', share: '20.00', color: 'text-[#999]' },
                        { participant: 'SELO', role: 'SELO', share: '10.00', color: 'text-[#999]' },
                        { participant: 'RESERVE FUND', role: 'RESERVE', share: '05.00', color: 'text-[#00FF41]' }
                    ]);
                }
                addStatus(`ISRC_CARREGADO: ${t.musica_display}`);
            } else {
                addStatus(`ERRO: ISRC_NAO_ENCONTRADO`);
            }
        } catch (err) {
            addStatus(`FALHA_AO_PROCESSAR_BUSCA`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!trackData.isrc) return;
        setLoading(true);
        addStatus('INICIANDO_PERSISTENCIA...');

        try {
            // Update Track Metadata
            addStatus('SALVANDO_METADADOS: ' + trackData.isrc);
            await api.put(`/tracks/${trackData.isrc}`, {
                musica_display: trackData.title,
                artist: trackData.artist,
                release_date: trackData.release_date,
                producer: trackData.producer,
                audio_engineer: trackData.audio_engineer,
                upc: trackData.upc,
                publisher: trackData.publisher,
                composer: trackData.copyright_holder // Mapping holder to composer for now in PUT
            });

            addStatus('BANCO_DE_DADOS_ATUALIZADO_SUCESSO');
        } catch (err: any) {
            addStatus('FALHA_NA_GRAVACAO: ' + (err.response?.data?.detail || 'ERRO_REQ'));
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentIndex < isrcList.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            loadTrack(isrcList[nextIdx]);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            const prevIdx = currentIndex - 1;
            setCurrentIndex(prevIdx);
            loadTrack(isrcList[prevIdx]);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery) {
            loadTrack(searchQuery);
            const foundIdx = isrcList.indexOf(searchQuery.toUpperCase());
            if (foundIdx !== -1) setCurrentIndex(foundIdx);
        }
    };

    return (
        <div className="bg-[#050505] text-[#E0E0E0] font-mono min-h-screen selection:bg-[#00FF41] selection:text-black antialiased overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
                .section-header { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #0A0A0A; border-left: 3px solid #00FF41; }
                .input-group { display: flex; align-items: center; gap: 12px; border: 1px solid #141414; padding: 10px 14px; transition: all 0.2s; background: rgba(5,5,5,0.5); }
                .input-group:hover { border-color: #222; background: #080808; }
                .input-group:focus-within { border-color: #00FF41; background: #080808; }
                .label-mono { font-size: 10px; color: #333; text-transform: uppercase; width: 140px; flex-shrink: 0; pointer-events: none; letter-spacing: 0.05em; }
                .input-mono { background: transparent; border: none; padding: 0; width: 100%; font-size: 13px; color: #999; }
                .input-mono:focus { outline: none; box-shadow: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #1A1A1A; }
                .ledger-row td { padding: 12px 14px; border-bottom: 1px solid #111; font-size: 13px; }
                .search-input { background: transparent; border: 1px solid #222; padding: 4px 12px; color: #00FF41; font-weight: bold; width: 240px; font-size: 14px; }
                .search-input:focus { outline: none; border-color: #00FF41; }
            `}} />

            {/* HEADER */}
            <header className="h-10 border-b border-[#141414] flex items-center justify-between px-4 bg-black/80 backdrop-blur-md z-50">
                <div className="flex items-center gap-6">
                    <span className="text-[#00FF41] font-bold text-[11px] tracking-[0.2em]">MUSIC_RIGHTS_OS v2.4.0</span>
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            placeholder="PESQUISAR_ISRC..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                        />
                    </form>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                    <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-[#00FF41] rounded-full animate-pulse shadow-[0_0_8px_#00FF41]"></span>
                        SISTEMA_NAVEGAVEL
                    </span>
                    <span className="text-[#222] font-bold">OPERADOR: ASSET_MNGR_01</span>
                </div>
            </header>

            <div className="flex h-[calc(100vh-2.5rem)]">
                {/* SIDEBAR */}
                <aside className="w-14 border-r border-[#141414] flex flex-col items-center py-6 gap-8 bg-black shrink-0">
                    <button className="text-[#00FF41] hover:bg-[#111] p-2 rounded transition-colors" onClick={() => navigate('/songs')}>
                        <span className="material-symbols-outlined text-[20px]">library_music</span>
                    </button>
                    <button className="text-[#222] hover:text-white p-2 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">copyright</span>
                    </button>
                    <button className="text-[#222] hover:text-white p-2 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
                    </button>
                    <button className="text-[#222] hover:text-white p-2 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                    </button>
                    <div className="mt-auto mb-4">
                        <button className="text-red-900/40 hover:text-red-500 p-2 transition-colors">
                            <span className="material-symbols-outlined text-[20px]">terminal</span>
                        </button>
                    </div>
                </aside>

                <main className="flex-1 overflow-hidden flex flex-col bg-[#050505]">
                    {/* BARRAS DE TOPO */}
                    <div className="p-4 border-b border-[#141414] flex items-center justify-between bg-black/40">
                        <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-[#0A0A0A] border border-[#141414] overflow-hidden rounded-sm relative shadow-2xl">
                                <img
                                    alt="CAPA"
                                    className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
                                    src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200&auto=format&fit=crop"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold leading-none tracking-tight">
                                    LANCAMENTO: <span className="text-[#00FF41]">{trackData.title || 'VAZIO'}</span>
                                </h1>
                                <p className="text-[9px] text-[#222] mt-1.5 tracking-[0.3em] uppercase">CAT_ID: d92-f021-482c-b391-asset-hub</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handlePrev} disabled={currentIndex <= 0} className="border border-[#1A1A1A] text-[#444] hover:text-white hover:border-white px-5 py-2 text-[10px] transition-all font-bold uppercase tracking-[0.2em] disabled:opacity-20 shrink-0">ISRC ANTERIOR</button>
                            <button onClick={handleNext} disabled={currentIndex >= isrcList.length - 1} className="border border-[#1A1A1A] text-[#444] hover:text-white hover:border-white px-5 py-2 text-[10px] transition-all font-bold uppercase tracking-[0.2em] disabled:opacity-20 shrink-0">PROXIMO ISRC</button>
                            <button onClick={handleSave} disabled={loading} className="bg-[#00FF41] text-black px-10 py-2 text-[10px] transition-all font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,255,65,0.15)] disabled:opacity-50">SALVAR</button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10 max-w-[1400px] mx-auto">

                            {/* COLUNA 01: ATRIBUTOS PRINCIPAIS */}
                            <div className="space-y-10">
                                <div>
                                    <div className="section-header mb-4">
                                        <span className="text-[10px] font-bold tracking-[0.3em]">01 // ATRIBUTOS_PRINCIPAIS</span>
                                    </div>
                                    <div className="space-y-[2px]">
                                        <div className="input-group">
                                            <span className="label-mono">TITULO_DA_MUSICA</span>
                                            <input disabled className="input-mono font-bold text-[#00FF41] opacity-70" type="text" value={trackData.title} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">NOME_DO_ARTISTA</span>
                                            <input className="input-mono" type="text" value={trackData.artist} onChange={(e) => setTrackData({ ...trackData, artist: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">DATA_LANCAMENTO</span>
                                            <input className="input-mono" type="text" value={trackData.release_date} onChange={(e) => setTrackData({ ...trackData, release_date: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">CODIGO_ISRC</span>
                                            <input disabled className="input-mono font-bold text-[#00FF41] opacity-70" type="text" value={trackData.isrc} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">PRODUTOR</span>
                                            <input className="input-mono" type="text" value={trackData.producer} onChange={(e) => setTrackData({ ...trackData, producer: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">ENG_DE_AUDIO</span>
                                            <input className="input-mono" type="text" value={trackData.audio_engineer} onChange={(e) => setTrackData({ ...trackData, audio_engineer: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                {/* SECAO 03: COPYRIGHT */}
                                <div>
                                    <div className="section-header mb-4">
                                        <span className="text-[10px] font-bold tracking-[0.3em]">03 // DETALHES_DE_COPYRIGHT</span>
                                    </div>
                                    <div className="space-y-[2px]">
                                        <div className="input-group">
                                            <span className="label-mono">EDITORA_PRINCIPAL</span>
                                            <input className="input-mono" type="text" value={trackData.publisher} onChange={(e) => setTrackData({ ...trackData, publisher: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">DETENTOR_DIREITOS</span>
                                            <input className="input-mono" type="text" value={trackData.copyright_holder} onChange={(e) => setTrackData({ ...trackData, copyright_holder: e.target.value })} />
                                        </div>
                                        <div className="input-group">
                                            <span className="label-mono">CODIGO_UPC_EAN</span>
                                            <input className="input-mono text-[#333]" type="text" value={trackData.upc} onChange={(e) => setTrackData({ ...trackData, upc: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COLUNA 02: REVENUE SPLIT LEDGER */}
                            <div className="space-y-10">
                                <div>
                                    <div className="section-header mb-4">
                                        <span className="text-[10px] font-bold tracking-[0.3em]">02 // REVENUE_SPLIT_LEDGER</span>
                                    </div>
                                    <div className="border border-[#141414] bg-[#080808]/30 overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#0A0A0A] border-b border-[#141414]">
                                                <tr>
                                                    <th className="p-4 text-[9px] text-[#222] uppercase tracking-[0.2em] w-2/5">PARTICIPANTE</th>
                                                    <th className="p-4 text-[9px] text-[#222] uppercase tracking-[0.2em] w-1/5 whitespace-nowrap">TIPO</th>
                                                    <th className="p-4 text-[9px] text-[#222] uppercase tracking-[0.2em] w-1/5 text-right">SHARE</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#121212]">
                                                {splits.map((s: any, i) => (
                                                    <tr key={i} className="ledger-row hover:bg-[#111]/40 transition-colors">
                                                        <td className={clsx("font-bold tracking-tight uppercase", s.color)}>
                                                            {s.participant.replace(/_/g, ' ')}
                                                        </td>
                                                        <td className="text-[10px] text-[#333] font-bold uppercase tracking-widest whitespace-nowrap">
                                                            {s.role || 'ARTISTA'}
                                                        </td>
                                                        <td className={clsx("text-right font-bold", s.color)}>{s.share}%</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <div className="p-4 bg-[#0A0A0A]/50 flex justify-between items-center border-t border-[#141414]">
                                            <span className="text-[9px] text-[#222] uppercase tracking-[0.2em]">TOTAL_ALLOCATION</span>
                                            <span className="text-[12px] font-bold text-[#00FF41]">100.00%</span>
                                        </div>
                                    </div>
                                </div>

                                {/* SECAO 04: LINKS DE UPLOAD */}
                                <div>
                                    <div className="section-header mb-4">
                                        <span className="text-[10px] font-bold tracking-[0.3em]">04 // LINKS_DE_UPLOAD</span>
                                    </div>
                                    <div className="space-y-[2px]">
                                        {[
                                            { label: 'ARQUIVO_AUDIO', icon: 'audio_file', color: 'text-blue-500/50', placeholder: 'https://cdn.grid.io/audio/...' },
                                            { label: 'IMAGEM_CAPA', icon: 'image', color: 'text-[#222]', placeholder: 'https://cdn.grid.io/art/...' },
                                            { label: 'TEASER_VIDEO', icon: 'movie', color: 'text-[#222]', placeholder: 'https://cdn.grid.io/video/...' }
                                        ].map((link, idx) => (
                                            <div key={idx} className="input-group group relative">
                                                <span className="material-symbols-outlined text-[18px] text-[#222] group-hover:text-[#444] ml-3">{link.icon}</span>
                                                <span className="text-[10px] text-[#111] group-hover:text-[#333] w-28 shrink-0 ml-3">{link.label}</span>
                                                <input className={clsx("input-mono", link.color)} placeholder={link.placeholder} type="text" />
                                                <div className="pr-1">
                                                    <label className="cursor-pointer bg-[#0A0A0A] hover:bg-[#111] border border-[#141414] px-3 py-1.5 text-[9px] font-bold text-[#333] hover:text-[#00FF41] transition-all flex items-center gap-2 uppercase tracking-tighter shrink-0">
                                                        <span className="material-symbols-outlined text-[14px]">cloud_upload</span>
                                                        UPLOAD
                                                        <input type="file" className="hidden" onChange={(e) => addStatus(`SUBINDO_ARQUIVO: ${e.target.files?.[0].name}`)} />
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FINAL LOGS */}
                        <div className="mt-16 border-t border-[#141414] pt-8 flex justify-between items-end pb-16 max-w-[1400px] mx-auto">
                            <div className="text-[10px] text-[#111] font-mono leading-tight space-y-1.5 select-none hover:text-[#333] transition-colors">
                                {statusText.map((line, i) => (
                                    <div key={i} className={clsx(i === statusText.length - 1 && "text-[#00FF41]/40")}>&gt; {line}</div>
                                ))}
                            </div>
                            <div className="flex items-center gap-10">
                                <div className="text-right">
                                    <p className="text-[9px] text-[#111] uppercase tracking-[0.3em]">Sincronização</p>
                                    <p className="text-[10px] font-bold text-[#00FF41]/30 uppercase">Efetiva</p>
                                </div>
                                <div className="h-12 w-[1px] bg-[#141414]"></div>
                                <div className="text-[11px] font-bold text-[#333] tracking-[0.2em]">
                                    {currentIndex + 1} / {isrcList.length}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* BARRA FIXA RODAPE */}
            <footer className="h-10 border-t border-[#141414] flex items-center px-4 bg-black fixed bottom-0 w-full z-50">
                <div className="text-[10px] text-[#111] flex items-center gap-8 font-bold">
                    <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[#00FF41]/20 rounded-full"></span> ZONA: GLO-DIST-01</span>
                    <span className="hidden sm:inline">NOD: ASSET_BROWSER_V1</span>
                    <span className="text-[#00FF41]/20 animate-pulse cursor-default uppercase">MODO_AUDITORIA_ATIVO</span>
                </div>
            </footer>
        </div>
    );
}

export default AssetHub;
