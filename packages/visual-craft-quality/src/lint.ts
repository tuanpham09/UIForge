// biome-ignore-all format: visual craft contract is maintained as semantic reference data
// biome-ignore-all assist/source/organizeImports: semantic package exports are intentionally grouped
import type { CraftScreen, LintResult, Severity, VisualCraftStrategy } from "./types";
import { defaultIconRegistry, resolveIcon } from "./icons";

const finding = (ruleId:string, severity:Severity, affectedIds:string[], message:string, recommendation:string) =>
  ({ ruleId, severity, affectedIds, message, recommendation });

export function lintVisualCraft(screen: CraftScreen, strategy: VisualCraftStrategy): LintResult {
  const findings = [
    ...lintTypography(screen,strategy),
    ...lintSpacing(screen,strategy),
    ...lintIcons(screen,strategy),
    ...lintCards(screen,strategy),
    ...lintRadiusElevation(screen),
    ...lintResponsive(screen,strategy)
  ];
  if ((screen.visibleColors?.length ?? 0) > strategy.decorationBudget.maxAccentColors)
    findings.push(finding("craft.color-budget","warning",screen.id,"Too many visible accent colors.","Reduce accent colors or assign semantic color roles."));
  const stable = findings.map(f => [f.ruleId,f.severity,[...f.affectedIds].sort(),f.message,f.recommendation]);
  const fingerprint = stable.map(v => JSON.stringify(v)).sort().join("|");
  return { version:"uiforge.visual-craft/v1", valid:!findings.some(f=>f.severity==="error"), findings, fingerprint };
}

function lintTypography(s:CraftScreen,strategy:VisualCraftStrategy) {
  const ramp=strategy.typography[s.viewport], findings: ReturnType<typeof finding>[]=[];
  for(const n of s.nodes) {
    if(n.kind==="text" && n.typeRole) {
      const role=ramp.roles[n.typeRole];
      if(n.fontSize && n.fontSize!==role.fontSize) findings.push(finding("craft.raw-font-size","warning",[n.id],"Raw font size does not match its semantic role.","Use the semantic typography role."));
      if(n.lineHeight && n.lineHeight!==role.lineHeight) findings.push(finding("craft.line-height-mismatch","warning",[n.id],"Line height does not match the semantic type role.","Use the role's line-height token."));
    }
  }
  return findings;
}
function lintSpacing(s:CraftScreen,strategy:VisualCraftStrategy) {
  const findings: ReturnType<typeof finding>[]=[];
  for(const n of s.nodes) if(n.spacing!==undefined && !strategy.spacing.values.includes(n.spacing))
    findings.push(finding("craft.spacing-outside-rhythm","warning",[n.id],`Spacing ${n.spacing}px is outside the semantic rhythm.`,"Use a spacing token from the Visual Craft Strategy."));
  return findings;
}
function lintIcons(s:CraftScreen,_strategy:VisualCraftStrategy) {
  const findings: ReturnType<typeof finding>[]=[];
  for(const n of s.nodes) if(n.kind==="icon" || n.iconId) {
    const icon=n.iconId?resolveIcon(defaultIconRegistry,n.iconId):undefined;
    if(!icon) findings.push(finding("craft.icon-unregistered","error",[n.id],"Icon is not registered semantically.","Use an icon registry ID backed by an SVG provider."));
    if(n.iconFormat && n.iconFormat!=="svg") findings.push(finding("craft.icon-non-svg","error",[n.id],"UI icon is not SVG.","Use a registered vector icon."));
    if(n.iconSize && ![12,16,20,24,32].includes(n.iconSize)) findings.push(finding("craft.icon-size","warning",[n.id],`Icon size ${n.iconSize}px is outside approved semantic sizes.`,"Use 12, 16, 20, 24 or 32px according to context."));
    if(n.iconFamily && n.iconFamily!=="outline") findings.push(finding("craft.icon-family","warning",[n.id],"Mixed icon family detected.","Use the project icon family."));
    if(n.iconWeight && n.iconWeight!=="regular") findings.push(finding("craft.icon-weight","warning",[n.id],"Mixed icon weight detected.","Use the project icon weight."));
  }
  return findings;
}
function lintCards(s:CraftScreen,strategy:VisualCraftStrategy) {
  const findings: ReturnType<typeof finding>[]=[];
  const cards=s.nodes.filter(n=>n.kind==="card");
  if((s.totalCardCount??cards.length)>=6 && (s.repeatedCardCount??cards.length)>=Math.ceil((s.totalCardCount??cards.length)*strategy.card.maxRepeatedAnatomyRatio))
    findings.push(finding("craft.card-spam","warning",cards.map(c=>c.id),"Card anatomy is repeated across too much of the screen.","Use compact cards, list rows or varied anatomy according to content purpose."));
  for(const card of cards) if(!card.cardPurpose)
    findings.push(finding("craft.card-purpose","warning",[card.id],"Card has no explicit semantic purpose.","Choose grouping, summary, preview, selectable, interactive or media."));
  return findings;
}
function lintRadiusElevation(s:CraftScreen) {
  const findings: ReturnType<typeof finding>[]=[];
  for(const n of s.nodes) {
    if(n.radius!==undefined && n.radius>16) findings.push(finding("craft.excessive-radius","warning",[n.id],"Radius is larger than the standard xl tier.","Use a semantic radius tier; reserve full radius for pills/circles."));
    if(n.elevation==="strong") findings.push(finding("craft.excessive-elevation","warning",[n.id],"Strong elevation should be reserved for high-layer surfaces.","Prefer none, subtle or medium elevation."));
    if(n.radius && n.elevation==="strong") findings.push(finding("craft.radius-elevation-stack","warning",[n.id],"Large radius combined with strong elevation can create decorative AI-style surface treatment.","Reduce radius/elevation unless the strategy explicitly requires it."));
  }
  return findings;
}
function lintResponsive(s:CraftScreen,strategy:VisualCraftStrategy) {
  const findings: ReturnType<typeof finding>[]=[];
  if(s.viewport==="mobile") {
    for(const n of s.nodes) if(n.kind==="text" && n.typeRole && n.fontSize && n.fontSize!==strategy.typography.mobile.roles[n.typeRole].fontSize)
      findings.push(finding("craft.mobile-type-scale","warning",[n.id],"Mobile semantic type ramp is not applied.","Use the mobile semantic typography role."));
    for(const n of s.nodes) if(n.interactiveTarget!==undefined && n.interactiveTarget<44)
      findings.push(finding("craft.interactive-target","error",[n.id],"Interactive target is below the 44px mobile baseline.","Increase the parent hit area without arbitrarily enlarging the visible icon."));
  }
  return findings;
}
