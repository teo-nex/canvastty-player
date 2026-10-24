#!/usr/bin/env python3
"""Verify the packaged snapshot, references, provenance and host limits offline."""
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
from urllib.parse import urlsplit, unquote
import zipfile
from build import ROOT, PACKAGE, VERSION, package_files

class Page(HTMLParser):
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "script":
            assert values.get("src"), "Inline executable script violates the plugin CSP"
        for key in ("src", "href"):
            value = values.get(key)
            if not value:
                continue
            url = urlsplit(value)
            if url.scheme == "canvastty-plugin":
                assert value == "canvastty-plugin://host/sdk.js", value
            elif url.scheme:
                assert url.scheme == "https" and url.hostname == "music.deploychan.webcam", value
            elif url.path:
                resolved = (PACKAGE / unquote(url.path).lstrip("/")).resolve()
                assert resolved.is_relative_to(PACKAGE.resolve()) and resolved.is_file(), value


def main():
    files = package_files()
    manifest = json.loads((PACKAGE / "canvastty.plugin.json").read_text())
    assert manifest["id"] == "webcam.deploychan.music"
    assert manifest["version"] == VERSION
    player = next(c for c in manifest["contributions"] if c["id"] == "player")
    assert player["kind"] == "canvas-app", "The full player must live on the shared canvas"
    assert not any(c["kind"] == "window" for c in manifest["contributions"])
    launcher = (PACKAGE / "launcher.js").read_text()
    assert 'request("canvas.open", { contributionId: "player" })' in launcher
    assert "window.open" not in launcher
    assert set(manifest["permissions"]) == {"storage", "network"}
    assert not manifest.get("hooks") and not manifest.get("services")
    assert 0 < len(files) <= 500
    assert sum(p.stat().st_size for p in files) <= 25 * 1024 * 1024
    assert all(p.stat().st_size <= 8 * 1024 * 1024 for p in files)
    assert not any(p.suffix.lower() in {".m4a", ".mp3", ".wav", ".ogg", ".aac"} for p in files)
    for contribution in manifest["contributions"]:
        path = PACKAGE / contribution["entry"]
        Page().feed(path.read_text())
    provenance = json.loads((PACKAGE / "PROVENANCE.json").read_text())
    for asset in provenance["assets"]:
        path = PACKAGE / urlsplit(asset["url"]).path.lstrip("/")
        assert sha256(path.read_bytes()).hexdigest() == asset["packagedSha256"], path
    for path in PACKAGE.rglob("*.js"):
        assert "createMediaElementSource" not in path.read_text(), path
    archive = ROOT / f"deploychan-music-{VERSION}.zip"
    if archive.exists():
        with zipfile.ZipFile(archive) as bundle:
            assert not bundle.testzip()
            assert set(bundle.namelist()) == {str(p.relative_to(PACKAGE)) for p in files}
            for path in files:
                assert bundle.read(str(path.relative_to(PACKAGE))) == path.read_bytes(), path
    print(json.dumps({"status": "PASS", "files": len(files), "bytes": sum(p.stat().st_size for p in files), "archiveSha256": sha256(archive.read_bytes()).hexdigest() if archive.exists() else None}, ensure_ascii=False))


if __name__ == "__main__":
    main()
