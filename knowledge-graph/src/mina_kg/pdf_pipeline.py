from __future__ import annotations

from dataclasses import asdict
from hashlib import sha256
import json
from pathlib import Path
import shutil
import subprocess
from typing import Any

from .catalog import BookSpec, validate_raw_directory


REVIEW_PAGE_RANGES: dict[str, tuple[int, int]] = {
    "KNTT_TOAN_6_T2": (4, 28),
    "KNTT_TOAN_7_T1": (5, 26),
}


def file_sha256(path: Path) -> str:
    digest = sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _run(command: list[str]) -> str:
    completed = subprocess.run(command, check=True, text=True, capture_output=True)
    return completed.stdout


def _pdfinfo(path: Path) -> dict[str, str]:
    if not shutil.which("pdfinfo"):
        raise RuntimeError("pdfinfo is required but was not found in PATH")
    result: dict[str, str] = {}
    for line in _run(["pdfinfo", str(path)]).splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            result[key.strip()] = value.strip()
    return result


def _text_layer_probe(path: Path) -> dict[str, Any]:
    try:
        from pypdf import PdfReader
    except ImportError:
        return {"available": False, "reason": "pypdf_not_installed", "sample_characters": 0}
    reader = PdfReader(path)
    sample_indexes = sorted(set([0, min(3, len(reader.pages) - 1), len(reader.pages) // 2]))
    sample_characters = sum(len((reader.pages[index].extract_text() or "").strip()) for index in sample_indexes)
    return {
        "available": sample_characters >= 100,
        "reason": "ok" if sample_characters >= 100 else "scan_or_missing_text_layer",
        "sample_pages": [index + 1 for index in sample_indexes],
        "sample_characters": sample_characters,
    }


def inspect_sources(root: Path) -> dict[str, Any]:
    sources = []
    for book, path in validate_raw_directory(root / "raw"):
        info = _pdfinfo(path)
        sources.append(
            {
                **asdict(book),
                "path": str(path.relative_to(root)),
                "sha256": file_sha256(path),
                "bytes": path.stat().st_size,
                "pages": int(info["Pages"]),
                "page_size": info.get("Page size"),
                "encrypted": info.get("Encrypted") == "yes",
                "text_layer": _text_layer_probe(path),
                "scope": {"curriculum": "GDPT_2018", "publisher_series": "KNTT", "subject": "math"},
            }
        )
    manifest = {
        "schema_version": "1.0.0",
        "dataset_scope": {"series": "KNTT", "subject": "math", "grades": [6, 7, 8, 9]},
        "sources": sources,
    }
    output = root / "output"
    output.mkdir(parents=True, exist_ok=True)
    (output / "source_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return manifest


def render_review_pages(root: Path, dpi: int = 120) -> list[Path]:
    if not shutil.which("pdftoppm"):
        raise RuntimeError("pdftoppm is required but was not found in PATH")
    rendered: list[Path] = []
    target = root / "output" / "review-pages"
    target.mkdir(parents=True, exist_ok=True)
    for book, pdf_path in validate_raw_directory(root / "raw"):
        if book.book_id not in REVIEW_PAGE_RANGES:
            continue
        first, last = REVIEW_PAGE_RANGES[book.book_id]
        prefix = target / book.book_id.lower()
        for previous in target.glob(f"{prefix.name}-*.png"):
            previous.unlink()
        subprocess.run(
            ["pdftoppm", "-f", str(first), "-l", str(last), "-png", "-r", str(dpi), str(pdf_path), str(prefix)],
            check=True,
            capture_output=True,
        )
        rendered.extend(sorted(target.glob(f"{prefix.name}-*.png")))
    return rendered
