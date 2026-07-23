import type { LegalDocument } from "../types";

export const riskDisclosure: LegalDocument = {
  slug: "risk-disclosure",
  title: "Risk Disclosure Statement",
  shortTitle: "Risk Disclosure",
  summary: "A clear explanation of the uncertainty in football and in any decision informed by our analysis.",
  version: "1.0",
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
      id: "sporting-uncertainty",
      heading: "1. Uncertainty of Sporting Events",
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
      heading: "2. Prediction Risk",
      blocks: [
        { type: "list", items: [
          "A high confidence rating does not mean certainty - it reflects our relative assessment based on available information at the time.",
          "Statistical probability does not guarantee any single outcome.",
          "Multiple Predictions can lose in a row, even during a period of strong historical performance.",
          "Historical accuracy does not guarantee future accuracy.",
          "Any analytical model, human or automated, rests on assumptions and has limitations.",
          "Source data may be incomplete, delayed, or occasionally wrong.",
        ] },
      ],
    },
    {
      id: "financial-risk",
      heading: "3. Financial Risk",
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
      heading: "4. Legal Risk",
      blocks: [
        { type: "paragraphs", items: ["You are responsible for confirming whether gambling and related activities are lawful in your own location before acting on that basis."] },
      ],
    },
    {
      id: "technology-risk",
      heading: "5. Technology Risk",
      blocks: [
        { type: "list", items: [
          "Website outages, delayed updates, and internet or third-party provider failures can all affect the timeliness of information you receive.",
          "You should always verify time-sensitive details (such as odds and team news) independently before acting.",
        ] },
      ],
    },
    {
      id: "responsibility",
      heading: "6. Personal Responsibility",
      blocks: [
        { type: "paragraphs", items: ["You make your own independent decisions. Bet Lab provides analysis and opinion; it does not make decisions for you and is not responsible for the outcome of decisions you make."] },
      ],
    },
  ],
};
