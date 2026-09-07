# Vertrouwelijk meldloket — voorbereid, nog niet aangesloten

De publieke voorkant blijft op GitHub Pages. `worker.mjs` wordt apart in het
Cloudflare-account van de VvE ingericht. Beide ontvangstschakelaars staan uit.
Er zijn geen echte tagreeksen, sleutels, bewonersgegevens of meldingen toegevoegd.

## Tagcontrole op ingekochte partijen

Sla uitsluitend de **begin- en eindgrens per ingekochte partij** op als Worker-secret
`TAG_RANGES_JSON`. Geen lijst met afzonderlijke tags; geen woningkoppeling in het
portaal. Ook de grenzen zelf horen niet in GitHub, HTML, JavaScript, documentatie,
logs of een openbare API. De bestaande Intratone-/VvE-administratie blijft leidend.

Het secret is een JSON-array van objecten met `start`, `end`, `radix` en `width`:

| Veld | Betekenis |
| --- | --- |
| `start`, `end` | Inclusieve grenzen als tekst, met voorloopnullen |
| `radix` | 10 voor decimale of 16 voor hexadecimale nummers |
| `width` | Exact aantal tekens, exclusief spaties/streepjes, 4–32 |

Leg het nummerformaat vast volgens de werkelijke leverancier/administratie.
Hexadecimale grenzen gebruiken hoofdletters zonder `0x`. Vergelijking met `BigInt`
voorkomt afronding van lange nummers. Geef bij extra inkoop het volledige bijgewerkte
secret met alle te behouden partijen op. Leid geen nieuwe reeks af uit minimum en
maximum van verspreide nummers: alleen werkelijk ingekochte aaneengesloten partijen.

Een nummer binnen een partij krijgt intern `in_range_pending_manual_check`.
Dit controleert de ingekochte partij; een bevoegde behandelaar controleert daarna
de uitgifte aan een woning. Voorraad kan immers nog niet uitgegeven zijn. Oude
partijen kunnen behouden blijven zodat gedeactiveerde tags nog herleidbaar zijn.
Geen tag of een nummer buiten de partijen wordt intern `anonymous_signal`.
De publieke ontvangstbevestiging is in alle gevallen identiek en bevat alleen een
willekeurig meldingsnummer. Er bestaat geen endpoint om een reeks af te tasten.

## Wat de code doet

- POST met alle formuliervelden en maximaal drie JPG/PNG/PDF-bijlagen van 2 MiB.
- Controle op toegestane oorsprong, methode, afmetingen, velden en bestandssignatuur.
- Turnstile-controle op de server, inclusief hostname en actie `melding`.
- Rate limiting: vijf pogingen per minuut per IP op de Cloudflare-locatie; een
  geheime HMAC en dagwaarde verbergen het IP in de tijdelijke limiter-sleutel.
  Het IP komt niet in het dossier. De limiter is geen harde wereldwijde quotumgarantie.
- AES-256-GCM versleutelt de identiteit en het dossier apart, met unieke IV's en
  binding aan meldingsnummer en onderdeel. Bijlagen zitten in het versleutelde dossier.
- Eén private R2-write bewaart beide versleutelde onderdelen. Pas daarna volgt 201.
- Bericht via Resend aan vaste bevoegde ontvangers: alleen het meldingsnummer.
  Bij e-mailstoring blijft de melding bewaard; een uurlijkse taak probeert opnieuw.
- Uurlijkse opschoning na 180 dagen voor nummers binnen een partij, na 30 dagen
  voor niet-herleidbare signalen. Er is maximaal één uur uitvoeringsmarge.

Bijlagen krijgen neutrale bestandsnamen. Bestandssignatuurcontrole is geen
malwarescan; de inhoud kan persoonsgegevens of beeldmetadata bevatten. Open
bijlagen via de gebruikelijke beveiligde werkomgeving, niet rechtstreeks als webpagina.
Een meldingsnummer is een referentie, geen wachtwoord of openbare leestoegang.

## Aansluiten door de beheerder

