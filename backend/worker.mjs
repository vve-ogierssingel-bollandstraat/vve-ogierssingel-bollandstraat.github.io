// GitHub Pages serves the form; this Worker is deployed separately.
// Neither the purchased tag ranges nor encryption keys belong in this repository.
const MAX_FILE = 2 * 1024 * 1024;
const MAX_REQUEST = 3 * MAX_FILE + 64 * 1024;
const encoder = new TextEncoder();
// Nuisance duration. "" stays valid: non-nuisance categories send no duration.
const DURATIONS = ["","tot15min","15-60min","1-3uur","3-6uur","6-12uur","meer12uur","doorlopend","nog-bezig"];
class ClientError extends Error { constructor(status, code) {super(code);this.status = status;} }
const bad = () => {throw new ClientError(400,"invalid_report");};
export function normaliseTag(value) {
  if (typeof value !== "string" || value.length > 48) bad();
  const tag = value.replace(/[\s-]/g,"").toUpperCase();
  if (tag && !/^[A-Z0-9]{4,32}$/.test(tag)) bad();
  return tag;
}
// Bounds are strings: preserve leading zeroes and compare large IDs losslessly.
// Each batch explicitly declares radix and width. Never infer ranges from a list.
export function parseRanges(json) {
  const ranges = JSON.parse(json);
  if (!Array.isArray(ranges) || ranges.length < 1 || ranges.length > 100) throw new Error("range_configuration");
  return ranges.map(r => {
    if (!r || ![10,16].includes(r.radix) || !Number.isInteger(r.width) || r.width < 4 || r.width > 32) throw new Error("range_configuration");
    const re = r.radix === 10 ? /^[0-9]+$/ : /^[0-9A-F]+$/;
    if (typeof r.start !== "string" || typeof r.end !== "string" || r.start.length !== r.width || r.end.length !== r.width || !re.test(r.start) || !re.test(r.end)) throw new Error("range_configuration");
    const start = BigInt((r.radix === 16 ? "0x" : "") + r.start), end = BigInt((r.radix === 16 ? "0x" : "") + r.end);
    if (start > end) throw new Error("range_configuration");
    return {radix:r.radix,width:r.width,start,end};
  });
}
export function inPurchasedRange(tag, ranges) {
  if (!tag) return false;
  return ranges.some(r => {
    if (tag.length !== r.width || !(r.radix === 10 ? /^[0-9]+$/ : /^[0-9A-F]+$/).test(tag)) return false;
    const value = BigInt((r.radix === 16 ? "0x" : "") + tag);
    return value >= r.start && value <= r.end;
  });
}
function textField(r, key, min, max) {
  if (typeof r[key] !== "string") bad();
  const value = r[key].trim();
  if (value.length < min || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) bad();
  return value;
}
export function validateReport(r, now = new Date()) {
  if (!r || typeof r !== "object" || Array.isArray(r)) bad();
  const allowed = ["tag","anonymous","category","eventDate","eventTime","timeZone","location","description","repeated","repeatDetails","contactAllowed","truthful","language","website","duration"];
  if (Object.keys(r).some(k => !allowed.includes(k))) bad();
  if (r.truthful !== true || typeof r.anonymous !== "boolean" || typeof r.contactAllowed !== "boolean" || r.website !== "") bad();
  const tag = normaliseTag(r.tag);
  if ((r.anonymous && (tag || r.contactAllowed)) || (!r.anonymous && !tag)) bad();
  if (!["geluid","rook-geur","vervuiling","veiligheid","schade","technisch","anders"].includes(r.category) || !["ja","nee","onbekend"].includes(r.repeated) || !["nl","en","de","pl","ro","bg","cs","sk","hu","hr","sr","uk","ru","zh"].includes(r.language) || r.timeZone !== "Europe/Amsterdam") bad();
  if (typeof r.eventDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(r.eventDate)) bad();
  const date = new Date(r.eventDate + "T12:00:00Z");
  const today = new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Amsterdam",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== r.eventDate || r.eventDate > today) bad();
  if (typeof r.eventTime !== "string" || (r.eventTime !== "" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.eventTime))) bad();
  const duration = r.duration === undefined ? "" : r.duration;
  if (!DURATIONS.includes(duration)) bad();
  return {tag,anonymous:r.anonymous,category:r.category,eventDate:r.eventDate,eventTime:r.eventTime,timeZone:r.timeZone,duration,
    location:textField(r,"location",2,160),description:textField(r,"description",20,5000),repeated:r.repeated,
    repeatDetails:textField(r,"repeatDetails",0,500),contactAllowed:r.contactAllowed,truthful:true,language:r.language};
}
function b64(bytes) {
  let result = "";
  for (let i = 0; i < bytes.length; i += 8192) result += String.fromCharCode(...bytes.subarray(i,i+8192));
  return btoa(result);
}
async function encryptionKey(env) {
  const bytes = Uint8Array.from(atob(env.ENCRYPTION_KEY),c => c.charCodeAt(0));
  if (bytes.length !== 32) throw new Error("key_configuration");
  return crypto.subtle.importKey("raw",bytes,{name:"AES-GCM"},false,["encrypt"]);
}
export async function seal(value, key, aad) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:encoder.encode(aad)},key,encoder.encode(JSON.stringify(value)));
  return {iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};
}
async function readLimited(request) {
  const length = request.headers.get("content-length");
  if (length && (!/^\d+$/.test(length) || Number(length) > MAX_REQUEST)) throw new ClientError(413,"too_large");
  if (!request.body) bad();
  const reader = request.body.getReader();
  const chunks = [];let size = 0;
  try {
    for (;;) {
      const {done,value} = await reader.read();if (done) break;
      size += value.byteLength;
      if (size > MAX_REQUEST) {await reader.cancel();throw new ClientError(413,"too_large");}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  return new Blob(chunks,{type:request.headers.get("content-type")});
}
async function attachments(form) {
  const files = form.getAll("attachments");
  if (files.length > 3) bad();
  const results = [];
  for (const [index,file] of files.entries()) {
    if (typeof file === "string" || !file || file.size < 1 || file.size > MAX_FILE) bad();
    const bytes = new Uint8Array(await file.arrayBuffer());
    const signatures = {
      "image/jpeg":bytes[0]===255 && bytes[1]===216 && bytes[2]===255,
      "image/png":[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v),
      "application/pdf":new TextDecoder().decode(bytes.subarray(0,5))==="%PDF-"
    };
    if (!signatures[file.type]) bad();
    const extension = {"image/jpeg":"jpg","image/png":"png","application/pdf":"pdf"}[file.type];
    // Do not store user-supplied filenames (which often contain a person's name).
    results.push({name:`bijlage-${index+1}.${extension}`,type:file.type,size:file.size,data:b64(bytes)});
  }
  return results;
}
function response(status, value, origin = "") {
  const headers = {"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff","Referrer-Policy":"no-referrer","Vary":"Origin"};
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(value),{status,headers});
}
function settings(env) {
  if (env.ACCEPT_REPORTS !== "true") throw new Error("disabled");
  const origin = new URL(env.ALLOWED_ORIGIN);
  if (origin.protocol !== "https:" || origin.origin !== env.ALLOWED_ORIGIN || origin.username || origin.password) throw new Error("origin_configuration");
  for (const key of ["TURNSTILE_SECRET_KEY","TAG_RANGES_JSON","ENCRYPTION_KEY","KEY_ID","RATE_LIMIT_SECRET","RESEND_API_KEY","NOTIFY_FROM","NOTIFY_TO"]) if (!env[key]) throw new Error("configuration");
  if (!/^[a-zA-Z0-9_-]{1,40}$/.test(env.KEY_ID) || !env.REPORTS || !env.RATE_LIMITER) throw new Error("configuration");
  const to = JSON.parse(env.NOTIFY_TO);
  if (!Array.isArray(to) || to.length < 1 || to.length > 5 || to.some(s => typeof s !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s))) throw new Error("recipients_configuration");
  return {hostname:origin.hostname,ranges:parseRanges(env.TAG_RANGES_JSON),to};
}
async function checkSpam(request, env, form, hostname) {
  const tokens = form.getAll("turnstileToken");
  if (tokens.length !== 1 || typeof tokens[0] !== "string" || !tokens[0] || tokens[0].length > 2048) throw new ClientError(403,"security_check");
  const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:tokens[0]}),signal:AbortSignal.timeout(10000)
  });
  if (!verify.ok) throw new Error("security_service");
  const outcome = await verify.json();
  if (outcome.success !== true || outcome.hostname !== hostname || outcome.action !== "melding") throw new ClientError(403,"security_check");
}
async function rateLimit(request, env) {
  const ip = request.headers.get("CF-Connecting-IP");
  if (!ip) throw new Error("missing_edge_address");
  // A keyed, daily changing rate-limit key; neither IP nor key enters the report.
  const key = await crypto.subtle.importKey("raw",encoder.encode(env.RATE_LIMIT_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  const digest = await crypto.subtle.sign("HMAC",key,encoder.encode(new Date().toISOString().slice(0,10)+":"+ip));
  const {success} = await env.RATE_LIMITER.limit({key:b64(new Uint8Array(digest))});
  if (!success) throw new ClientError(429,"rate_limit");
}
export async function notify(env, objectKey, settingsTo) {
  const object = await env.REPORTS.get(objectKey);
  if (!object || object.customMetadata?.notified === "yes") return;
  const envelope = await object.json();
  if (Date.parse(envelope.expiresAt) <= Date.now()) return;
  const delivery = await fetch("https://api.resend.com/emails",{
    method:"POST",headers:{"Content-Type":"application/json","Authorization":`Bearer ${env.RESEND_API_KEY}`,"Idempotency-Key":envelope.id},
    body:JSON.stringify({from:env.NOTIFY_FROM,to:settingsTo,subject:`Nieuwe VvE-melding ${envelope.id}`,text:`Er staat een nieuwe vertrouwelijke VvE-melding klaar.\n\nMeldingsnummer: ${envelope.id}\n\nOpen de afgeschermde VvE-opslag voor behandeling.`}),
    signal:AbortSignal.timeout(10000)
  });
  if (!delivery.ok) throw new Error("notification_delivery");
  // R2's object metadata and encrypted body are updated together; no plaintext copy.
  await env.REPORTS.put(objectKey,JSON.stringify(envelope),{
    httpMetadata:{contentType:"application/json"},customMetadata:{...object.customMetadata,notified:"yes"}
  });
}
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== "/api/meldingen") return response(404,{error:"not_found"});
    const origin = request.headers.get("Origin");
    if (!origin || origin !== env.ALLOWED_ORIGIN) return response(403,{error:"origin"});
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Methods":"POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type","Access-Control-Max-Age":"600","Vary":"Origin","Cache-Control":"no-store"}});
    if (request.method !== "POST") return response(405,{error:"method"},origin);
    if (url.search || !/^multipart\/form-data;\s*boundary=/i.test(request.headers.get("Content-Type") || "")) return response(400,{error:"invalid_request"},origin);
    try {
      const configured = settings(env);
      const key = await encryptionKey(env);
      await rateLimit(request,env);
      const body = await readLimited(request);
      let form, raw;
      try {
        form = await new Response(body,{headers:{"Content-Type":request.headers.get("Content-Type")}}).formData();
        if ([...form.keys()].some(k=>!["report","attachments","turnstileToken"].includes(k)) || form.getAll("report").length !== 1) bad();
        raw = form.get("report");if (typeof raw !== "string" || raw.length > 12000) bad();
        raw = JSON.parse(raw);
      } catch {bad();}
      const report = validateReport(raw);
      await checkSpam(request,env,form,configured.hostname);
      const files = await attachments(form);
      const inRange = inPurchasedRange(report.tag,configured.ranges);
      const id = "VVE-" + crypto.randomUUID().replaceAll("-","").toUpperCase();
      const receivedAt = new Date().toISOString();
      const expiresAt = new Date(Date.now()+(inRange?180:30)*86400000).toISOString();
      const {tag,anonymous,...incident} = report;
      // A purchased batch match is not an apartment verification.
      const identity = {tag,verification:inRange?"in_range_pending_manual_check":"anonymous_signal"};
      const envelope = {
        version:1,id,keyId:env.KEY_ID,receivedAt,expiresAt,
        identity:await seal(identity,key,`vve:1:${id}:identity`),
        report:await seal({...incident,contactAllowed:inRange && incident.contactAllowed,receivedAt,attachments:files},key,`vve:1:${id}:report`)
      };
      const objectKey = `reports/${id}.json`;
      await env.REPORTS.put(objectKey,JSON.stringify(envelope),{httpMetadata:{contentType:"application/json"},customMetadata:{expiresAt,notified:"no"}});
      ctx.waitUntil(notify(env,objectKey,configured.to).catch(()=>{console.error("notification_pending");}));
      // Identical response for in-range, out-of-range and absent tags. No enumeration.
      return response(201,{reportId:id},origin);
    } catch (e) {
      if (e instanceof ClientError) return response(e.status,{error:e.message},origin);
      console.error("report_service_unavailable");
      return response(503,{error:"unavailable"},origin);
    }
  },
  async scheduled(controller, env, ctx) {
    // Retention and retries keep running even while intake is disabled.
    let cursor;
    do {
      const page = await env.REPORTS.list({prefix:"reports/",limit:100,include:["customMetadata"],...(cursor?{cursor}:{})});
      for (const object of page.objects) {
        const expiration = Date.parse(object.customMetadata?.expiresAt);
        if (!Number.isFinite(expiration)) {console.error("retention_metadata_missing");continue;}
        if (expiration <= Date.now()) {await env.REPORTS.delete(object.key);continue;}
        if (object.customMetadata?.notified !== "yes") {
          try {await notify(env,object.key,JSON.parse(env.NOTIFY_TO));} catch {console.error("notification_pending");}
        }
      }
      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);
  }
};
