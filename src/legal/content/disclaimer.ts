import type { LegalDocument } from "../types";

export const disclaimer: LegalDocument = {
  slug: "disclaimer",
  title: "Disclaimer and Risk Disclosure",
  shortTitle: "Disclaimer & Risk Disclosure",
  summary: "What Bet Lab is, and is not, the real uncertainty in football and in any decision informed by our analysis, and how we expect you to use our content responsibly.",
  version: "2.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "summary",
      heading: "Summary",
      blocks: [
        { type: "callout", variant: "danger", text: "No football prediction is ever certain. Confidence ratings reflect relative statistical assessment, not guaranteed outcomes. Never risk money you cannot afford to lose, and never use Bet Lab as a guaranteed income system." },
      ],
    },
    {
      id: "what-we-are",
      heading: "1. What Bet Lab Is",
      blocks: [
        { type: "paragraphs", items: [
          "Bet Lab provides football intelligence, statistical analysis and analytical opinions about football fixtures and markets.",
        ] },
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
      id: "sporting-uncertainty",
      heading: "3. Uncertainty of Sporting Events",
      blocks: [
        { type: "paragraphs", items: ["Football match outcomes can be affected by many factors outside anyone's control or prediction, including:"] },
        { type: "list", items: [
          "Injuries and suspensions.",
          "Late tactical or line-up changes.",
          "Weather conditions.",
          "Refereeing decisions.",
          "Player motivation and morale.",
          "Fixture scheduling and travel fatigue.",
          "Errors or delays in underlying data.",
          "Unexpected, late-breaking events.",
        ] },
      ],
    },
    {
      id: "prediction-risk",
      heading: "4. Prediction Risk",
      blocks: [
        { type: "list", items: [
          "A high confidence rating does not mean certainty - it reflects our relative assessment based on available information at the time.",
          "Statistical probability does not guarantee any single outcome.",
          "Multiple Predictions can lose in a row, even during a period of strong historical performance.",
          "Historical accuracy does not guarantee future accuracy.",
          "Any analytical model, human or automated, rests on assumptions and has limitations.",
          "Source data may be incomplete, delayed, or occasionally wrong.",
          "Match circumstances, team news and odds may change after a Prediction is published; independently verify time-sensitive details before acting on them.",
        ] },
      ],
    },
    {
      id: "financial-risk",
      heading: "5. Financial Risk",
      blocks: [
        { type: "list", items: [
          "If you choose to place a bet with a third party informed by our analysis, you may lose all of the money you wager.",
          "Never gamble with borrowed money.",
          "Never gamble with money needed for rent, food, school fees, medical care, or other essential household needs.",
          "Never chase losses by increasing your stakes to try to recover them.",
          "Bet Lab does not provide a guaranteed-income system. Your Subscription fee purchases access to analytical content, not guaranteed winnings.",
        ] },
      ],
    },
    {
      id: "legal-risk",
      heading: "6. Legal Risk",
      blocks: [
        { type: "paragraphs", items: ["You are responsible for confirming whether gambling and related activities are lawful in your own location before acting on that basis. You must comply with the laws applicable to you."] },
      ],
    },
    {
      id: "technology-risk",
      heading: "7. Technology Risk",
      blocks: [
        { type: "list", items: [
          "Website outages, delayed updates, and internet or third-party provider failures can all affect the timeliness of information you receive.",
          "You should always verify time-sensitive details (such as odds and team news) independently before acting.",
        ] },
      ],
    },
    {
      id: "responsible-use",
      heading: "8. Your Responsibility and Responsible Use",
      blocks: [
        { type: "list", items: [
          "You alone are responsible for any independent decision you make, including any wager placed with a third party. Bet Lab is not responsible for gambling losses arising from decisions you make independently, whether or not informed by our Content.",
          "Never stake money you cannot afford to lose.",
          "Gambling can be addictive. If you notice signs of harm, stop and seek appropriate support - see our Responsible Gambling Statement.",
          "Persons under 18 must not use Bet Lab.",
        ] },
      ],
    },
  ],
};
