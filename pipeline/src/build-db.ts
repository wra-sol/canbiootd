import fs from "node:fs";
import path from "node:path";
import initSqlJs from "sql.js";
import { APP_ASSETS_DB, DB_PATH, PARSED_PATH } from "./config.js";
import type { ParsedBio } from "./parser.js";
import readline from "node:readline";

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleIds(ids: number[], seed = 20260825): number[] {
  const arr = [...ids];
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function readParsed(): Promise<ParsedBio[]> {
  if (!fs.existsSync(PARSED_PATH)) {
    throw new Error("Run npm run parse first");
  }
  const rows: ParsedBio[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(PARSED_PATH),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    rows.push(JSON.parse(line) as ParsedBio);
  }
  return rows;
}

function esc(s: string | null | undefined): string {
  if (s == null) return "NULL";
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function num(n: number | null | undefined): string {
  return n == null ? "NULL" : String(n);
}

async function main() {
  const rows = await readParsed();
  if (rows.length === 0) throw new Error("No parsed rows");

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const SQL = await initSqlJs();
  const db = new SQL.Database();

  db.run(`
    CREATE TABLE bios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      url_en TEXT NOT NULL,
      url_fr TEXT NOT NULL,
      name_en TEXT NOT NULL,
      name_fr TEXT NOT NULL,
      birth_text TEXT,
      death_text TEXT,
      birth_year INTEGER,
      death_year INTEGER,
      volume INTEGER,
      author TEXT,
      teaser_en TEXT,
      teaser_fr TEXT,
      html_en TEXT NOT NULL,
      html_fr TEXT NOT NULL,
      biblio_en TEXT,
      biblio_fr TEXT,
      plain_en TEXT NOT NULL,
      plain_fr TEXT NOT NULL,
      citation TEXT
    );
    CREATE TABLE daily_order (
      seq INTEGER PRIMARY KEY,
      bio_id INTEGER NOT NULL
    );
    CREATE TABLE meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE INDEX idx_bios_name_en ON bios(name_en);
    CREATE INDEX idx_bios_name_fr ON bios(name_fr);
  `);

  const insertSql = `
    INSERT INTO bios (
      slug, url_en, url_fr, name_en, name_fr,
      birth_text, death_text, birth_year, death_year,
      volume, author, teaser_en, teaser_fr,
      html_en, html_fr, biblio_en, biblio_fr,
      plain_en, plain_fr, citation
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `;

  const stmt = db.prepare(insertSql);
  for (const r of rows) {
    stmt.run([
      r.slug,
      r.urlEn,
      r.urlFr,
      r.nameEn,
      r.nameFr,
      r.birthText,
      r.deathText,
      r.birthYear,
      r.deathYear,
      r.volume,
      r.author,
      r.teaserEn,
      r.teaserFr,
      r.htmlEn,
      r.htmlFr,
      r.biblioEn,
      r.biblioFr,
      r.plainEn,
      r.plainFr,
      r.citation,
    ]);
  }
  stmt.free();

  const idRes = db.exec("SELECT id FROM bios ORDER BY id");
  const ids = (idRes[0]?.values ?? []).map((v) => Number(v[0]));
  const shuffled = shuffleIds(ids);

  const orderStmt = db.prepare(
    "INSERT INTO daily_order (seq, bio_id) VALUES (?, ?)"
  );
  shuffled.forEach((bioId, seq) => {
    orderStmt.run([seq, bioId]);
  });
  orderStmt.free();

  const epoch = "2026-08-25";
  db.run("INSERT INTO meta (key, value) VALUES (?, ?)", [
    "epoch_date",
    epoch,
  ]);
  db.run("INSERT INTO meta (key, value) VALUES (?, ?)", [
    "built_at",
    new Date().toISOString(),
  ]);
  db.run("INSERT INTO meta (key, value) VALUES (?, ?)", [
    "count",
    String(rows.length),
  ]);
  db.run("INSERT INTO meta (key, value) VALUES (?, ?)", [
    "source",
    "https://www.biographi.ca/",
  ]);
  db.run("INSERT INTO meta (key, value) VALUES (?, ?)", [
    "terms",
    "https://www.biographi.ca/en/notices.html",
  ]);

  const data = db.export();
  db.close();
  fs.writeFileSync(DB_PATH, Buffer.from(data));

  fs.mkdirSync(path.dirname(APP_ASSETS_DB), { recursive: true });
  fs.copyFileSync(DB_PATH, APP_ASSETS_DB);

  const sizeMb = (fs.statSync(DB_PATH).size / (1024 * 1024)).toFixed(1);
  console.log(
    `Built ${rows.length} bios → ${DB_PATH} (${sizeMb} MB) and ${APP_ASSETS_DB}`
  );
  // silence unused
  void esc;
  void num;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
