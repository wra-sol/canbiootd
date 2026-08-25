/**
 * Fast path: index letter A page 1 only, fetch those bios, parse, build DB.
 * Useful for app development before a full overnight crawl.
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { BASE_EN, CACHE_DIR, DATA_DIR, INDEX_PATH } from "./config.js";
import { fetchText } from "./http.js";
import type { IndexEntry } from "./indexer.js";
import { spawnSync } from "node:child_process";

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(path.join(CACHE_DIR, "en"), { recursive: true });
  fs.mkdirSync(path.join(CACHE_DIR, "fr"), { recursive: true });

  const url = `${BASE_EN}/en/browse.php?type=alpha&term1=A&p=1`;
  console.log("Fetching sample index…");
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const slugs = new Set<string>();
  $('a[href*="/en/bio/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/\/en\/bio\/([^/?#]+)\.html/);
    if (m) slugs.add(m[1]);
  });

  const entries: IndexEntry[] = [...slugs].map((slug) => ({
    slug,
    urlEn: `${BASE_EN}/en/bio/${slug}.html`,
    urlFr: `${BASE_EN}/fr/bio/${slug.replace(/E$/, "F")}.html`,
  }));

  fs.writeFileSync(INDEX_PATH, JSON.stringify(entries, null, 2));
  console.log(`Sample index: ${entries.length} bios`);

  for (const e of entries) {
    const enPath = path.join(CACHE_DIR, "en", `${e.slug}.html`);
    const frSlug = e.slug.replace(/E$/, "F");
    const frPath = path.join(CACHE_DIR, "fr", `${frSlug}.html`);
    if (!fs.existsSync(enPath)) {
      console.log(`  EN ${e.slug}`);
      fs.writeFileSync(enPath, await fetchText(e.urlEn));
    }
    if (!fs.existsSync(frPath)) {
      console.log(`  FR ${frSlug}`);
      try {
        fs.writeFileSync(frPath, await fetchText(e.urlFr));
      } catch {
        console.warn(`  FR missing ${frSlug}`);
      }
    }
  }

  console.log("Parsing + building DB…");
  const run = (script: string) => {
    const r = spawnSync("npx", ["tsx", script], {
      cwd: path.resolve(DATA_DIR, ".."),
      stdio: "inherit",
      shell: true,
    });
    if (r.status !== 0) process.exit(r.status ?? 1);
  };
  run("src/parser.ts");
  run("src/build-db.ts");
  console.log("Sample ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
