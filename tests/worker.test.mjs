import test from "node:test";
import assert from "node:assert/strict";
import worker,{normaliseTag,parseRanges,inPurchasedRange} from "../backend/worker.mjs";

// Synthetic batches only. Never replace these fixtures with real VvE tag ranges.
const ranges = [{start:"00001000",end:"00001099",radix:10,width:8},{start:"00AA0000",end:"00AA00FF",radix:16,width:8}];
const origin = "https://vve-ogierssingel-bollandstraat.github.io";
const report = (changes={}) => ({tag:"00001042",anonymous:false,category:"geluid",eventDate:"2026-08-01",eventTime:"23:15",timeZone:"Europe/Amsterdam",location:"Fictieve testlocatie",description:"Dit is uitsluitend een fictieve testmelding.",repeated:"nee",repeatDetails:"",contactAllowed:true,truthful:true,language:"nl",website:"",...changes});
function setup(changes={}) {
  const objects = new Map(), pending = [];
  const env = {
    ACCEPT_REPORTS:"true",ALLOWED_ORIGIN:origin,TURNSTILE_SECRET_KEY:"test-only",TAG_RANGES_JSON:JSON.stringify(ranges),
    ENCRYPTION_KEY:Buffer.alloc(32,7).toString("base64"),KEY_ID:"test-key",RATE_LIMIT_SECRET:"synthetic-secret",
    RESEND_API_KEY:"test-only",NOTIFY_FROM:"test@example.invalid",NOTIFY_TO:'["board@example.invalid"]',
    RATE_LIMITER:{limit:async()=>({success:true})},
    REPORTS:{
      put:async(key,value,options={}) => {objects.set(key,{value,customMetadata:options.customMetadata,etag:"test-etag"});},
      get:async key => {const obj=objects.get(key);return obj?{...obj,json:async()=>JSON.parse(obj.value)}:null;},
      list:async()=>({objects:[...objects.entries()].map(([key,o])=>({key,customMetadata:o.customMetadata})),truncated:false}),
      delete:async key=>{objects.delete(key);}
    },...changes
  };
  return {env,objects,ctx:{waitUntil:p=>pending.push(p)},flush:()=>Promise.all(pending)};
}
function request(r=report(),file,requestOrigin=origin) {
  const form = new FormData();form.append("report",JSON.stringify(r));form.append("turnstileToken","synthetic-turnstile");
  if (file) for (const f of (Array.isArray(file)?file:[file])) form.append("attachments",f);
  return new Request(origin+"/api/meldingen",{method:"POST",headers:{Origin:requestOrigin,"CF-Connecting-IP":"192.0.2.1"},body:form});
}
async function openPart(envelope,part,env) {
  const key=await crypto.subtle.importKey("raw",Buffer.from(env.ENCRYPTION_KEY,"base64"),{name:"AES-GCM"},false,["decrypt"]);
  const source=envelope[part];
  const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:Buffer.from(source.iv,"base64"),additionalData:new TextEncoder().encode(`vve:1:${envelope.id}:${part}`)},key,Buffer.from(source.ciphertext,"base64"));
  return JSON.parse(new TextDecoder().decode(plain));
}
const deliveries=[];
let turnstileResult,mailStatus=200;
const realFetch=globalThis.fetch;
test.beforeEach(()=>{deliveries.length=0;mailStatus=200;turnstileResult={success:true,hostname:new URL(origin).hostname,action:"melding"};globalThis.fetch=async(url,options)=>{
  if (url.includes("siteverify")) return Response.json(turnstileResult);
  if (url==="https://api.resend.com/emails") {deliveries.push(JSON.parse(options.body));return Response.json({id:"synthetic-email"},{status:mailStatus});}
  throw new Error("Unexpected network call");
};});
test.afterEach(()=>{globalThis.fetch=realFetch;});

