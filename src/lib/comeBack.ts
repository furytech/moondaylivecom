// The closing line of the Today tab: when the Moon next changes sign, in the member's own timezone.

const dayKey = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const clock = (d: Date, tz: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(d);

const weekday = (d: Date, tz: string) => new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(d);

/**
 * "Come back tomorrow: the Moon enters Pisces at 9:54 PM." The wording follows the member's calendar:
 * the ingress may be later today, tomorrow, or a few days away.
 */
export function comeBackLine(nextSign: string, ingressAt: Date, now: Date, tz: string): string {
  const safeTz = (() => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      return "UTC";
    }
  })();
  const time = clock(ingressAt, safeTz);
  const today = dayKey(now, safeTz);
  const tomorrow = dayKey(new Date(now.getTime() + 24 * 60 * 60 * 1000), safeTz);
  const when = dayKey(ingressAt, safeTz);

  const at =
    when === today ? `today at ${time}` : when === tomorrow ? `at ${time}` : `on ${weekday(ingressAt, safeTz)} at ${time}`;
  return `Come back tomorrow: the Moon enters ${nextSign} ${at}.`;
}
