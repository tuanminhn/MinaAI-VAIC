from __future__ import annotations

import argparse

from app.db.session import session_scope
from app.repositories.content_repository import ContentRepository
from app.services.content_service import ContentService
from app.services.skill_graph_service import SkillGraphService


def validate_content(package_code: str) -> None:
    with session_scope() as session:
        ContentService(
            repository=ContentRepository(session),
            skill_graph=SkillGraphService(),
        ).validate_package_content(package_code)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--package-code", default="MATH6_FRACTIONS_FOUNDATION_V1")
    args = parser.parse_args()
    validate_content(args.package_code)
    print(f"Content validation passed for package {args.package_code}.")


if __name__ == "__main__":
    main()
