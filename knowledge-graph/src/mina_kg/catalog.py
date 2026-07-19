from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


@dataclass(frozen=True)
class BookSpec:
    filename: str
    book_id: str
    grade: int
    volume: int
    title: str


ALLOWED_BOOKS = (
    BookSpec("SGK Toan 6 Tap 1 KNTT.pdf", "KNTT_TOAN_6_T1", 6, 1, "Toán 6 - Tập 1"),
    BookSpec("SGK Toan 6 Tap 2 KNTT.pdf", "KNTT_TOAN_6_T2", 6, 2, "Toán 6 - Tập 2"),
    BookSpec("SGK Toan 7 Tap 1 KNTT.pdf", "KNTT_TOAN_7_T1", 7, 1, "Toán 7 - Tập 1"),
    BookSpec("SGK Toan 7 Tap 2 KNTT.pdf", "KNTT_TOAN_7_T2", 7, 2, "Toán 7 - Tập 2"),
)

BOOK_BY_FILENAME = {book.filename: book for book in ALLOWED_BOOKS}
BOOK_BY_ID = {book.book_id: book for book in ALLOWED_BOOKS}


def validate_raw_directory(raw_dir: Path) -> list[tuple[BookSpec, Path]]:
    actual = sorted(path.name for path in raw_dir.glob("*.pdf"))
    expected = sorted(BOOK_BY_FILENAME)
    unexpected = sorted(set(actual) - set(expected))
    missing = sorted(set(expected) - set(actual))
    if unexpected or missing:
        details = []
        if unexpected:
            details.append(f"unexpected PDFs: {unexpected}")
        if missing:
            details.append(f"missing PDFs: {missing}")
        raise ValueError("Raw PDF scope violation: " + "; ".join(details))
    return [(BOOK_BY_FILENAME[name], raw_dir / name) for name in expected]


def stable_code(value: str) -> str:
    cleaned = re.sub(r"[^A-Z0-9]+", "_", value.upper()).strip("_")
    return cleaned

