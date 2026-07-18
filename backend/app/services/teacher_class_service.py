from __future__ import annotations

import uuid

from app.api.errors import ApiErrorException
from app.db.models.user import User
from app.repositories.classroom_repository import ClassroomRepository
from app.schemas.teacher import (
    TeacherClassDetailResponse,
    TeacherClassesResponse,
    TeacherClassSchoolResponse,
    TeacherClassSummaryResponse,
    TeacherStudentsResponse,
    TeacherStudentSummaryResponse,
)


class TeacherClassService:
    def __init__(self, *, classrooms: ClassroomRepository) -> None:
        self.classrooms = classrooms

    def list_classes(self, *, user: User) -> TeacherClassesResponse:
        rows = self.classrooms.list_teacher_classes_with_student_count(teacher_user_id=user.id)
        return TeacherClassesResponse(
            items=[
                TeacherClassSummaryResponse(
                    id=classroom.id,
                    code=classroom.code,
                    name=classroom.name,
                    grade=classroom.grade,
                    academic_year=classroom.academic_year,
                    school_name=school_name,
                    student_count=student_count,
                )
                for classroom, school_name, student_count in rows
            ]
        )

    def get_class_detail(self, *, user: User, class_id: uuid.UUID) -> TeacherClassDetailResponse:
        row = self.classrooms.get_teacher_class_detail(
            teacher_user_id=user.id,
            class_id=class_id,
        )
        if row is None:
            raise ApiErrorException(
                status_code=404,
                code="CLASSROOM_NOT_FOUND",
                message="Không tìm thấy lớp học.",
            )

        classroom, school = row
        return TeacherClassDetailResponse(
            id=classroom.id,
            code=classroom.code,
            name=classroom.name,
            grade=classroom.grade,
            academic_year=classroom.academic_year,
            school=TeacherClassSchoolResponse(id=school.id, name=school.name),
        )

    def list_students(self, *, user: User, class_id: uuid.UUID) -> TeacherStudentsResponse:
        detail = self.classrooms.get_teacher_class_detail(
            teacher_user_id=user.id,
            class_id=class_id,
        )
        if detail is None:
            raise ApiErrorException(
                status_code=404,
                code="CLASSROOM_NOT_FOUND",
                message="Không tìm thấy lớp học.",
            )

        students = self.classrooms.list_teacher_class_students(
            teacher_user_id=user.id,
            class_id=class_id,
        )
        return TeacherStudentsResponse(
            items=[
                TeacherStudentSummaryResponse(
                    id=student.id,
                    display_name=student.display_name,
                    is_active=student.is_active,
                )
                for student in students
            ]
        )
