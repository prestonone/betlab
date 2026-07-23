import type { LegalDocument } from "../types";

export const cookiePolicy: LegalDocument = {
  slug: "cookies",
  title: "Cookie Policy",
  shortTitle: "Cookie Policy",
  summary: "What cookies Bet Lab actually uses today, and how you can control them.",
  version: "1.0",
  effectiveDate: "2026-07-23",
  sections: [
    {
      id: "what-are-cookies",
      heading: "1. What Cookies Are",
      blocks: [
        { type: "paragraphs", items: [
          "Cookies are small pieces of data stored in your browser by a website you visit, used to remember information between requests.",
        ] },
      ],
    },
    {
      id: "what-we-actually-use",
      heading: "2. What Bet Lab Actually Uses",
      blocks: [
        { type: "paragraphs", items: [
          "The main Bet Lab website (where you browse predictions, manage your subscription, and use your dashboard) does not set any cookies of its own. Your sign-in session is kept using browser local storage, not cookies, and is never sent to third parties.",
          "The only cookies used anywhere in our systems are set by the separate Bet Lab staff administration area, and only when a staff member logs in there:",
        ] },
        { type: "list", items: [
          "A session cookie, used to keep an authenticated staff member logged in to the administration area.",
          "A security (CSRF) cookie, used to protect the administration area against cross-site request forgery.",
        ] },
        { type: "paragraphs", items: [
          "Both of these are strictly necessary, first-party, session-based cookies used only by staff, not by ordinary members using the public website.",
        ] },
      ],
    },
    {
      id: "what-we-dont-use",
      heading: "3. What We Do Not Currently Use",
      blocks: [
        { type: "paragraphs", items: [
          "We do not currently use analytics cookies, advertising or marketing-tracking cookies, or any third-party tracking cookies on the public website.",
        ] },
        { type: "callout", variant: "info", text: "If this changes in the future, we will update this policy first and add an appropriate cookie-consent control before any non-essential cookie is set." },
      ],
    },
    {
      id: "control",
      heading: "4. Your Control",
      blocks: [
        { type: "list", items: [
          "You can clear your browser's local storage at any time, which will sign you out of Bet Lab.",
          "Most browsers let you view, block or delete cookies through their settings. Blocking the staff administration area's essential cookies will prevent staff sign-in to that area; it has no effect on the public member website, which does not use cookies.",
        ] },
      ],
    },
    {
      id: "updates",
      heading: "5. Updates to This Policy",
      blocks: [
        { type: "paragraphs", items: ["We will revise this policy if our use of cookies changes, and update the version number and effective date above."] },
      ],
    },
  ],
};