1. Maak in het VvE-account een private R2-bucket `vve-meldingen-prive` aan. Houd
   publieke toegang en een publieke custom domain uit. Geef alleen bevoegde
   behandelaars toegang met persoonlijke accounts en MFA. Kies bij inrichting de
   passende datalocatie/jurisdictie en verwerkersafspraken; claim geen EU-opslag
   zonder die configuratie. Stel ook een R2-lifecycle van 180 dagen in als vangnet.
2. Installeer een actuele Wrangler 4-versie in de beheeromgeving. Controleer met
   `wrangler deploy --dry-run` vanuit deze map de Worker-configuratie. Dit
   wijzigingsvoorstel heeft nog geen echte Cloudflare-bindings of deployment getest.
3. Richt Turnstile in voor `vve-ogierssingel-bollandstraat.github.io`. Gebruik de
   echte sitekey voor de voorkant en een afzonderlijk serversecret. Geen testsleutels
   of localhost-hostnames in productie.
4. Richt een geverifieerde Resend-afzender in. Stel uitsluitend bevoegde ontvangers
   in. E-mails bevatten geen tags, locaties, categorieën, omschrijvingen of bijlagen.
5. Leg onderstaande secrets vast met `wrangler secret put NAAM`. Gebruik de
   invoerprompt: zet waarden niet in de commandoregel, shellgeschiedenis of Git.

| Secret | Waarde |
| --- | --- |
| `TAG_RANGES_JSON` | Volledige lijst met uitsluitend partijgrenzen en nummerformaat |
| `ENCRYPTION_KEY` | Cryptografisch willekeurige sleutel van 32 bytes, base64 |
| `RATE_LIMIT_SECRET` | Afzonderlijk cryptografisch willekeurig geheim |
| `TURNSTILE_SECRET_KEY` | Serversecret van de productie-widget |
| `RESEND_API_KEY` | API-sleutel voor de notificatie-afzender |
| `NOTIFY_FROM` | Geverifieerd afzenderadres |
| `NOTIFY_TO` | JSON-array van vaste e-mailadressen van bevoegde behandelaars |

6. Bewaar de versleutelingssleutel en `KEY_ID` samen in de beheerde wachtwoordkluis.
   Bij rotatie: nieuwe `KEY_ID`, nieuwe sleutel en behoud van oude sleutels zolang
   er dossiers mee versleuteld zijn. Verwijder oude sleutels niet voortijdig.
7. Leg met het bestuur vast wie meldingen behandelt, wie de tagadministratie mag
   raadplegen, hoe een contactverzoek wordt opgevolgd en welke dossiertermijnen gelden.
   De 180/30 dagen zijn ontwerpdefaults, geen wettelijke bewaarplicht. Stem de
   privacytekst en het daadwerkelijke beheerproces vóór ingebruikname op elkaar af.
8. Test met herkenbaar fictieve gegevens: ontvangst, ontsleuteling, bijlage,
   notificatie en opschoning. Test ook ongeldige Turnstile en storing van de opslag.
   Zet daarna `ACCEPT_REPORTS = "true"` en deploy de Worker. Vul pas na controle
   van de dienst in `assets/melding-config.js` de HTTPS-URL met pad
   `/api/meldingen` en de publieke Turnstile-sitekey in, en zet `enabled: true`.
   Beperk dan `connect-src` in de CSP van `melden.html` tot de gekozen Worker-origin
   en Cloudflare. Pas ook de twee aankondigingsteksten over voorbereiding aan.

Voor GitHub Pages hoeft geen nieuwe hostingomgeving te worden gemaakt. Deze PR
publiceert of activeert niets. Activeer geen automatische productie-deployment op
de voorstelbranch. Kosten en eventuele accountvereisten zijn nog te controleren
in de gekozen VvE-accounts; dit voorstel belooft geen gratis gebruik.

## Behandeling zonder openbaar beheerportaal

Een beheerpagina is een latere uitbreiding. Voor deze eerste versie is toegang
via persoonlijke, bevoegde Cloudflare-accounts en offline ontsleuteling voorzien.
Controleer vóór activering dat dit voor de aangewezen behandelaars werkbaar is.

