const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

function csvEscape(v) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

const dbPath = path.resolve(__dirname, "db.sqlite");
const outDir = path.resolve(__dirname, "exports");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);
const outFile = path.join(outDir, `streams_daily_${today}.csv`);

const db = new sqlite3.Database(dbPath);

const sql = `
SELECT
  a.track_url,
  a.date,
  a.total_streams,
  (a.total_streams - b.total_streams) AS streams_day
FROM streams_total a
JOIN streams_total b
  ON a.track_url = b.track_url
 AND b.date = DATE(a.date, '-1 day')
WHERE a.date = DATE('now')
ORDER BY streams_day DESC;
`;

// Fallback para teste se não houver dados de "hoje - ontem"
// Se a query principal vier vazia e for apenas um teste, pode não gerar nada, 
// mas o script segue a logica pedida.

db.all(sql, [], (err, rows) => {
    if (err) {
        console.error("Erro na query:", err.message);
        process.exit(1);
    }

    const header = ["track_url", "date", "total_streams", "streams_day"];
    const lines = [header.join(",")];

    for (const r of rows) {
        lines.push([
            csvEscape(r.track_url),
            csvEscape(r.date),
            csvEscape(r.total_streams),
            csvEscape(r.streams_day),
        ].join(","));
    }

    fs.writeFileSync(outFile, lines.join("\n"), "utf-8");
    console.log("CSV gerado:", outFile);

    db.close();
});
