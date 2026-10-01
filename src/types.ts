export interface ZodiacSignTransit {
  id: string;
  sign: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  ruler: string;
  dates: string;
  transitTitle: string;
  transitAspect: string;
  transitDate?: string | null;
  transit_date?: string | null;
  copy: string;
  powerHour: string;
  ritualTip: string;
  hashtags: string[];
  status: 'pending' | 'published';
  imageUrl?: string | null;
  image_url?: string | null;
  publishedAt?: string | null;
  socialPostedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Subscriber {
  id: string;
  email: string;
  tier: 'Free' | 'Stargazer Pro' | 'Founding Patron';
  zodiacSign: string;
  referralSource: string;
  smsAlerts: boolean;
  emailAlerts: boolean;
  status: 'Active' | 'Churned' | 'Paused';
  createdAt: string;
}

export interface CombinationProfile {
  id?: string;
  sun_sign: string;
  moon_sign: string;
  combination_title: string;
  solar_essence: string;
  lunar_essence: string;
  combination_synthesis: string;
  luminous_expression?: string[] | string | null;
  shadow_synthesis?: string | null;
  shadow_behaviors?: Array<{
    name: string;
    pattern: string;
    root: string;
    integration_pathways: string[];
    integration_gift: string;
  }> | null;
  default_behaviors?: string[] | Record<string, unknown>[];
  shadow_pattern?: string | null;
  upgrade_teaser?: string | null;
  generated_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NatalSigns {
  sunSign: string;
  moonSign: string;
  birthDate: string;
}
