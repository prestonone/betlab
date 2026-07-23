import type { LegalDocument } from "../types";

export const methodology: LegalDocument = {
  slug: "methodology",
  title: "Prediction Methodology",
  shortTitle: "Prediction Methodology",
  summary: "A transparent explanation of how Bet Lab predictions are produced, reviewed, published and recorded.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "how-produced",
      heading: "1. How Predictions Are Produced",
      blocks: [
        { type: "paragraphs", items: [
          "Bet Lab Predictions are produced through human analyst review. An analyst assesses factors such as recent team form, home and away records, head-to-head history, player availability, competition context, and other statistical trends reasonably available at the time, and publishes a written analysis together with a specific market selection and the odds available when the pick was prepared.",
        ] },
        { type: "callout", variant: "info", text: "Bet Lab does not currently use artificial intelligence, machine learning, a proprietary automated algorithm, or a real-time live data feed to generate Predictions. If this changes, this page will be updated first." },
      ],
    },
    {
      id: "categories",
      heading: "2. Categories",
      blocks: [
        { type: "paragraphs", items: [
          "Predictions are organised into categories (for example Banker, Sure 2, Sure 3, Sure 5, and Rollover) reflecting the analyst's own relative assessment of a selection, not a statistically computed probability. A category label describes how the pick has been framed by the analyst, not a guarantee of any kind.",
        ] },
      ],
    },
    {
      id: "publication",
      heading: "3. Review and Publication",
      blocks: [
        { type: "list", items: [
          "Each Prediction is reviewed before publication.",
          "Once published, a Prediction becomes visible to eligible Users according to its access level (free or Premium Content).",
          "Data may be incomplete, delayed, or occasionally inaccurate. A Prediction reflects an opinion at the time it was published and may become outdated as match circumstances change - always verify fixtures, line-ups and odds independently before acting.",
        ] },
      ],
    },
    {
      id: "corrections",
      heading: "4. Corrections",
      blocks: [
        { type: "paragraphs", items: [
          "We may correct a published error (for example, an incorrectly recorded team name or market). A correction does not create any entitlement to compensation for a betting decision made with a third party based on the earlier version.",
        ] },
      ],
    },
    {
      id: "record-keeping",
      heading: "5. Honest Record-Keeping",
      blocks: [
        { type: "paragraphs", items: [
          "We maintain our historical prediction record honestly. We do not delete or hide losing Predictions in order to inflate our apparent performance.",
        ] },
      ],
    },
    {
      id: "definitions",
      heading: "6. Result Definitions",
      blocks: [
        { type: "list", items: [
          "Won - the selection settled in favour of the Prediction.",
          "Lost - the selection settled against the Prediction.",
          "Void - the selection could not be settled as originally framed (for example, the match was postponed or the market was voided) and is excluded from win/loss calculations.",
          "Pending - the fixture has not yet been settled.",
        ] },
        { type: "paragraphs", items: [
          "Where a win rate or similar statistic is shown, it is calculated as: won ÷ (won + lost), over the sample period stated next to the figure, excluding void and pending items from the count.",
        ] },
      ],
    },
  ],
};
