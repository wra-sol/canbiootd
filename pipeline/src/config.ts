import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(ROOT, "data");
export const CACHE_DIR = path.join(DATA_DIR, "cache");
export const INDEX_PATH = path.join(DATA_DIR, "index.json");
export const PARSED_PATH = path.join(DATA_DIR, "parsed.jsonl");
export const DB_PATH = path.join(DATA_DIR, "bios.sqlite");
export const APP_ASSETS_DB = path.resolve(ROOT, "../app/assets/bios.sqlite");

export const BASE_EN = "https://www.biographi.ca";
export const USER_AGENT =
  "CanBIO-OTD/1.0 (non-commercial educational reader; contact: local-dev)";
export const REQUEST_DELAY_MS = 1000;
export const MAX_RETRIES = 4;

/** A–Z plus special letters present on the browse page */
export const LETTERS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  "Þ",
  "ˀ",
];
