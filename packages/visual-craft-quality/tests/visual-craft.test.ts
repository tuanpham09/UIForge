import { describe, expect, it } from "vitest";
import { defaultIconRegistry, defaultVisualCraftStrategy, lintVisualCraft, validateIconRegistry, validateStrategy } from "../src";

const badDesign = {
  id:"expense-bad", viewport:"mobile" as const,
  nodes:[
    {id:"title",kind:"text" as const,typeRole:"page-title" as const,fontSize:"48px",lineHeight:"60px"},
    {id:"gap",kind:"container" as const,spacing:22},
    {id:"icon",kind:"icon" as const,iconId:"missing",iconFormat:"png",iconSize:28,iconFamily:"filled",iconWeight:"bold"},
    ...Array.from({length:6},(_,i)=>({id:`card-${i}`,kind:"card" as const,cardAnatomy:"metric-card",radius:24,elevation:"strong" as const,cardPurpose:"summary" as const})),
    {id:"button",kind:"control" as const,interactiveTarget:40}
  ],
  totalCardCount:6,repeatedCardCount:6,visibleColors:["red","blue","green","purple"]
};

describe("visual craft strategy",()=>{
  it("matches the UIForge desktop/mobile typography baseline",()=>{
    expect(defaultVisualCraftStrategy.typography.desktop.roles["page-title"]).toMatchObject({fontSize:"32px",lineHeight:"40px"});
    expect(defaultVisualCraftStrategy.typography.mobile.roles["page-title"]).toMatchObject({fontSize:"28px",lineHeight:"36px"});
  });
  it("uses the 4px rhythm and density tiers",()=>{
    expect(defaultVisualCraftStrategy.spacing.values).toEqual([4,8,12,16,20,24,32,40,48,64]);
    expect(defaultVisualCraftStrategy.density.card).toEqual({compact:12,standard:16,spacious:24});
    expect(validateStrategy(defaultVisualCraftStrategy)).toEqual([]);
  });
  it("uses Lucide SVG semantics",()=>{
    expect(defaultIconRegistry.defaultProvider).toBe("lucide");
    expect(validateIconRegistry(defaultIconRegistry)).toEqual([]);
  });
  it("selects compact cards for dense summaries",()=>{
    expect(defaultVisualCraftStrategy.density.defaultByPurpose.summary).toBe("compact");
    expect(defaultVisualCraftStrategy.density.defaultByPurpose.grouping).toBe("standard");
  });
  it("detects bad-design patterns deterministically",()=>{
    const a=lintVisualCraft(badDesign,defaultVisualCraftStrategy);
    const b=lintVisualCraft(badDesign,defaultVisualCraftStrategy);
    expect(a).toEqual(b);
    expect(a.findings.map(f=>f.ruleId)).toEqual(expect.arrayContaining([
      "craft.raw-font-size","craft.spacing-outside-rhythm","craft.icon-unregistered","craft.icon-non-svg",
      "craft.icon-size","craft.icon-family","craft.icon-weight","craft.card-spam","craft.excessive-radius",
      "craft.excessive-elevation","craft.radius-elevation-stack","craft.mobile-type-scale","craft.interactive-target",
      "craft.color-budget"
    ]));
    expect(a.fingerprint).toBe(b.fingerprint);
  });
});
