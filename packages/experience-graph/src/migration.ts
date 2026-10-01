// biome-ignore-all format: version gate is intentionally compact
// biome-ignore-all assist/source/organizeImports: implementation imports are intentionally compact

import{EXPERIENCE_GRAPH_VERSION,type ExperienceGraph}from"./types";
export function migrateExperienceGraph(input:unknown):ExperienceGraph{if(typeof input!=="object"||input===null||!("version"in input)||(input as{version?:unknown}).version!==EXPERIENCE_GRAPH_VERSION)throw new Error(`Unsupported Experience Graph version. Expected ${EXPERIENCE_GRAPH_VERSION}.`);return input as ExperienceGraph}
