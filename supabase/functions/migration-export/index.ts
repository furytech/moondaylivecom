// Temporary migration export endpoint.
// Streams a data-only SQL dump (or a users CSV) for moving this project to a
// self-hosted Supabase project. Protected by the MAKE_SOCIAL_SECRET header.
import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

const SECRET = Deno.env.get("MAKE_SOCIAL_SECRET")!;
const DB_URL = Deno.env.get("SUPABASE_DB_URL")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-make-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.headers.get("x-make-secret") !== SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...cors, "content-type": "application/json" },
    });
  }

  const mode = new URL(req.url).searchParams.get("mode") ?? "data";
  const client = new Client(DB_URL);
  await client.connect();

  try {
    if (mode === "users") {
      const r = await client.queryObject<
        { email: string; created_at: string; confirmed: string; roles: string }
      >`
        select u.email,
               u.created_at::text as created_at,
               (u.email_confirmed_at is not null)::text as confirmed,
               coalesce(string_agg(r.role::text, '|' order by r.role::text), '') as roles
        from auth.users u
        left join public.user_roles r on r.user_id = u.id
        group by u.id, u.email, u.created_at, u.email_confirmed_at
        order by u.created_at
      `;
      const lines = ["email,created_at,email_confirmed,roles"];
      for (const row of r.rows) {
        lines.push(
          [row.email, row.created_at, row.confirmed, row.roles]
            .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
            .join(","),
        );
      }
      return new Response(lines.join("\n") + "\n", {
        headers: { ...cors, "content-type": "text/csv" },
      });
    }

    // ---- data-only SQL dump, parents before children ----
    const tablesRes = await client.queryObject<{ table_name: string }>`
      select c.relname as table_name
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
      order by c.relname
    `;
    const tables = tablesRes.rows.map((t) => t.table_name);

    const depsRes = await client.queryObject<{ child: string; parent: string }>`
      select ch.relname as child, pa.relname as parent
      from pg_constraint co
      join pg_class ch on ch.oid = co.conrelid
      join pg_class pa on pa.oid = co.confrelid
      join pg_namespace nc on nc.oid = ch.relnamespace
      join pg_namespace np on np.oid = pa.relnamespace
      where co.contype = 'f' and nc.nspname = 'public' and np.nspname = 'public'
    `;
    const deps = new Map<string, Set<string>>();
    for (const t of tables) deps.set(t, new Set());
    for (const d of depsRes.rows) {
      if (d.child !== d.parent) deps.get(d.child)?.add(d.parent);
    }
    const ordered: string[] = [];
    const seen = new Set<string>();
    const visit = (t: string, stack: Set<string>) => {
      if (seen.has(t) || stack.has(t)) return;
      stack.add(t);
      for (const p of deps.get(t) ?? []) visit(p, stack);
      stack.delete(t);
      seen.add(t);
      ordered.push(t);
    };
    for (const t of tables) visit(t, new Set());

    const out: string[] = [
      "-- Moonday Live — data-only dump (run AFTER schema.sql)",
      `-- Generated ${new Date().toISOString()}`,
      "BEGIN;",
      "SET session_replication_role = replica;  -- defer FK checks during load",
      "",
    ];
    const counts: Record<string, number> = {};

    for (const t of ordered) {
      if (!/^[a-z0-9_]+$/.test(t)) continue; // defensive: identifiers only
      const rows = await client.queryObject<{ stmt: string }>(
        `select format('INSERT INTO public.%I (%s) VALUES (%s);',
                  $1::text,
                  (select string_agg(quote_ident(key), ', ') from json_each_text(row_to_json(x))),
                  (select string_agg(coalesce(quote_literal(value), 'NULL'), ', ') from json_each_text(row_to_json(x)))
                ) as stmt
         from public."${t}" x`,
        [t],
      );
      counts[t] = rows.rows.length;
      out.push(`-- ${t} (${rows.rows.length} rows)`);
      for (const r of rows.rows) out.push(r.stmt);
      out.push("");
    }

    out.push("SET session_replication_role = DEFAULT;");
    out.push("COMMIT;");
    out.push("");
    out.push("-- Row counts at export time:");
    for (const [t, n] of Object.entries(counts)) out.push(`--   ${t}: ${n}`);
    out.push("");

    return new Response(out.join("\n"), {
      headers: { ...cors, "content-type": "text/plain" },
    });
  } catch (e) {
    console.error("export failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  } finally {
    await client.end();
  }
});
