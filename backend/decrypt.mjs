// Offline use on an authorised administrator's device, outside the public checkout.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {resolve,join} from "node:path";
const [input,output,option] = process.argv.slice(2);
if (!input || !output || (option && option !== "--identity")) throw new Error("Gebruik: node decrypt.mjs /prive/melding.json /prive/uitvoer [--identity]");
const envelope = JSON.parse(await readFile(input,"utf8"));
if (envelope.version !== 1 || !/^VVE-[0-9A-F]{32}$/.test(envelope.id)) throw new Error("Onbekend formaat");
const bytes = Buffer.from(process.env.VVE_DECRYPTION_KEY || "","base64");
if (bytes.length !== 32) throw new Error("Stel VVE_DECRYPTION_KEY in met de sleutel voor keyId " + envelope.keyId);
const key = await crypto.subtle.importKey("raw",bytes,{name:"AES-GCM"},false,["decrypt"]);
const part = option === "--identity" ? "identity" : "report";
const source = envelope[part];
const plaintext = await crypto.subtle.decrypt({name:"AES-GCM",iv:Buffer.from(source.iv,"base64"),additionalData:new TextEncoder().encode(`vve:1:${envelope.id}:${part}`)},key,Buffer.from(source.ciphertext,"base64"));
const data = JSON.parse(new TextDecoder().decode(plaintext));
const target = resolve(output);
await mkdir(target,{recursive:true,mode:0o700});
const file = join(target,envelope.id+"-"+part+".json");
if (part === "report") {
  for (const [index,attachment] of (data.attachments || []).entries()) {
    const ext = {"image/jpeg":"jpg","image/png":"png","application/pdf":"pdf"}[attachment.type];
    if (!ext) throw new Error("Onbekend bijlagetype");
    const name = `${envelope.id}-bijlage-${index+1}.${ext}`;
    await writeFile(join(target,name),Buffer.from(attachment.data,"base64"),{mode:0o600,flag:"wx"});
    attachment.name = name;delete attachment.data;
  }
}
await writeFile(file,JSON.stringify({id:envelope.id,...data},null,2)+"\n",{mode:0o600,flag:"wx"});
console.log("Afgeschermde uitvoer geschreven:",file);
