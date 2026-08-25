import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { BASE_EN, DATA_DIR, INDEX_PATH, LETTERS } from "./config.js";
import { fetchText } from "./http.js";

export type IndexEntry = {
  slug: string;
  urlEn: string;
  urlFr: string;
};

function slugFromHref(href: string): string | null {
  const m = href.match(/\/en\/bio\/([^/?#]+)\.html/);
  return m ? m[1] : null;
}

function frUrlFromEnSlug(slug: string): string {
  const frSlug = slug.replace(/E$/, "F");
  return `${BASE_EN}/fr/bio/${frSlug}.html`;
}

async function pagesForLetter(letter: string): Promise<number> {
  const url = `${BASE_EN}/en/browse.php?type=alpha&term1=${encodeURIComponent(letter)}&p=1`;
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  let max = 1;
  $("ul.pagination a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const m = href.match(/[?&]p=(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return max;
}

async function slugsForLetterPage(letter: string, page: number): Promise<string[]> {
  const url = `${BASE_EN}/en/browse.php?type=alpha&term1=${encodeURIComponent(letter)}&p=${page}`;
  const html = await fetchText(url);
  const $ = cheerio.load(html);
  const slugs = new Set<string>();
  $('a[href*="/en/bio/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const slug = slugFromHref(href);
    if (slug) slugs.add(slug);
  });
  return [...slugs];
}

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const bySlug = new Map<string, IndexEntry>();

  for (const letter of LETTERS) {
    process.stdout.write(`Indexing letter ${letter}… `);
    let pages = 1;
    try {
      pages = await pagesForLetter(letter);
    } catch (e) {
      console.error(`failed page count: ${e}`);
      continue;
    }
    console.log(`${pages} page(s)`);
    for (let p = 1; p <= pages; p++) {
      try {
        const slugs = await slugsForLetterPage(letter, p);
        for (const slug of slugs) {
          if (bySlug.has(slug)) continue;
          bySlug.set(slug, {
            slug,
            urlEn: `${BASE_EN}/en/bio/${slug}.html`,
            urlFr: frUrlFromEnSlug(slug),
          });
        }
        process.stdout.write(`  p${p}: +${slugs.length} (total ${bySlug.size})\n`);
      } catch (e) {
        console.error(`  p${p} failed: ${e}`);
      }
    }
  }

  const entries = [...bySlug.values()].sort((a, b) =>
    a.slug.localeCompare(b.slug)
  );
  fs.writeFileSync(INDEX_PATH, JSON.stringify(entries, null, 2));
  console.log(`Wrote ${entries.length} entries → ${INDEX_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
