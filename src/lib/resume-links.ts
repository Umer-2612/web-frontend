import type { ResumeLink } from "@/lib/api";

const HAS_WORD = /[\p{L}\p{N}]/u;

/** Labels to try, in order, for a link whose own label is unusable and whose domain says nothing
 * ("Portfolio" is by far the most common wording on a resume header). */
const GENERIC_LABELS = ["Portfolio", "Website"];

function knownLabelForUrl(url: string): string {
  if (/^mailto:/i.test(url)) return url.replace(/^mailto:/i, "").split("?")[0] ?? "";
  if (/linkedin\.com/i.test(url)) return "LinkedIn";
  if (/github\.com/i.test(url)) return "GitHub";
  if (/gitlab\.com/i.test(url)) return "GitLab";
  return "";
}

/** Links come from PDF annotations matched to the text under them. Older parses sometimes labelled a link
 * with its neighbouring separator ("·"), which then linked every "·" on the page and left the real word
 * ("LinkedIn", "Portfolio") as plain text. Repairs those: a label with no letters or digits is replaced by
 * one derived from the URL, and a link nothing can be derived for is dropped. */
export function normalizeLinks(links: ResumeLink[]): ResumeLink[] {
  const generic = [...GENERIC_LABELS];
  const out: ResumeLink[] = [];
  for (const link of links) {
    // Trim stray symbols off the ends too: older parses stored "LinkedIn⋄" (the separator after it).
    const label = (link.label ?? "").replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "").trim();
    if (HAS_WORD.test(label)) {
      out.push({ label, url: link.url });
      continue;
    }
    const derived = knownLabelForUrl(link.url) || generic.shift() || "";
    if (derived) out.push({ label: derived, url: link.url });
  }
  return out;
}

/** Separator glyphs resumes use between header items ("LinkedIn ⋄ Portfolio ◆ GitHub", "Live Demo · GitHub"). */
const SEPARATORS = /\s*[·•⋄◆◇▪●]\s*/g;

/** One consistent " · " between items, and no doubled spaces: PDF text runs were sometimes joined bare,
 * giving "Platform Live Demo⋄GitHub". Safe for display text only; never changes the words. */
export function tidyResumeText(text: string): string {
  return text.replace(SEPARATORS, " · ").replace(/\s{2,}/g, " ").trim();
}

/** A space only where an inserted link would otherwise touch a word on either side. */
export function linkPadding(before: string, after: string): { lead: string; trail: string } {
  return {
    lead: before && !/\s$/.test(before) ? " " : "",
    trail: after && !/^[\s,.;:!?)\]]/.test(after) ? " " : "",
  };
}
