// Transcribes a guest astrologer's voice note into text.
// The guest records in the browser, the audio lands in the private
// `guest-audio` bucket, and this function turns it into a transcript that the
// generator can quote verbatim.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await admin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const audioPath = String(body.audio_path ?? "");
    const contributionId = body.contribution_id ? String(body.contribution_id) : null;

    if (!audioPath || audioPath.includes("..")) {
      return json({ error: "A valid audio_path is required." }, 400);
    }

    // The guest may only transcribe files inside their own folder.
    if (!audioPath.startsWith(`${userData.user.id}/`)) {
      return json({ error: "You can only transcribe your own recordings." }, 403);
    }

    const { data: file, error: downloadError } = await admin.storage
      .from("guest-audio")
      .download(audioPath);
    if (downloadError || !file) return json({ error: "Recording not found." }, 404);

    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    const base64 = btoa(binary);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.6-flash",
        messages: [
          {
            role: "system",
            content:
              "You transcribe an astrologer talking. Return the transcript only — no commentary, no summary, no headings. Preserve their phrasing and astrological terms exactly (sect, bounds, domicile, Chandra Lagna, planet names). Remove only stammers and false starts. Add paragraph breaks where they pause.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Transcribe this recording." },
              {
                type: "input_audio",
                input_audio: { data: base64, format: audioPath.endsWith(".mp3") ? "mp3" : "webm" },
              },
            ],
          },
        ],
      }),
    });

    if (res.status === 429) return json({ error: "Rate limited — try again in a minute." }, 429);
    if (res.status === 402) {
      return json({ error: "AI credits exhausted — top up in workspace billing." }, 402);
    }
    if (!res.ok) {
      const details = await res.text();
      console.error("Transcription gateway error:", res.status, details);
      return json({ error: "Transcription failed." }, 502);
    }

    const data = await res.json();
    const transcript = String(data.choices?.[0]?.message?.content ?? "").trim();
    if (!transcript) return json({ error: "Nothing could be transcribed." }, 422);

    if (contributionId) {
      await admin
        .from("guest_contributions")
        .update({ transcript })
        .eq("id", contributionId);
    }

    return json({ transcript });
  } catch (err) {
    console.error("transcribe-guest-audio error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});
