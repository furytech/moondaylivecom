import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { getCurrentMoon } from "@/lib/currentMoon";

export default defineTool({
  name: "get_current_moon",
  title: "Get current moon",
  description:
    "Returns the current tropical moon sign, moon phase, and illumination percentage for the transiting Moon right now.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: async () => {
    const moon = await getCurrentMoon(new Date());
    const payload = {
      timestamp: new Date().toISOString(),
      sign: moon.sign,
      phase: moon.phaseName,
      illumination_percent: Math.round(moon.illumination * 100),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
