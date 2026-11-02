import assert from "node:assert/strict";
import test from "node:test";
import { AgentActionError, HabitatAgentClient } from "./agent-client.js";

test("known agent failures preserve their code instead of becoming unavailable", async () => {
 for(const [status,code] of [[409,"service_stop_incomplete"],[504,"service_timeout"],[503,"service_start_failed"]] as const){
  const client=new HabitatAgentClient(new URL('http://127.0.0.1:4317'),'fixture',async()=>new Response(JSON.stringify({error:code}),{status}));
  await assert.rejects(client.requestServerAction('dragonwilds','stop'),(error:unknown)=>error instanceof AgentActionError&&error.code===code&&error.httpStatus===status);
 }
});
test("unknown error bodies cannot introduce arbitrary reasons or sensitive text",async()=>{
 const client=new HabitatAgentClient(new URL('http://127.0.0.1:4317'),'fixture',async()=>new Response(JSON.stringify({error:'C:/private/secret'}),{status:503}));
 await assert.rejects(client.requestServerAction('dragonwilds','stop'),(error:unknown)=>error instanceof Error&&!(error instanceof AgentActionError)&&!error.message.includes('private'));
});