test("batch bounds are inclusive and support separate decimal/hex batches",()=>{
  const parsed=parseRanges(JSON.stringify(ranges));
  for (const value of ["00001000","00001099","00AA0000","00AA00FF"]) assert.equal(inPurchasedRange(value,parsed),true);
  for (const value of ["00000999","00001100","00AA0100","1000",""]) assert.equal(inPurchasedRange(value,parsed),false);
  assert.equal(normaliseTag("00-aa-00ff"),"00AA00FF");
});
test("large IDs are not rounded and malformed ranges fail closed",()=>{
  const parsed=parseRanges('[{"start":"90071992547409930","end":"90071992547409931","radix":10,"width":17}]');
  assert.equal(inPurchasedRange("90071992547409931",parsed),true);assert.equal(inPurchasedRange("90071992547409932",parsed),false);
  for(const json of ['[]','{}','[{"start":"9999","end":"0000","radix":10,"width":4}]','[{"start":1000,"end":1100,"radix":10,"width":4}]']) assert.throws(()=>parseRanges(json));
});
test("receipt follows encrypted storage; identity is separate and notification has no content",async()=>{
  const s=setup();const file=new File([new Uint8Array([137,80,78,71,13,10,26,10,0])],"personal-name.png",{type:"image/png"});
  const response=await worker.fetch(request(report(),file),s.env,s.ctx);assert.equal(response.status,201);
  const receipt=await response.json();assert.deepEqual(Object.keys(receipt),["reportId"]);assert.match(receipt.reportId,/^VVE-[0-9A-F]{32}$/);
  await s.flush();assert.equal(s.objects.size,1);
  const stored=[...s.objects.values()][0];
  for(const secret of ["00001042","Fictieve testlocatie","testmelding","personal-name","192.0.2.1"]) assert.equal(stored.value.includes(secret),false);
  const envelope=JSON.parse(stored.value),identity=await openPart(envelope,"identity",s.env),incident=await openPart(envelope,"report",s.env);
  assert.equal(identity.tag,"00001042");assert.equal(identity.verification,"in_range_pending_manual_check");
  assert.equal(incident.description,report().description);assert.equal(incident.tag,undefined);assert.equal(incident.attachments[0].name,"bijlage-1.png");
  assert.equal(stored.customMetadata.notified,"yes");assert.equal(deliveries.length,1);
  const mail=JSON.stringify(deliveries);assert.ok(mail.includes(receipt.reportId));assert.ok(!mail.includes(report().tag));assert.ok(!mail.includes(report().location));
  envelope.report.ciphertext=envelope.identity.ciphertext;await assert.rejects(()=>openPart(envelope,"report",s.env));
});
test("out-of-range and missing tags get the same public response shape",async()=>{
  for(const fields of [{tag:"00009999"},{tag:"",anonymous:true,contactAllowed:false}]) {
    const s=setup();const response=await worker.fetch(request(report(fields)),s.env,s.ctx);assert.equal(response.status,201);assert.deepEqual(Object.keys(await response.json()),["reportId"]);await s.flush();
    const envelope=JSON.parse([...s.objects.values()][0].value);assert.equal((await openPart(envelope,"identity",s.env)).verification,"anonymous_signal");
    assert.equal((await openPart(envelope,"report",s.env)).contactAllowed,false);
    assert.equal(Math.round((Date.parse(envelope.expiresAt)-Date.parse(envelope.receivedAt))/86400000),30);
  }
});
test("disabled service, absent ranges or wrong key cannot accept a report",async()=>{
  for(const changes of [{ACCEPT_REPORTS:"false"},{TAG_RANGES_JSON:"[]"},{ENCRYPTION_KEY:"invalid"},{NOTIFY_TO:"[]"}]) {
    const s=setup(changes);assert.equal((await worker.fetch(request(),s.env,s.ctx)).status,503);assert.equal(s.objects.size,0);
  }
});
test("invalid Turnstile, wrong hostname and wrong action are rejected before storage",async()=>{
  for(const result of [{success:false},{success:true,hostname:"attacker.invalid",action:"melding"},{success:true,hostname:new URL(origin).hostname,action:"login"}]) {
    turnstileResult=result;const s=setup();assert.equal((await worker.fetch(request(),s.env,s.ctx)).status,403);assert.equal(s.objects.size,0);
  }
});
test("other origins, GET and public read routes cannot read or write reports",async()=>{
  const s=setup();assert.equal((await worker.fetch(request(report(),null,"https://other.invalid"),s.env,s.ctx)).status,403);
  assert.equal((await worker.fetch(new Request(origin+"/api/meldingen",{headers:{Origin:origin}}),s.env,s.ctx)).status,405);
  assert.equal((await worker.fetch(new Request(origin+"/api/meldingen/VVE-123"),s.env,s.ctx)).status,404);assert.equal(s.objects.size,0);
});
test("server enforces required fields, truthfulness, enum and real calendar date",async()=>{
  for(const changes of [{truthful:false},{tag:""},{anonymous:true},{eventDate:"2026-02-30"},{eventDate:"2099-01-01"},{category:"unknown"},{description:"short"},{email:"forbidden@example.invalid"},{website:"spam"}]) {
    const s=setup();assert.equal((await worker.fetch(request(report(changes)),s.env,s.ctx)).status,400);assert.equal(s.objects.size,0);
  }
});
test("spoofed, oversized and excessive attachments are rejected",async()=>{
  const spoofed=new File(["not-a-png"],"image.png",{type:"image/png"});
  const tooBig=new File([new Uint8Array(2*1024*1024+1)],"image.png",{type:"image/png"});
  const pdf=new File(["%PDF-1.7 test"],"test.pdf",{type:"application/pdf"});
  for(const file of [spoofed,tooBig,[pdf,pdf,pdf,pdf]]) {const s=setup();assert.equal((await worker.fetch(request(report(),file),s.env,s.ctx)).status,400);assert.equal(s.objects.size,0);}
});
test("untrusted content length and oversized stream are bounded",async()=>{
  const s=setup();const req=request();req.headers.set("Content-Length",String(8*1024*1024));assert.equal((await worker.fetch(req,s.env,s.ctx)).status,413);
  const chunk=new Uint8Array(7*1024*1024);const stream=new ReadableStream({start(c){c.enqueue(chunk);c.close();}});
  const streamed=new Request(origin+"/api/meldingen",{method:"POST",headers:{Origin:origin,"CF-Connecting-IP":"192.0.2.1","Content-Type":"multipart/form-data; boundary=test"},body:stream,duplex:"half"});
  assert.equal((await worker.fetch(streamed,s.env,s.ctx)).status,413);assert.equal(s.objects.size,0);
});
test("rate limit and storage failure never produce a successful receipt",async()=>{
  const limited=setup({RATE_LIMITER:{limit:async()=>({success:false})}});assert.equal((await worker.fetch(request(),limited.env,limited.ctx)).status,429);assert.equal(limited.objects.size,0);
  const broken=setup();broken.env.REPORTS.put=async()=>{throw new Error("storage_down");};assert.equal((await worker.fetch(request(),broken.env,broken.ctx)).status,503);assert.equal(deliveries.length,0);
});
test("mail failures preserve accepted report and scheduled retry recovers",async()=>{
  mailStatus=503;const s=setup();assert.equal((await worker.fetch(request(),s.env,s.ctx)).status,201);await s.flush();
  assert.equal([...s.objects.values()][0].customMetadata.notified,"no");mailStatus=200;
  await worker.scheduled({},s.env,s.ctx);assert.equal([...s.objects.values()][0].customMetadata.notified,"yes");
});
test("expired records are deleted even while intake is disabled",async()=>{
  const s=setup({ACCEPT_REPORTS:"false"});s.objects.set("reports/expired.json",{value:"{}",customMetadata:{expiresAt:"2000-01-01T00:00:00Z",notified:"no"}});
  await worker.scheduled({},s.env,s.ctx);assert.equal(s.objects.size,0);assert.equal(deliveries.length,0);
});
