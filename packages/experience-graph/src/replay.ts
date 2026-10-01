// biome-ignore-all format: replay implementation is intentionally compact
// biome-ignore-all assist/source/organizeImports: implementation imports are intentionally compact

import type{Action,Destination,ExperienceGraph,ReplayResult,Trigger}from"./types";
const destinationOf=(a:Action):Destination|null=>a.type==="navigate"||a.type==="overlay"||a.type==="replace"?a.destination:null;
const matches=(a:Trigger,b:Trigger)=>JSON.stringify(a)===JSON.stringify(b);
export function replayTransitions(graph:ExperienceGraph,startingPointId:string,triggers:readonly Trigger[]):ReplayResult{
 const start=graph.startingPoints.find(p=>p.id===startingPointId);if(!start)throw new Error(`Unknown starting point: ${startingPointId}`);let current=start.destination;const steps=[];
 for(const trigger of triggers){const t=graph.transitions.filter(x=>x.source.screenId===current.screenId&&(!x.source.nodeId||x.source.nodeId===current.nodeId)&&matches(x.trigger,trigger)).sort((a,b)=>a.id.localeCompare(b.id))[0];if(!t)throw new Error(`No matching transition from ${current.screenId}`);const next=destinationOf(t.action);steps.push({transitionId:t.id,from:current,to:next,trigger,action:t.action});if(next)current=next}
 return{finalDestination:current,steps}
}
