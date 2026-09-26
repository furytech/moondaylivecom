export interface ZodiacSignTransit {
  id: string;
  sign: string;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  ruler: string;
  dates: string;
  transitTitle: string;
  transitAspect: string;
  copy: string;
  powerHour: string;
  ritualTip: string;
  hashtags: string[];
  status: 'pending' | 'published';
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
