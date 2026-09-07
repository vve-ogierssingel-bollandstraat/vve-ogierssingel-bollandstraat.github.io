"""Static validation: assets, links, form labels, script syntax and unchanged rules."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import re
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.links=[]; self.ids=[]; self.labels=[]; self.controls=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if "id" in a: self.ids.append(a["id"])
        if tag=="label" and "for" in a: self.labels.append(a["for"])
        if tag in ("input","select","textarea") and "id" in a: self.controls.append(a["id"])
        for attr in ("href","src"):
            if attr in a: self.links.append(a[attr])

for file in ROOT.rglob("*.html"):
    source=file.read_text(); page=Page(); page.feed(source)
    assert len(page.ids)==len(set(page.ids)), f"Duplicate id: {file}"
    for link in page.links:
        u=urlsplit(link)
        if u.scheme or u.netloc: continue
        if u.path: assert (file.parent/unquote(u.path)).resolve().is_file(), f"Missing link: {file}: {link}"
        elif u.fragment: assert u.fragment in page.ids, f"Missing anchor: {link}"
    for script in re.findall(r"<script(?:\s[^>]*)?>(.*?)</script>",source,re.S):
        if script.strip():
            with tempfile.NamedTemporaryFile(suffix=".js",mode="w") as f:
                f.write(script);f.flush();subprocess.run(["node","--check",f.name],check=True,capture_output=True)
    if file.name=="melden.html":
        assert set(page.controls) <= set(page.labels) | {"anonymous","contact","truthful"}, "Missing form label"
        assert 'form-action \'none\'' in source and 'id="submit" type="submit" disabled' in source
for file in list((ROOT/"assets").glob("*.js"))+list((ROOT/"backend").glob("*.mjs")):
    subprocess.run(["node","--check",str(file)],check=True,capture_output=True)

# The house rules must survive layout work. Compare the whole visible text of
# index.html against the base commit, ignoring markup, styling and scripts, with
# the referral card excised on both sides because that is the part we do change.
# Matching on the visible text means index.html may be restyled and restructured,
# but not one word of what residents read may shift without this failing.
class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.out=[]; self.skip=0
    def handle_starttag(self,tag,attrs):
        if tag in ("script","style"): self.skip+=1
    def handle_endtag(self,tag):
        if tag in ("script","style"): self.skip=max(0,self.skip-1)
    def handle_data(self,data):
        if not self.skip and data.strip(): self.out.append(" ".join(data.split()))

DOCS_CARD=re.compile(r'<div class="card docs">.*?</div>',re.S)

def visible_text(source):
    parser=Text(); parser.feed(DOCS_CARD.sub("",source)); return " ".join(parser.out)

base=subprocess.check_output(["git","show","3e5b6d5b1701b76d76af0343d70236fb05031504:index.html"],cwd=ROOT,text=True)
before=visible_text(base)
after=visible_text((ROOT/"index.html").read_text())
assert len(before)>10000, "Base text extraction looks wrong"
if before!=after:
    for i,(a,b) in enumerate(zip(before,after)):
        if a!=b:
            raise AssertionError(f"Resident text changed near offset {i}:\n  was: ...{before[max(0,i-60):i+60]}...\n  now: ...{after[max(0,i-60):i+60]}...")
    raise AssertionError(f"Resident text length changed: {len(before)} -> {len(after)}")
print(f"PASS: local links, labels, JavaScript syntax and {len(after)} characters of unchanged resident text")
