from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.content import router as content_router
from app.api.v1.diagnostic import router as diagnostic_router
from app.api.v1.health import router as health_router
from app.api.v1.student import router as student_router
from app.api.v1.teacher import router as teacher_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(content_router)
api_router.include_router(diagnostic_router)
api_router.include_router(health_router, tags=["health"])
api_router.include_router(student_router)
api_router.include_router(teacher_router)
