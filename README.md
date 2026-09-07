# VvE Ogierssingel / Bollandstraat

Statische, meertalige GitHub Pages-site. Voorstel van 7 september 2026.

## In deze wijziging

- Bewonerspagina: bestaande teksten behouden, uitsluitend een klachtenknop in de
  veertien bestaande talen toegevoegd. Het formulier zelf is NL/EN/Chinees;
  de overige talen verwijzen naar de Engelse formulierinterface. Vrije invoer mag
  in elke taal.
- Eigenarenpagina: vier hoofdlijnen voor 2027 — onderhoud/financiën, bestuurlijke
  continuïteit, verantwoordelijkheid van eigenaren/verhuurders en toegangsbeheer
  met vertrouwelijke meldingen. Voorstellen zijn als voorstellen aangeduid.
- De oude eigenarenpagina staat als duidelijk gemarkeerd archief onder `archief/`.
- Klachtenformulier en aparte ontvangst-Worker voorbereid. **Nog niet actief.**
- Tagcontrole gebruikt uitsluitend geheime begin-/eindgrenzen per ingekochte
  partij. Geen echte grenzen of tag-/bewonerslijst opgenomen in deze repository.

De eigenareninhoud volgt de bespreking van 5 september en de voorrang hebbende
uitkomst van het werkoverleg van 7 september 2026: nieuw SDZ-MJOP; bijdrage volgt
uit MJOP/begroting; verduurzaming per afzonderlijk haalbare maatregel. €290 is een
rekenbedrag, geen nieuw vastgesteld tarief. Jaarbudget €4.000 en maximum €1.600
per persoon zijn voorstellen voor actieve VvE-taken. Kleine dossiers, individuele
klachten en losse ideeën zijn geen onderdeel van de publieke 2027-pagina.

Het interne bespreekdocument bevat privégegevens en is daarom niet meegekopieerd
of publiek gelinkt. Er zijn geen andere bestanden uit het VvE-dossier gepubliceerd.

## Ontvangst aansluiten

Zie [backend/README.md](backend/README.md). De website blijft op GitHub Pages.
De Worker, private opslag, spamcontrole, geheime partijgrenzen en notificaties
worden apart geconfigureerd. Een beheerportaal is geen onderdeel van deze eerste
versie; offline behandeling door bevoegde beheerders is beschreven.

De voorstelbranch wordt niet gemergd of gepubliceerd door deze wijziging.
GitHub Pages publiceert de bestaande hoofdtak volgens de ingestelde configuratie.

## Controle

```sh
node --test tests/worker.test.mjs
python3 scripts/check-site.py
```

Geen bouwstap of frontend-dependencies nodig. De controles bewaken onder meer dat
de bestaande bewonersinhoud gelijk blijft, behalve de toegevoegde klachtenknoppen.
De testmeldingen en partijgrenzen zijn uitsluitend fictief. Productie-inrichting
en een echte ontvangstproef moeten bij aansluiting nog worden uitgevoerd.
