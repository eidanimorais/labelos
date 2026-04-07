
import axios from "axios";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import pLimit from "p-limit";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import fs from "fs";
import csv from "csv-parser";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    maxRedirects: 5,
    headers: {
        "User-Agent": "Mozilla/5.0",
    },
}));

// Configure R2
const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_V2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_V2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_V2_SECRET_ACCESS_KEY,
    },
});

const BUCKET = process.env.R2_V2_BUCKET_NAME;
const PUBLIC_DOMAIN = process.env.R2_V2_PUBLIC_DOMAIN;

function extractDriveId(url) {
    if (!url) return null;
    const m = url.match(/\/file\/d\/([^/]+)/);
    return m ? m[1] : null;
}

function extractAllISRCs(isrcRaw) {
    if (!isrcRaw) return [];
    return isrcRaw.split(',').map(p => p.trim()).filter(p => p.length > 5);
}

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

async function getDriveStream(fileId) {
    const base = `https://drive.google.com/uc?export=download&id=${fileId}`;

    // 1) First request (HTML + cookie)
    const first = await client.get(base, {
        responseType: "text",
        validateStatus: (s) => s >= 200 && s < 400,
    });

    // Check if it's already the file (direct download)
    if (
        first.headers["content-type"] &&
        !first.headers["content-type"].includes("text/html")
    ) {
        return {
            stream: first.data,
            contentType: first.headers["content-type"],
            direct: true,
        };
    }

    // 2) Extract token
    const match = first.data.match(/confirm=([0-9A-Za-z_]+)/);
    if (!match) {
        return { retryDirect: true };
    }

    const confirm = match[1];
    const finalUrl = `${base}&confirm=${confirm}`;

    // 3) Final request
    const final = await client.get(finalUrl, {
        responseType: "stream",
        validateStatus: (s) => s >= 200 && s < 400,
    });

    return {
        stream: final.data,
        contentType: final.headers["content-type"] || "application/octet-stream",
    };
}

async function getDriveStreamSafe(fileId) {
    const res = await getDriveStream(fileId);
    if (res.retryDirect || res.direct) {
        const base = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const final = await client.get(base, {
            responseType: "stream",
            validateStatus: (s) => s >= 200 && s < 400,
        });
        return {
            stream: final.data,
            contentType: final.headers["content-type"] || "application/octet-stream"
        }
    }
    return res;
}

async function uploadToR2(bucket, key, body, contentType) {
    const upload = new Upload({
        client: r2,
        params: {
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
        },
        queueSize: 3,
        partSize: 10 * 1024 * 1024,
    });

    await upload.done();
    return `${PUBLIC_DOMAIN}/${key}`;
}

async function processRow(row) {
    const isrcs = extractAllISRCs(row['ISRC']);
    if (isrcs.length === 0) return null;

    const coverLink = row['COVER ART'];
    const wavLink = row['WAV'];

    // We want to return an array of results, one per ISRC
    const results = [];
    let coverBuffer = null;
    let coverContentType = null;
    let wavBuffer = null;
    let wavContentType = null;

    // 1. Download Cover (once per row)
    if (coverLink && coverLink.includes('drive.google.com')) {
        const fileId = extractDriveId(coverLink);
        if (fileId) {
            try {
                const { stream, contentType } = await getDriveStreamSafe(fileId);
                coverBuffer = await streamToBuffer(stream);
                coverContentType = contentType;
            } catch (e) {
                console.error(`❌ [${isrcs[0]}...] Cover download failed: ${e.message}`);
            }
        }
    }

    // 2. Download WAV (once per row)
    if (wavLink && wavLink.includes('drive.google.com')) {
        const fileId = extractDriveId(wavLink);
        if (fileId) {
            try {
                const { stream, contentType } = await getDriveStreamSafe(fileId);
                wavBuffer = await streamToBuffer(stream);
                wavContentType = contentType === 'application/octet-stream' ? 'audio/wav' : contentType;
            } catch (e) {
                console.error(`❌ [${isrcs[0]}...] WAV download failed: ${e.message}`);
            }
        }
    }

    // 3. Upload for EACH ISRC
    for (const isrc of isrcs) {
        const result = { isrc, cover_url: null, master_audio_url: null };
        let changed = false;

        // Upload Cover
        if (coverBuffer) {
            try {
                const ext = coverContentType === 'image/png' ? 'png' : 'jpg';
                const key = `cover/${isrc}.${ext}`;
                const url = await uploadToR2(BUCKET, key, coverBuffer, coverContentType);
                result.cover_url = url;
                changed = true;
                console.log(`✅ [${isrc}] Cover uploaded: ${url}`);
            } catch (e) {
                console.error(`❌ [${isrc}] Cover upload failed: ${e.message}`);
            }
        }

        // Upload WAV
        if (wavBuffer) {
            try {
                const key = `audio/${isrc}.wav`;
                const url = await uploadToR2(BUCKET, key, wavBuffer, wavContentType);
                result.master_audio_url = url;
                changed = true;
                console.log(`✅ [${isrc}] WAV uploaded: ${url}`);
            } catch (e) {
                console.error(`❌ [${isrc}] WAV upload failed: ${e.message}`);
            }
        }

        if (changed) results.push(result);
    }

    return results.length > 0 ? results : null;
}

async function main() {
    // Default to the original file if no argument provided
    const defaultCsv = '../../uploads/catalogo-completo-fuub.csv';
    const argPath = process.argv[2];

    let csvPath;
    if (argPath) {
        // If argument provided, resolve relative to CWD (root)
        csvPath = path.resolve(process.cwd(), argPath);
    } else {
        // Fallback to relative from script dir
        csvPath = path.join(__dirname, defaultCsv);
    }

    console.log(`Processing CSV: ${csvPath}`);
    const rows = [];

    // Read CSV
    await new Promise((resolve, reject) => {
        fs.createReadStream(csvPath)
            .pipe(csv())
            .on('data', (data) => rows.push(data))
            .on('end', resolve)
            .on('error', reject);
    });

    console.log(`Found ${rows.length} rows in CSV.`);

    // Limit concurrency to avoid memory issues (buffers)
    const limit = pLimit(2);
    const allResults = [];

    const tasks = rows.map(row => limit(async () => {
        const rowResults = await processRow(row);
        if (rowResults) {
            allResults.push(...rowResults);
        }
    }));

    await Promise.all(tasks);

    // Save results
    fs.writeFileSync(
        path.join(__dirname, 'hydration_results.json'),
        JSON.stringify(allResults, null, 2)
    );
    console.log(`Done. Updated items: ${allResults.length}. Saved to hydration_results.json`);
}

main();
