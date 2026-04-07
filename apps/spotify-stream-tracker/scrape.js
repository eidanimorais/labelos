const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// --- CONFIGURAÇÃO ---
const CONCURRENCY_LIMIT = 3; // Número de abas simultâneas
const DATA_DIR = path.resolve(__dirname, '../../data/spotify');
const AUTH_FILE = path.join(DATA_DIR, 'auth.json');
const EXPORT_DIR = path.join(DATA_DIR, 'exports');
// --------------------

// Garante pastas
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR);

// Verifica arquivo de faixas
const tracksPath = path.join(DATA_DIR, 'tracks.csv');
if (!fs.existsSync(tracksPath)) {
    console.error(`Erro: arquivo tracks.csv não encontrado em ${tracksPath}!`);
    process.exit(1);
}

// Lê e prepara lista de músicas
const tracks = fs.readFileSync(tracksPath, 'utf-8')
    .split('\n')
    .slice(1)
    .filter(line => line.trim() !== '')
    .map(line => {
        const lastCommaIndex = line.lastIndexOf(',');
        if (lastCommaIndex === -1) return null;
        const id = line.substring(0, lastCommaIndex).replace(/^"|"$/g, '');
        const url = line.substring(lastCommaIndex + 1);
        return { id, url };
    })
    .filter(item => item !== null);

// Banco de Dados
const dbPath = path.join(DATA_DIR, 'db.sqlite');
const db = new sqlite3.Database(dbPath);
db.run(`
  CREATE TABLE IF NOT EXISTS streams_total (
    track_id TEXT,
    date TEXT,
    total_streams INTEGER,
    track_url TEXT,
    PRIMARY KEY (track_id, date)
  )
`);

// Função de Delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Função para exportar CSV formatado (Matriz: Músicas x Datas)
function exportCSV() {
    return new Promise((resolve) => {
        const outFile = path.join(EXPORT_DIR, `historico_streams.csv`);

        // Pega TODO o histórico
        const sql = `
            SELECT track_id, date, total_streams 
            FROM streams_total 
            ORDER BY date ASC
        `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error("Erro ao exportar:", err);
                resolve();
                return;
            }

            // 1. Identificar todas as datas únicas e todas as músicas
            const datesSet = new Set();
            const tracksMap = new Map(); // track_id -> { date: streams }

            rows.forEach(r => {
                // Formata data YYYY-MM-DD para DD/MM/YYYY
                const [ano, mes, dia] = r.date.split('-');
                const dateHeader = `${dia}/${mes}/${ano}`;

                datesSet.add(dateHeader);

                if (!tracksMap.has(r.track_id)) {
                    tracksMap.set(r.track_id, {});
                }
                tracksMap.get(r.track_id)[dateHeader] = r.total_streams;
            });

            // Ordena datas cronologicamente (recriando o objeto Date para ordenar corretamente)
            const sortedDates = Array.from(datesSet).sort((a, b) => {
                const [da, ma, ya] = a.split('/');
                const [db, mb, yb] = b.split('/');
                return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
            });

            // 2. Construir o Cabeçalho
            const header = ["Nome da Música", ...sortedDates];
            const lines = [header.join(",")];

            // 3. Construir as Linhas (Ordenadas pelo total de streams da última data)
            const sortedTracks = Array.from(tracksMap.keys()).sort((a, b) => {
                const lastDate = sortedDates[sortedDates.length - 1];
                const streamsA = tracksMap.get(a)[lastDate] || 0;
                const streamsB = tracksMap.get(b)[lastDate] || 0;
                return streamsB - streamsA; // Decrescente
            });

            sortedTracks.forEach(trackId => {
                const row = [trackId.includes(',') ? `"${trackId}"` : trackId]; // Escape nome

                sortedDates.forEach(date => {
                    const val = tracksMap.get(trackId)[date];
                    row.push(val !== undefined ? val : ""); // Célula vazia se não tiver dado
                });

                lines.push(row.join(","));
            });

            fs.writeFileSync(outFile, lines.join("\n"), "utf-8");
            console.log(`\n📄 CSV Histórico Exportado: ${outFile}`);
            resolve();
        });
    });
}

(async () => {
    // Verifica se existe sessão salva
    let browser;
    let context;
    const hasAuth = fs.existsSync(AUTH_FILE);
    const isHeadless = hasAuth; // Se tem auth, roda headless (escondido). Se não, roda com janela.

    console.log(`Iniciando Scraper... (Modo: ${isHeadless ? 'Automático/Headless' : 'Setup/Visual'})`);

    browser = await chromium.launch({ headless: isHeadless });

    if (hasAuth) {
        context = await browser.newContext({ storageState: AUTH_FILE });
    } else {
        context = await browser.newContext();
        const page = await context.newPage();

        console.log("\n🔒 SESSÃO NÃO ENCONTRADA");
        console.log("Acessando Spotify para login manual...");
        await page.goto('https://accounts.spotify.com/login');

        console.log('\n--- AÇÃO NECESSÁRIA ---');
        console.log('1. Faça login na janela do navegador.');
        console.log('2. VOLTE AQUI e pressione ENTER para salvar a sessão e começar.');
        console.log('-----------------------');

        await new Promise(resolve => process.stdin.once('data', resolve));

        // Salva o estado da sessão (cookies, localStorage)
        await context.storageState({ path: AUTH_FILE });
        console.log("✅ Sessão salva em 'auth.json'. Próximas execuções serão automáticas.\n");
        await page.close();
    }

    // Gerenciamento de Concorrência
    console.log(`Processando ${tracks.length} músicas com ${CONCURRENCY_LIMIT} abas simultâneas...`);

    // Divide tracks em chunks
    for (let i = 0; i < tracks.length; i += CONCURRENCY_LIMIT) {
        const chunk = tracks.slice(i, i + CONCURRENCY_LIMIT);
        const promises = chunk.map(async (track) => {
            const page = await context.newPage();
            try {
                // Bloqueia imagens e fontes para economizar dados/memória
                await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2}', route => route.abort());

                await page.goto(track.url, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(2000); // Pequeno delay garante renderização dinâmica

                const streamsText = await page.locator('[data-testid="playcount"]').first().textContent()
                    .catch(() => page.locator('span:has-text("reproduções")').first().textContent())
                    .catch(() => null);

                if (streamsText) {
                    const total = parseInt(streamsText.replace(/\D/g, ''), 10);
                    if (!isNaN(total)) {
                        const today = new Date().toISOString().slice(0, 10);

                        await new Promise((resolve) => {
                            db.run(
                                `INSERT OR REPLACE INTO streams_total (track_id, date, total_streams, track_url) VALUES (?, ?, ?, ?)`,
                                [track.id, today, total, track.url],
                                resolve
                            );
                        });
                        console.log(`[${track.id.substring(0, 15)}...] ${total.toLocaleString()}`);
                    } else {
                        console.log(`[${track.id}] Falha: Formato numérico inválido`);
                    }
                } else {
                    console.log(`[${track.id}] Falha: Contador não encontrado`);
                }
            } catch (e) {
                console.error(`[${track.id}] Erro: ${e.message}`);
            } finally {
                await page.close();
            }
        });

        await Promise.all(promises);
    }

    await exportCSV();

    await browser.close();
    db.close();
    console.log("\n🏁 Processo Finalizado com Sucesso!");
})();
