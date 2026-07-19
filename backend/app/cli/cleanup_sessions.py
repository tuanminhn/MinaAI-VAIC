from __future__ import annotations

from app.db.session import session_scope
from app.services.auth_service import AuthService


def main() -> None:
    with session_scope() as session:
        deleted = AuthService(session).cleanup_expired_sessions()
    print(f"Deleted {deleted} expired or revoked sessions.")


if __name__ == "__main__":
    main()
