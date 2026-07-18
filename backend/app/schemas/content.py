from __future__ import annotations

from app.schemas.base import ApiSchema


class ContentPackageSummaryResponse(ApiSchema):
    code: str
    title: str
    subject: str
    grade: int
    version: int
    status: str
    skill_count: int


class ContentSkillSummaryResponse(ApiSchema):
    code: str
    name: str
    grade: int
    prerequisite_codes: list[str]


class ContentSkillsResponse(ApiSchema):
    items: list[ContentSkillSummaryResponse]


class SkillQuestionCountResponse(ApiSchema):
    purpose: str
    count: int


class SkillMisconceptionResponse(ApiSchema):
    code: str
    name: str
    description: str


class RemediationUnitMetadataResponse(ApiSchema):
    code: str
    title: str
    summary: str
    misconception_code: str | None = None


class ContentSkillDetailResponse(ApiSchema):
    code: str
    name: str
    description: str | None = None
    grade: int
    prerequisite_codes: list[str]
    misconceptions: list[SkillMisconceptionResponse]
    question_counts: list[SkillQuestionCountResponse]
    remediation_units: list[RemediationUnitMetadataResponse]
