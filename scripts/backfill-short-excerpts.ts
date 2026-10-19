// One-off (approved 2026-10-19): rewrite excerpts under 100 characters on published transit posts
// with a two-sentence summary. Saves the current excerpts first; touches only excerpt.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import dotenv from "dotenv";
import { excerptFromContent } from "../src/lib/postText";

dotenv.config({ path: ".env.local", quiet: true });
const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key || url.includes("hzlpnmvboqhzthvjlves")) throw new Error("wrong or missing Supabase config");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function main() {
  const rows: any[] = await (await fetch(
    `${url}/rest/v1/blog_posts?select=id,slug,title,excerpt,content,publish_at&category=eq.Transits&status=eq.published&order=slug`, { headers })).json();
  const short = rows.filter((r) => r.excerpt.length < 100);
  const dir = ".backup/blog-title-backfill-2026-10-19";
  const file = `${dir}/short-excerpts-before-second-pass.json`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(short.map(({ id, slug, excerpt }) => ({ id, slug, excerpt })), null, 2));
  if (JSON.parse(readFileSync(file, "utf8")).length !== short.length) throw new Error("backup failed");
  console.log(`backup verified: ${short.length} excerpts -> ${file}`);
  for (const r of short) {
    const excerpt = excerptFromContent(r.content, r.title, 160, r.publish_at);
    if (!excerpt || excerpt === r.excerpt) { console.log("unchanged", r.slug); continue; }
    const up = await fetch(`${url}/rest/v1/blog_posts?id=eq.${r.id}`, {
      method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify({ excerpt }) });
    const out: any = await up.json();
    console.log(up.ok && out.length === 1 ? "updated" : `FAILED ${up.status}`, `[${r.excerpt.length}->${excerpt.length}]`, excerpt);
  }
}
main();
