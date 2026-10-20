// What a member sends when they share their OWN Moon sign: the sign's public share link and a warm line.
// Never a birthday, a Sun sign, a name or anything from the combination profile.

import { sharedMoonUrl } from "@/lib/sharedMoonSeo";

export const shareTitle = "My Moon sign — Moonday Live";

export function shareMessage(sign: string): string {
  return `I'm a ${sign} Moon. Find your Moon sign:`;
}

export function shareLink(sign: string): string {
  return sharedMoonUrl(sign);
}

export function twitterShareUrl(sign: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage(sign))}&url=${encodeURIComponent(shareLink(sign))}`;
}

export function facebookShareUrl(sign: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink(sign))}`;
}

export function emailShareUrl(sign: string): string {
  return `mailto:?subject=${encodeURIComponent(`I'm a ${sign} Moon`)}&body=${encodeURIComponent(`${shareMessage(sign)} ${shareLink(sign)}`)}`;
}
