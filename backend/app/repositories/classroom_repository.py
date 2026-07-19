from __future__ import annotations

import uuid

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session, joinedload

from app.db.models.classroom import Classroom
from app.db.models.classroom_membership import ClassroomMembership
from app.db.models.school import School
from app.db.models.user import User


class ClassroomRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_school_code_year(
        self,
        *,
        school_id: uuid.UUID,
        code: str,
        academic_year: str,
    ) -> Classroom | None:
        statement = select(Classroom).where(
            Classroom.school_id == school_id,
            Classroom.code == code,
            Classroom.academic_year == academic_year,
        )
        return self.session.execute(statement).scalar_one_or_none()

    def add(self, classroom: Classroom) -> Classroom:
        self.session.add(classroom)
        return classroom

    def get_membership(
        self,
        *,
        classroom_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> ClassroomMembership | None:
        statement = select(ClassroomMembership).where(
            ClassroomMembership.classroom_id == classroom_id,
            ClassroomMembership.user_id == user_id,
        )
        return self.session.execute(statement).scalar_one_or_none()

    def add_membership(self, membership: ClassroomMembership) -> ClassroomMembership:
        self.session.add(membership)
        return membership

    def get_primary_membership_for_user(
        self,
        *,
        user_id: uuid.UUID,
        membership_role: str,
    ) -> ClassroomMembership | None:
        statement = (
            select(ClassroomMembership)
            .options(
                joinedload(ClassroomMembership.classroom).joinedload(Classroom.school),
            )
            .where(
                ClassroomMembership.user_id == user_id,
                ClassroomMembership.membership_role == membership_role,
            )
            .order_by(ClassroomMembership.is_primary.desc(), ClassroomMembership.created_at.asc())
            .limit(1)
        )
        return self.session.execute(statement).scalars().first()

    def list_teacher_classes_with_student_count(self, *, teacher_user_id: uuid.UUID):
        student_membership = ClassroomMembership.__table__.alias("student_membership")
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")

        statement = (
            select(
                Classroom,
                School.name.label("school_name"),
                func.count(student_membership.c.id).label("student_count"),
            )
            .join(teacher_membership, teacher_membership.c.classroom_id == Classroom.id)
            .join(School, School.id == Classroom.school_id)
            .outerjoin(
                student_membership,
                and_(
                    student_membership.c.classroom_id == Classroom.id,
                    student_membership.c.membership_role == "student",
                ),
            )
            .where(
                teacher_membership.c.user_id == teacher_user_id,
                teacher_membership.c.membership_role == "teacher",
            )
            .group_by(Classroom.id, School.name)
            .order_by(Classroom.grade.asc(), Classroom.name.asc())
        )
        return self.session.execute(statement).all()

    def get_teacher_class_detail(
        self,
        *,
        teacher_user_id: uuid.UUID,
        class_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")

        statement = (
            select(Classroom, School)
            .join(teacher_membership, teacher_membership.c.classroom_id == Classroom.id)
            .join(School, School.id == Classroom.school_id)
            .where(
                Classroom.id == class_id,
                teacher_membership.c.user_id == teacher_user_id,
                teacher_membership.c.membership_role == "teacher",
            )
            .limit(1)
        )
        return self.session.execute(statement).first()

    def list_teacher_class_students(
        self,
        *,
        teacher_user_id: uuid.UUID,
        class_id: uuid.UUID,
    ):
        teacher_membership = ClassroomMembership.__table__.alias("teacher_membership")

        statement = (
            select(User)
            .join(
                ClassroomMembership,
                ClassroomMembership.user_id == User.id,
            )
            .join(
                teacher_membership,
                teacher_membership.c.classroom_id == ClassroomMembership.classroom_id,
            )
            .where(
                ClassroomMembership.classroom_id == class_id,
                ClassroomMembership.membership_role == "student",
                teacher_membership.c.classroom_id == class_id,
                teacher_membership.c.user_id == teacher_user_id,
                teacher_membership.c.membership_role == "teacher",
            )
            .order_by(User.display_name.asc())
        )
        return self.session.execute(statement).scalars().all()
