/**
 * import-squads.js
 * Lê 2026_Dados_Cadastrais_Base.xlsx e gera src/constants/squads.js
 * Fotos: extraídas automaticamente dos links Imgur da coluna "Link".
 * Override manual: coluna "app" (nome de arquivo em imagens/fotos/).
 *
 * Uso:  npm run import-squads
 */

const XLSX  = require("xlsx");
const https = require("https");
const http  = require("http");
const fs    = require("fs");
const path  = require("path");

// ── Caminhos ─────────────────────────────────────────────────
const XLSX_PATH  = path.join(__dirname, "../2026_Dados_Cadastrais_Base.xlsx");
const OUT_PATH   = path.join(__dirname, "../src/constants/squads.js");
const CACHE_PATH = path.join(__dirname, "../.cache/imgur-photos.json");

// ── Cache de fotos já resolvidas ──────────────────────────────
function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")); }
  catch { return {}; }
}
function saveCache(cache) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), "utf8");
}

// ── Busca a URL direta de imagem a partir de uma URL Imgur ────
function fetchImgurImage(url) {
  return new Promise(resolve => {
    const mod = url.startsWith("https") ? https : http;
    const req = mod.get(url, {
      headers: {
        "User-Agent":      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    }, res => {
      // Seguir redirecionamento uma vez
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
        return resolve(fetchImgurImage(res.headers.location));
      }
      let html = "";
      res.setEncoding("utf8");
      res.on("data", chunk => {
        html += chunk;
        // Interrompe ao ter HTML suficiente para encontrar a imagem
        if (html.length > 80_000) req.destroy();
      });
      res.on("end", () => {
        // 1. Tenta og:image (mais confiável)
        const og = html.match(/<meta property="og:image" content="([^"]+)"/i)
                || html.match(/<meta name="twitter:image" content="([^"]+)"/i);
        if (og) {
          const raw = og[1].replace(/&amp;/g, "&");
          // Converte para tamanho 'l' (large 640px) se tiver sufixo de tamanho
          const sized = raw.replace(/(i\.imgur\.com\/)([a-zA-Z0-9]{4,})[shbtmhl](\.(jpg|png|gif|jpeg))/i,
            (_, host, id, ext) => `${host}${id}l${ext}`);
          return resolve(sized);
        }
        // 2. Fallback: primeira URL i.imgur com ID de 5+ chars
        const m = html.match(/(https:\/\/i\.imgur\.com\/[a-zA-Z0-9]{5,}[shbtmhl]?\.(jpg|png|gif|jpeg))/i);
        if (m) {
          const sized = m[1].replace(/(i\.imgur\.com\/)([a-zA-Z0-9]{5,})[shbtmhl](\.(jpg|png|gif|jpeg))/i,
            (_, host, id, ext) => `${host}${id}l${ext}`);
          return resolve(sized);
        }
        resolve(null);
      });
      res.on("error", () => resolve(null));
    });
    req.on("error", () => resolve(null));
    req.setTimeout(10_000, () => { req.destroy(); resolve(null); });
  });
}

// ── Delay entre requisições para não sobrecarregar o Imgur ────
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── Normalização ──────────────────────────────────────────────
function normalizePos(raw) {
  if (!raw) return "Volante";
  const p = raw.trim().toUpperCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (p.includes("GOLEIRO") || p === "GK" || p === "GL") return "Goleiro";
  if (p.includes("ZAGUEIRO"))                            return "Zagueiro";
  if (p.includes("LATERAL") && p.includes("DIR"))       return "Lateral Direito";
  if (p.includes("LATERAL") && p.includes("ESQ"))       return "Lateral Esquerdo";
  if (p === "LATERAL")                                   return "Lateral Direito";
  if (p.includes("VOLANTE") || p === "FIXO")            return "Volante";
  if (p.includes("MEIA"))                                return "Meia";
  if (p.includes("PONTA") || p === "ALA")               return "Ponta";
  if (p.includes("ATACANTE") || p === "PIVO" || p === "PIVÔ") return "Atacante";
  return "Volante";
}

function normalizeCat(raw) {
  if (!raw) return null;
  const c = String(raw).trim().toLowerCase().replace(/\s+/g, "");
  const m = c.match(/sub(\d+)/);
  if (m) return `Sub ${String(parseInt(m[1])).padStart(2, "0")}`;
  if (c === "profissional") return "Profissional";
  if (c === "feminino")     return "Feminino";
  return null;
}

