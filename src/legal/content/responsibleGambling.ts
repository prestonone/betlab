import type { LegalDocument } from "../types";

export const responsibleGambling: LegalDocument = {
  slug: "responsible-gambling",
  title: "Responsible Gambling Statement",
  shortTitle: "Responsible Gambling",
  summary: "Bet Lab does not operate gambling services, but we recognise some members use our analysis when making their own independent betting decisions - here's how to stay safe.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "not-a-gambling-service",
      heading: "1. Bet Lab Is Not a Gambling Service",
      blocks: [
        { type: "paragraphs", items: [
          "Bet Lab sells access to football analysis and prediction opinions. We do not accept bets, hold gambling funds, or operate any wagering product. We recognise, however, that some members may use our analysis when making their own independent decisions with third-party bookmakers, and we want that to happen as safely as possible.",
        ] },
      ],
    },
    {
      id: "entertainment-not-income",
      heading: "2. Treat Gambling as Entertainment, Not Income",
      blocks: [
        { type: "list", items: [
          "Never gamble with money you need for essentials - rent, food, school fees, medical care, or other household responsibilities.",
          "Never borrow money to gamble.",
          "Never chase losses by increasing your stakes.",
          "Set yourself a time and money limit before you start, and stick to it.",
          "Take regular breaks.",
          "Do not gamble while distressed, intoxicated, or under pressure.",
          "Do not let gambling interfere with your family, work, health, or financial responsibilities.",
        ] },
      ],
    },
    {
      id: "under-18",
      heading: "3. Persons Under 18",
      blocks: [
        { type: "paragraphs", items: ["Bet Lab is strictly for adults aged 18 and over. If you are under 18, you must not use this Platform."] },
      ],
    },
    {
      id: "warning-signs",
      heading: "4. Warning Signs of Harmful Gambling",
      blocks: [
        { type: "list", items: [
          "Spending more time or money on gambling than you intended.",
          "Feeling anxious, guilty, or preoccupied about gambling.",
          "Gambling to escape stress or difficult emotions.",
          "Lying to family or friends about how much you gamble.",
          "Borrowing money or missing payments to fund gambling.",
          "Struggling to stop despite wanting to.",
        ] },
      ],
    },
    {
      id: "getting-help",
      heading: "5. Steps You Can Take",
      blocks: [
        { type: "list", items: [
          "Talk to someone you trust about how you are feeling.",
          "Consider self-excluding from gambling operators you use - most licensed bookmakers offer this directly.",
          "You can close your Bet Lab account or unsubscribe from our communications at any time by emailing support@betlabhq.com.",
          "Seek support from a reputable, independent organisation that specialises in gambling harm.",
        ] },
        { type: "callout", variant: "info", text: "Owner note: this section should link to a verified, currently-active Nigerian gambling-support helpline once one has been confirmed from an authoritative source. Internationally recognised resources such as Gamblers Anonymous (gamblersanonymous.org) and BeGambleAware (begambleaware.org) can be a starting point in the meantime. Do not publish an unverified phone number." },
      ],
    },
  ],
};
