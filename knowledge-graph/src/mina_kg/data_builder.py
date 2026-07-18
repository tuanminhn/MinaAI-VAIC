from __future__ import annotations

import json
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "1.0.0"
REVIEW_STATUS = "approved"
REVIEWED_AT = "2026-07-18"
REVIEWED_BY = "Codex (AI-assisted mathematics review, user-authorized)"


def provenance(book_id: str, pages: list[int], lesson: str) -> dict[str, Any]:
    return {
        "book_id": book_id,
        "pdf_pages": pages,
        "lesson": lesson,
        "review_status": REVIEW_STATUS,
    }


def skill(
    code: str,
    name: str,
    grade: int,
    domain: str,
    subdomain: str,
    description: str,
    source: dict[str, Any],
) -> dict[str, Any]:
    return {
        "id": code,
        "code": code,
        "canonical_name": name,
        "grade": grade,
        "subject": "math",
        "curriculum": "GDPT_2018",
        "publisher_series": "KNTT",
        "domain": domain,
        "subdomain": subdomain,
        "description": description,
        "mastery_threshold": 0.8,
        "review_status": REVIEW_STATUS,
        "provenance": [source],
    }


def option(
    option_id: str,
    content: str,
    is_correct: bool = False,
    misconception_id: str | None = None,
) -> dict[str, Any]:
    value = {"id": option_id, "content": content, "is_correct": is_correct}
    if misconception_id:
        value["misconception_id"] = misconception_id
    return value


