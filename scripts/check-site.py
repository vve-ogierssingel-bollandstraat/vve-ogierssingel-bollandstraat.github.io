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

base=subprocess.check_output(["git","show","3e5b6d5b1701b76d76af0343d70236fb05031504:index.html"],cwd=ROOT,text=True)
current=(ROOT/"index.html").read_text()
current=re.sub(r'\n<div class="card docs"><a class="complaint-button"[^>]*>[^<]+</a></div>',"",current)
current=re.sub(r'\.complaint-button\{[^}]+\}\n',"",current)
assert current==base, "Existing resident content changed beyond complaint buttons"
print("PASS: local links, labels, JavaScript syntax and unchanged resident text")
