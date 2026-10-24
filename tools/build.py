#!/usr/bin/env python3
"""Package the public music player for CanvasTTY without weakening its CSP."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.request import Request, urlopen
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = ROOT if (ROOT / "canvastty.plugin.json").is_file() else ROOT / "package"
ORIGIN = "https://music.deploychan.webcam"
PLUGIN_ID = "webcam.deploychan.music"
VERSION = "1.1.0"


def package_files():
    roots = {"_next", "bootstrap", "fonts", "licenses"}
    entries = {"index.html", "host.js", "launcher.html", "launcher.js", "launcher.css", "icon.svg", "canvastty.plugin.json", "PROVENANCE.json", "THIRD_PARTY_NOTICES.md"}
    return [p for p in PACKAGE.rglob("*") if p.is_file() and (p.relative_to(PACKAGE).parts[0] in roots or str(p.relative_to(PACKAGE)) in entries)]


def download(path):
    if not path.startswith("/") or ".." in path.split("/"):
        raise ValueError(f"Unexpected asset path: {path}")
    with urlopen(Request(ORIGIN + path, headers={"User-Agent": "CanvasTTY-Music-Builder/1.0"}), timeout=30) as response:
        if response.url.split("/")[2] != "music.deploychan.webcam":
            raise ValueError("Asset redirected to a different host")
        data = response.read(8 * 1024 * 1024 + 1)
        if len(data) > 8 * 1024 * 1024:
            raise ValueError(f"Asset exceeds the host limit: {path}")
        return data


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        path = values.get("src") if tag == "script" else values.get("href") if tag == "link" else None
        if path and path.startswith("/_next/"):
            self.paths.add(path)


def main():
    PACKAGE.mkdir(parents=True, exist_ok=True)
    upstream_html = download("/")
    html = upstream_html.decode()
    assets = Assets()
    assets.feed(html)
    fetched = {}
    with ThreadPoolExecutor(max_workers=6) as pool:
        fetched.update(zip(sorted(assets.paths), pool.map(download, sorted(assets.paths))))
    # Production Turbopack can request additional chunks after initial hydration.
    extra = set()
    for path, data in list(fetched.items()):
        if path.endswith(".js"):
            text = data.decode()
            extra.update("/_next/" + p for p in re.findall(r'["\'](static/chunks/[\w.-]+\.js)["\']', text))
        elif path.endswith(".css"):
            extra.update(re.findall(r'url\(["\']?(/fonts/[^)"\']+)', data.decode()))
    for path in sorted(extra - fetched.keys()):
        fetched[path] = download(path)

    patches = 0
    upstream = []
    for path, original in sorted(fetched.items()):
        data = original
        if path.endswith((".js", ".css")):
            text = data.decode()
            for prefix in ("/audio/", "/covers/", "/icons/"):
                text = text.replace(prefix, ORIGIN + prefix)
            if "createMediaElementSource" in text:
                # This origin has no Access-Control-Allow-Origin. Connecting a remote
                # HTMLAudioElement to Web Audio would produce silence. Keep the direct
                # audio output and the upstream visual animations instead.
                text, count = re.subn(
                    r"let tr=\(\)=>\{if\(K\.current\).*?catch\{\}\},ta=",
                    "let tr=()=>{},ta=", text,
                )
                if count != 1 or "createMediaElementSource" in text:
                    raise ValueError("Upstream audio implementation changed; review the adaptation")
                patches += count
            data = text.encode()
        target = PACKAGE / path.lstrip("/")
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        upstream.append({"url": ORIGIN + path, "sha256": sha256(original).hexdigest(), "packagedSha256": sha256(data).hexdigest()})
    if patches != 1:
        raise ValueError("Expected exactly one upstream Web Audio adaptation")

    # Inline Next bootstrap scripts are incompatible with the plugin's strict CSP.
    # Preserve their order and content in local external scripts.
    bootstrap = []
    def externalize(match):
        name = f"bootstrap/{len(bootstrap):02d}.js"
        bootstrap.append((name, match.group(1)))
        return f'<script src="/{name}"></script>'
    html = re.sub(r"<script>(.*?)</script>", externalize, html, flags=re.S)
    for prefix in ("/audio/", "/covers/", "/icons/"):
        html = html.replace(prefix, ORIGIN + prefix)
    for name, text in bootstrap:
        target = PACKAGE / name
        target.parent.mkdir(parents=True, exist_ok=True)
        # Flight data also contains asset URLs from the server-rendered document.
        for prefix in ("/audio/", "/covers/", "/icons/"):
            text = text.replace(prefix, ORIGIN + prefix)
        target.write_text(text)
    html = html.replace("</head>", '<script src="canvastty-plugin://host/sdk.js"></script><script defer src="/host.js"></script></head>')
    (PACKAGE / "index.html").write_text(html)

    manifest = {
        "apiVersion": 1, "id": PLUGIN_ID, "name": "Canvas Player", "version": VERSION,
        "description": "Музыкальный плеер на канвасе CanvasTTY рядом с терминалами. Музыка загружается с music.deploychan.webcam.",
        "platforms": ["canvastty"], "minHostVersion": "1.8.1", "icon": "icon.svg",
        "permissions": ["network", "storage"],
        "contributions": [
            {"id": "player", "kind": "canvas-app", "title": "Canvas Player", "entry": "index.html", "defaultSize": {"width": 1100, "height": 760}, "minSize": {"width": 380, "height": 560}},
            {"id": "launcher", "kind": "home-widget", "title": "Canvas Player", "entry": "launcher.html", "defaultSize": {"columns": 4, "rows": 2}},
        ],
    }
    (PACKAGE / "canvastty.plugin.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    provenance = {
        "source": ORIGIN, "capturedAt": datetime.now(timezone.utc).isoformat(),
        "upstreamHtmlSha256": sha256(upstream_html).hexdigest(),
        "adaptations": ["External bootstrap scripts for host CSP", "HTTPS media and image URLs", "Direct audio output because upstream audio does not allow CORS", "Host volume persistence and HOME launcher"],
        "assets": upstream,
        "redistribution": "Upstream music is streamed and is not included. Upstream assets retain their original ownership and are not relicensed by this integration. See THIRD_PARTY_NOTICES.md.",
    }
    (PACKAGE / "PROVENANCE.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n")
    files = package_files()
    if len(files) > 500 or sum(p.stat().st_size for p in files) > 25 * 1024 * 1024:
        raise ValueError("Package exceeds CanvasTTY's installation limits")
    archive = ROOT / f"deploychan-music-{VERSION}.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as out:
        for path in sorted(files):
            out.write(path, path.relative_to(PACKAGE))
    print(json.dumps({"archive": str(archive), "files": len(files), "bytes": sum(p.stat().st_size for p in files), "sha256": sha256(archive.read_bytes()).hexdigest()}, ensure_ascii=False))


if __name__ == "__main__":
    main()