def build_dataset() -> dict[str, Any]:
    g6_l23 = provenance("KNTT_TOAN_6_T2", [5, 6, 7, 8, 9], "Bài 23. Mở rộng phân số. Phân số bằng nhau")
    g6_l24 = provenance("KNTT_TOAN_6_T2", [10, 11, 12, 13, 14], "Bài 24. So sánh phân số. Hỗn số dương")
    g6_l25 = provenance("KNTT_TOAN_6_T2", [16, 17, 18, 19], "Bài 25. Phép cộng và phép trừ phân số")
    g6_l26 = provenance("KNTT_TOAN_6_T2", [20, 21, 22], "Bài 26. Phép nhân và phép chia phân số")
    g7_l1 = provenance("KNTT_TOAN_7_T1", [6, 7, 8, 9, 10], "Bài 1. Tập hợp các số hữu tỉ")
    g7_l2 = provenance("KNTT_TOAN_7_T1", [11, 12, 13, 14, 15], "Bài 2. Cộng, trừ, nhân, chia số hữu tỉ")

    skills = [
        skill("MATH.G6.FRACTION.REPRESENT", "Nhận biết và biểu diễn phân số", 6, "Numbers", "Fractions", "Nhận biết phân số có dạng a/b với a, b là số nguyên, b khác 0; biểu diễn phép chia số nguyên dưới dạng phân số.", g6_l23),
        skill("MATH.G6.FRACTION.EQUIVALENT", "Nhận biết hai phân số bằng nhau", 6, "Numbers", "Fractions", "Kiểm tra và tạo các phân số bằng nhau bằng tính chất cơ bản.", g6_l23),
        skill("MATH.G6.FRACTION.REDUCE", "Rút gọn phân số", 6, "Numbers", "Fractions", "Chia tử và mẫu cho một ước chung để đưa phân số về dạng tối giản.", g6_l23),
        skill("MATH.G6.FRACTION.COMPARE", "So sánh hai phân số", 6, "Numbers", "Fractions", "Đưa phân số về dạng phù hợp và xác định thứ tự của chúng.", g6_l24),
        skill("MATH.G6.FRACTION.COMMON_DENOMINATOR", "Quy đồng mẫu số hai phân số", 6, "Numbers", "Fractions", "Tìm mẫu số chung và biến đổi hai phân số thành các phân số bằng chúng có cùng mẫu.", g6_l25),
        skill("MATH.G6.FRACTION.ADD_SUBTRACT", "Cộng và trừ hai phân số", 6, "Numbers", "Fractions", "Cộng hoặc trừ hai phân số cùng mẫu hay khác mẫu và rút gọn kết quả.", g6_l25),
        skill("MATH.G6.FRACTION.MULTIPLY_DIVIDE", "Nhân và chia hai phân số", 6, "Numbers", "Fractions", "Nhân tử với tử, mẫu với mẫu; chia bằng cách nhân với phân số nghịch đảo.", g6_l26),
        skill("MATH.G7.RATIONAL.RECOGNIZE", "Nhận biết một số hữu tỉ", 7, "Numbers", "RationalNumbers", "Nhận biết số viết được dưới dạng a/b với a, b nguyên và b khác 0.", g7_l1),
        skill("MATH.G7.RATIONAL.REPRESENT", "Biểu diễn số hữu tỉ dưới dạng phân số", 7, "Numbers", "RationalNumbers", "Viết số hữu tỉ dưới dạng phân số có mẫu dương để thực hiện phép tính.", g7_l1),
        skill("MATH.G7.RATIONAL.ADD_SUBTRACT", "Cộng và trừ hai số hữu tỉ", 7, "Numbers", "RationalNumbers", "Đưa số hữu tỉ về phân số và thực hiện phép cộng hoặc trừ đúng dấu.", g7_l2),
        skill("MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "Nhân và chia hai số hữu tỉ", 7, "Numbers", "RationalNumbers", "Thực hiện phép nhân và chia số hữu tỉ, bao gồm quy tắc dấu và nghịch đảo.", g7_l2),
    ]

    def edge(
        source: str,
        target: str,
        evidence: str,
        confidence: float = 0.9,
        relationship_type: str = "prerequisite",
    ) -> dict[str, Any]:
        return {
            "source_skill_id": source,
            "target_skill_id": target,
            "relationship_type": relationship_type,
            "evidence": evidence,
            "confidence": confidence,
            "created_by": "curated_demo_v1",
            "review_status": REVIEW_STATUS,
        }

    edges = [
        edge("MATH.G6.FRACTION.REPRESENT", "MATH.G6.FRACTION.EQUIVALENT", "Cần hiểu cấu tạo phân số trước khi kiểm tra hai cách biểu diễn bằng nhau."),
        edge("MATH.G6.FRACTION.EQUIVALENT", "MATH.G6.FRACTION.REDUCE", "Rút gọn dựa trực tiếp trên tính chất tạo phân số bằng nhau."),
        edge("MATH.G6.FRACTION.EQUIVALENT", "MATH.G6.FRACTION.COMMON_DENOMINATOR", "Quy đồng tạo các phân số bằng phân số ban đầu với cùng mẫu."),
        edge("MATH.G6.FRACTION.COMMON_DENOMINATOR", "MATH.G6.FRACTION.COMPARE", "Quy đồng là một chiến lược hỗ trợ so sánh phân số khác mẫu, nhưng không phải cách duy nhất.", relationship_type="supporting"),
        edge("MATH.G6.FRACTION.COMMON_DENOMINATOR", "MATH.G6.FRACTION.ADD_SUBTRACT", "Cộng hoặc trừ phân số khác mẫu cần đưa chúng về cùng mẫu."),
        edge("MATH.G6.FRACTION.REDUCE", "MATH.G6.FRACTION.ADD_SUBTRACT", "Rút gọn giúp trình bày kết quả phép cộng hoặc trừ ở dạng tối giản, nhưng không bắt buộc để thực hiện phép tính.", relationship_type="supporting"),
        edge("MATH.G6.FRACTION.REDUCE", "MATH.G6.FRACTION.MULTIPLY_DIVIDE", "Rút gọn trước hoặc sau phép nhân/chia giúp tính gọn và đưa kết quả về dạng tối giản.", relationship_type="supporting"),
        edge("MATH.G6.FRACTION.REPRESENT", "MATH.G7.RATIONAL.RECOGNIZE", "Số hữu tỉ được định nghĩa qua biểu diễn a/b với a, b nguyên và b khác 0."),
        edge("MATH.G7.RATIONAL.RECOGNIZE", "MATH.G7.RATIONAL.REPRESENT", "Cần hiểu định nghĩa số hữu tỉ trước khi viết một số dưới dạng phân số có mẫu dương."),
        edge("MATH.G6.FRACTION.ADD_SUBTRACT", "MATH.G7.RATIONAL.ADD_SUBTRACT", "Phép cộng/trừ số hữu tỉ sử dụng trực tiếp quy tắc cộng/trừ phân số.", 0.98),
        edge("MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.ADD_SUBTRACT", "Cần biểu diễn đúng số hữu tỉ và dấu trước khi thực hiện phép tính."),
        edge("MATH.G6.FRACTION.MULTIPLY_DIVIDE", "MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "Phép nhân/chia số hữu tỉ sử dụng trực tiếp quy tắc nhân/chia phân số.", 0.98),
        edge("MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "Cần biểu diễn đúng số hữu tỉ và dấu trước khi nhân hoặc chia."),
    ]

    misconceptions = [
        {"id": "MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR", "description": "Cộng riêng tử số và mẫu số", "error_pattern": "a/b + c/d = (a+c)/(b+d)", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.ADD_SUBTRACT", "MATH.G7.RATIONAL.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.ADD_DENOMINATORS_AS_COMMON", "description": "Chọn mẫu số chung bằng tổng hai mẫu số", "error_pattern": "MSC(b,d) = b+d", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.COMMON_DENOMINATOR"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.CHANGE_DENOMINATOR_ONLY", "description": "Đổi mẫu số nhưng không biến đổi tử số tương ứng", "error_pattern": "a/b = a/m when m != b", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.COMMON_DENOMINATOR", "MATH.G6.FRACTION.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.RATIONAL.IGNORE_NEGATIVE_SIGN", "description": "Bỏ qua dấu âm khi cộng hoặc trừ số hữu tỉ", "error_pattern": "-a/b + c/d treated as a/b + c/d", "severity": "major", "skill_ids": ["MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.DIVIDE_WITHOUT_RECIPROCAL", "description": "Chia tử cho tử và mẫu cho mẫu hoặc giữ nguyên phân số chia thay vì lấy nghịch đảo", "error_pattern": "a/b : c/d = (a:c)/(b:d) or a/b * c/d", "severity": "major", "skill_ids": ["MATH.G6.FRACTION.MULTIPLY_DIVIDE", "MATH.G7.RATIONAL.MULTIPLY_DIVIDE"], "review_status": REVIEW_STATUS},
    ]

    questions = [
        {
            "id": "Q.DIAG.G7.RATIONAL.ADD.001", "type": "diagnostic", "grade": 7,
            "stem": "Tính (-2/3) + 5/6.", "skill_ids": ["MATH.G7.RATIONAL.ADD_SUBTRACT"],
            "options": [option("A", "1/6", True), option("B", "3/9", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR"), option("C", "7/6", misconception_id="MIS.RATIONAL.IGNORE_NEGATIVE_SIGN"), option("D", "-7/18")],
            "explanation": "Quy đồng -2/3 = -4/6, rồi cộng -4/6 + 5/6 = 1/6.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G6.COMMON_DENOM.001", "type": "diagnostic", "grade": 6,
            "stem": "Mẫu số chung nhỏ nhất phù hợp để quy đồng 1/4 và 1/6 là số nào?", "skill_ids": ["MATH.G6.FRACTION.COMMON_DENOMINATOR"],
            "options": [option("A", "12", True), option("B", "10", misconception_id="MIS.FRACTION.ADD_DENOMINATORS_AS_COMMON"), option("C", "24"), option("D", "2")],
            "explanation": "Bội chung nhỏ nhất của 4 và 6 là 12.", "provenance": [g6_l25], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G6.ADD.001", "type": "diagnostic", "grade": 6,
            "stem": "Tính 1/4 + 1/6.", "skill_ids": ["MATH.G6.FRACTION.ADD_SUBTRACT"],
            "options": [option("A", "5/12", True), option("B", "2/10", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR"), option("C", "2/12", misconception_id="MIS.FRACTION.CHANGE_DENOMINATOR_ONLY"), option("D", "1/10")],
            "explanation": "Quy đồng 1/4 = 3/12 và 1/6 = 2/12, kết quả là 5/12.", "provenance": [g6_l25], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G7.RATIONAL.SIGN.001", "type": "diagnostic", "grade": 7,
            "stem": "Tính (-3/4) - 1/2.", "skill_ids": ["MATH.G7.RATIONAL.ADD_SUBTRACT"],
            "options": [option("A", "-5/4", True), option("B", "-1/4"), option("C", "5/4", misconception_id="MIS.RATIONAL.IGNORE_NEGATIVE_SIGN"), option("D", "-4/6", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR")],
            "explanation": "Đổi 1/2 = 2/4; -3/4 - 2/4 = -5/4.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.REMED.G6.COMMON_DENOM.001", "type": "remediation", "grade": 6,
            "stem": "Quy đồng 2/3 và 5/6 về mẫu số 6. Phân số thứ nhất trở thành gì?", "skill_ids": ["MATH.G6.FRACTION.COMMON_DENOMINATOR"],
            "options": [option("A", "4/6", True), option("B", "2/6", misconception_id="MIS.FRACTION.CHANGE_DENOMINATOR_ONLY"), option("C", "7/6"), option("D", "4/3")],
            "explanation": "Nhân cả tử và mẫu của 2/3 với 2 để được 4/6.", "provenance": [g6_l25], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.REMED.G6.ADD.001", "type": "remediation", "grade": 6,
            "stem": "Tính 2/3 + 1/6.", "skill_ids": ["MATH.G6.FRACTION.ADD_SUBTRACT"],
            "options": [option("A", "5/6", True), option("B", "3/9", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR"), option("C", "3/6", misconception_id="MIS.FRACTION.CHANGE_DENOMINATOR_ONLY"), option("D", "1/2")],
            "explanation": "2/3 = 4/6 nên 4/6 + 1/6 = 5/6.", "provenance": [g6_l25], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.TRANSFER.G7.RATIONAL.ADD.001", "type": "transfer", "grade": 7,
            "stem": "Tính (-1/4) + 2/3.", "skill_ids": ["MATH.G7.RATIONAL.ADD_SUBTRACT"],
            "options": [option("A", "5/12", True), option("B", "1/7", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR"), option("C", "11/12", misconception_id="MIS.RATIONAL.IGNORE_NEGATIVE_SIGN"), option("D", "-5/12")],
            "explanation": "-1/4 = -3/12 và 2/3 = 8/12, tổng là 5/12.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.TRANSFER.G7.RATIONAL.SUB.001", "type": "transfer", "grade": 7,
            "stem": "Tính 3/5 - (-1/2).", "skill_ids": ["MATH.G7.RATIONAL.ADD_SUBTRACT"],
            "options": [option("A", "11/10", True), option("B", "1/10", misconception_id="MIS.RATIONAL.IGNORE_NEGATIVE_SIGN"), option("C", "4/7", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR"), option("D", "-11/10")],
            "explanation": "Trừ số âm là cộng số đối: 3/5 + 1/2 = 6/10 + 5/10 = 11/10.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
        },
    ]

    remediation_paths = [
        {
            "id": "PATH.G6_TO_G7.COMMON_DENOM.ADD",
            "target_skill_id": "MATH.G7.RATIONAL.ADD_SUBTRACT",
            "root_cause_skill_id": "MATH.G6.FRACTION.COMMON_DENOMINATOR",
            "estimated_minutes": 10,
            "max_steps": 4,
            "question_ids": ["Q.REMED.G6.COMMON_DENOM.001", "Q.REMED.G6.ADD.001"],
            "transfer_question_ids": ["Q.TRANSFER.G7.RATIONAL.ADD.001", "Q.TRANSFER.G7.RATIONAL.SUB.001"],
            "pass_threshold": 0.5,
            "on_pass": "return_to_target_skill",
            "on_fail": "teacher_review",
            "review_status": REVIEW_STATUS,
        }
    ]

    demo_students = [
        {
            "id": "STUDENT_DEMO_MINH", "display_name": "Minh", "scenario": "root_cause_gap",
            "answers": {"Q.DIAG.G7.RATIONAL.ADD.001": "B", "Q.DIAG.G6.COMMON_DENOM.001": "B", "Q.DIAG.G6.ADD.001": "B"},
            "expected": {"status": "diagnosed", "root_cause_skill_id": "MATH.G6.FRACTION.COMMON_DENOMINATOR", "confidence_min": 0.8, "recommended_path_id": "PATH.G6_TO_G7.COMMON_DENOM.ADD"},
        },
        {
            "id": "STUDENT_DEMO_AN", "display_name": "An", "scenario": "mastered",
            "answers": {"Q.DIAG.G7.RATIONAL.ADD.001": "A", "Q.DIAG.G6.COMMON_DENOM.001": "A", "Q.DIAG.G6.ADD.001": "A", "Q.DIAG.G7.RATIONAL.SIGN.001": "A"},
            "expected": {"status": "mastered", "target_skill_id": "MATH.G7.RATIONAL.ADD_SUBTRACT"},
        },
        {
            "id": "STUDENT_DEMO_LAN", "display_name": "Lan", "scenario": "insufficient_evidence",
            "answers": {"Q.DIAG.G7.RATIONAL.ADD.001": "D"},
            "expected": {"status": "insufficient_evidence", "next_question_id": "Q.DIAG.G6.COMMON_DENOM.001"},
        },
    ]

    return {
        "schema_version": SCHEMA_VERSION,
        "dataset": {
            "id": "MINA_KNTT_MATH_G6_G7_DEMO_V1",
            "series": "KNTT",
            "subject": "math",
            "grades": [6, 7],
            "review_status": REVIEW_STATUS,
            "reviewed_at": REVIEWED_AT,
            "reviewed_by": REVIEWED_BY,
            "review_scope": ["skills", "prerequisite_edges", "answers", "distractors", "misconceptions"],
        },
        "skills": skills,
        "edges": edges,
        "misconceptions": misconceptions,
        "questions": questions,
        "remediation_paths": remediation_paths,
        "demo_students": demo_students,
    }


def write_dataset(root: Path) -> dict[str, Any]:
    dataset = build_dataset()
    output = root / "output"
    output.mkdir(parents=True, exist_ok=True)
    files = {
        "knowledge_graph.json": {"schema_version": SCHEMA_VERSION, "dataset": dataset["dataset"], "skills": dataset["skills"], "edges": dataset["edges"]},
        "misconceptions.json": {"schema_version": SCHEMA_VERSION, "misconceptions": dataset["misconceptions"]},
        "questions.json": {"schema_version": SCHEMA_VERSION, "questions": dataset["questions"]},
        "remediation_paths.json": {"schema_version": SCHEMA_VERSION, "remediation_paths": dataset["remediation_paths"]},
        "demo_students.json": {"schema_version": SCHEMA_VERSION, "students": dataset["demo_students"]},
    }
    for filename, content in files.items():
        (output / filename).write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return dataset
