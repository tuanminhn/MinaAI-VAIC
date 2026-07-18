from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from .catalog import BOOK_BY_ID
from .data_builder import build_dataset


class ValidationError(ValueError):
    pass


def _unique(items: list[dict[str, Any]], label: str) -> set[str]:
    ids = [item["id"] for item in items]
    if len(ids) != len(set(ids)):
        raise ValidationError(f"duplicate {label} IDs")
    return set(ids)


def _validate_dag(skill_ids: set[str], edges: list[dict[str, Any]]) -> None:
    adjacency = {skill_id: [] for skill_id in skill_ids}
    indegree = {skill_id: 0 for skill_id in skill_ids}
    for edge in edges:
        if edge["relationship_type"] != "prerequisite":
            continue
        source, target = edge["source_skill_id"], edge["target_skill_id"]
        adjacency[source].append(target)
        indegree[target] += 1
    queue = [node for node, degree in indegree.items() if degree == 0]
    visited = 0
    while queue:
        node = queue.pop()
        visited += 1
        for target in adjacency[node]:
            indegree[target] -= 1
            if indegree[target] == 0:
                queue.append(target)
    if visited != len(skill_ids):
        raise ValidationError("prerequisite graph contains a cycle")


def validate_dataset(dataset: dict[str, Any] | None = None) -> dict[str, Any]:
    dataset = dataset or build_dataset()
    checks: list[str] = []
    if dataset["dataset"]["grades"] != [6, 7] or dataset["dataset"]["series"] != "KNTT":
        raise ValidationError("dataset is outside the locked KNTT Math 6-7 scope")
    checks.append("scope")

    allowed_relationships = {"prerequisite", "supporting", "part_of", "equivalent", "related", "next_skill"}
    allowed_review_statuses = {"pending", "approved", "rejected"}
    if dataset["dataset"]["review_status"] not in allowed_review_statuses:
        raise ValidationError("invalid dataset review status")
    if dataset["dataset"]["review_status"] == "approved":
        if not dataset["dataset"].get("reviewed_at") or not dataset["dataset"].get("reviewed_by"):
            raise ValidationError("approved dataset requires review metadata")
        reviewed_items = (
            dataset["skills"]
            + dataset["edges"]
            + dataset["misconceptions"]
            + dataset["questions"]
            + dataset["remediation_paths"]
        )
        if any(item.get("review_status") != "approved" for item in reviewed_items):
            raise ValidationError("approved dataset contains unapproved content")
        provenance_items = [source for skill in dataset["skills"] for source in skill["provenance"]]
        provenance_items += [source for question in dataset["questions"] for source in question["provenance"]]
        if any(source.get("review_status") != "approved" for source in provenance_items):
            raise ValidationError("approved dataset contains unapproved provenance")
    checks.append("review_status_consistency")

    skill_ids = _unique(dataset["skills"], "skill")
    misconception_ids = _unique(dataset["misconceptions"], "misconception")
    question_ids = _unique(dataset["questions"], "question")
    path_ids = _unique(dataset["remediation_paths"], "remediation path")
    checks.append("unique_ids")

    for skill in dataset["skills"]:
        if skill["grade"] not in (6, 7) or skill["publisher_series"] != "KNTT":
            raise ValidationError(f"skill outside scope: {skill['id']}")
        if not skill["canonical_name"].split()[0] in {"Biểu", "Nhận", "Rút", "So", "Quy", "Cộng", "Nhân"}:
            raise ValidationError(f"skill name is not action-oriented: {skill['id']}")
        for source in skill["provenance"]:
            if source["book_id"] not in BOOK_BY_ID or not source["pdf_pages"]:
                raise ValidationError(f"invalid provenance: {skill['id']}")
    checks.append("skill_scope_and_provenance")

    for edge in dataset["edges"]:
        if edge["source_skill_id"] not in skill_ids or edge["target_skill_id"] not in skill_ids:
            raise ValidationError(f"broken edge reference: {edge}")
        if not edge["evidence"].strip():
            raise ValidationError(f"edge without evidence: {edge}")
        if edge["relationship_type"] not in allowed_relationships:
            raise ValidationError(f"invalid relationship type: {edge}")
    _validate_dag(skill_ids, dataset["edges"])
    checks.append("edge_references_and_dag")

    for misconception in dataset["misconceptions"]:
        if not set(misconception["skill_ids"]).issubset(skill_ids):
            raise ValidationError(f"broken misconception skill reference: {misconception['id']}")
    checks.append("misconception_references")

    stems_by_type: dict[str, set[str]] = {}
    for question in dataset["questions"]:
        if question["grade"] not in (6, 7) or not set(question["skill_ids"]).issubset(skill_ids):
            raise ValidationError(f"question outside scope or broken skill reference: {question['id']}")
        if sum(1 for item in question["options"] if item["is_correct"]) != 1:
            raise ValidationError(f"question must have exactly one correct option: {question['id']}")
        for answer in question["options"]:
            if answer.get("misconception_id") and answer["misconception_id"] not in misconception_ids:
                raise ValidationError(f"broken option misconception: {question['id']}")
        if not question.get("provenance"):
            raise ValidationError(f"question without provenance: {question['id']}")
        stems_by_type.setdefault(question["type"], set()).add(question["stem"].strip().lower())
    if stems_by_type.get("transfer", set()) & stems_by_type.get("remediation", set()):
        raise ValidationError("transfer and remediation questions reuse the same stem")
    checks.append("question_references_answers_and_transfer_independence")

    for path in dataset["remediation_paths"]:
        if path["target_skill_id"] not in skill_ids or path["root_cause_skill_id"] not in skill_ids:
            raise ValidationError(f"broken path skill reference: {path['id']}")
        if not set(path["question_ids"] + path["transfer_question_ids"]).issubset(question_ids):
            raise ValidationError(f"broken path question reference: {path['id']}")
    checks.append("remediation_path_references")

    for student in dataset["demo_students"]:
        if not set(student["answers"]).issubset(question_ids):
            raise ValidationError(f"broken demo answer reference: {student['id']}")
        recommended = student["expected"].get("recommended_path_id")
        if recommended and recommended not in path_ids:
            raise ValidationError(f"broken demo path reference: {student['id']}")
    checks.append("demo_fixture_references")

    return {
        "valid": True,
        "schema_version": dataset["schema_version"],
        "counts": {
            "skills": len(dataset["skills"]),
            "edges": len(dataset["edges"]),
            "misconceptions": len(dataset["misconceptions"]),
            "questions": len(dataset["questions"]),
            "remediation_paths": len(dataset["remediation_paths"]),
            "demo_students": len(dataset["demo_students"]),
        },
        "checks": checks,
        "human_review_required": dataset["dataset"]["review_status"] != "approved",
        "review_status": dataset["dataset"]["review_status"],
    }


def write_validation_report(root: Path, dataset: dict[str, Any] | None = None) -> dict[str, Any]:
    report = validate_dataset(dataset)
    target = root / "output" / "validation_report.json"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report
