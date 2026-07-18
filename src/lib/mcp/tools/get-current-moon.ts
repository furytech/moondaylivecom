import { defineTool } from "@lovable.dev/mcp-js";
import { getCurrentMoon } from "@/lib/currentMoon";

export default defineTool({
  name: "get_current_moon",
  title: "Get current moon",
  description:
    "Returns the current tropical moon sign, phase, and illumination percentage for the transiting Moon right now.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: false, openWorldHint: false },
  handler: () => {
    const moon = getCurrentMoon(new Date());
    const payload = {
      timestamp: new Date().toISOString(),
      sign: moon.sign,
      symbol: moon.symbol,
      element: moon.element,
      phase: moon.phase,
      phase_emoji: moon.phaseEmoji,
      illumination_percent: moon.illumination,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      structuredContent: payload,
    };
  },
});
