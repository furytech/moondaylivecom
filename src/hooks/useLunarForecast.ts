import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CurrentMoonData } from "@/lib/currentMoon";
import { generateDailyForecast } from "@/lib/forecastEngine";

interface ForecastData {
  headline: string;
  forecast: string;
  energy: string;
  luckyFocus: string;
  phaseModifier?: string;
  integrationInvitation?: string;
}

interface UseLunarForecastResult {
  forecast: ForecastData | null;
  loading: boolean;
  error: string | null;
}

export function useLunarForecast(
  birthMoonSign: string,
  currentMoon: CurrentMoonData,
  natalSunSign?: string | null
): UseLunarForecastResult {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
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
          const { data: triadData, error: triadError } = await supabase
            .from('triad_states')
            .select('physical_guidance, emotional_guidance, spiritual_guidance, daily_ritual, shadow_activation, integration_invitation')
            .eq('natal_sun_sign', natalSunSign)
            .eq('natal_moon_sign', birthMoonSign)
            .eq('transiting_moon_sign', currentMoon.sign)
            .maybeSingle();

          if (triadError) {
            console.error("Error fetching triad forecast:", triadError);
          }

          if (triadData) {
            setForecast({
              headline: triadData.physical_guidance || "",
              forecast: triadData.emotional_guidance || "",
              energy: triadData.spiritual_guidance || "",
              luckyFocus: triadData.daily_ritual || "",
              phaseModifier: triadData.shadow_activation || undefined,
              integrationInvitation: triadData.integration_invitation || undefined,
            });
            setLoading(false);
            return;
          }
        }

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
  }, [birthMoonSign, currentMoon.sign, currentMoon.phase, natalSunSign]);

  return { forecast, loading, error };
}
