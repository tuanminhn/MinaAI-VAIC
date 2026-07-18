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
    curriculum_source = {
        "book_id": "CTGDPT2018_TOAN",
        "pdf_pages": [],
        "lesson": "Chương trình GDPT 2018 môn Toán - yêu cầu cần đạt cấp THCS",
        "source_url": "https://moet.gov.vn/content/vanban/Lists/VBPQ/Attachments/1453/vbhn-322018-202021-ttbgddt-trinh-ky-xt.pdf",
        "review_status": REVIEW_STATUS,
    }

    skills = [
        skill("MATH.G6.FRACTION.REPRESENT", "Nhận biết và biểu diễn phân số", 6, "Numbers", "Fractions", "Nhận biết phân số có dạng a/b với a, b là số nguyên, b khác 0; biểu diễn phép chia số nguyên dưới dạng phân số.", g6_l23),
        skill("MATH.G6.FRACTION.EQUIVALENT", "Nhận biết hai phân số bằng nhau", 6, "Numbers", "Fractions", "Kiểm tra và tạo các phân số bằng nhau bằng tính chất cơ bản.", g6_l23),
        skill("MATH.G6.FRACTION.REDUCE", "Rút gọn phân số", 6, "Numbers", "Fractions", "Chia tử và mẫu cho một ước chung để đưa phân số về dạng tối giản.", g6_l23),
        skill("MATH.G6.FRACTION.COMPARE", "So sánh hai phân số", 6, "Numbers", "Fractions", "Đưa phân số về dạng phù hợp và xác định thứ tự của chúng.", g6_l24),
        skill("MATH.G6.FRACTION.COMMON_DENOMINATOR", "Quy đồng mẫu số hai phân số", 6, "Numbers", "Fractions", "Tìm mẫu số chung và biến đổi hai phân số thành các phân số bằng chúng có cùng mẫu.", g6_l25),
        skill("MATH.G6.FRACTION.ADD_SUBTRACT", "Cộng và trừ hai phân số", 6, "Numbers", "Fractions", "Cộng hoặc trừ hai phân số cùng mẫu hay khác mẫu và rút gọn kết quả.", g6_l25),
        skill("MATH.G6.FRACTION.MULTIPLY_DIVIDE", "Nhân và chia hai phân số", 6, "Numbers", "Fractions", "Nhân tử với tử, mẫu với mẫu; chia bằng cách nhân với phân số nghịch đảo.", g6_l26),
        skill("MATH.G6.FRACTION.MIXED_NUMBER", "Biểu diễn hỗn số dương dưới dạng phân số", 6, "Numbers", "Fractions", "Đổi hỗn số dương thành phân số và ngược lại để so sánh hoặc thực hiện phép tính.", g6_l24),
        skill("MATH.G6.FRACTION.RECIPROCAL", "Nhận biết phân số nghịch đảo", 6, "Numbers", "Fractions", "Xác định phân số nghịch đảo của một phân số khác 0.", g6_l26),
        skill("MATH.G7.RATIONAL.RECOGNIZE", "Nhận biết một số hữu tỉ", 7, "Numbers", "RationalNumbers", "Nhận biết số viết được dưới dạng a/b với a, b nguyên và b khác 0.", g7_l1),
        skill("MATH.G7.RATIONAL.REPRESENT", "Biểu diễn số hữu tỉ dưới dạng phân số", 7, "Numbers", "RationalNumbers", "Viết số hữu tỉ dưới dạng phân số có mẫu dương để thực hiện phép tính.", g7_l1),
        skill("MATH.G7.RATIONAL.ADD_SUBTRACT", "Cộng và trừ hai số hữu tỉ", 7, "Numbers", "RationalNumbers", "Đưa số hữu tỉ về phân số và thực hiện phép cộng hoặc trừ đúng dấu.", g7_l2),
        skill("MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "Nhân và chia hai số hữu tỉ", 7, "Numbers", "RationalNumbers", "Thực hiện phép nhân và chia số hữu tỉ, bao gồm quy tắc dấu và nghịch đảo.", g7_l2),
        skill("MATH.G7.RATIONAL.OPPOSITE", "Nhận biết số đối của một số hữu tỉ", 7, "Numbers", "RationalNumbers", "Xác định số đối và dùng số đối để chuyển phép trừ thành phép cộng.", g7_l1),
        skill("MATH.G7.RATIONAL.COMPARE", "So sánh hai số hữu tỉ", 7, "Numbers", "RationalNumbers", "Biểu diễn hai số hữu tỉ ở dạng phù hợp và so sánh đúng khi có số âm.", g7_l1),
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
        edge("MATH.G6.FRACTION.REPRESENT", "MATH.G6.FRACTION.MIXED_NUMBER", "Đổi hỗn số cần hiểu phần nguyên và phần phân số cùng biểu diễn một giá trị."),
        edge("MATH.G6.FRACTION.REPRESENT", "MATH.G6.FRACTION.RECIPROCAL", "Cần nhận biết đúng tử số và mẫu số trước khi hoán đổi để tìm nghịch đảo."),
        edge("MATH.G6.FRACTION.RECIPROCAL", "MATH.G6.FRACTION.MULTIPLY_DIVIDE", "Chia cho một phân số được thực hiện bằng nhân với phân số nghịch đảo của nó."),
        edge("MATH.G6.FRACTION.REPRESENT", "MATH.G7.RATIONAL.RECOGNIZE", "Số hữu tỉ được định nghĩa qua biểu diễn a/b với a, b nguyên và b khác 0."),
        edge("MATH.G7.RATIONAL.RECOGNIZE", "MATH.G7.RATIONAL.REPRESENT", "Cần hiểu định nghĩa số hữu tỉ trước khi viết một số dưới dạng phân số có mẫu dương."),
        edge("MATH.G6.FRACTION.ADD_SUBTRACT", "MATH.G7.RATIONAL.ADD_SUBTRACT", "Phép cộng/trừ số hữu tỉ sử dụng trực tiếp quy tắc cộng/trừ phân số.", 0.98),
        edge("MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.ADD_SUBTRACT", "Cần biểu diễn đúng số hữu tỉ và dấu trước khi thực hiện phép tính."),
        edge("MATH.G6.FRACTION.MULTIPLY_DIVIDE", "MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "Phép nhân/chia số hữu tỉ sử dụng trực tiếp quy tắc nhân/chia phân số.", 0.98),
        edge("MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "Cần biểu diễn đúng số hữu tỉ và dấu trước khi nhân hoặc chia."),
        edge("MATH.G7.RATIONAL.RECOGNIZE", "MATH.G7.RATIONAL.OPPOSITE", "Cần nhận biết giá trị và dấu của số hữu tỉ để xác định số đối."),
        edge("MATH.G7.RATIONAL.OPPOSITE", "MATH.G7.RATIONAL.ADD_SUBTRACT", "Quy tắc trừ một số hữu tỉ dựa trực tiếp vào phép cộng với số đối."),
        edge("MATH.G6.FRACTION.COMPARE", "MATH.G7.RATIONAL.COMPARE", "So sánh số hữu tỉ kế thừa các chiến lược so sánh phân số."),
        edge("MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.COMPARE", "Cần đưa số hữu tỉ về biểu diễn phù hợp trước khi so sánh."),
    ]

    misconceptions = [
        {"id": "MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR", "description": "Cộng riêng tử số và mẫu số", "error_pattern": "a/b + c/d = (a+c)/(b+d)", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.ADD_SUBTRACT", "MATH.G7.RATIONAL.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.ADD_DENOMINATORS_AS_COMMON", "description": "Chọn mẫu số chung bằng tổng hai mẫu số", "error_pattern": "MSC(b,d) = b+d", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.COMMON_DENOMINATOR"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.CHANGE_DENOMINATOR_ONLY", "description": "Đổi mẫu số nhưng không biến đổi tử số tương ứng", "error_pattern": "a/b = a/m when m != b", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.COMMON_DENOMINATOR", "MATH.G6.FRACTION.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.RATIONAL.IGNORE_NEGATIVE_SIGN", "description": "Bỏ qua dấu âm khi cộng hoặc trừ số hữu tỉ", "error_pattern": "-a/b + c/d treated as a/b + c/d", "severity": "major", "skill_ids": ["MATH.G7.RATIONAL.REPRESENT", "MATH.G7.RATIONAL.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.DIVIDE_WITHOUT_RECIPROCAL", "description": "Chia tử cho tử và mẫu cho mẫu hoặc giữ nguyên phân số chia thay vì lấy nghịch đảo", "error_pattern": "a/b : c/d = (a:c)/(b:d) or a/b * c/d", "severity": "major", "skill_ids": ["MATH.G6.FRACTION.MULTIPLY_DIVIDE", "MATH.G7.RATIONAL.MULTIPLY_DIVIDE"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.EQUIVALENT_CHANGE_ONE_PART", "description": "Chỉ nhân hoặc chia tử số mà không biến đổi mẫu số cùng hệ số", "error_pattern": "a/b = ka/b", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.EQUIVALENT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.REDUCE_ONE_PART", "description": "Rút gọn riêng tử số hoặc mẫu số", "error_pattern": "ka/kb = a/kb or ka/b", "severity": "fundamental", "skill_ids": ["MATH.G6.FRACTION.EQUIVALENT", "MATH.G6.FRACTION.REDUCE"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.MIXED_NUMBER_IGNORE_WHOLE", "description": "Bỏ phần nguyên khi đổi hỗn số thành phân số", "error_pattern": "n a/b = a/b", "severity": "major", "skill_ids": ["MATH.G6.FRACTION.MIXED_NUMBER"], "review_status": REVIEW_STATUS},
        {"id": "MIS.FRACTION.RECIPROCAL_NEGATE", "description": "Nhầm phân số nghịch đảo với số đối", "error_pattern": "reciprocal(a/b) = -a/b", "severity": "major", "skill_ids": ["MATH.G6.FRACTION.RECIPROCAL", "MATH.G6.FRACTION.MULTIPLY_DIVIDE"], "review_status": REVIEW_STATUS},
        {"id": "MIS.RATIONAL.SUBTRACT_WITHOUT_OPPOSITE", "description": "Không đổi phép trừ thành cộng với số đối", "error_pattern": "a - (-b) = a - b", "severity": "major", "skill_ids": ["MATH.G7.RATIONAL.OPPOSITE", "MATH.G7.RATIONAL.ADD_SUBTRACT"], "review_status": REVIEW_STATUS},
        {"id": "MIS.RATIONAL.NEGATIVE_ORDER_REVERSED", "description": "Cho rằng số âm có giá trị tuyệt đối lớn hơn thì lớn hơn", "error_pattern": "a>b implies -a>-b", "severity": "major", "skill_ids": ["MATH.G7.RATIONAL.COMPARE"], "review_status": REVIEW_STATUS},
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
            "options": [option("A", "-5/4", True), option("B", "-1/4", misconception_id="MIS.RATIONAL.SUBTRACT_WITHOUT_OPPOSITE"), option("C", "5/4", misconception_id="MIS.RATIONAL.IGNORE_NEGATIVE_SIGN"), option("D", "-4/6", misconception_id="MIS.FRACTION.ADD_NUMERATOR_DENOMINATOR")],
            "explanation": "Đổi 1/2 = 2/4; -3/4 - 2/4 = -5/4.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G6.EQUIVALENT.001", "type": "diagnostic", "grade": 6,
            "stem": "Phân số nào bằng 3/5?", "skill_ids": ["MATH.G6.FRACTION.EQUIVALENT"],
            "options": [option("A", "9/15", True), option("B", "9/5", misconception_id="MIS.FRACTION.EQUIVALENT_CHANGE_ONE_PART"), option("C", "3/15", misconception_id="MIS.FRACTION.EQUIVALENT_CHANGE_ONE_PART"), option("D", "6/15")],
            "explanation": "Nhân cả tử và mẫu của 3/5 với 3 được 9/15.", "provenance": [g6_l23], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G6.REDUCE.001", "type": "diagnostic", "grade": 6,
            "stem": "Rút gọn phân số 18/24 về dạng tối giản.", "skill_ids": ["MATH.G6.FRACTION.REDUCE"],
            "options": [option("A", "3/4", True), option("B", "9/24", misconception_id="MIS.FRACTION.REDUCE_ONE_PART"), option("C", "18/12", misconception_id="MIS.FRACTION.REDUCE_ONE_PART"), option("D", "6/8")],
            "explanation": "Chia cả tử và mẫu cho ước chung lớn nhất 6, được 3/4.", "provenance": [g6_l23], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G6.MIXED_NUMBER.001", "type": "diagnostic", "grade": 6,
            "stem": "Đổi hỗn số 2 1/3 thành phân số.", "skill_ids": ["MATH.G6.FRACTION.MIXED_NUMBER"],
            "options": [option("A", "7/3", True), option("B", "1/3", misconception_id="MIS.FRACTION.MIXED_NUMBER_IGNORE_WHOLE"), option("C", "3/3"), option("D", "5/3")],
            "explanation": "2 1/3 = (2×3+1)/3 = 7/3.", "provenance": [g6_l24], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G6.RECIPROCAL.001", "type": "diagnostic", "grade": 6,
            "stem": "Phân số nghịch đảo của -3/7 là gì?", "skill_ids": ["MATH.G6.FRACTION.RECIPROCAL"],
            "options": [option("A", "-7/3", True), option("B", "3/7", misconception_id="MIS.FRACTION.RECIPROCAL_NEGATE"), option("C", "7/3"), option("D", "-3/7")],
            "explanation": "Hoán đổi tử và mẫu, đồng thời giữ dấu âm: -7/3.", "provenance": [g6_l26], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G7.OPPOSITE.001", "type": "diagnostic", "grade": 7,
            "stem": "Tính 2/5 - (-3/10).", "skill_ids": ["MATH.G7.RATIONAL.OPPOSITE", "MATH.G7.RATIONAL.ADD_SUBTRACT"],
            "options": [option("A", "7/10", True), option("B", "1/10", misconception_id="MIS.RATIONAL.SUBTRACT_WITHOUT_OPPOSITE"), option("C", "-7/10"), option("D", "-1/10")],
            "explanation": "Trừ số âm là cộng số đối: 2/5 + 3/10 = 7/10.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.DIAG.G7.COMPARE.001", "type": "diagnostic", "grade": 7,
            "stem": "Khẳng định nào đúng?", "skill_ids": ["MATH.G7.RATIONAL.COMPARE"],
            "options": [option("A", "-2/3 > -5/6", True), option("B", "-2/3 < -5/6", misconception_id="MIS.RATIONAL.NEGATIVE_ORDER_REVERSED"), option("C", "-2/3 = -5/6"), option("D", "Không thể so sánh")],
            "explanation": "-2/3 = -4/6, mà -4/6 > -5/6.", "provenance": [g7_l1], "review_status": REVIEW_STATUS,
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
            "id": "Q.REMED.G6.EQUIVALENT.001", "type": "remediation", "grade": 6,
            "stem": "Điền số thích hợp: 4/7 = ?/21.", "skill_ids": ["MATH.G6.FRACTION.EQUIVALENT"],
            "options": [option("A", "12", True), option("B", "4", misconception_id="MIS.FRACTION.EQUIVALENT_CHANGE_ONE_PART"), option("C", "8"), option("D", "24")],
            "explanation": "Mẫu được nhân 3 nên tử cũng phải nhân 3: 4×3=12.", "provenance": [g6_l23], "review_status": REVIEW_STATUS,
        },
        {
            "id": "Q.REMED.G7.OPPOSITE.001", "type": "remediation", "grade": 7,
            "stem": "Phép tính 1/3 - (-1/4) được đổi thành phép cộng nào?", "skill_ids": ["MATH.G7.RATIONAL.OPPOSITE"],
            "options": [option("A", "1/3 + 1/4", True), option("B", "1/3 + (-1/4)", misconception_id="MIS.RATIONAL.SUBTRACT_WITHOUT_OPPOSITE"), option("C", "-1/3 + 1/4"), option("D", "-1/3 + (-1/4)")],
            "explanation": "Trừ -1/4 là cộng với số đối của nó, tức 1/4.", "provenance": [g7_l2], "review_status": REVIEW_STATUS,
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
        },
        {
            "id": "PATH.G6_TO_G7.EQUIVALENT.ADD",
            "target_skill_id": "MATH.G7.RATIONAL.ADD_SUBTRACT",
            "root_cause_skill_id": "MATH.G6.FRACTION.EQUIVALENT",
            "estimated_minutes": 8, "max_steps": 3,
            "question_ids": ["Q.REMED.G6.EQUIVALENT.001", "Q.REMED.G6.COMMON_DENOM.001"],
            "transfer_question_ids": ["Q.TRANSFER.G7.RATIONAL.ADD.001"],
            "pass_threshold": 0.67, "on_pass": "return_to_target_skill", "on_fail": "teacher_review",
            "review_status": REVIEW_STATUS,
        },
        {
            "id": "PATH.G7.OPPOSITE.ADD_SUBTRACT",
            "target_skill_id": "MATH.G7.RATIONAL.ADD_SUBTRACT",
            "root_cause_skill_id": "MATH.G7.RATIONAL.OPPOSITE",
            "estimated_minutes": 6, "max_steps": 2,
            "question_ids": ["Q.REMED.G7.OPPOSITE.001"],
            "transfer_question_ids": ["Q.TRANSFER.G7.RATIONAL.SUB.001"],
            "pass_threshold": 1.0, "on_pass": "return_to_target_skill", "on_fail": "teacher_review",
            "review_status": REVIEW_STATUS,
        }
    ]

    demo_students = [
        {
            "id": "STUDENT_DEMO_MINH", "display_name": "Minh", "scenario": "root_cause_gap",
            "answers": {"Q.DIAG.G9.IDENTITY.001": "B", "Q.DIAG.G9.QUADRATIC.001": "B", "Q.DIAG.G9.SYSTEM.001": "A"},
            "expected": {"status": "diagnosed", "root_cause_skill_id": "MATH.G8.ALGEBRA.IDENTITIES", "confidence_min": 0.75},
        },
        {
            "id": "STUDENT_DEMO_AN", "display_name": "An", "scenario": "mastered",
            "answers": {
                "Q.DIAG.G9.IDENTITY.001": "A", "Q.DIAG.G9.RADICAL.001": "A",
                "Q.DIAG.G9.SYSTEM.001": "A", "Q.DIAG.G9.INEQUALITY.001": "A",
                "Q.DIAG.G9.QUADRATIC.001": "A", "Q.DIAG.G9.FUNCTION.001": "A",
                "Q.DIAG.G9.TRIG.001": "A", "Q.DIAG.G9.CIRCLE.001": "A",
                "Q.DIAG.G9.SOLID.001": "A", "Q.DIAG.G9.DATA.001": "A",
                "Q.DIAG.G9.PROBABILITY.001": "A", "Q.DIAG.G9.MODELING.001": "A",
            },
            "expected": {"status": "mastered", "target_skill_id": "MATH.G9.READINESS"},
        },
        {
            "id": "STUDENT_DEMO_LAN", "display_name": "Lan", "scenario": "insufficient_evidence",
            "answers": {"Q.DIAG.G9.RADICAL.001": "D"},
            "expected": {"status": "insufficient_evidence", "next_question_id": "Q.DIAG.G9.IDENTITY.001"},
        },
    ]

    # Curriculum-wide map. These are canonical assessable skills rather than a
    # chapter transcription, so one node can be mapped to different textbooks.
    curriculum_skill_specs = [
        (6, "NATURAL.DIVISIBILITY", "Vận dụng tính chia hết và phân tích thừa số nguyên tố", "Numbers", "NaturalNumbers"),
        (6, "INTEGER.CALCULATE", "Thực hiện phép tính với số nguyên", "Numbers", "Integers"),
        (6, "DECIMAL.CALCULATE", "Thực hiện phép tính với số thập phân", "Numbers", "Decimals"),
        (6, "RATIO.PERCENT", "Giải quyết bài toán tỉ số và phần trăm", "Numbers", "RatioPercent"),
        (6, "GEOMETRY.BASIC_SHAPES", "Nhận biết và tính toán với hình phẳng cơ bản", "Geometry", "PlaneGeometry"),
        (6, "GEOMETRY.SYMMETRY", "Nhận biết hình có trục hoặc tâm đối xứng", "Geometry", "Symmetry"),
        (6, "DATA.DESCRIBE", "Đọc và mô tả dữ liệu từ bảng biểu", "Statistics", "Data"),
        (6, "PROBABILITY.EXPERIMENT", "Mô tả xác suất thực nghiệm", "Probability", "Experiments"),
        (7, "REAL.IRRATIONAL", "Nhận biết số vô tỉ và căn bậc hai số học", "Numbers", "RealNumbers"),
        (7, "REAL.CALCULATE", "Thực hiện phép tính trong tập số thực", "Numbers", "RealNumbers"),
        (7, "POWER.RULES", "Vận dụng quy tắc lũy thừa", "Algebra", "Powers"),
        (7, "RATIO.PROPORTION", "Giải quyết bài toán tỉ lệ thức và đại lượng tỉ lệ", "Algebra", "Proportions"),
        (7, "ALGEBRA.EXPRESSION", "Biểu diễn và tính giá trị biểu thức đại số", "Algebra", "Expressions"),
        (7, "GEOMETRY.ANGLES_LINES", "Vận dụng quan hệ góc và đường thẳng song song", "Geometry", "LinesAngles"),
        (7, "GEOMETRY.TRIANGLE", "Vận dụng tính chất và trường hợp bằng nhau của tam giác", "Geometry", "Triangles"),
        (7, "DATA.REPRESENT", "Biểu diễn và phân tích dữ liệu bằng biểu đồ", "Statistics", "Data"),
        (7, "PROBABILITY.EVENT", "Tính xác suất của biến cố đơn giản", "Probability", "Events"),
        (8, "ALGEBRA.POLYNOMIAL", "Thực hiện phép tính với đa thức nhiều biến", "Algebra", "Polynomials"),
        (8, "ALGEBRA.IDENTITIES", "Vận dụng hằng đẳng thức đáng nhớ", "Algebra", "Identities"),
        (8, "ALGEBRA.FACTOR", "Phân tích đa thức thành nhân tử", "Algebra", "Factorization"),
        (8, "ALGEBRA.RATIONAL_EXPRESSION", "Thực hiện phép tính với phân thức đại số", "Algebra", "RationalExpressions"),
        (8, "EQUATION.LINEAR", "Giải phương trình bậc nhất một ẩn", "Algebra", "Equations"),
        (8, "FUNCTION.LINEAR", "Nhận biết và biểu diễn hàm số bậc nhất", "Algebra", "Functions"),
        (8, "GEOMETRY.QUADRILATERAL", "Vận dụng tính chất các tứ giác đặc biệt", "Geometry", "Quadrilaterals"),
        (8, "GEOMETRY.THALES", "Vận dụng định lí Thalès trong tam giác", "Geometry", "Similarity"),
        (8, "GEOMETRY.SIMILAR", "Nhận biết và vận dụng tam giác đồng dạng", "Geometry", "Similarity"),
        (8, "GEOMETRY.PYTHAGOREAN", "Vận dụng định lí Pythagore", "Geometry", "RightTriangles"),
        (8, "DATA.ANALYZE", "Phân tích dữ liệu và lựa chọn biểu đồ phù hợp", "Statistics", "Data"),
        (8, "PROBABILITY.RATIO", "Tính xác suất bằng tỉ số kết quả thuận lợi", "Probability", "Events"),
        (9, "RADICAL.SIMPLIFY", "Rút gọn biểu thức chứa căn thức bậc hai", "Algebra", "Radicals"),
        (9, "EQUATION.LINEAR_SYSTEM", "Giải hệ hai phương trình bậc nhất hai ẩn", "Algebra", "LinearSystems"),
        (9, "INEQUALITY.LINEAR", "Giải bất phương trình bậc nhất một ẩn", "Algebra", "Inequalities"),
        (9, "EQUATION.QUADRATIC", "Giải phương trình bậc hai một ẩn", "Algebra", "Quadratics"),
        (9, "FUNCTION.QUADRATIC", "Phân tích đồ thị hàm số bậc hai", "Algebra", "Functions"),
        (9, "MODELING.ALGEBRA", "Mô hình hóa bài toán thực tế bằng phương trình hoặc hệ phương trình", "Algebra", "Modeling"),
        (9, "TRIGONOMETRY.RIGHT_TRIANGLE", "Vận dụng tỉ số lượng giác trong tam giác vuông", "Geometry", "Trigonometry"),
        (9, "GEOMETRY.CIRCLE", "Vận dụng quan hệ góc, dây và tiếp tuyến của đường tròn", "Geometry", "Circles"),
        (9, "GEOMETRY.SOLID", "Tính diện tích và thể tích hình khối", "Geometry", "Solids"),
        (9, "DATA.GROUPED", "Phân tích mẫu số liệu ghép nhóm", "Statistics", "GroupedData"),
        (9, "PROBABILITY.COMPOUND", "Tính xác suất của biến cố bằng mô hình đơn giản", "Probability", "Events"),
        (9, "READINESS", "Đánh giá mức sẵn sàng Toán lớp 9", "CrossDomain", "Diagnostic"),
    ]
    # Các yêu cầu đang bị node tổng hợp ở trên che khuất được tách thành
    # micro-skill có thể quan sát/đánh giá. Số trang tham chiếu theo bản
    # Chương trình GDPT 2018 môn Toán ban hành cùng Thông tư 32/2018.
    detailed_curriculum_specs = [
        (6, "NATURAL.SET", "Biểu diễn tập hợp số tự nhiên", "Numbers", "NaturalNumbers", "Sử dụng thuật ngữ tập hợp, phần tử và các cách cho tập hợp; biểu diễn số tự nhiên trong hệ thập phân.", 47),
        (6, "NATURAL.ORDER", "So sánh các số tự nhiên", "Numbers", "NaturalNumbers", "Nhận biết thứ tự và so sánh hai số tự nhiên cho trước.", 47),
        (6, "NATURAL.OPERATIONS", "Thực hiện phép tính với số tự nhiên", "Numbers", "NaturalNumbers", "Thực hiện cộng, trừ, nhân, chia và vận dụng tính chất phép tính để tính hợp lí.", 47),
        (6, "NATURAL.POWER", "Thực hiện phép tính lũy thừa số tự nhiên", "Numbers", "NaturalNumbers", "Tính lũy thừa số mũ tự nhiên, nhân và chia hai lũy thừa cùng cơ số.", 47),
        (6, "NATURAL.PRIME", "Phân tích số tự nhiên thành thừa số nguyên tố", "Numbers", "NaturalNumbers", "Nhận biết số nguyên tố, hợp số và phân tích số tự nhiên thành tích các thừa số nguyên tố.", 48),
        (6, "NATURAL.GCD_LCM", "Xác định ước chung lớn nhất và bội chung nhỏ nhất", "Numbers", "NaturalNumbers", "Xác định UCLN, BCNN của hai hoặc ba số và vận dụng vào bài toán số học.", 48),
        (6, "INTEGER.REPRESENT", "Biểu diễn số nguyên trên trục số", "Numbers", "Integers", "Nhận biết số nguyên âm, tập hợp số nguyên, số đối và biểu diễn số nguyên trên trục số.", 48),
        (6, "INTEGER.COMPARE", "So sánh hai số nguyên", "Numbers", "Integers", "Nhận biết thứ tự và so sánh hai số nguyên, giải thích ý nghĩa số âm trong thực tiễn.", 48),
        (6, "FRACTION.VALUE_PROBLEM", "Giải bài toán về giá trị phân số", "Numbers", "Fractions", "Tính giá trị phân số của một số và tìm một số khi biết giá trị phân số của số đó.", 49),
        (6, "DECIMAL.COMPARE", "So sánh hai số thập phân", "Numbers", "Decimals", "Nhận biết số thập phân âm, số đối và so sánh hai số thập phân.", 50),
        (6, "DECIMAL.ROUND", "Làm tròn và ước lượng số thập phân", "Numbers", "Decimals", "Thực hiện ước lượng và làm tròn số thập phân phù hợp với tình huống.", 50),
        (6, "RATIO.CALCULATE_PERCENT", "Tính tỉ số và tỉ số phần trăm", "Numbers", "RatioPercent", "Tính tỉ số, tỉ số phần trăm, giá trị phần trăm và đại lượng ban đầu.", 50),
        (6, "GEOMETRY.REGULAR_SHAPES", "Mô tả và tạo lập hình phẳng đều", "Geometry", "PlaneGeometry", "Nhận dạng, mô tả, vẽ tam giác đều, hình vuông và tạo lập lục giác đều.", 50),
        (6, "GEOMETRY.QUADRILATERALS", "Mô tả và vẽ các tứ giác đặc biệt", "Geometry", "PlaneGeometry", "Mô tả cạnh, góc, đường chéo và vẽ hình chữ nhật, hình thoi, hình bình hành, hình thang cân.", 51),
        (6, "GEOMETRY.PERIMETER_AREA", "Tính chu vi và diện tích hình phẳng", "Geometry", "Measurement", "Giải quyết vấn đề thực tiễn về chu vi và diện tích các hình phẳng đã học.", 51),
        (6, "GEOMETRY.POINT_LINE_RAY", "Nhận biết điểm, đường thẳng và tia", "Geometry", "PlaneGeometry", "Nhận biết quan hệ điểm - đường thẳng, đường cắt nhau, song song, thẳng hàng, điểm nằm giữa và tia.", 52),
        (6, "GEOMETRY.SEGMENT", "Xác định đoạn thẳng và trung điểm", "Geometry", "Measurement", "Nhận biết đoạn thẳng, độ dài đoạn thẳng và trung điểm của đoạn thẳng.", 52),
        (6, "GEOMETRY.ANGLE", "Nhận biết và đo các loại góc", "Geometry", "Angles", "Nhận biết góc, điểm trong góc, góc đặc biệt và số đo góc.", 52),
        (6, "DATA.COLLECT", "Thu thập và phân loại dữ liệu", "Statistics", "Data", "Thu thập, phân loại dữ liệu theo tiêu chí và nhận biết tính hợp lí của dữ liệu.", 53),
        (6, "DATA.REPRESENT", "Biểu diễn dữ liệu bằng bảng và biểu đồ", "Statistics", "Data", "Lựa chọn và biểu diễn dữ liệu bằng bảng, biểu đồ tranh, biểu đồ cột hoặc cột kép.", 53),
        (6, "DATA.INTERPRET", "Phân tích dữ liệu từ bảng và biểu đồ", "Statistics", "Data", "Nhận ra quy luật và giải quyết vấn đề đơn giản từ bảng và biểu đồ thống kê.", 53),
        (6, "PROBABILITY.MODEL", "Mô tả mô hình xác suất đơn giản", "Probability", "Experiments", "Nhận biết các kết quả có thể xảy ra trong trò chơi hoặc thí nghiệm xác suất đơn giản.", 53),
        (6, "PROBABILITY.EMPIRICAL", "Tính xác suất thực nghiệm bằng phân số", "Probability", "Experiments", "Dùng phân số mô tả xác suất thực nghiệm qua số lần lặp lại của một sự kiện.", 54),
        (7, "RATIONAL.NUMBER_LINE", "Biểu diễn số hữu tỉ trên trục số", "Numbers", "RationalNumbers", "Biểu diễn số hữu tỉ trên trục số và nhận biết số đối.", 55),
        (7, "RATIONAL.POWER", "Thực hiện lũy thừa của số hữu tỉ", "Numbers", "RationalNumbers", "Tính lũy thừa số mũ tự nhiên của số hữu tỉ và vận dụng các tính chất cơ bản.", 56),
        (7, "REAL.SQRT", "Tính căn bậc hai số học", "Numbers", "RealNumbers", "Nhận biết căn bậc hai số học và tính giá trị đúng hoặc gần đúng bằng máy tính.", 56),
        (7, "REAL.REPRESENT", "Biểu diễn số thực trên trục số", "Numbers", "RealNumbers", "Nhận biết số vô tỉ, số thực, số đối và biểu diễn số thực trên trục số trong trường hợp thuận lợi.", 56),
        (7, "REAL.ABS_ROUND", "Tính giá trị tuyệt đối và làm tròn số thực", "Numbers", "RealNumbers", "Nhận biết giá trị tuyệt đối; ước lượng và làm tròn theo độ chính xác cho trước.", 57),
        (7, "RATIO.EQUAL_RATIOS", "Vận dụng dãy tỉ số bằng nhau", "Algebra", "Proportions", "Nhận biết và vận dụng tính chất tỉ lệ thức, dãy tỉ số bằng nhau trong giải toán.", 57),
        (7, "RATIO.DIRECT_INVERSE", "Giải bài toán đại lượng tỉ lệ", "Algebra", "Proportions", "Nhận biết đại lượng tỉ lệ thuận, tỉ lệ nghịch và giải bài toán liên quan.", 57),
        (7, "ALGEBRA.MONOMIAL_POLYNOMIAL", "Thực hiện phép tính với đa thức một biến", "Algebra", "Polynomials", "Nhận biết đơn thức, đa thức một biến; cộng, trừ, nhân và chia đa thức một biến.", 58),
        (7, "ALGEBRA.POLYNOMIAL_ROOT", "Xác định nghiệm của đa thức một biến", "Algebra", "Polynomials", "Tính giá trị đa thức và nhận biết nghiệm của đa thức một biến.", 58),
        (7, "GEOMETRY.PRISM", "Mô tả và tính toán với lăng trụ đứng", "Geometry", "Solids", "Mô tả hình hộp, hình lập phương, lăng trụ đứng và tính diện tích, thể tích.", 58),
        (7, "GEOMETRY.ANGLE_RELATIONS", "Nhận biết các quan hệ góc", "Geometry", "LinesAngles", "Nhận biết góc kề bù, đối đỉnh, tia phân giác và các góc tạo bởi đường thẳng cắt hai đường thẳng.", 59),
        (7, "GEOMETRY.PARALLEL", "Giải thích tính chất hai đường thẳng song song", "Geometry", "LinesAngles", "Vận dụng tiên đề Euclid và dấu hiệu nhận biết hai đường thẳng song song.", 59),
        (7, "GEOMETRY.TRIANGLE_CONGRUENCE", "Chứng minh hai tam giác bằng nhau", "Geometry", "Triangles", "Vận dụng các trường hợp bằng nhau của tam giác và tam giác vuông.", 60),
        (7, "GEOMETRY.TRIANGLE_SPECIAL_LINES", "Vận dụng các đường đặc biệt trong tam giác", "Geometry", "Triangles", "Nhận biết trung tuyến, đường cao, phân giác, trung trực và sự đồng quy.", 60),
        (7, "DATA.PIE_LINE_CHART", "Biểu diễn dữ liệu bằng biểu đồ quạt và đoạn thẳng", "Statistics", "Data", "Lựa chọn, vẽ và phân tích biểu đồ hình quạt tròn, biểu đồ đoạn thẳng.", 61),
        (7, "PROBABILITY.EVENT_CLASSIFY", "Phân loại biến cố trong mô hình xác suất", "Probability", "Events", "Nhận biết biến cố chắc chắn, không thể và ngẫu nhiên trong các ví dụ đơn giản.", 62),
        (8, "ALGEBRA.POLYNOMIAL_CONCEPT", "Nhận biết đa thức nhiều biến", "Algebra", "Polynomials", "Nhận biết đơn thức, đa thức nhiều biến, thu gọn và tính giá trị.", 63),
        (8, "ALGEBRA.RATIONAL_DOMAIN", "Xác định điều kiện của phân thức đại số", "Algebra", "RationalExpressions", "Nhận biết phân thức, điều kiện xác định, giá trị và hai phân thức bằng nhau.", 64),
        (8, "FUNCTION.LINEAR_GRAPH", "Vẽ đồ thị hàm số bậc nhất", "Algebra", "Functions", "Thiết lập bảng giá trị, vẽ đồ thị và nhận biết hệ số góc của đường thẳng.", 65),
        (8, "GEOMETRY.PYTHAGOREAN_CONVERSE", "Vận dụng định lí Pythagore và định lí đảo", "Geometry", "RightTriangles", "Tính độ dài cạnh và nhận biết tam giác vuông bằng định lí Pythagore thuận, đảo.", 66),
        (8, "GEOMETRY.QUADRILATERAL_CLASSIFY", "Phân loại các tứ giác đặc biệt", "Geometry", "Quadrilaterals", "Giải thích tính chất và dấu hiệu nhận biết hình thang cân, bình hành, chữ nhật, thoi, vuông.", 66),
        (8, "GEOMETRY.MIDLINE", "Vận dụng đường trung bình của tam giác", "Geometry", "Similarity", "Mô tả và vận dụng tính chất đường trung bình của tam giác.", 67),
        (8, "GEOMETRY.ANGLE_BISECTOR", "Vận dụng tính chất đường phân giác trong tam giác", "Geometry", "Similarity", "Tính độ dài và lập tỉ lệ bằng tính chất đường phân giác trong tam giác.", 67),
        (8, "DATA.CONVERT", "Chuyển đổi giữa các dạng biểu diễn dữ liệu", "Statistics", "Data", "So sánh và chuyển dữ liệu giữa bảng, biểu đồ cột, quạt tròn và đoạn thẳng.", 68),
        (8, "DATA.FREQUENCY", "Xác định tần số của dữ liệu", "Statistics", "Frequency", "Xác định tần số, phát hiện quy luật và giải quyết vấn đề từ dữ liệu thống kê.", 69),
        (8, "PROBABILITY.THEORETICAL", "Mô tả xác suất lí thuyết bằng tỉ số", "Probability", "Events", "Dùng tỉ số mô tả xác suất và liên hệ xác suất thực nghiệm với xác suất của biến cố.", 69),
        (9, "RADICAL.NUMBER", "Tính căn bậc hai và căn bậc ba của số thực", "Algebra", "Radicals", "Nhận biết, tính và biến đổi đơn giản căn bậc hai, căn bậc ba của số thực.", 71),
        (9, "RADICAL.EXPRESSION_DOMAIN", "Xác định điều kiện của căn thức", "Algebra", "Radicals", "Nhận biết căn thức bậc hai, bậc ba của biểu thức và xác định điều kiện có nghĩa.", 71),
        (9, "RADICAL.RATIONALIZE", "Trục căn thức ở mẫu", "Algebra", "Radicals", "Biến đổi căn thức bậc hai của biểu thức và trục căn thức ở mẫu.", 71),
        (9, "FUNCTION.QUADRATIC.TABLE_GRAPH", "Vẽ đồ thị hàm số bậc hai", "Algebra", "Functions", "Lập bảng giá trị, vẽ đồ thị y=ax² và nhận biết trục đối xứng.", 71),
        (9, "EQUATION.PRODUCT", "Giải phương trình tích", "Algebra", "Equations", "Giải phương trình tích của hai nhân tử bậc nhất.", 72),
        (9, "EQUATION.RATIONAL", "Giải phương trình chứa ẩn ở mẫu", "Algebra", "Equations", "Xác định điều kiện và giải phương trình chứa ẩn ở mẫu quy về bậc nhất.", 72),
        (9, "EQUATION.VIETE", "Vận dụng định lí Viète", "Algebra", "Quadratics", "Giải thích và vận dụng định lí Viète để tính nhẩm nghiệm, tìm hai số biết tổng và tích.", 72),
        (9, "INEQUALITY.PROPERTIES", "Vận dụng tính chất bất đẳng thức", "Algebra", "Inequalities", "Nhận biết bất đẳng thức và vận dụng tính bắc cầu, liên hệ thứ tự với phép cộng và phép nhân.", 73),
        (9, "GEOMETRY.CYLINDER_CONE_SPHERE", "Mô tả hình trụ, hình nón và hình cầu", "Geometry", "Solids", "Mô tả, tạo lập và nhận biết các yếu tố của hình trụ, hình nón, hình cầu.", 73),
        (9, "GEOMETRY.SOLID_MEASURE", "Tính diện tích và thể tích khối tròn xoay", "Geometry", "Solids", "Tính diện tích xung quanh và thể tích hình trụ, hình nón, hình cầu.", 73),
        (9, "TRIGONOMETRY.RATIOS", "Tính tỉ số lượng giác của góc nhọn", "Geometry", "Trigonometry", "Nhận biết và tính sin, cos, tan, cot của góc nhọn, kể cả góc đặc biệt.", 74),
        (9, "TRIGONOMETRY.SOLVE_TRIANGLE", "Giải tam giác vuông", "Geometry", "Trigonometry", "Vận dụng hệ thức cạnh - góc để tính độ dài, số đo góc và giải bài toán thực tiễn.", 74),
        (9, "GEOMETRY.CIRCLE_POSITIONS", "Xác định vị trí tương đối với đường tròn", "Geometry", "Circles", "Mô tả vị trí tương đối của hai đường tròn và của đường thẳng với đường tròn.", 74),
        (9, "GEOMETRY.CIRCLE_TANGENT", "Vận dụng tính chất tiếp tuyến đường tròn", "Geometry", "Circles", "Nhận biết tiếp tuyến và giải thích tính chất hai tiếp tuyến cắt nhau.", 74),
        (9, "GEOMETRY.CIRCLE_ANGLES", "Vận dụng góc ở tâm và góc nội tiếp", "Geometry", "Circles", "Liên hệ số đo cung, góc ở tâm và góc nội tiếp cùng chắn một cung.", 75),
        (9, "GEOMETRY.INSCRIBED_CIRCLES", "Xác định đường tròn nội tiếp và ngoại tiếp tam giác", "Geometry", "Circles", "Xác định tâm, bán kính đường tròn nội tiếp và ngoại tiếp tam giác.", 75),
        (9, "GEOMETRY.CYCLIC_QUADRILATERAL", "Vận dụng tính chất tứ giác nội tiếp", "Geometry", "Circles", "Nhận biết tứ giác nội tiếp và vận dụng tổng hai góc đối bằng 180 độ.", 75),
        (9, "GEOMETRY.ARC_SECTOR", "Tính độ dài cung và diện tích hình quạt", "Geometry", "Circles", "Tính độ dài cung, diện tích hình quạt và hình vành khuyên.", 75),
        (9, "GEOMETRY.REGULAR_POLYGON", "Mô tả đa giác đều và phép quay", "Geometry", "RegularPolygons", "Nhận dạng đa giác đều và mô tả các phép quay giữ nguyên hình.", 76),
        (9, "DATA.FREQUENCY_TABLE", "Thiết lập bảng và biểu đồ tần số", "Statistics", "Frequency", "Xác định tần số, lập bảng tần số và biểu đồ tần số.", 76),
        (9, "DATA.RELATIVE_FREQUENCY", "Thiết lập bảng tần số tương đối", "Statistics", "Frequency", "Xác định tần số tương đối và lập bảng, biểu đồ tần số tương đối.", 77),
        (9, "DATA.GROUPED_FREQUENCY", "Thiết lập bảng tần số ghép nhóm", "Statistics", "GroupedData", "Lập bảng tần số, tần số tương đối ghép nhóm và biểu đồ tương ứng.", 77),
        (9, "PROBABILITY.SAMPLE_SPACE", "Xác định phép thử và không gian mẫu", "Probability", "Events", "Nhận biết phép thử ngẫu nhiên, không gian mẫu và các kết quả có thể.", 77),
        (9, "PROBABILITY.COUNT", "Tính xác suất bằng phương pháp kiểm đếm", "Probability", "Events", "Tính xác suất qua số trường hợp thuận lợi và số trường hợp có thể trong mô hình đơn giản.", 77),
    ]
    existing_skill_ids = {item["id"] for item in skills}
    for grade, suffix, name, domain, subdomain in curriculum_skill_specs:
        code = f"MATH.G{grade}.{suffix}"
        if code not in existing_skill_ids:
            skills.append(skill(code, name, grade, domain, subdomain, name + " theo yêu cầu cần đạt của chương trình.", curriculum_source))
    for grade, suffix, name, domain, subdomain, description, page in detailed_curriculum_specs:
        code = f"MATH.G{grade}.{suffix}"
        if code not in existing_skill_ids:
            source = dict(curriculum_source)
            source["pdf_pages"] = [page]
            source["lesson"] = f"Chương trình GDPT 2018 môn Toán - yêu cầu cần đạt lớp {grade}"
            skills.append(skill(code, name, grade, domain, subdomain, description, source))

    # Mapping Toán 6 KNTT Tập 1. Các node trùng nghĩa chỉ nhận thêm
    # provenance; các hành vi cần đánh giá độc lập mới trở thành node mới.
    def kntt_g6_t1_source(start: int, end: int, lesson: str) -> dict[str, Any]:
        return provenance("KNTT_TOAN_6_T1", list(range(start, end + 1)), lesson)

    kntt_g6_t1_new_specs = [
        ("SET.DESCRIBE_LIST", "Mô tả tập hợp bằng cách liệt kê phần tử", "Viết tập hợp bằng cách liệt kê mỗi phần tử một lần trong dấu ngoặc nhọn.", "Numbers", "Sets", 5, 9, "Bài 1. Tập hợp"),
        ("SET.DESCRIBE_CHARACTERISTIC", "Mô tả tập hợp bằng dấu hiệu đặc trưng", "Xác định và viết dấu hiệu đặc trưng chung cho các phần tử của một tập hợp.", "Numbers", "Sets", 5, 9, "Bài 1. Tập hợp"),
        ("NUM.READ_WRITE_DECIMAL", "Đọc và viết số tự nhiên trong hệ thập phân", "Đọc, viết số tự nhiên nhiều chữ số theo đúng lớp và hàng trong hệ thập phân.", "Numbers", "NaturalNumbers", 10, 13, "Bài 2. Cách ghi số tự nhiên"),
        ("NUM.VALUE_EXPANSION", "Phân tích số tự nhiên theo giá trị hàng", "Biểu diễn số tự nhiên thành tổng giá trị các chữ số theo vị trí hàng.", "Numbers", "NaturalNumbers", 10, 13, "Bài 2. Cách ghi số tự nhiên"),
        ("NUM.ROMAN_CONVERSION", "Đọc và viết số La Mã từ 1 đến 30", "Chuyển đổi qua lại giữa số tự nhiên và số La Mã trong phạm vi 30.", "Numbers", "RomanNumerals", 10, 13, "Bài 2. Cách ghi số tự nhiên"),
        ("NUM.NUMBER_LINE", "Biểu diễn số tự nhiên trên tia số", "Xác định vị trí và thứ tự của số tự nhiên trên tia số.", "Numbers", "NaturalNumbers", 14, 15, "Bài 3. Thứ tự trong tập hợp các số tự nhiên"),
        ("OPS.ADD_PROPERTIES", "Vận dụng tính chất phép cộng số tự nhiên", "Vận dụng tính giao hoán và kết hợp của phép cộng để tính nhẩm, tính hợp lí.", "Numbers", "NaturalOperations", 15, 17, "Bài 4. Phép cộng và phép trừ số tự nhiên"),
        ("OPS.MUL_DISTRIBUTIVE", "Vận dụng tính chất phân phối để tính nhẩm", "Vận dụng tính chất phân phối của phép nhân đối với phép cộng hoặc trừ.", "Numbers", "NaturalOperations", 17, 20, "Bài 5. Phép nhân và phép chia số tự nhiên"),
        ("POW.MULTIPLY_SAME_BASE", "Nhân hai lũy thừa cùng cơ số", "Giữ nguyên cơ số và cộng số mũ khi nhân hai lũy thừa cùng cơ số.", "Numbers", "Powers", 22, 25, "Bài 6. Lũy thừa với số mũ tự nhiên"),
        ("POW.DIVIDE_SAME_BASE", "Chia hai lũy thừa cùng cơ số", "Giữ nguyên cơ số và trừ số mũ khi chia hai lũy thừa cùng cơ số khác 0.", "Numbers", "Powers", 22, 25, "Bài 6. Lũy thừa với số mũ tự nhiên"),
        ("ORDER.NO_BRACKETS", "Tính biểu thức không có dấu ngoặc", "Thực hiện lũy thừa, nhân chia, cộng trừ theo đúng thứ tự trong biểu thức không có ngoặc.", "Numbers", "OrderOfOperations", 25, 28, "Bài 7. Thứ tự thực hiện các phép tính"),
        ("ORDER.WITH_BRACKETS", "Tính biểu thức có dấu ngoặc", "Thực hiện đúng thứ tự ngoặc tròn, ngoặc vuông, ngoặc nhọn trước các phép tính còn lại.", "Numbers", "OrderOfOperations", 25, 28, "Bài 7. Thứ tự thực hiện các phép tính"),
        ("DIV.CONCEPT", "Nhận biết quan hệ chia hết, ước và bội", "Xác định quan hệ chia hết và nhận biết ước, bội của một số tự nhiên.", "Numbers", "Divisibility", 29, 34, "Bài 8. Quan hệ chia hết và tính chất"),
        ("DIV.SUM_PROPERTY", "Vận dụng tính chia hết của tổng và hiệu", "Xác định tính chia hết của tổng hoặc hiệu từ tính chia hết của các số hạng.", "Numbers", "Divisibility", 29, 34, "Bài 8. Quan hệ chia hết và tính chất"),
        ("DIV.RULES_2_5", "Vận dụng dấu hiệu chia hết cho 2 và 5", "Xác định số tự nhiên chia hết cho 2 hoặc 5 dựa vào chữ số tận cùng.", "Numbers", "Divisibility", 34, 38, "Bài 9. Dấu hiệu chia hết"),
        ("DIV.RULES_3_9", "Vận dụng dấu hiệu chia hết cho 3 và 9", "Xác định số tự nhiên chia hết cho 3 hoặc 9 dựa vào tổng các chữ số.", "Numbers", "Divisibility", 34, 38, "Bài 9. Dấu hiệu chia hết"),
        ("FACTOR.GCF_FIND", "Xác định ước chung lớn nhất", "Tìm ước chung lớn nhất của hai hoặc nhiều số tự nhiên.", "Numbers", "Divisibility", 44, 49, "Bài 11. Ước chung. Ước chung lớn nhất"),
        ("MULTIPLE.LCM_FIND", "Xác định bội chung nhỏ nhất", "Tìm bội chung nhỏ nhất của hai hoặc nhiều số tự nhiên.", "Numbers", "Divisibility", 49, 54, "Bài 12. Bội chung. Bội chung nhỏ nhất"),
        ("INT.ADD_SAME_SIGN", "Cộng hai số nguyên cùng dấu", "Cộng giá trị tuyệt đối và giữ dấu chung của hai số nguyên cùng dấu.", "Numbers", "IntegerOperations", 62, 67, "Bài 14. Phép cộng và phép trừ số nguyên"),
        ("INT.ADD_DIFF_SIGN", "Cộng hai số nguyên khác dấu", "Lấy hiệu hai giá trị tuyệt đối và đặt dấu của số có giá trị tuyệt đối lớn hơn.", "Numbers", "IntegerOperations", 62, 67, "Bài 14. Phép cộng và phép trừ số nguyên"),
        ("INT.SUBTRACT", "Trừ hai số nguyên", "Chuyển phép trừ số nguyên thành phép cộng với số đối rồi tính.", "Numbers", "IntegerOperations", 62, 67, "Bài 14. Phép cộng và phép trừ số nguyên"),
        ("INT.BRACKETS_RULE", "Bỏ dấu ngoặc trong biểu thức số nguyên", "Bỏ dấu ngoặc đúng quy tắc và xử lí dấu của các số hạng trong biểu thức.", "Numbers", "IntegerOperations", 67, 69, "Bài 15. Quy tắc dấu ngoặc"),
        ("INT.MULTIPLY_DIFF", "Nhân hai số nguyên khác dấu", "Nhân hai giá trị tuyệt đối và đặt dấu âm cho tích của hai số nguyên khác dấu.", "Numbers", "IntegerOperations", 70, 73, "Bài 16. Phép nhân số nguyên"),
        ("INT.MULTIPLY_SAME", "Nhân hai số nguyên cùng dấu", "Nhân hai giá trị tuyệt đối và đặt dấu dương cho tích của hai số nguyên cùng dấu.", "Numbers", "IntegerOperations", 70, 73, "Bài 16. Phép nhân số nguyên"),
        ("INT.DIVISIBILITY", "Xác định ước và bội của số nguyên", "Thực hiện phép chia hết và xác định ước, bội trong tập hợp số nguyên.", "Numbers", "IntegerDivisibility", 73, 75, "Bài 17. Phép chia hết. Ước và bội của một số nguyên"),
        ("SYM.AXIAL", "Nhận biết hình có trục đối xứng", "Xác định trục đối xứng của hình phẳng và nhận biết đối xứng trục trong thực tiễn.", "Geometry", "Symmetry", 98, 103, "Bài 21. Hình có trục đối xứng"),
        ("SYM.CENTRAL", "Nhận biết hình có tâm đối xứng", "Xác định tâm đối xứng của hình phẳng và nhận biết đối xứng tâm trong thực tiễn.", "Geometry", "Symmetry", 103, 111, "Bài 22. Hình có tâm đối xứng"),
    ]
    for suffix, name, description, domain, subdomain, start, end, lesson in kntt_g6_t1_new_specs:
        code = f"MATH.G6.{suffix}"
        if code not in {item["id"] for item in skills}:
            skills.append(skill(code, name, 6, domain, subdomain, description, kntt_g6_t1_source(start, end, lesson)))

    kntt_g6_t1_existing_mappings = [
        ("MATH.G6.NATURAL.SET", 5, 9, "Bài 1. Tập hợp"),
        ("MATH.G6.NATURAL.ORDER", 14, 15, "Bài 3. Thứ tự trong tập hợp các số tự nhiên"),
        ("MATH.G6.NATURAL.OPERATIONS", 15, 20, "Bài 4–5. Các phép tính với số tự nhiên"),
        ("MATH.G6.NATURAL.POWER", 22, 25, "Bài 6. Lũy thừa với số mũ tự nhiên"),
        ("MATH.G6.NATURAL.DIVISIBILITY", 29, 54, "Bài 8–12. Tính chia hết trong tập hợp số tự nhiên"),
        ("MATH.G6.NATURAL.PRIME", 38, 43, "Bài 10. Số nguyên tố"),
        ("MATH.G6.NATURAL.GCD_LCM", 44, 54, "Bài 11–12. Ước chung và bội chung"),
        ("MATH.G6.FRACTION.REDUCE", 44, 49, "Bài 11. Ước chung. Ước chung lớn nhất"),
        ("MATH.G6.FRACTION.COMMON_DENOMINATOR", 49, 54, "Bài 12. Bội chung. Bội chung nhỏ nhất"),
        ("MATH.G6.INTEGER.REPRESENT", 57, 62, "Bài 13. Tập hợp các số nguyên"),
        ("MATH.G6.INTEGER.COMPARE", 57, 62, "Bài 13. Tập hợp các số nguyên"),
        ("MATH.G6.INTEGER.CALCULATE", 62, 75, "Bài 14–17. Các phép tính với số nguyên"),
        ("MATH.G6.GEOMETRY.REGULAR_SHAPES", 77, 83, "Bài 18. Tam giác đều, hình vuông, lục giác đều"),
        ("MATH.G6.GEOMETRY.QUADRILATERALS", 83, 90, "Bài 19. Các tứ giác thường gặp"),
        ("MATH.G6.GEOMETRY.PERIMETER_AREA", 90, 97, "Bài 20. Chu vi và diện tích một số tứ giác"),
        ("MATH.G6.GEOMETRY.SYMMETRY", 98, 111, "Bài 21–22. Trục đối xứng và tâm đối xứng"),
    ]
    skill_by_id = {item["id"]: item for item in skills}
    for skill_id, start, end, lesson in kntt_g6_t1_existing_mappings:
        skill_by_id[skill_id]["provenance"].append(kntt_g6_t1_source(start, end, lesson))

    curriculum_edges = [
        ("MATH.G6.NATURAL.SET", "MATH.G6.SET.DESCRIBE_LIST"),
        ("MATH.G6.NATURAL.SET", "MATH.G6.SET.DESCRIBE_CHARACTERISTIC"),
        ("MATH.G6.NUM.READ_WRITE_DECIMAL", "MATH.G6.NUM.VALUE_EXPANSION"),
        ("MATH.G6.NUM.READ_WRITE_DECIMAL", "MATH.G6.NATURAL.ORDER"),
        ("MATH.G6.NATURAL.ORDER", "MATH.G6.NUM.NUMBER_LINE"),
        ("MATH.G6.NATURAL.OPERATIONS", "MATH.G6.OPS.ADD_PROPERTIES"),
        ("MATH.G6.NATURAL.OPERATIONS", "MATH.G6.OPS.MUL_DISTRIBUTIVE"),
        ("MATH.G6.NATURAL.POWER", "MATH.G6.POW.MULTIPLY_SAME_BASE"),
        ("MATH.G6.POW.MULTIPLY_SAME_BASE", "MATH.G6.POW.DIVIDE_SAME_BASE"),
        ("MATH.G6.NATURAL.OPERATIONS", "MATH.G6.ORDER.NO_BRACKETS"),
        ("MATH.G6.ORDER.NO_BRACKETS", "MATH.G6.ORDER.WITH_BRACKETS"),
        ("MATH.G6.NATURAL.OPERATIONS", "MATH.G6.DIV.CONCEPT"),
        ("MATH.G6.DIV.CONCEPT", "MATH.G6.DIV.SUM_PROPERTY"),
        ("MATH.G6.DIV.CONCEPT", "MATH.G6.DIV.RULES_2_5"),
        ("MATH.G6.DIV.CONCEPT", "MATH.G6.DIV.RULES_3_9"),
        ("MATH.G6.NATURAL.PRIME", "MATH.G6.FACTOR.GCF_FIND"),
        ("MATH.G6.NATURAL.PRIME", "MATH.G6.MULTIPLE.LCM_FIND"),
        ("MATH.G6.INTEGER.REPRESENT", "MATH.G6.INT.ADD_SAME_SIGN"),
        ("MATH.G6.INTEGER.REPRESENT", "MATH.G6.INT.ADD_DIFF_SIGN"),
        ("MATH.G6.INT.ADD_SAME_SIGN", "MATH.G6.INT.SUBTRACT"),
        ("MATH.G6.INT.ADD_DIFF_SIGN", "MATH.G6.INT.SUBTRACT"),
        ("MATH.G6.INT.SUBTRACT", "MATH.G6.INT.BRACKETS_RULE"),
        ("MATH.G6.INTEGER.REPRESENT", "MATH.G6.INT.MULTIPLY_DIFF"),
        ("MATH.G6.INTEGER.REPRESENT", "MATH.G6.INT.MULTIPLY_SAME"),
        ("MATH.G6.INT.MULTIPLY_DIFF", "MATH.G6.INT.DIVISIBILITY"),
        ("MATH.G6.INT.MULTIPLY_SAME", "MATH.G6.INT.DIVISIBILITY"),
        ("MATH.G6.GEOMETRY.REGULAR_SHAPES", "MATH.G6.SYM.AXIAL"),
        ("MATH.G6.GEOMETRY.QUADRILATERALS", "MATH.G6.SYM.CENTRAL"),
        ("MATH.G6.NATURAL.SET", "MATH.G6.NATURAL.ORDER"),
        ("MATH.G6.NATURAL.ORDER", "MATH.G6.NATURAL.OPERATIONS"),
        ("MATH.G6.NATURAL.OPERATIONS", "MATH.G6.NATURAL.POWER"),
        ("MATH.G6.NATURAL.OPERATIONS", "MATH.G6.NATURAL.PRIME"),
        ("MATH.G6.NATURAL.PRIME", "MATH.G6.NATURAL.GCD_LCM"),
        ("MATH.G6.NATURAL.GCD_LCM", "MATH.G6.FRACTION.COMMON_DENOMINATOR"),
        ("MATH.G6.INTEGER.REPRESENT", "MATH.G6.INTEGER.COMPARE"),
        ("MATH.G6.INTEGER.COMPARE", "MATH.G6.INTEGER.CALCULATE"),
        ("MATH.G6.FRACTION.ADD_SUBTRACT", "MATH.G6.FRACTION.VALUE_PROBLEM"),
        ("MATH.G6.DECIMAL.COMPARE", "MATH.G6.DECIMAL.CALCULATE"),
        ("MATH.G6.DECIMAL.CALCULATE", "MATH.G6.DECIMAL.ROUND"),
        ("MATH.G6.DECIMAL.CALCULATE", "MATH.G6.RATIO.CALCULATE_PERCENT"),
        ("MATH.G6.GEOMETRY.REGULAR_SHAPES", "MATH.G6.GEOMETRY.QUADRILATERALS"),
        ("MATH.G6.GEOMETRY.QUADRILATERALS", "MATH.G6.GEOMETRY.PERIMETER_AREA"),
        ("MATH.G6.GEOMETRY.POINT_LINE_RAY", "MATH.G6.GEOMETRY.SEGMENT"),
        ("MATH.G6.GEOMETRY.POINT_LINE_RAY", "MATH.G6.GEOMETRY.ANGLE"),
        ("MATH.G6.DATA.COLLECT", "MATH.G6.DATA.REPRESENT"),
        ("MATH.G6.DATA.REPRESENT", "MATH.G6.DATA.INTERPRET"),
        ("MATH.G6.PROBABILITY.MODEL", "MATH.G6.PROBABILITY.EMPIRICAL"),
        ("MATH.G7.RATIONAL.RECOGNIZE", "MATH.G7.RATIONAL.NUMBER_LINE"),
        ("MATH.G7.RATIONAL.MULTIPLY_DIVIDE", "MATH.G7.RATIONAL.POWER"),
        ("MATH.G7.REAL.IRRATIONAL", "MATH.G7.REAL.SQRT"),
        ("MATH.G7.REAL.IRRATIONAL", "MATH.G7.REAL.REPRESENT"),
        ("MATH.G7.REAL.REPRESENT", "MATH.G7.REAL.ABS_ROUND"),
        ("MATH.G7.RATIO.PROPORTION", "MATH.G7.RATIO.EQUAL_RATIOS"),
        ("MATH.G7.RATIO.EQUAL_RATIOS", "MATH.G7.RATIO.DIRECT_INVERSE"),
        ("MATH.G7.ALGEBRA.EXPRESSION", "MATH.G7.ALGEBRA.MONOMIAL_POLYNOMIAL"),
        ("MATH.G7.ALGEBRA.MONOMIAL_POLYNOMIAL", "MATH.G7.ALGEBRA.POLYNOMIAL_ROOT"),
        ("MATH.G6.GEOMETRY.ANGLE", "MATH.G7.GEOMETRY.ANGLE_RELATIONS"),
        ("MATH.G7.GEOMETRY.ANGLE_RELATIONS", "MATH.G7.GEOMETRY.PARALLEL"),
        ("MATH.G7.GEOMETRY.TRIANGLE", "MATH.G7.GEOMETRY.TRIANGLE_CONGRUENCE"),
        ("MATH.G7.GEOMETRY.TRIANGLE_CONGRUENCE", "MATH.G7.GEOMETRY.TRIANGLE_SPECIAL_LINES"),
        ("MATH.G6.DATA.REPRESENT", "MATH.G7.DATA.PIE_LINE_CHART"),
        ("MATH.G6.PROBABILITY.MODEL", "MATH.G7.PROBABILITY.EVENT_CLASSIFY"),
        ("MATH.G7.ALGEBRA.MONOMIAL_POLYNOMIAL", "MATH.G8.ALGEBRA.POLYNOMIAL_CONCEPT"),
        ("MATH.G8.ALGEBRA.FACTOR", "MATH.G8.ALGEBRA.RATIONAL_DOMAIN"),
        ("MATH.G8.ALGEBRA.RATIONAL_DOMAIN", "MATH.G8.ALGEBRA.RATIONAL_EXPRESSION"),
        ("MATH.G8.FUNCTION.LINEAR", "MATH.G8.FUNCTION.LINEAR_GRAPH"),
        ("MATH.G7.GEOMETRY.TRIANGLE", "MATH.G8.GEOMETRY.PYTHAGOREAN_CONVERSE"),
        ("MATH.G7.GEOMETRY.ANGLES_LINES", "MATH.G8.GEOMETRY.QUADRILATERAL_CLASSIFY"),
        ("MATH.G8.GEOMETRY.THALES", "MATH.G8.GEOMETRY.MIDLINE"),
        ("MATH.G8.GEOMETRY.THALES", "MATH.G8.GEOMETRY.ANGLE_BISECTOR"),
        ("MATH.G7.DATA.PIE_LINE_CHART", "MATH.G8.DATA.CONVERT"),
        ("MATH.G8.DATA.CONVERT", "MATH.G8.DATA.FREQUENCY"),
        ("MATH.G7.PROBABILITY.EVENT_CLASSIFY", "MATH.G8.PROBABILITY.THEORETICAL"),
        ("MATH.G7.REAL.SQRT", "MATH.G9.RADICAL.NUMBER"),
        ("MATH.G9.RADICAL.NUMBER", "MATH.G9.RADICAL.EXPRESSION_DOMAIN"),
        ("MATH.G9.RADICAL.EXPRESSION_DOMAIN", "MATH.G9.RADICAL.SIMPLIFY"),
        ("MATH.G9.RADICAL.SIMPLIFY", "MATH.G9.RADICAL.RATIONALIZE"),
        ("MATH.G8.FUNCTION.LINEAR_GRAPH", "MATH.G9.FUNCTION.QUADRATIC.TABLE_GRAPH"),
        ("MATH.G8.EQUATION.LINEAR", "MATH.G9.EQUATION.PRODUCT"),
        ("MATH.G8.ALGEBRA.RATIONAL_DOMAIN", "MATH.G9.EQUATION.RATIONAL"),
        ("MATH.G9.EQUATION.QUADRATIC", "MATH.G9.EQUATION.VIETE"),
        ("MATH.G7.REAL.CALCULATE", "MATH.G9.INEQUALITY.PROPERTIES"),
        ("MATH.G9.INEQUALITY.PROPERTIES", "MATH.G9.INEQUALITY.LINEAR"),
        ("MATH.G9.GEOMETRY.CYLINDER_CONE_SPHERE", "MATH.G9.GEOMETRY.SOLID_MEASURE"),
        ("MATH.G8.GEOMETRY.PYTHAGOREAN", "MATH.G9.TRIGONOMETRY.RATIOS"),
        ("MATH.G9.TRIGONOMETRY.RATIOS", "MATH.G9.TRIGONOMETRY.SOLVE_TRIANGLE"),
        ("MATH.G7.GEOMETRY.ANGLES_LINES", "MATH.G9.GEOMETRY.CIRCLE_POSITIONS"),
        ("MATH.G9.GEOMETRY.CIRCLE_POSITIONS", "MATH.G9.GEOMETRY.CIRCLE_TANGENT"),
        ("MATH.G9.GEOMETRY.CIRCLE_ANGLES", "MATH.G9.GEOMETRY.CYCLIC_QUADRILATERAL"),
        ("MATH.G9.GEOMETRY.CIRCLE_ANGLES", "MATH.G9.GEOMETRY.ARC_SECTOR"),
        ("MATH.G8.DATA.FREQUENCY", "MATH.G9.DATA.FREQUENCY_TABLE"),
        ("MATH.G9.DATA.FREQUENCY_TABLE", "MATH.G9.DATA.RELATIVE_FREQUENCY"),
        ("MATH.G9.DATA.RELATIVE_FREQUENCY", "MATH.G9.DATA.GROUPED_FREQUENCY"),
        ("MATH.G8.PROBABILITY.THEORETICAL", "MATH.G9.PROBABILITY.SAMPLE_SPACE"),
        ("MATH.G9.PROBABILITY.SAMPLE_SPACE", "MATH.G9.PROBABILITY.COUNT"),
        ("MATH.G6.NATURAL.DIVISIBILITY", "MATH.G8.ALGEBRA.FACTOR"),
        ("MATH.G6.INTEGER.CALCULATE", "MATH.G7.REAL.CALCULATE"),
        ("MATH.G6.RATIO.PERCENT", "MATH.G7.RATIO.PROPORTION"),
        ("MATH.G7.ALGEBRA.EXPRESSION", "MATH.G8.ALGEBRA.POLYNOMIAL"),
        ("MATH.G8.ALGEBRA.POLYNOMIAL", "MATH.G8.ALGEBRA.IDENTITIES"),
        ("MATH.G8.ALGEBRA.IDENTITIES", "MATH.G8.ALGEBRA.FACTOR"),
        ("MATH.G8.ALGEBRA.FACTOR", "MATH.G8.ALGEBRA.RATIONAL_EXPRESSION"),
        ("MATH.G8.EQUATION.LINEAR", "MATH.G9.EQUATION.LINEAR_SYSTEM"),
        ("MATH.G8.EQUATION.LINEAR", "MATH.G9.INEQUALITY.LINEAR"),
        ("MATH.G8.ALGEBRA.IDENTITIES", "MATH.G9.EQUATION.QUADRATIC"),
        ("MATH.G8.FUNCTION.LINEAR", "MATH.G9.FUNCTION.QUADRATIC"),
        ("MATH.G9.EQUATION.LINEAR_SYSTEM", "MATH.G9.MODELING.ALGEBRA"),
        ("MATH.G9.EQUATION.QUADRATIC", "MATH.G9.MODELING.ALGEBRA"),
        ("MATH.G7.GEOMETRY.TRIANGLE", "MATH.G8.GEOMETRY.PYTHAGOREAN"),
        ("MATH.G7.GEOMETRY.ANGLES_LINES", "MATH.G8.GEOMETRY.THALES"),
        ("MATH.G8.GEOMETRY.THALES", "MATH.G8.GEOMETRY.SIMILAR"),
        ("MATH.G8.GEOMETRY.SIMILAR", "MATH.G9.TRIGONOMETRY.RIGHT_TRIANGLE"),
        ("MATH.G7.GEOMETRY.ANGLES_LINES", "MATH.G9.GEOMETRY.CIRCLE"),
        ("MATH.G8.GEOMETRY.PYTHAGOREAN", "MATH.G9.GEOMETRY.SOLID"),
        ("MATH.G6.DATA.DESCRIBE", "MATH.G7.DATA.REPRESENT"),
        ("MATH.G7.DATA.REPRESENT", "MATH.G8.DATA.ANALYZE"),
        ("MATH.G8.DATA.ANALYZE", "MATH.G9.DATA.GROUPED"),
        ("MATH.G6.PROBABILITY.EXPERIMENT", "MATH.G7.PROBABILITY.EVENT"),
        ("MATH.G7.PROBABILITY.EVENT", "MATH.G8.PROBABILITY.RATIO"),
        ("MATH.G8.PROBABILITY.RATIO", "MATH.G9.PROBABILITY.COMPOUND"),
    ]
    for source, target in curriculum_edges:
        edges.append(edge(source, target, "Kỹ năng nguồn cung cấp thao tác hoặc khái niệm được sử dụng trực tiếp ở kỹ năng đích.", 0.9))
    for grade9_skill in [item["id"] for item in skills if item["grade"] == 9 and item["id"] != "MATH.G9.READINESS"]:
        edges.append(edge(grade9_skill, "MATH.G9.READINESS", "Kỹ năng là một thành phần được lấy bằng chứng trong bài diagnostic tổng hợp lớp 9.", 1.0, "part_of"))

    grade9_misconceptions = [
        ("MIS.ALGEBRA.IDENTITY.SQUARE_SUM", "Khai triển sai bình phương của một tổng", "(a+b)^2=a^2+b^2", ["MATH.G8.ALGEBRA.IDENTITIES", "MATH.G9.EQUATION.QUADRATIC"]),
        ("MIS.EQUATION.DIVIDE_ZERO", "Chia hai vế cho biểu thức có thể bằng 0", "divide by expression without zero case", ["MATH.G8.EQUATION.LINEAR", "MATH.G9.EQUATION.QUADRATIC"]),
        ("MIS.SYSTEM.ELIMINATION_SIGN", "Sai dấu khi khử ẩn trong hệ phương trình", "subtract equations without distributing sign", ["MATH.G9.EQUATION.LINEAR_SYSTEM"]),
        ("MIS.INEQUALITY.FLIP_SIGN", "Không đổi chiều bất phương trình khi nhân hoặc chia số âm", "a<b => a/c<b/c for c<0", ["MATH.G9.INEQUALITY.LINEAR"]),
        ("MIS.RADICAL.DISTRIBUTE_SUM", "Phân phối căn bậc hai qua phép cộng", "sqrt(a+b)=sqrt(a)+sqrt(b)", ["MATH.G9.RADICAL.SIMPLIFY"]),
        ("MIS.QUADRATIC.ONE_ROOT", "Bỏ sót một nghiệm của phương trình bậc hai", "x^2=a => x=sqrt(a)", ["MATH.G9.EQUATION.QUADRATIC"]),
        ("MIS.TRIG.RATIO_SWAP", "Nhầm cạnh đối và cạnh kề trong tỉ số lượng giác", "tan=adjacent/opposite", ["MATH.G9.TRIGONOMETRY.RIGHT_TRIANGLE"]),
        ("MIS.CIRCLE.CENTRAL_INSCRIBED", "Nhầm số đo góc ở tâm với góc nội tiếp", "central angle = inscribed angle", ["MATH.G9.GEOMETRY.CIRCLE"]),
        ("MIS.DATA.MEAN.FREQUENCY", "Tính trung bình mà bỏ qua tần số", "mean=sum(values)/number of groups", ["MATH.G9.DATA.GROUPED"]),
        ("MIS.PROBABILITY.ADD_OVERLAP", "Cộng xác suất mà không xử lí phần giao", "P(A union B)=P(A)+P(B)", ["MATH.G9.PROBABILITY.COMPOUND"]),
    ]
    for item_id, description, pattern, skill_ids in grade9_misconceptions:
        misconceptions.append({"id": item_id, "description": description, "error_pattern": pattern, "severity": "major", "skill_ids": skill_ids, "review_status": REVIEW_STATUS})

    grade9_questions = [
        ("IDENTITY", "Khai triển (x+3)^2.", "x²+6x+9", "x²+9", "MIS.ALGEBRA.IDENTITY.SQUARE_SUM", "MATH.G8.ALGEBRA.IDENTITIES"),
        ("RADICAL", "Rút gọn √72.", "6√2", "8√2", None, "MATH.G9.RADICAL.SIMPLIFY"),
        ("SYSTEM", "Nghiệm của hệ x+y=5, x-y=1 là gì?", "(3; 2)", "(2; 3)", "MIS.SYSTEM.ELIMINATION_SIGN", "MATH.G9.EQUATION.LINEAR_SYSTEM"),
        ("INEQUALITY", "Giải bất phương trình -2x > 6.", "x < -3", "x > -3", "MIS.INEQUALITY.FLIP_SIGN", "MATH.G9.INEQUALITY.LINEAR"),
        ("QUADRATIC", "Giải phương trình x²=9.", "x=3 hoặc x=-3", "x=3", "MIS.QUADRATIC.ONE_ROOT", "MATH.G9.EQUATION.QUADRATIC"),
        ("FUNCTION", "Đồ thị y=x² đi qua điểm nào?", "(2; 4)", "(2; 2)", None, "MATH.G9.FUNCTION.QUADRATIC"),
        ("TRIG", "Trong tam giác vuông, tan A bằng tỉ số nào?", "cạnh đối/cạnh kề", "cạnh kề/cạnh đối", "MIS.TRIG.RATIO_SWAP", "MATH.G9.TRIGONOMETRY.RIGHT_TRIANGLE"),
        ("CIRCLE", "Góc nội tiếp chắn nửa đường tròn có số đo bao nhiêu?", "90°", "180°", "MIS.CIRCLE.CENTRAL_INSCRIBED", "MATH.G9.GEOMETRY.CIRCLE"),
        ("SOLID", "Thể tích hình trụ bán kính r, chiều cao h là gì?", "πr²h", "2πrh", None, "MATH.G9.GEOMETRY.SOLID"),
        ("DATA", "Giá trị 2 xuất hiện 3 lần, giá trị 5 xuất hiện 1 lần. Trung bình là bao nhiêu?", "2,75", "3,5", "MIS.DATA.MEAN.FREQUENCY", "MATH.G9.DATA.GROUPED"),
        ("PROBABILITY", "Gieo xúc xắc cân đối. Xác suất ra số chẵn là bao nhiêu?", "1/2", "1/3", None, "MATH.G9.PROBABILITY.COMPOUND"),
        ("MODELING", "Tổng hai số là 10 và hiệu là 4. Hai số đó là gì?", "7 và 3", "6 và 4", None, "MATH.G9.MODELING.ALGEBRA"),
    ]
    for suffix, stem, correct, distractor, misconception_id, skill_id in grade9_questions:
        questions.append({
            "id": f"Q.DIAG.G9.{suffix}.001", "type": "diagnostic", "grade": 9,
            "stem": stem, "skill_ids": [skill_id],
            "options": [option("A", correct, True), option("B", distractor, misconception_id=misconception_id), option("C", "Không đủ dữ kiện"), option("D", "Kết quả khác")],
            "explanation": f"Đáp án đúng là {correct}.", "provenance": [curriculum_source], "review_status": REVIEW_STATUS,
        })

    return {
        "schema_version": SCHEMA_VERSION,
        "dataset": {
            "id": "MINA_GDPT2018_MATH_G6_G9_V2",
            "series": "GDPT2018",
            "subject": "math",
            "grades": [6, 7, 8, 9],
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
