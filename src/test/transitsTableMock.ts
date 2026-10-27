import { vi } from 'vitest';

type Result = { data?: any; error?: { message: string } | null };

/**
 * Test double for the transits table calls the approve / undo code makes:
 *   update(payload).in(ids)[.eq()/.is()/.or()...].select('id')   -> the next queued result
 *   select(cols).in('id', ids)                                    -> { data: rows } (why an undo was refused)
 *   upsert(rows, opts)                                            -> { error }
 */
export function transitsTable(opts: { updateResults?: Result[]; rows?: any[]; upsertError?: { message: string } | null } = {}) {
  const queue = [...(opts.updateResults ?? [{ data: [], error: null }])];
  const filters: string[][] = [];
  const update = vi.fn((_payload: Record<string, unknown>) => {
    const result = queue.length > 1 ? queue.shift()! : queue[0];
    const used: string[] = [];
    filters.push(used);
    const chain: Record<string, any> = {};
    for (const method of ['in', 'eq', 'is', 'or']) {
      chain[method] = vi.fn((...args: unknown[]) => {
        used.push(`${method}:${args.map(String).join(",")}`);
        return chain;
      });
    }
    chain.select = vi.fn(() => Promise.resolve({ data: result.data ?? [], error: result.error ?? null }));
    return chain;
  });
  const upsert = vi.fn().mockResolvedValue({ error: opts.upsertError ?? null });
  const select = vi.fn(() => ({ in: vi.fn(() => Promise.resolve({ data: opts.rows ?? [], error: null })) }));
  return { table: { update, upsert, select }, update, upsert, select, filters };
}