Download het versleutelde R2-object naar een private map buiten deze repository.
Lees de juiste sleutel vanuit de wachtwoordkluis in `VVE_DECRYPTION_KEY` (niet in
een commando plakken). Op een beheerdersapparaat met Node 22 of nieuwer:

```sh
node backend/decrypt.mjs /prive/melding.json /prive/dossier
node backend/decrypt.mjs /prive/melding.json /prive/identiteit --identity
```

De eerste opdracht schrijft dossier en bijlagen zonder tagnummer. De tweede
maakt afzonderlijk de tag beschikbaar aan iemand die de woningkoppeling mag
controleren. De tool weigert bestaande uitvoerbestanden te overschrijven. Voeg
geen uitvoer toe aan GitHub. Neem het tagnummer niet over in e-mails of notulen.
Het delen van een versleutelingssleutel geeft toegang tot beide onderdelen;
de offline procedure levert geen fijnmazige rollen per onderdeel. Daarvoor is
een apart afgeschermd beheerportaal nodig als vervolgstap.

Leg de interne uitgiftecontrole en behandeling vast onder het meldingsnummer.
Neem bij toestemming contact op via de bestaande administratie. Bij verhuur
kan alleen de eigenaar bekend zijn; presenteer diens contactgegevens niet als
gegevens van de feitelijke melder. Verplaats alleen noodzakelijke gegevens naar
een apart dossier als langere behandeling nodig is en bepaal daar een termijn.
Verwijder kopieën en bijlagen ook op beheerdersapparaten volgens die afspraak.

## Bewaren en opruimen

De Worker wist zijn eigen opslag: een uurlijkse cron verwijdert meldingen na
180 dagen en niet-herleidbare signalen na 30 dagen. Een R2-lifecycleregel van
180 dagen op de prefix `reports/` staat daarnaast als vangnet, voor het geval
de cron stilvalt.

Wat `decrypt.mjs` op een beheerdersapparaat zet valt daar buiten. Dat is platte
tekst en blijft staan tot iemand het weghaalt; geen enkele automatische regel
raakt die bestanden. De privacytekst op `melden.html` belooft dat het bestuur
langer lopende dossiers hoogstens twee jaar na afronding bewaart, deze jaarlijks
opschoont, en dat werkkopieën onder dezelfde termijn vallen. `opruimen.mjs`
maakt dat uitvoerbaar:

```sh
node opruimen.mjs /prive/behandeling                     # overzicht, wist niets
node opruimen.mjs /prive/behandeling --verwijder         # ouder dan 730 dagen
node opruimen.mjs /prive/behandeling --verwijder --alles # zaak afgerond
```

Zonder `--verwijder` toont het script alleen wat er staat en hoe oud het is.
Het raakt uitsluitend bestanden die `decrypt.mjs` zelf aanmaakt; eigen
aantekeningen in dezelfde map blijven ongemoeid. Vóór het verwijderen volgt één
overschrijfronde. Op SSD's en copy-on-write-bestandssystemen is dat geen
garantie op onherstelbaar wissen: houd de behandelmap op een versleutelde schijf.

Een bewaartermijn die wel in de privacytekst staat maar door niemand wordt
toegepast, is onder de AVG een tekortkoming en geen detail. Zet de jaarlijkse
opschoning daarom op de bestuursagenda.

## Controle van het voorstel

```sh
node --test tests/worker.test.mjs
python3 scripts/check-site.py
```

De tests gebruiken uitsluitend fictieve partijgrenzen en meldingen. Ze oefenen
de Worker met lokale adapters; echte R2, Turnstile, Resend en IAM moeten bij
aansluiting nog worden gecontroleerd. Een mislukte netwerkbevestiging kan volgen
op een geslaagde opslag; het formulier beweert dan niet dat niets is ontvangen.
Notificaties worden opnieuw geprobeerd. Een zeldzame dubbele notificatie na een
langdurige storing is mogelijk; het meldingsnummer blijft gelijk.

## Geraadpleegde technische documentatie

- [Turnstile servercontrole](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [Private R2-binding in Workers](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [Workers rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
- [Resend e-mail-API](https://resend.com/docs/api-reference/emails/send-email)
