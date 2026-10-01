import type {ExperienceGraph} from "./types";
const sortById=<T extends {id:string}>(items:T[])=>[...items].sort((a,b)=>a.id.localeCompare(b.id));
export function normalizeExperienceGraph(graph:ExperienceGraph):ExperienceGraph{return{...graph,flows:sortById(graph.flows).map(f=>({...f,screenIds:[...f.screenIds].sort(),startingPointIds:[...f.startingPointIds].sort(),transitionIds:[...f.transitionIds].sort()})),journeys:sortById(graph.journeys).map(j=>({...j,transitionIds:[...j.transitionIds].sort()})),startingPoints:sortById(graph.startingPoints).map(p=>({...p,journeyIds:[...(p.journeyIds??[])].sort()})),transitions:sortById(graph.transitions)}}
function canonicalize(value:unknown):unknown{if(Array.isArray(value))return value.map(canonicalize);if(value&&typeof value==="object"){const sorted:Record<string,unknown>={};for(const key of Object.keys(value).sort())sorted[key]=canonicalize((value as Record<string,unknown>)[key]);return sorted}return value}
export function serializeExperienceGraph(graph:ExperienceGraph):string{return JSON.stringify(canonicalize(normalizeExperienceGraph(graph)))}
export function deserializeExperienceGraph(serialized:string):ExperienceGraph{return JSON.parse(serialized) as ExperienceGraph}
export const experienceGraphKey=(graph:ExperienceGraph)=>serializeExperienceGraph(graph)
