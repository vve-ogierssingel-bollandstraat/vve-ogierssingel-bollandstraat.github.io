#!/usr/bin/env python3
"""Stamp a content hash onto every local asset reference.

GitHub Pages serves assets/*.js and assets/*.css with a cache lifetime of its
own choosing, and the filenames never change. A visitor who has been here
before therefore keeps the old JavaScript while receiving the new HTML, which
is how a renamed element id turns into a broken form for returning residents
only. Appending ?v=<hash of the file> makes each change a different URL.

Run after changing anything under assets/. check-site.py fails if the stamps
are stale, so it cannot be forgotten silently.
"""
import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = re.compile(r'((?:href|src)=")((?:\.\./)?assets/[A-Za-z0-9._-]+\.(?:js|css))(?:\?v=[0-9a-f]+)?(")')


def digest(path):
    return hashlib.sha1(path.read_bytes()).hexdigest()[:8]


def stamp(html, write=True):
    source = html.read_text(encoding="utf-8")

    def replace(match):
        prefix, ref, suffix = match.groups()
        target = (html.parent / ref).resolve()
        if not target.is_file():
            raise SystemExit(f"[FAIL] {html.name} verwijst naar ontbrekend bestand: {ref}")
        return f"{prefix}{ref}?v={digest(target)}{suffix}"

    updated = REFERENCE.sub(replace, source)
    if updated != source and write:
        html.write_text(updated, encoding="utf-8")
    return updated != source


def check():
    stale = [h.relative_to(ROOT) for h in sorted(ROOT.rglob("*.html")) if stamp(h, write=False)]
    return stale


if __name__ == "__main__":
    if "--check" in sys.argv:
        stale = check()
        if stale:
            print("[FAIL] verouderde versiestempels in: " + ", ".join(map(str, stale)))
            print("       draai: python3 scripts/version-assets.py")
            raise SystemExit(1)
        print("[OK]   alle versiestempels komen overeen met de bestandsinhoud")
    else:
        changed = [h.relative_to(ROOT) for h in sorted(ROOT.rglob("*.html")) if stamp(h)]
        print("[OK]   bijgewerkt: " + (", ".join(map(str, changed)) if changed else "niets te doen"))
