import fs from "node:fs";
import path from "node:path";
import { CACHE_DIR, INDEX_PATH } from "./config.js";
import type { IndexEntry } from "./indexer.js";
import { fetchText } from "./http.js";

function cachePath(kind: "en" | "fr", slug: string): string {
  return path.join(CACHE_DIR, kind, `${slug}.html`);
}

async function ensure(url: string, dest: string): Promise<"ok" | "skip" | "fail"> {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 500) return "skip";
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    const html = await fetchText(url);
    fs.writeFileSync(dest, html);
    return "ok";
  } catch (e) {
    console.error(`FAIL ${url}: ${e}`);
    return "fail";
  }
}

async function main() {
  if (!fs.existsSync(INDEX_PATH)) {
    console.error("Run npm run index first");
    process.exit(1);
  }
  const entries: IndexEntry[] = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  fs.mkdirSync(path.join(CACHE_DIR, "en"), { recursive: true });
  fs.mkdirSync(path.join(CACHE_DIR, "fr"), { recursive: true });

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const rEn = await ensure(e.urlEn, cachePath("en", e.slug));
    const frSlug = e.slug.replace(/E$/, "F");
    const rFr = await ensure(e.urlFr, cachePath("fr", frSlug));
    for (const r of [rEn, rFr]) {
      if (r === "ok") ok++;
      else if (r === "skip") skip++;
      else fail++;
    }
    if ((i + 1) % 25 === 0 || i === entries.length - 1) {
      console.log(
        `[${i + 1}/${entries.length}] fetched=${ok} cached=${skip} fail=${fail}`
      );
    }
  }
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
