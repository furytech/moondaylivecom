import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "list_recent_cosmic_weather",
  title: "List recent cosmic weather",
  description:
    "Returns the most recent Sun/Moon transit ticks from the 3-Node Matrix cosmic_weather table, newest first. Includes tropical, sidereal, and draconic moon signs.",
  inputSchema: {
    limit: z
      .number()
      .int()
      .min(1)
      .max(50)
      .optional()
      .describe("Maximum number of rows to return. Defaults to 10."),
  },
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const max = limit ?? 10;
    const { data, error } = await supabaseForUser(ctx)
      .from("cosmic_weather")
      .select(
        "id, trigger_timestamp, sun_sign_tropical, sun_sign_sidereal, moon_sign_tropical, moon_sign_sidereal, moon_sign_draconic, is_processed",
      )
      .order("trigger_timestamp", { ascending: false })
      .limit(max);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});
