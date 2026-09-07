// Ruimt ontsleutelde werkkopieën op die decrypt.mjs heeft weggeschreven.
//
// De Worker wist zijn eigen opslag automatisch (180 dagen voor herleidbare
// meldingen, 30 dagen voor signalen). Wat decrypt.mjs op een beheerdersapparaat
// zet valt daarbuiten: dat is platte tekst en blijft staan tot iemand het weghaalt.
// De privacytekst belooft twee jaar na afronding; dit script maakt dat uitvoerbaar.
//
//   node opruimen.mjs <map>                     toon wat er staat en hoe oud (wist niets)
//   node opruimen.mjs <map> --verwijder         wis wat ouder is dan de termijn
//   node opruimen.mjs <map> --verwijder --alles wis alles in de map, ongeacht leeftijd
//   node opruimen.mjs <map> --dagen 365         andere termijn dan de standaard 730
//
// Zonder --verwijder gebeurt er niets: standaard is dit een overzicht.

import {readdir, stat, unlink, writeFile} from "node:fs/promises";
import {join, resolve} from "node:path";

const args = process.argv.slice(2);
const dir = args.find(a => !a.startsWith("--"));
const remove = args.includes("--verwijder");
const all = args.includes("--alles");
const daysArg = args.indexOf("--dagen");
const days = daysArg === -1 ? 730 : Number(args[daysArg + 1]);

if (!dir || !Number.isFinite(days) || days < 0) {
  console.error("Gebruik: node opruimen.mjs <map> [--verwijder] [--alles] [--dagen N]");
  process.exit(2);
}
for (const flag of args.filter(a => a.startsWith("--"))) {
  if (!["--verwijder","--alles","--dagen"].includes(flag)) {
    console.error(`Onbekende optie: ${flag}`);
    process.exit(2);
  }
}
if (all && !remove) {
  console.error("--alles werkt alleen samen met --verwijder.");
  process.exit(2);
}

const target = resolve(dir);
const cutoff = Date.now() - days * 86400000;
// Alleen bestanden die decrypt.mjs zelf aanmaakt; niets anders wordt aangeraakt.
const OWNED = /^VVE-[0-9A-F]{32}-(identity|report)\.json$|^VVE-[0-9A-F]{32}-bijlage-\d+\.(jpg|png|pdf)$/;

let entries;
try {
  entries = await readdir(target, {withFileTypes: true});
} catch {
  console.error(`[FAIL] Map niet gevonden of niet leesbaar: ${target}`);
  process.exit(1);
}

const files = [];
let skipped = 0;
for (const entry of entries) {
  if (!entry.isFile()) { skipped++; continue; }
  if (!OWNED.test(entry.name)) { skipped++; continue; }
  const info = await stat(join(target, entry.name));
  files.push({name: entry.name, path: join(target, entry.name), mtime: info.mtimeMs, size: info.size});
}
files.sort((a, b) => a.mtime - b.mtime);

if (!files.length) {
  console.log(`[OK]   Geen werkkopieën in ${target}.`);
  if (skipped) console.log(`       ${skipped} andere bestand(en) genegeerd.`);
  process.exit(0);
}

const age = f => Math.floor((Date.now() - f.mtime) / 86400000);
const doomed = files.filter(f => all || f.mtime < cutoff);

console.log(`Map:      ${target}`);
console.log(`Termijn:  ${all ? "alles, ongeacht leeftijd" : `${days} dagen`}`);
console.log(`Bestanden: ${files.length}${skipped ? ` (${skipped} genegeerd, niet van decrypt.mjs)` : ""}\n`);
for (const f of files) {
  const mark = doomed.includes(f) ? (remove ? "WIS " : "OUD ") : "    ";
  console.log(`  ${mark} ${String(age(f)).padStart(5)} dagen  ${(f.size / 1024).toFixed(0).padStart(5)} kB  ${f.name}`);
}

if (!doomed.length) {
  console.log(`\n[OK]   Niets is ouder dan ${days} dagen.`);
  process.exit(0);
}
if (!remove) {
  console.log(`\n[WARN] ${doomed.length} bestand(en) staan langer dan ${days} dagen op schijf.`);
  console.log("       Draai opnieuw met --verwijder om ze te wissen.");
  process.exit(0);
}

let failed = 0;
for (const f of doomed) {
  try {
    // Eén overschrijfronde vóór het verwijderen. Op SSD's en copy-on-write-
    // bestandssystemen is dat geen garantie: schijfversleuteling blijft nodig.
    await writeFile(f.path, Buffer.alloc(f.size, 0));
    await unlink(f.path);
    console.log(`[OK]   gewist  ${f.name}`);
  } catch (error) {
    failed++;
    console.error(`[FAIL] ${f.name}: ${error.message}`);
  }
}
console.log(`\n[${failed ? "WARN" : "OK"}]   ${doomed.length - failed} van ${doomed.length} gewist.`);
if (failed) process.exit(1);
