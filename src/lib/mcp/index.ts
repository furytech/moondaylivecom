import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getCurrentMoonTool from "./tools/get-current-moon";
import getMyMoonProfileTool from "./tools/get-my-moon-profile";
import listRecentCosmicWeatherTool from "./tools/list-recent-cosmic-weather";

// Build the OAuth issuer from the Supabase project ref. VITE_SUPABASE_PROJECT_ID
// is inlined at build time so this stays import-safe (no runtime env read).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "moonday-live-mcp",
  title: "Moonday Live",
  version: "0.1.0",
  instructions:
    "Moonday Live tools. Read the current transiting Moon (sign, phase, illumination), the signed-in user's stored moon profile, and recent cosmic_weather ticks from the 3-Node Matrix. Entertainment only — never medical, financial, or legal advice.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [getCurrentMoonTool, getMyMoonProfileTool, listRecentCosmicWeatherTool],
});
