from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys

from .data_builder import write_dataset
from .pdf_pipeline import inspect_sources, render_review_pages
from .validation import ValidationError, write_validation_report


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description="Mina AI knowledge-graph pipeline")
    result.add_argument("command", choices=("inspect", "render", "build", "validate", "all"))
    result.add_argument("--root", type=Path, default=Path.cwd(), help="knowledge-graph directory")
    result.add_argument("--dpi", type=int, default=120, help="review page render DPI")
    return result


def main(argv: list[str] | None = None) -> int:
    args = parser().parse_args(argv)
    root = args.root.resolve()
    try:
        if args.command in ("inspect", "all"):
            manifest = inspect_sources(root)
            print(f"inspected {len(manifest['sources'])} PDF sources")
        if args.command in ("render", "all"):
            pages = render_review_pages(root, dpi=args.dpi)
            print(f"rendered {len(pages)} review pages")
        if args.command in ("build", "all"):
            dataset = write_dataset(root)
            print(f"built dataset {dataset['dataset']['id']}")
        else:
            dataset = None
        if args.command in ("validate", "all"):
            report = write_validation_report(root, dataset)
            print(json.dumps(report["counts"], ensure_ascii=False))
            print("validation: PASS")
    except (RuntimeError, ValueError, ValidationError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
