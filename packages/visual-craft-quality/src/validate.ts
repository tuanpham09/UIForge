import type { IconRegistry, VisualCraftStrategy } from "./types";

export function validateStrategy(strategy: VisualCraftStrategy): string[] {
  const findings: string[] = [];
  if (strategy.spacing.base !== 4) findings.push("spacing.base must be 4px.");
  if (strategy.spacing.values.some(v => v % 4 !== 0)) findings.push("spacing.values must follow the 4px rhythm.");
  for (const viewport of ["desktop","mobile"] as const) {
    for (const role of Object.values(strategy.typography[viewport].roles)) {
      if (!role.fontSize || !role.lineHeight) findings.push(`Typography role ${role.role} must define font size and line height.`);
    }
  }
  if (strategy.radius.xl === 16 && strategy.radius.full !== "pill-or-circle-only") findings.push("Full radius must remain semantically constrained.");
  if (strategy.card.maxRepeatedAnatomyRatio > 1 || strategy.card.maxRepeatedAnatomyRatio <= 0) findings.push("Card repetition threshold must be between 0 and 1.");
  return findings;
}

export function validateIconRegistry(registry: IconRegistry): string[] {
  const findings: string[] = [];
  for (const icon of Object.values(registry.icons)) {
    if (icon.provider !== "lucide" || icon.format !== "svg") findings.push(`Icon ${icon.id} must use the default SVG/Lucide provider.`);
    if (icon.family !== "outline" || icon.weight !== "regular") findings.push(`Icon ${icon.id} uses an inconsistent family or weight.`);
    if (icon.sizes.some(size => ![12,16,20,24,32].includes(size))) findings.push(`Icon ${icon.id} has an unapproved semantic size.`);
  }
  return findings;
}
