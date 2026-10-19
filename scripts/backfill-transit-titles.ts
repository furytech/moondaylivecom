// One-off (approved 2026-10-19): strip the repeated title from published transit post bodies and
// replace title-copy excerpts with a real summary. Backs up the originals first; touches only
// content and excerpt. Run: npx tsx scripts/backfill-transit-titles.ts
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import dotenv from "dotenv";
import { excerptFromContent, repeatsTitle, stripLeadingTitle } from "../src/lib/postText";

dotenv.config({ path: ".env.local", quiet: true });
const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key || url.includes("hzlpnmvboqhzthvjlves")) throw new Error("wrong or missing Supabase config");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

async function main() {
  const res = await fetch(
    `${url}/rest/v1/blog_posts?select=id,slug,title,excerpt,content&category=eq.Transits&status=eq.published&order=slug`,
    { headers },
  );
  const rows: any[] = await res.json();
  if (!Array.isArray(rows)) throw new Error(JSON.stringify(rows));

  const dir = ".backup/blog-title-backfill-2026-10-19";
  mkdirSync(dir, { recursive: true });
  const file = `${dir}/original-excerpt-and-content.json`;
  writeFileSync(file, JSON.stringify(rows, null, 2));
  const saved = JSON.parse(readFileSync(file, "utf8"));
  if (saved.length !== rows.length || saved.some((r: any, i: number) => r.content !== rows[i].content)) {
    throw new Error("backup verification failed, nothing changed");
  }
  console.log(`backup verified: ${saved.length} posts -> ${file}`);

  for (const r of rows) {
    const content = stripLeadingTitle(r.content, r.title);
    const excerpt = repeatsTitle(r.excerpt, r.title) ? excerptFromContent(content, r.title) : r.excerpt;
    if (content === r.content && excerpt === r.excerpt) { console.log("unchanged", r.slug); continue; }
    if (!excerpt) { console.log("SKIP (no excerpt derivable)", r.slug); continue; }
    const up = await fetch(`${url}/rest/v1/blog_posts?id=eq.${r.id}`, {
      method: "PATCH", headers: { ...headers, Prefer: "return=representation" }, body: JSON.stringify({ content, excerpt }),
    });
    const out: any = await up.json();
    console.log(up.ok && out.length === 1 ? "updated" : `FAILED ${up.status}`, r.slug, `| excerpt: ${excerpt}`);
  }

  const after: any[] = await (await fetch(`${url}/rest/v1/blog_posts?select=slug,title,excerpt,content&category=eq.Transits&status=eq.published`, { headers })).json();
  for (const r of after) {
    const first = r.content.split("\n").find((l: string) => l.trim()) ?? "";
    console.log(r.slug.slice(-30), "| bodyRepeatsTitle:", repeatsTitle(first, r.title), "| excerptRepeatsTitle:", repeatsTitle(r.excerpt, r.title), "| excerptLen:", r.excerpt.length);
  }
}
main();
