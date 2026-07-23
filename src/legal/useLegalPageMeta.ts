import { useEffect } from "react";

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface LegalPageMetaOptions {
  title: string;
  description: string;
  path: string;
  modifiedDate?: string;
  breadcrumb?: BreadcrumbItem[];
}

const SITE_URL = "https://www.betlabhq.com";

function setMetaTag(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLinkTag(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(id: string, data: object) {
  let el = document.getElementById(id) as HTMLScriptElement | null;
  if (!el) {
    el = document.createElement("script");
    el.id = id;
    el.type = "application/ld+json";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/** Sets per-page title/description/canonical/OG/Twitter meta tags plus
 * WebPage + BreadcrumbList structured data. This is a client-rendered SPA,
 * so this has real value for social-link unfurling and rich-result eligibility,
 * but does not change the underlying hash/path-crawlability ceiling already
 * documented elsewhere for this app. */
export function useLegalPageMeta({ title, description, path, modifiedDate, breadcrumb }: LegalPageMetaOptions) {
  useEffect(() => {
    document.title = title;
    setMetaTag("name", "description", description);
    setMetaTag("name", "robots", "index, follow");
    setLinkTag("canonical", `${SITE_URL}${path}`);

    setMetaTag("property", "og:title", title);
    setMetaTag("property", "og:description", description);
    setMetaTag("property", "og:url", `${SITE_URL}${path}`);
    setMetaTag("property", "og:type", "article");

    setMetaTag("name", "twitter:card", "summary");
    setMetaTag("name", "twitter:title", title);
    setMetaTag("name", "twitter:description", description);

    setJsonLd("legal-page-schema", {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: title,
      description,
      url: `${SITE_URL}${path}`,
      ...(modifiedDate ? { dateModified: modifiedDate } : {}),
    });

    if (breadcrumb && breadcrumb.length > 0) {
      setJsonLd("legal-breadcrumb-schema", {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumb.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${SITE_URL}${item.path}`,
        })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, path, modifiedDate]);
}
