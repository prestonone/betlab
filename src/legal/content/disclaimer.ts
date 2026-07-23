import type { LegalDocument } from "../types";

export const disclaimer: LegalDocument = {
  slug: "disclaimer",
  title: "Disclaimer and Responsible Use Policy",
  shortTitle: "Disclaimer & Responsible Use",
  summary: "What Bet Lab is, and is not, and how we expect you to use our analytical content responsibly.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "what-we-are",
      heading: "1. What Bet Lab Is",
      blocks: [
        { type: "paragraphs", items: [
          "Bet Lab provides football intelligence, statistical analysis and analytical opinions about football fixtures and markets.",
        ] },
        { type: "callout", variant: "warning", text: "Predictions are analytical opinions, not guarantees. Sporting events are inherently uncertain and no result is ever certain." },
      ],
    },
    {
      id: "what-we-are-not",
      heading: "2. What Bet Lab Is Not",
      blocks: [
        { type: "list", items: [
          "Bet Lab is not a bookmaker.",
          "Bet Lab is not a sportsbook.",
          "Bet Lab is not a casino.",
          "Bet Lab does not operate wagering or betting accounts on your behalf.",
          "Bet Lab does not guarantee profits or winning outcomes.",
          "Nothing on Bet Lab is financial, investment, or legal advice.",
        ] },
      ],
    },
    {
      id: "your-responsibility",
      heading: "3. Your Responsibility",
      blocks: [
        { type: "list", items: [
          "Match circumstances, team news and odds may change after a Prediction is published; independently verify time-sensitive details before acting on them.",
          "Past prediction performance does not guarantee future results.",
          "You must comply with the laws applicable to you, including any laws relating to gambling in your location.",
          "You alone are responsible for any independent decision you make, including any wager placed with a third party.",
          "Bet Lab is not responsible for gambling losses arising from decisions you make independently, whether or not informed by our Content.",
        ] },
      ],
    },
    {
      id: "responsible-use",
      heading: "4. Responsible Use",
      blocks: [
        { type: "list", items: [
          "Never stake money you cannot afford to lose.",
          "Gambling can be addictive. If you notice signs of harm, stop and seek appropriate support - see our Responsible Gambling Statement.",
          "Persons under 18 must not use Bet Lab.",
        ] },
      ],
    },
  ],
};