// ── Main ──────────────────────────────────────────────────────
async function main() {
  // 1. Ler planilha
  const wb   = XLSX.readFile(XLSX_PATH);
  const ws   = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws);

  // 2. Agrupar por categoria
  const grouped = {};
  rows.forEach(row => {
    const cat = normalizeCat(row["Categoria"]);
    if (!cat) return;
    const athleteId = String(row["ID do Atleta"] || "").trim();
    const name      = String(row["Nome"] || "").trim();
    const nickname  = String(row["Apelido"] || "").trim() || name.split(" ")[0];
    const pos       = normalizePos(row["Posição"]);
    const link      = String(row["Link"] || "").trim();
    // Coluna "app": override manual de foto (nome de arquivo em imagens/fotos/)
    const appCol    = String(row["app"] || row["App"] || row["APP"] || "").trim();
    if (!name && !athleteId) return;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push({ athleteId, name, nickname, pos, link, appOverride: appCol, photo: "" });
  });

  // 3. Resolver fotos dos links Imgur
  const cache = loadCache();
  const needFetch = [];
  for (const players of Object.values(grouped)) {
    for (const p of players) {
      if (p.appOverride) {
        // Override manual → não precisa buscar
        p.photo = p.appOverride;
      } else if (p.link && p.link.includes("imgur")) {
        if (cache[p.link] !== undefined) {
          // Já está em cache
          p.photo = cache[p.link] || "";
        } else {
          needFetch.push(p);
        }
      }
    }
  }

  if (needFetch.length > 0) {
    console.log(`\nBuscando ${needFetch.length} fotos do Imgur (cache: ${Object.keys(cache).length} já resolvidas)...`);
    let done = 0;
    // Processa em lotes de 4 requisições paralelas
    for (let i = 0; i < needFetch.length; i += 4) {
      const batch = needFetch.slice(i, i + 4);
      await Promise.all(batch.map(async p => {
        const url = await fetchImgurImage(p.link);
        p.photo = url || "";
        cache[p.link] = p.photo;
        done++;
        const pct = Math.round((done / needFetch.length) * 100);
        process.stdout.write(`\r  ${done}/${needFetch.length} (${pct}%)  `);
      }));
      await delay(250); // pausa entre lotes
    }
    console.log("\n");
    saveCache(cache);
    console.log("Cache salvo em", CACHE_PATH);
  } else {
    console.log(`\nFotos: todos os ${Object.keys(cache).length} links já estão em cache.`);
  }

  // 4. Categorias em ordem
  const CAT_ORDER = [
    "Sub 07","Sub 08","Sub 09","Sub 10","Sub 11","Sub 12",
    "Sub 13","Sub 14","Sub 15","Sub 16","Sub 17","Sub 20",
    "Profissional","Feminino",
  ];
  Object.keys(grouped).forEach(c => { if (!CAT_ORDER.includes(c)) CAT_ORDER.push(c); });
  const catList = CAT_ORDER.filter(c => grouped[c] || c === "Profissional" || c === "Feminino");

  // 5. Formação padrão 4-3-3
  const DEFAULT_FORMATION = [
    {id:"p0",  isGK:true,  x:12, y:50},
    {id:"p1",  isGK:false, x:30, y:15},
    {id:"p2",  isGK:false, x:28, y:38},
    {id:"p3",  isGK:false, x:28, y:62},
    {id:"p4",  isGK:false, x:30, y:85},
    {id:"p5",  isGK:false, x:50, y:25},
    {id:"p6",  isGK:false, x:52, y:50},
    {id:"p7",  isGK:false, x:50, y:75},
    {id:"p8",  isGK:false, x:78, y:15},
    {id:"p9",  isGK:false, x:82, y:50},
    {id:"p10", isGK:false, x:78, y:85},
  ];

  // 6. Gerar squads.js
  const lines = [];
  lines.push(`// AUTO-GERADO por scripts/import-squads.js — NÃO EDITE MANUALMENTE`);
  lines.push(`// Fonte: 2026_Dados_Cadastrais_Base.xlsx`);
  lines.push(`// Para atualizar: npm run import-squads\n`);
  lines.push(`export const POSITIONS = [`);
  lines.push(`  "Goleiro","Zagueiro","Lateral Direito","Lateral Esquerdo",`);
  lines.push(`  "Volante","Meia","Ponta","Atacante",`);
  lines.push(`];\n`);
  lines.push(`export const CAT_LIST = [`);
  lines.push(`  ${catList.map(c => JSON.stringify(c)).join(",")},`);
  lines.push(`];\n`);
  lines.push(`export const SQUADS = {`);
  catList.forEach(cat => {
    const players = grouped[cat] || [];
    lines.push(`  ${JSON.stringify(cat)}: [`);
    players.forEach((p, i) => {
      lines.push(`    {id:${i+1},athleteId:${JSON.stringify(p.athleteId)},name:${JSON.stringify(p.name)},nickname:${JSON.stringify(p.nickname)},number:"",pos:${JSON.stringify(p.pos)},photo:${JSON.stringify(p.photo)}},`);
    });
    lines.push(`  ],`);
  });
  lines.push(`};\n`);
  lines.push(`CAT_LIST.forEach(k => { if (!SQUADS[k]) SQUADS[k] = []; });\n`);
  lines.push(`export const DEFAULT_FORMATION = [`);
  DEFAULT_FORMATION.forEach(s => lines.push(`  {id:${JSON.stringify(s.id)},isGK:${s.isGK},x:${s.x},y:${s.y}},`));
  lines.push(`];`);

  fs.writeFileSync(OUT_PATH, lines.join("\n"), "utf8");

  // 7. Relatório
  console.log("✅  squads.js gerado em", OUT_PATH);
  let totalFotos = 0;
  catList.forEach(cat => {
    const pl = grouped[cat] || [];
    const comFoto = pl.filter(p => p.photo).length;
    totalFotos += comFoto;
    if (pl.length > 0) console.log(`   ${cat.padEnd(14)} → ${pl.length} atletas, ${comFoto} fotos`);
  });
  console.log(`\nTotal: ${Object.values(grouped).reduce((a,b) => a+b.length, 0)} atletas, ${totalFotos} com foto`);
}

main().catch(e => { console.error(e); process.exit(1); });
