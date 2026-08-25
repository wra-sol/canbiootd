import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { CACHE_DIR, INDEX_PATH, PARSED_PATH } from "./config.js";
import type { IndexEntry } from "./indexer.js";

export type ParsedBio = {
  slug: string;
  urlEn: string;
  urlFr: string;
  nameEn: string;
  nameFr: string;
  birthText: string | null;
  deathText: string | null;
  birthYear: number | null;
  deathYear: number | null;
  volume: number | null;
  author: string | null;
  teaserEn: string | null;
  teaserFr: string | null;
  htmlEn: string;
  htmlFr: string;
  biblioEn: string | null;
  biblioFr: string | null;
  plainEn: string;
  plainFr: string;
  citation: string | null;
};

function stripHtml(html: string): string {
  return cheerio
    .load(html)("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function volumeFromSlug(slug: string): number | null {
  const m = slug.match(/_(\d+)[EF]$/);
  return m ? Number(m[1]) : null;
}

function yearFromText(t: string | null): number | null {
  if (!t) return null;
  const m = t.match(/\b(1[0-9]{3}|20[0-2][0-9])\b/);
  return m ? Number(m[1]) : null;
}

function extractDates(lead: string): {
  birthText: string | null;
  deathText: string | null;
} {
  // Typical: "…; b. 3 Oct. 1854 in …; …; d. there 14 July 1935."
  const birth = lead.match(/\bb\.\s+([^;]+)/i);
  const death = lead.match(/\bd\.\s+([^;.]+)/i);
  return {
    birthText: birth ? birth[1].trim() : null,
    deathText: death ? death[1].trim() : null,
  };
}

function parsePage(
  html: string,
  lang: "en" | "fr"
): {
  name: string;
  teaser: string | null;
  bodyHtml: string;
  biblio: string | null;
  author: string | null;
  citation: string | null;
  lead: string;
} {
  const $ = cheerio.load(html);
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const name = ogTitle
    .replace(/\s*[–—-]\s*Dictionary of Canadian Biography.*$/i, "")
    .replace(/\s*[–—-]\s*Dictionnaire biographique du Canada.*$/i, "")
    .trim();

  const teaser =
    $('meta[property="og:description"]').attr("content")?.trim() || null;

  const summary = $("#summary").html()?.trim() ?? "";
  const first = $("#first").html()?.trim() ?? "";
  const bodyHtml = [summary, first].filter(Boolean).join("\n");
  const biblio = $("#second").html()?.trim() || null;

  // Cite block often near end
  let citation: string | null = null;
  let author: string | null = null;
  $("table, .cite, #copyright").each((_, el) => {
    const text = $(el).text();
    if (/Permalink|Author of Article|Auteur/i.test(text)) {
      citation = text.replace(/\s+/g, " ").trim();
    }
  });
  const authorMatch = $.html().match(
    /Author of Article:\s*<\/[^>]+>\s*([^<]+)/i
  );
  if (authorMatch) author = authorMatch[1].trim();
  // French
  const auteurMatch = $.html().match(
    /Auteur de l['’]article\s*:\s*<\/[^>]+>\s*([^<]+)/i
  );
  if (!author && auteurMatch) author = auteurMatch[1].trim();

  // H1 fallback for name
  const h1 = $("h1").first().text().trim();
  const finalName = name || h1 || "Unknown";

  const lead = stripHtml(summary || first).slice(0, 800);

  return {
    name: finalName,
    teaser,
    bodyHtml: bodyHtml || `<p>${teaser ?? ""}</p>`,
    biblio,
    author,
    citation,
    lead,
  };
}

function readCache(kind: "en" | "fr", slug: string): string | null {
  const p = path.join(CACHE_DIR, kind, `${slug}.html`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

async function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error("Run npm run index first");
    process.exit(1);
  }
  const entries: IndexEntry[] = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  if (fs.existsSync(PARSED_PATH)) fs.unlinkSync(PARSED_PATH);
  const out = fs.createWriteStream(PARSED_PATH, { flags: "a" });

  let ok = 0;
  let skip = 0;

  for (const e of entries) {
    const enHtml = readCache("en", e.slug);
    if (!enHtml) {
      skip++;
      continue;
    }
    const frSlug = e.slug.replace(/E$/, "F");
    const frHtml = readCache("fr", frSlug);

    try {
      const en = parsePage(enHtml, "en");
      const fr = frHtml
        ? parsePage(frHtml, "fr")
        : {
            name: en.name,
            teaser: en.teaser,
            bodyHtml: en.bodyHtml,
            biblio: en.biblio,
            author: en.author,
            citation: en.citation,
            lead: en.lead,
          };

      const { birthText, deathText } = extractDates(en.lead);
      const rec: ParsedBio = {
        slug: e.slug,
        urlEn: e.urlEn,
        urlFr: e.urlFr,
        nameEn: en.name,
        nameFr: fr.name,
        birthText,
        deathText,
        birthYear: yearFromText(birthText),
        deathYear: yearFromText(deathText),
        volume: volumeFromSlug(e.slug),
        author: en.author ?? fr.author,
        teaserEn: en.teaser,
        teaserFr: fr.teaser,
        htmlEn: en.bodyHtml,
        htmlFr: fr.bodyHtml,
        biblioEn: en.biblio,
        biblioFr: fr.biblio,
        plainEn: stripHtml(en.bodyHtml),
        plainFr: stripHtml(fr.bodyHtml),
        citation: en.citation ?? fr.citation,
      };
      out.write(JSON.stringify(rec) + "\n");
      ok++;
      if (ok % 100 === 0) console.log(`parsed ${ok}`);
    } catch (err) {
      console.error(`parse fail ${e.slug}: ${err}`);
      skip++;
    }
  }

  out.end();
  console.log(`Parsed ${ok}, skipped ${skip} → ${PARSED_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
