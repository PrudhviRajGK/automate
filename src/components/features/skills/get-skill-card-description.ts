import type { SkillInfo } from "#/types/settings";
import { rebrandCatalogText } from "#/utils/rebrand-catalog-text";

const FRONTMATTER_PATTERN = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function parseDescriptionFromFrontmatter(frontmatter: string): string | null {
  const blockMatch = frontmatter.match(
    /^description:\s*\|\s*\r?\n((?:[ \t].*(?:\r?\n|$))+)/m,
  );
  if (blockMatch) {
    return blockMatch[1]!.replace(/^[ \t]+/gm, "").trim();
  }

  const quotedMatch = frontmatter.match(/^description:\s*['"](.+?)['"]\s*$/m);
  if (quotedMatch) {
    return quotedMatch[1]!.trim();
  }

  const inlineMatch = frontmatter.match(/^description:\s*(.+)\s*$/m);
  if (inlineMatch) {
    return inlineMatch[1]!.trim();
  }

  return null;
}

function stripFrontmatter(content: string): string {
  const match = content.match(FRONTMATTER_PATTERN);
  if (!match) return content.trim();
  return content.slice(match[0].length).trim();
}

function extractBodyPreview(body: string): string {
  const withoutTitle = body.replace(/^#+\s+[^\n]+\n+/, "").trim();
  const paragraph =
    withoutTitle
      .split(/\n\s*\n/)
      .map((part) => part.replace(/\s+/g, " ").trim())
      .find((part) => part.length > 0) ??
    withoutTitle.replace(/\s+/g, " ").trim();

  return paragraph;
}

/**
 * Subtitle text for skill cards: prefer API `description`, then YAML
 * frontmatter inside `content`, then the first body paragraph.
 *
 * Published skills are third-party catalog data, so the product name in their
 * prose is rebranded on the way to the card — see `rebrandCatalogText`.
 */
export function getSkillCardDescription(skill: SkillInfo): string {
  return rebrandCatalogText(resolveSkillCardDescription(skill));
}

function resolveSkillCardDescription(skill: SkillInfo): string {
  const description = skill.description?.trim();
  if (description) return description;

  const content = skill.content?.trim();
  if (!content) return "";

  const frontmatterMatch = content.match(FRONTMATTER_PATTERN);
  if (frontmatterMatch) {
    const fromFrontmatter = parseDescriptionFromFrontmatter(
      frontmatterMatch[1]!,
    );
    if (fromFrontmatter) return fromFrontmatter;
  }

  return extractBodyPreview(stripFrontmatter(content));
}
