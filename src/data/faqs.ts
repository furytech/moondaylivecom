// Site FAQ: one list for the page, its FAQPage structured data and the served HTML.

export interface Faq {
  q: string;
  a: string;
}

export const faqs: Faq[] = [
  {
    q: "What is Moonday Live?",
    a: "Moonday Live is a luxury lunar guidance experience. We translate the Great Cycle of the Moon — phase by phase — into personalized rituals across the Mind, Soul, and Body pillars. It is created for entertainment and reflection.",
  },
  {
    q: "How is my Lunar Signature calculated?",
    a: "Your Lunar Signature is calculated from your birthday using astronomical engines. Moonday never needs your birth time or location.",
  },
  {
    q: "What is the Luminary Tier?",
    a: "The Luminary Tier unlocks the full archive: deeper daily forecasts, the complete Lunar Library, void-of-course interval guidance, and unlimited access to your personal blueprint.",
  },
  {
    q: "Can I cancel my subscription?",
    a: "Yes. Members can cancel anytime online: go to Account → Manage subscription. Your access continues until the end of the paid period. Please review our Refund Policy for details.",
  },
  {
    q: "Do you offer refunds?",
    a: "Subscriptions renew automatically and are non-refundable, but you can cancel anytime to stop future charges. See our Refund & Cancellation Policy for full details.",
  },
  {
    q: "Is Moonday Live a substitute for professional advice?",
    a: "No. Moonday Live is provided strictly for entertainment, inspiration, and personal reflection. It is not a substitute for medical, psychological, legal, or financial advice. Please see our Disclaimer.",
  },
  {
    q: "How do I update my birth details?",
    a: "Your birthday is locked once it's set, because it anchors your natal Moon sign. If you entered it incorrectly, email support@moondaylive.com from your account address and we'll correct it. Moonday never needs your birth time or location.",
  },
  {
    q: "How do I delete my account?",
    a: "Email support@moondaylive.com from your account address requesting deletion, and we will remove your data within 30 days.",
  },
];

/** FAQPage structured data for the FAQ list. */
export function faqPageSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
