import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CurrentMoonData } from "@/lib/currentMoon";
import { generateDailyForecast } from "@/lib/forecastEngine";

export interface TriadData {
  physical_guidance: string;
  emotional_guidance: string;
  spiritual_guidance: string;
  daily_ritual: string;
  shadow_activation: string;
  integration_invitation: string;
}

export interface ForecastData {
  headline: string;
  forecast: string;
  energy: string;
  luckyFocus: string;
  phaseModifier?: string;
  integrationInvitation?: string;
  triadData?: TriadData | null;
}

export interface UseLunarForecastResult {
  forecast: ForecastData | null;
  triadData: TriadData | null;
  loading: boolean;
  error: string | null;
}

const TRIAD_COLUMNS =
  "physical_guidance, emotional_guidance, spiritual_guidance, daily_ritual, shadow_activation, integration_invitation";
const TRIAD_PREVIEW_COLUMNS = "physical_guidance, emotional_guidance";

type TriadRow = Partial<Record<keyof TriadData, string | null>>;

/** PostgREST / Postgres say "no such function" with these codes (the lockdown SQL has not been applied yet). */
function isMissingFunction(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    /could not find the function/i.test(error.message ?? "")
  );
}

/**
 * Today's Triad row for this member. Luminary members read their own row (all six columns). Free members
 * only ever get the teaser, through get_my_triad_preview, which cuts the text on the server. Until that
 * function exists in the database, free members use the old read, narrowed to the two teaser columns.
 * No row (or an error) means "nothing to show": the caller falls back to the generic forecast.
 */
async function fetchTriadRow(
  isPro: boolean,
  natalSunSign: string,
  birthMoonSign: string,
  transitSign: string
): Promise<{ row: TriadRow | null; error: unknown }> {
  const readTable = async (columns: string) => {
    const { data, error } = await supabase
      .from("triad_states")
      .select(columns)
      .eq("natal_sun_sign", natalSunSign)
      .eq("natal_moon_sign", birthMoonSign)
      .eq("transiting_moon_sign", transitSign)
      .maybeSingle();
    return { row: (data as TriadRow | null) ?? null, error };
  };

  if (isPro) return readTable(TRIAD_COLUMNS);

  const { data, error } = await supabase.rpc("get_my_triad_preview", { p_transiting_moon_sign: transitSign });
  if (error) {
    if (isMissingFunction(error)) return readTable(TRIAD_PREVIEW_COLUMNS);
    return { row: null, error };
  }
  return { row: (Array.isArray(data) ? data[0] : data) ?? null, error: null };
}

export function useLunarForecast(
  birthMoonSign: string,
  currentMoon: CurrentMoonData,
  natalSunSign?: string | null,
  isPro: boolean = true
): UseLunarForecastResult {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [triadData, setTriadData] = useState<TriadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      if (!birthMoonSign || !currentMoon.sign) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        if (natalSunSign) {
          const { row: dbTriad, error: triadError } = await fetchTriadRow(
            isPro,
            natalSunSign,
            birthMoonSign,
            currentMoon.sign
          );

          if (triadError) {
            console.error("Error fetching triad forecast:", triadError);
          }

          if (dbTriad) {
            const structuredTriad: TriadData = {
              physical_guidance: dbTriad.physical_guidance || "",
              emotional_guidance: dbTriad.emotional_guidance || "",
              spiritual_guidance: dbTriad.spiritual_guidance || "",
              daily_ritual: dbTriad.daily_ritual || "",
              shadow_activation: dbTriad.shadow_activation || "",
              integration_invitation: dbTriad.integration_invitation || "",
            };

            setTriadData(structuredTriad);
            setForecast({
              headline: dbTriad.physical_guidance || "",
              forecast: dbTriad.emotional_guidance || "",
              energy: dbTriad.spiritual_guidance || "",
              luckyFocus: dbTriad.daily_ritual || "",
              phaseModifier: dbTriad.shadow_activation || undefined,
              integrationInvitation: dbTriad.integration_invitation || undefined,
            });
            setLoading(false);
            return;
          }
        }

        // Triad not found or natalSunSign not provided -> clear triadData
        setTriadData(null);

        // Fetch the forecast for this birth/current sign combination
        const { data: forecastData, error: forecastError } = await supabase
          .from("daily_forecasts")
          .select("headline, forecast_text, energy, lucky_focus")
          .eq("birth_moon_sign", birthMoonSign)
          .eq("current_moon_sign", currentMoon.sign)
          .maybeSingle();

        // Fetch the phase modifier for today's moon phase
        const { data: phaseData, error: phaseError } = await supabase
          .from("moon_phase_texts")
          .select("modifier_text")
          .eq("phase_name", currentMoon.phase)
          .maybeSingle();

        if (forecastError) {
          console.error("Error fetching forecast:", forecastError);
        }

        if (phaseError) {
          console.error("Error fetching phase modifier:", phaseError);
        }

        // If we have database content, use it
        if (forecastData) {
          setForecast({
            headline: forecastData.headline,
            forecast: forecastData.forecast_text,
            energy: forecastData.energy,
            luckyFocus: forecastData.lucky_focus,
            phaseModifier: phaseData?.modifier_text || undefined,
          });
        } else {
          // Fall back to the local forecast engine
          const localForecast = generateDailyForecast(birthMoonSign, currentMoon.sign);
          setForecast({
            headline: localForecast.headline,
            forecast: localForecast.forecast,
            energy: localForecast.energy,
            luckyFocus: localForecast.luckyFocus,
            phaseModifier: phaseData?.modifier_text || undefined,
          });
        }
      } catch (err) {
        console.error("Failed to fetch lunar forecast:", err);
        setError("Failed to load forecast");
        setTriadData(null);

        // Fall back to local engine on error
        const localForecast = generateDailyForecast(birthMoonSign, currentMoon.sign);
        setForecast({
          headline: localForecast.headline,
          forecast: localForecast.forecast,
          energy: localForecast.energy,
          luckyFocus: localForecast.luckyFocus,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [birthMoonSign, currentMoon.sign, currentMoon.phase, natalSunSign, isPro]);

  return { forecast, triadData, loading, error };
}
