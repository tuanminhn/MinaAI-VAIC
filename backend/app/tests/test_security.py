from __future__ import annotations

from app.core.security import hash_password, verify_password


def test_password_hash_is_not_plain_text() -> None:
    password = "VerySecret123!"
    password_hash = hash_password(password)

    assert password_hash != password


def test_verify_password_passes_for_correct_password() -> None:
    password_hash = hash_password("VerySecret123!")
    assert verify_password("VerySecret123!", password_hash) is True


def test_verify_password_fails_for_wrong_password() -> None:
    password_hash = hash_password("VerySecret123!")
    assert verify_password("WrongPassword", password_hash) is False
