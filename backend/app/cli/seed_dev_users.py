from __future__ import annotations

import argparse

from app.core.config import get_settings
from app.db.session import session_scope
from app.services.auth_service import AuthService, normalize_username


def seed_dev_users(reset_password: bool = False) -> int:
    settings = get_settings()
    if settings.app_env not in {"development", "test"}:
        raise RuntimeError("Development user seeding is only allowed in development or test.")

    required_values = {
        "DEV_STUDENT_USERNAME": settings.dev_student_username,
        "DEV_STUDENT_PASSWORD": settings.dev_student_password,
        "DEV_STUDENT_DISPLAY_NAME": settings.dev_student_display_name,
        "DEV_TEACHER_USERNAME": settings.dev_teacher_username,
        "DEV_TEACHER_PASSWORD": settings.dev_teacher_password,
        "DEV_TEACHER_DISPLAY_NAME": settings.dev_teacher_display_name,
    }
    missing = [key for key, value in required_values.items() if not value]
    if missing:
        raise RuntimeError(f"Missing development seed settings: {', '.join(missing)}")

    with session_scope() as session:
        auth_service = AuthService(session)
        created_or_updated = 0
        for username, password, display_name, role in [
            (
                settings.dev_student_username,
                settings.dev_student_password,
                settings.dev_student_display_name,
                "student",
            ),
            (
                settings.dev_teacher_username,
                settings.dev_teacher_password,
                settings.dev_teacher_display_name,
                "teacher",
            ),
        ]:
            existing = auth_service.users.get_by_normalized_username(
                normalize_username(username or "")
            )
            if existing is None:
                auth_service.create_user(
                    username=username or "",
                    display_name=display_name or "",
                    role=role,
                    password=password or "",
                    is_active=True,
                )
                created_or_updated += 1
                continue

            changed = False
            if existing.display_name != (display_name or ""):
                existing.display_name = display_name or ""
                changed = True
            if existing.role != role:
                existing.role = role
                changed = True
            if not existing.is_active:
                existing.is_active = True
                changed = True
            if reset_password:
                from app.core.security import hash_password

                existing.password_hash = hash_password(password or "")
                changed = True
            if changed:
                created_or_updated += 1

    return created_or_updated


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reset-password", action="store_true")
    args = parser.parse_args()
    count = seed_dev_users(reset_password=args.reset_password)
    print(f"Seed completed for {count} development users.")


if __name__ == "__main__":
    main()
