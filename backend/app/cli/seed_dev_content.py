from __future__ import annotations

from dataclasses import dataclass

from app.core.config import get_settings
from app.db.models.assignment_content_target import AssignmentContentTarget
from app.db.models.content_package import ContentPackage
from app.db.models.misconception import Misconception
from app.db.models.question_item import QuestionItem
from app.db.models.question_option import QuestionOption
from app.db.models.remediation_unit import RemediationUnit
from app.db.models.skill import Skill
from app.db.models.skill_prerequisite import SkillPrerequisite
from app.db.session import session_scope
from app.repositories.content_repository import ContentRepository
from app.services.content_service import ContentService
from app.services.skill_graph_service import SkillGraphService

PACKAGE_CODE = "MATH6_FRACTIONS_FOUNDATION_V1"
PACKAGE_TITLE = "Nền tảng phân số lớp 6"
PACKAGE_DESCRIPTION = (
    "Nội dung MVP cho cụm kỹ năng phân số lớp 6. "
    "Cần giáo viên review trước khi triển khai thực tế."
)
ASSIGNMENT_TITLE = "Ôn tập phân số"


@dataclass(frozen=True)
class OptionSeed:
    code: str
    label: str
    is_correct: bool
    feedback: str


@dataclass(frozen=True)
class QuestionSeed:
    code: str
    skill_code: str
    purpose: str
    prompt: str
    difficulty: int
    explanation: str
    options: tuple[OptionSeed, ...]
    misconception_code: str | None = None


SKILLS = (
    {
        "code": "MATH6.MULTIPLES.COMMON_MULTIPLE",
        "name": "Xác định bội chung",
        "description": "Nhận biết các số là bội chung của hai số đã cho.",
        "grade": 6,
        "sort_order": 10,
    },
    {
        "code": "MATH6.MULTIPLES.LCM",
        "name": "Tìm bội chung nhỏ nhất",
        "description": "Tìm BCNN của hai số tự nhiên nhỏ để chuẩn bị quy đồng mẫu số.",
        "grade": 6,
        "sort_order": 20,
    },
    {
        "code": "MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        "name": "Nhận biết hai phân số bằng nhau",
        "description": "Nhận biết các phân số bằng nhau khi nhân cùng tử và mẫu với một số khác 0.",
        "grade": 6,
        "sort_order": 30,
    },
    {
        "code": "MATH6.FRACTIONS.COMMON_DENOMINATOR",
        "name": "Quy đồng mẫu số",
        "description": "Đưa hai phân số về cùng mẫu số bằng cách chọn mẫu chung phù hợp.",
        "grade": 6,
        "sort_order": 40,
    },
    {
        "code": "MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        "name": "Trừ hai phân số cùng mẫu",
        "description": "Thực hiện phép trừ phân số khi hai mẫu số đã bằng nhau.",
        "grade": 6,
        "sort_order": 50,
    },
    {
        "code": "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        "name": "Trừ hai phân số khác mẫu",
        "description": "Quy đồng rồi trừ hai phân số có mẫu số khác nhau.",
        "grade": 6,
        "sort_order": 60,
    },
    {
        "code": "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        "name": "Giải phương trình phân số đơn giản",
        "description": "Giải phương trình phân số một bước bằng phép toán ngược phù hợp.",
        "grade": 6,
        "sort_order": 70,
    },
)

PREREQUISITES = (
    ("MATH6.MULTIPLES.LCM", "MATH6.MULTIPLES.COMMON_MULTIPLE", 1),
    ("MATH6.FRACTIONS.COMMON_DENOMINATOR", "MATH6.FRACTIONS.EQUIVALENT_FRACTION", 1),
    ("MATH6.FRACTIONS.COMMON_DENOMINATOR", "MATH6.MULTIPLES.LCM", 2),
    (
        "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        "MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        1,
    ),
    (
        "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        "MATH6.FRACTIONS.COMMON_DENOMINATOR",
        2,
    ),
    (
        "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        1,
    ),
)

MISCONCEPTIONS = (
    {
        "code": "MATH6.MIS.LCM_USE_PRODUCT_ALWAYS",
        "skill_code": "MATH6.MULTIPLES.LCM",
        "name": "Luôn nhân hai số để tìm BCNN",
        "description": "Học sinh luôn lấy tích hai số mà không tìm BCNN nhỏ nhất phù hợp.",
        "teacher_note": "Nhắc học sinh so sánh các bội chung nhỏ trước khi dùng tích.",
    },
    {
        "code": "MATH6.MIS.COMMON_DENOMINATOR_ADD_DENOMINATORS",
        "skill_code": "MATH6.FRACTIONS.COMMON_DENOMINATOR",
        "name": "Cộng hai mẫu số để tạo mẫu chung",
        "description": "Học sinh cộng mẫu số thay vì tìm một mẫu chung là bội của cả hai mẫu.",
        "teacher_note": "Cần quay lại ý nghĩa mẫu chung và BCNN.",
    },
    {
        "code": "MATH6.MIS.SUBTRACT_NUMERATOR_AND_DENOMINATOR",
        "skill_code": "MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        "name": "Trừ cả tử và mẫu",
        "description": "Học sinh trừ cả tử số lẫn mẫu số khi thực hiện phép trừ phân số.",
        "teacher_note": "Củng cố quy tắc giữ nguyên mẫu khi hai phân số đã cùng mẫu.",
    },
    {
        "code": "MATH6.MIS.KEEP_NUMERATOR_WHEN_SCALING",
        "skill_code": "MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        "name": "Nhân mẫu nhưng quên nhân tử",
        "description": "Học sinh chỉ đổi mẫu số mà không nhân tử số với cùng một số.",
        "teacher_note": "Nhấn mạnh phải nhân cả tử và mẫu với cùng một số khác 0.",
    },
    {
        "code": "MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
        "skill_code": "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        "name": "Chuyển vế mà không dùng phép toán ngược",
        "description": "Học sinh đổi chỗ số hạng nhưng không thực hiện phép toán ngược tương ứng.",
        "teacher_note": "Cần quay lại ý tưởng giữ hai vế bằng nhau bằng cùng một phép biến đổi.",
    },
)

QUESTIONS: tuple[QuestionSeed, ...] = (
    QuestionSeed(
        code="Q.DIAG.COMMON_MULTIPLE.01",
        skill_code="MATH6.MULTIPLES.COMMON_MULTIPLE",
        purpose="diagnostic",
        prompt="Số nào là bội chung của 3 và 4?",
        difficulty=1,
        explanation="12 chia hết cho cả 3 và 4 nên là bội chung.",
        options=(
            OptionSeed("A", "6", False, "6 chưa chia hết cho 4."),
            OptionSeed("B", "8", False, "8 chưa chia hết cho 3."),
            OptionSeed("C", "12", True, "12 là bội chung của 3 và 4."),
            OptionSeed("D", "15", False, "15 chưa chia hết cho 4."),
        ),
    ),
    QuestionSeed(
        code="Q.DIAG.COMMON_MULTIPLE.02",
        skill_code="MATH6.MULTIPLES.COMMON_MULTIPLE",
        purpose="diagnostic",
        prompt="Số nào là bội chung của 5 và 6?",
        difficulty=1,
        explanation="30 là số nhỏ nhất trong các lựa chọn chia hết cho cả 5 và 6.",
        options=(
            OptionSeed("A", "20", False, "20 chưa chia hết cho 6."),
            OptionSeed("B", "24", False, "24 chưa chia hết cho 5."),
            OptionSeed("C", "25", False, "25 chưa chia hết cho 6."),
            OptionSeed("D", "30", True, "30 là bội chung của 5 và 6."),
        ),
    ),
    QuestionSeed(
        code="Q.DIAG.LCM.01",
        skill_code="MATH6.MULTIPLES.LCM",
        purpose="diagnostic",
        prompt="BCNN của 6 và 8 là số nào?",
        difficulty=2,
        explanation="24 là bội chung nhỏ nhất của 6 và 8.",
        options=(
            OptionSeed("A", "14", False, "14 không là bội chung."),
            OptionSeed("B", "24", True, "24 là BCNN của 6 và 8."),
            OptionSeed("C", "48", False, "48 là bội chung nhưng không nhỏ nhất."),
            OptionSeed("D", "6", False, "6 chưa chia hết cho 8."),
        ),
        misconception_code="MATH6.MIS.LCM_USE_PRODUCT_ALWAYS",
    ),
    QuestionSeed(
        code="Q.DIAG.LCM.02",
        skill_code="MATH6.MULTIPLES.LCM",
        purpose="diagnostic",
        prompt="BCNN của 4 và 10 là số nào?",
        difficulty=2,
        explanation="20 là bội chung nhỏ nhất của 4 và 10.",
        options=(
            OptionSeed("A", "14", False, "14 không là bội của 10."),
            OptionSeed("B", "20", True, "20 là BCNN phù hợp."),
            OptionSeed("C", "40", False, "40 lớn hơn BCNN."),
            OptionSeed("D", "10", False, "10 chưa chia hết cho 4."),
        ),
        misconception_code="MATH6.MIS.LCM_USE_PRODUCT_ALWAYS",
    ),
    QuestionSeed(
        code="Q.DIAG.EQUIVALENT.01",
        skill_code="MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        purpose="diagnostic",
        prompt="Phân số nào bằng 2/3 và có mẫu số 12?",
        difficulty=1,
        explanation="2/3 = 8/12 khi nhân cả tử và mẫu với 4.",
        options=(
            OptionSeed("A", "4/12", False, "Mới đổi mẫu mà chưa đổi tử đúng cách."),
            OptionSeed("B", "6/12", False, "6/12 bằng 1/2."),
            OptionSeed("C", "8/12", True, "Nhân cả tử và mẫu với 4 được 8/12."),
            OptionSeed("D", "10/12", False, "10/12 không bằng 2/3."),
        ),
        misconception_code="MATH6.MIS.KEEP_NUMERATOR_WHEN_SCALING",
    ),
    QuestionSeed(
        code="Q.DIAG.EQUIVALENT.02",
        skill_code="MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        purpose="diagnostic",
        prompt="Điền phân số bằng 3/5: 3/5 = ?/20",
        difficulty=1,
        explanation="Nhân cả tử và mẫu với 4 nên được 12/20.",
        options=(
            OptionSeed("A", "3/20", False, "Chỉ đổi mẫu mà chưa đổi tử."),
            OptionSeed("B", "8/20", False, "8/20 không bằng 3/5."),
            OptionSeed("C", "12/20", True, "Nhân cả tử và mẫu với 4 được 12/20."),
            OptionSeed("D", "15/20", False, "15/20 bằng 3/4."),
        ),
        misconception_code="MATH6.MIS.KEEP_NUMERATOR_WHEN_SCALING",
    ),
    QuestionSeed(
        code="Q.DIAG.COMMON_DENOMINATOR.01",
        skill_code="MATH6.FRACTIONS.COMMON_DENOMINATOR",
        purpose="diagnostic",
        prompt="Mẫu số chung nhỏ nhất của 1/4 và 1/6 là số nào?",
        difficulty=2,
        explanation="BCNN của 4 và 6 là 12 nên có thể chọn mẫu chung 12.",
        options=(
            OptionSeed("A", "10", False, "10 không chia hết cho 6."),
            OptionSeed("B", "12", True, "12 là mẫu chung nhỏ nhất phù hợp."),
            OptionSeed("C", "24", False, "24 là mẫu chung nhưng không nhỏ nhất."),
            OptionSeed("D", "4 + 6 = 10", False, "Cộng hai mẫu không tạo ra mẫu chung đúng."),
        ),
        misconception_code="MATH6.MIS.COMMON_DENOMINATOR_ADD_DENOMINATORS",
    ),
    QuestionSeed(
        code="Q.DIAG.COMMON_DENOMINATOR.02",
        skill_code="MATH6.FRACTIONS.COMMON_DENOMINATOR",
        purpose="diagnostic",
        prompt="Cặp phân số nào là kết quả quy đồng đúng của 2/3 và 1/4 với mẫu số 12?",
        difficulty=2,
        explanation="2/3 = 8/12 và 1/4 = 3/12.",
        options=(
            OptionSeed("A", "2/12 và 1/12", False, "Chưa nhân tử số tương ứng."),
            OptionSeed(
                "B", "6/12 và 4/12", False, "Hai phân số này không tương ứng với 2/3 và 1/4."
            ),
            OptionSeed("C", "8/12 và 3/12", True, "Đây là cặp quy đồng đúng."),
            OptionSeed("D", "7/12 và 5/12", False, "Không giữ giá trị ban đầu của hai phân số."),
        ),
        misconception_code="MATH6.MIS.COMMON_DENOMINATOR_ADD_DENOMINATORS",
    ),
    QuestionSeed(
        code="Q.DIAG.SUBTRACT_SAME.01",
        skill_code="MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        purpose="diagnostic",
        prompt="3/4 - 1/4 bằng bao nhiêu?",
        difficulty=1,
        explanation="Giữ nguyên mẫu 4 và trừ tử số: 3 - 1 = 2.",
        options=(
            OptionSeed("A", "2/4", True, "Giữ nguyên mẫu và trừ tử đúng cách."),
            OptionSeed("B", "2/0", False, "Không trừ mẫu số."),
            OptionSeed("C", "3/3", False, "Kết quả này không đúng quy tắc."),
            OptionSeed("D", "1/4", False, "Chỉ lấy phần trừ đi."),
        ),
        misconception_code="MATH6.MIS.SUBTRACT_NUMERATOR_AND_DENOMINATOR",
    ),
    QuestionSeed(
        code="Q.DIAG.SUBTRACT_SAME.02",
        skill_code="MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        purpose="diagnostic",
        prompt="7/9 - 2/9 bằng bao nhiêu?",
        difficulty=1,
        explanation="Giữ nguyên mẫu 9 và lấy 7 - 2 = 5.",
        options=(
            OptionSeed("A", "5/9", True, "Đúng quy tắc trừ hai phân số cùng mẫu."),
            OptionSeed("B", "5/0", False, "Không trừ mẫu số."),
            OptionSeed("C", "9/5", False, "Đảo vị trí tử và mẫu."),
            OptionSeed("D", "5/7", False, "Mẫu số bị thay đổi sai."),
        ),
        misconception_code="MATH6.MIS.SUBTRACT_NUMERATOR_AND_DENOMINATOR",
    ),
    QuestionSeed(
        code="Q.DIAG.SUBTRACT_DIFFERENT.01",
        skill_code="MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        purpose="diagnostic",
        prompt="1/2 - 1/3 bằng bao nhiêu?",
        difficulty=2,
        explanation="Quy đồng thành 3/6 - 2/6 = 1/6.",
        options=(
            OptionSeed("A", "0/5", False, "Không trừ cả tử và mẫu."),
            OptionSeed("B", "1/6", True, "Quy đồng rồi trừ đúng cách."),
            OptionSeed("C", "2/5", False, "Cộng hoặc trừ mẫu sai cách."),
            OptionSeed("D", "1/5", False, "Mẫu số 5 không phải mẫu chung."),
        ),
    ),
    QuestionSeed(
        code="Q.DIAG.SUBTRACT_DIFFERENT.02",
        skill_code="MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        purpose="diagnostic",
        prompt="5/6 - 1/4 bằng bao nhiêu?",
        difficulty=3,
        explanation="Quy đồng thành 10/12 - 3/12 = 7/12.",
        options=(
            OptionSeed("A", "4/2", False, "Không thể trừ tử và mẫu riêng rẽ."),
            OptionSeed("B", "7/12", True, "Đây là kết quả đúng sau quy đồng."),
            OptionSeed("C", "4/10", False, "Mẫu 10 không phải mẫu chung đúng."),
            OptionSeed("D", "6/10", False, "Kết quả này không tương ứng phép trừ."),
        ),
    ),
    QuestionSeed(
        code="Q.DIAG.EQUATION.01",
        skill_code="MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        purpose="diagnostic",
        prompt="Tìm x: x + 1/4 = 3/4",
        difficulty=2,
        explanation="Lấy 3/4 - 1/4 nên được x = 2/4.",
        options=(
            OptionSeed(
                "A", "1/2", False, "1/2 bằng 2/4 nhưng cần xem cách làm trong các lựa chọn."
            ),
            OptionSeed("B", "2/4", True, "Trừ 1/4 ở cả hai vế được 2/4."),
            OptionSeed("C", "4/4", False, "4/4 không thỏa phương trình."),
            OptionSeed("D", "1/4", False, "1/4 cộng 1/4 chỉ được 2/4."),
        ),
        misconception_code="MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
    ),
    QuestionSeed(
        code="Q.DIAG.EQUATION.02",
        skill_code="MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        purpose="diagnostic",
        prompt="Tìm x: x - 1/3 = 1/6",
        difficulty=3,
        explanation="Cộng 1/3 vào cả hai vế: x = 1/6 + 1/3 = 3/6.",
        options=(
            OptionSeed("A", "1/2", False, "1/2 bằng 3/6 nhưng cần xem lựa chọn theo quy đồng."),
            OptionSeed("B", "2/6", False, "2/6 chưa đủ vì 2/6 - 1/3 = 0."),
            OptionSeed("C", "3/6", True, "Đây là kết quả đúng sau khi cộng 1/3 vào cả hai vế."),
            OptionSeed("D", "1/9", False, "Không dùng phép toán ngược phù hợp."),
        ),
        misconception_code="MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
    ),
    QuestionSeed(
        code="Q.REM.COMMON_MULTIPLE.01",
        skill_code="MATH6.MULTIPLES.COMMON_MULTIPLE",
        purpose="remediation",
        prompt="Số nào là bội chung của 2 và 5?",
        difficulty=1,
        explanation="10 chia hết cho cả 2 và 5 nên là bội chung.",
        options=(
            OptionSeed("A", "6", False, "6 không chia hết cho 5."),
            OptionSeed("B", "8", False, "8 không chia hết cho 5."),
            OptionSeed("C", "10", True, "10 là bội chung của 2 và 5."),
            OptionSeed("D", "15", False, "15 không chia hết cho 2."),
        ),
    ),
    QuestionSeed(
        code="Q.REM.COMMON_MULTIPLE.02",
        skill_code="MATH6.MULTIPLES.COMMON_MULTIPLE",
        purpose="remediation",
        prompt="Số nào là bội chung của 4 và 6?",
        difficulty=1,
        explanation="12 chia hết cho cả 4 và 6 nên là bội chung.",
        options=(
            OptionSeed("A", "10", False, "10 không chia hết cho 4 và 6."),
            OptionSeed("B", "12", True, "12 là bội chung phù hợp."),
            OptionSeed("C", "18", False, "18 không chia hết cho 4."),
            OptionSeed("D", "20", False, "20 không chia hết cho 6."),
        ),
    ),
    QuestionSeed(
        code="Q.REM.LCM.01",
        skill_code="MATH6.MULTIPLES.LCM",
        purpose="remediation",
        prompt="BCNN của 3 và 4 là số nào?",
        difficulty=1,
        explanation="12 là bội chung nhỏ nhất của 3 và 4.",
        options=(
            OptionSeed("A", "7", False, "7 không là bội chung."),
            OptionSeed("B", "12", True, "12 là BCNN đúng."),
            OptionSeed("C", "24", False, "24 là bội chung nhưng không nhỏ nhất."),
            OptionSeed("D", "4", False, "4 không chia hết cho 3."),
        ),
        misconception_code="MATH6.MIS.LCM_USE_PRODUCT_ALWAYS",
    ),
    QuestionSeed(
        code="Q.REM.LCM.02",
        skill_code="MATH6.MULTIPLES.LCM",
        purpose="remediation",
        prompt="BCNN của 5 và 6 là số nào?",
        difficulty=1,
        explanation="30 là bội chung nhỏ nhất của 5 và 6.",
        options=(
            OptionSeed("A", "11", False, "11 không là bội chung."),
            OptionSeed("B", "20", False, "20 không chia hết cho 6."),
            OptionSeed("C", "30", True, "30 là BCNN đúng."),
            OptionSeed("D", "60", False, "60 là bội chung nhưng không nhỏ nhất."),
        ),
        misconception_code="MATH6.MIS.LCM_USE_PRODUCT_ALWAYS",
    ),
    QuestionSeed(
        code="Q.REM.EQUIVALENT.01",
        skill_code="MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        purpose="remediation",
        prompt="Muốn đổi 1/3 thành phân số có mẫu số 9, em chọn đáp án nào?",
        difficulty=1,
        explanation="Nhân cả tử và mẫu với 3.",
        options=(
            OptionSeed("A", "1/9", False, "Chỉ đổi mẫu mà chưa đổi tử."),
            OptionSeed("B", "2/9", False, "2/9 không bằng 1/3."),
            OptionSeed("C", "3/9", True, "Nhân cả tử và mẫu với 3 được 3/9."),
            OptionSeed("D", "6/9", False, "6/9 bằng 2/3."),
        ),
        misconception_code="MATH6.MIS.KEEP_NUMERATOR_WHEN_SCALING",
    ),
    QuestionSeed(
        code="Q.REM.EQUIVALENT.02",
        skill_code="MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        purpose="remediation",
        prompt="Phân số nào bằng 4/5?",
        difficulty=1,
        explanation="8/10 bằng 4/5 khi nhân cả tử và mẫu với 2.",
        options=(
            OptionSeed("A", "4/10", False, "4/10 bằng 2/5."),
            OptionSeed("B", "5/10", False, "5/10 bằng 1/2."),
            OptionSeed("C", "8/10", True, "Đây là phân số bằng 4/5."),
            OptionSeed("D", "9/10", False, "9/10 không bằng 4/5."),
        ),
    ),
    QuestionSeed(
        code="Q.REM.COMMON_DENOMINATOR.01",
        skill_code="MATH6.FRACTIONS.COMMON_DENOMINATOR",
        purpose="remediation",
        prompt="Mẫu chung nhỏ nhất của 1/3 và 1/5 là số nào?",
        difficulty=1,
        explanation="BCNN của 3 và 5 là 15.",
        options=(
            OptionSeed("A", "8", False, "8 không chia hết cho 5."),
            OptionSeed("B", "15", True, "15 là mẫu chung nhỏ nhất."),
            OptionSeed("C", "30", False, "30 là mẫu chung nhưng không nhỏ nhất."),
            OptionSeed("D", "3 + 5 = 8", False, "Cộng mẫu không cho mẫu chung đúng."),
        ),
        misconception_code="MATH6.MIS.COMMON_DENOMINATOR_ADD_DENOMINATORS",
    ),
    QuestionSeed(
        code="Q.REM.COMMON_DENOMINATOR.02",
        skill_code="MATH6.FRACTIONS.COMMON_DENOMINATOR",
        purpose="remediation",
        prompt="1/2 được quy đồng thành bao nhiêu khi chọn mẫu số 8?",
        difficulty=1,
        explanation="1/2 = 4/8 khi nhân cả tử và mẫu với 4.",
        options=(
            OptionSeed("A", "1/8", False, "Chỉ đổi mẫu."),
            OptionSeed("B", "2/8", False, "2/8 bằng 1/4."),
            OptionSeed("C", "4/8", True, "Đây là kết quả quy đồng đúng."),
            OptionSeed("D", "8/8", False, "8/8 bằng 1."),
        ),
    ),
    QuestionSeed(
        code="Q.REM.SUBTRACT_SAME.01",
        skill_code="MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        purpose="remediation",
        prompt="5/8 - 1/8 bằng bao nhiêu?",
        difficulty=1,
        explanation="Giữ mẫu 8, trừ tử: 5 - 1 = 4.",
        options=(
            OptionSeed("A", "4/8", True, "Đúng quy tắc."),
            OptionSeed("B", "4/0", False, "Không trừ mẫu."),
            OptionSeed("C", "5/7", False, "Mẫu bị đổi sai."),
            OptionSeed("D", "1/8", False, "Đây là số bị trừ."),
        ),
        misconception_code="MATH6.MIS.SUBTRACT_NUMERATOR_AND_DENOMINATOR",
    ),
    QuestionSeed(
        code="Q.REM.SUBTRACT_SAME.02",
        skill_code="MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        purpose="remediation",
        prompt="6/7 - 2/7 bằng bao nhiêu?",
        difficulty=1,
        explanation="Giữ mẫu 7, trừ tử: 6 - 2 = 4.",
        options=(
            OptionSeed("A", "4/7", True, "Đúng quy tắc trừ hai phân số cùng mẫu."),
            OptionSeed("B", "4/0", False, "Không trừ mẫu số."),
            OptionSeed("C", "6/5", False, "Mẫu số bị đổi sai."),
            OptionSeed("D", "2/7", False, "Đây là số bị trừ."),
        ),
        misconception_code="MATH6.MIS.SUBTRACT_NUMERATOR_AND_DENOMINATOR",
    ),
    QuestionSeed(
        code="Q.REM.SUBTRACT_DIFFERENT.01",
        skill_code="MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        purpose="remediation",
        prompt="3/4 - 1/2 bằng bao nhiêu?",
        difficulty=2,
        explanation="Quy đồng thành 3/4 - 2/4 = 1/4.",
        options=(
            OptionSeed("A", "2/2", False, "Không thể trừ tử và mẫu riêng."),
            OptionSeed("B", "1/4", True, "Quy đồng rồi trừ đúng."),
            OptionSeed("C", "2/4", False, "2/4 là giá trị của 1/2 sau quy đồng."),
            OptionSeed("D", "1/2", False, "Chưa trừ xong."),
        ),
    ),
    QuestionSeed(
        code="Q.REM.SUBTRACT_DIFFERENT.02",
        skill_code="MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        purpose="remediation",
        prompt="2/3 - 1/6 bằng bao nhiêu?",
        difficulty=2,
        explanation="Quy đồng thành 4/6 - 1/6 = 3/6.",
        options=(
            OptionSeed(
                "A", "1/2", False, "1/2 bằng 3/6 nhưng chưa bám trực tiếp phép trừ sau quy đồng."
            ),
            OptionSeed("B", "3/6", True, "Đây là kết quả đúng."),
            OptionSeed("C", "1/3", False, "1/3 không đúng."),
            OptionSeed("D", "1/9", False, "Sai do chọn mẫu không đúng."),
        ),
    ),
    QuestionSeed(
        code="Q.REM.EQUATION.01",
        skill_code="MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        purpose="remediation",
        prompt="Tìm x: x + 1/5 = 4/5",
        difficulty=2,
        explanation="Trừ 1/5 ở cả hai vế nên x = 3/5.",
        options=(
            OptionSeed("A", "3/5", True, "Đúng phép toán ngược."),
            OptionSeed("B", "5/5", False, "5/5 không thỏa phương trình."),
            OptionSeed("C", "1/5", False, "Chưa trừ đúng."),
            OptionSeed("D", "4/5", False, "Đây là vế phải ban đầu."),
        ),
        misconception_code="MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
    ),
    QuestionSeed(
        code="Q.REM.EQUATION.02",
        skill_code="MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        purpose="remediation",
        prompt="Tìm x: x - 2/7 = 1/7",
        difficulty=2,
        explanation="Cộng 2/7 vào cả hai vế nên x = 3/7.",
        options=(
            OptionSeed("A", "1/7", False, "Đây là vế phải ban đầu."),
            OptionSeed("B", "2/7", False, "2/7 chưa thỏa phương trình."),
            OptionSeed("C", "3/7", True, "Đúng vì 3/7 - 2/7 = 1/7."),
            OptionSeed("D", "4/7", False, "4/7 - 2/7 = 2/7."),
        ),
        misconception_code="MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
    ),
    QuestionSeed(
        code="Q.TRANSFER.COMMON_DENOMINATOR.01",
        skill_code="MATH6.FRACTIONS.COMMON_DENOMINATOR",
        purpose="transfer",
        prompt="Cặp phân số nào là kết quả quy đồng đúng của 3/5 và 1/2 với mẫu số 10?",
        difficulty=2,
        explanation="3/5 = 6/10 và 1/2 = 5/10.",
        options=(
            OptionSeed("A", "3/10 và 1/10", False, "Chỉ đổi mẫu."),
            OptionSeed("B", "6/10 và 5/10", True, "Đây là cặp quy đồng đúng."),
            OptionSeed("C", "8/10 và 4/10", False, "Không bảo toàn giá trị ban đầu."),
            OptionSeed("D", "7/10 và 3/10", False, "Sai do nhân tử không đúng."),
        ),
    ),
    QuestionSeed(
        code="Q.TRANSFER.SUBTRACT_DIFFERENT.01",
        skill_code="MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        purpose="transfer",
        prompt="7/8 - 1/6 bằng bao nhiêu?",
        difficulty=3,
        explanation="Quy đồng thành 21/24 - 4/24 = 17/24.",
        options=(
            OptionSeed("A", "6/2", False, "Không trừ tử và mẫu riêng."),
            OptionSeed("B", "17/24", True, "Đây là kết quả đúng."),
            OptionSeed("C", "20/14", False, "Mẫu và tử đều sai."),
            OptionSeed("D", "3/24", False, "Chỉ trừ phần sau quy đồng sai."),
        ),
    ),
    QuestionSeed(
        code="Q.TRANSFER.EQUATION.01",
        skill_code="MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        purpose="transfer",
        prompt="Tìm x: x + 2/3 = 5/6",
        difficulty=3,
        explanation="Quy đồng: 5/6 - 4/6 = 1/6 nên x = 1/6.",
        options=(
            OptionSeed("A", "1/6", True, "Đúng sau khi dùng phép trừ phù hợp."),
            OptionSeed("B", "3/6", False, "3/6 cộng 2/3 không được 5/6."),
            OptionSeed("C", "7/6", False, "Lớn hơn vế phải."),
            OptionSeed("D", "2/6", False, "2/6 cộng 2/3 bằng 1."),
        ),
        misconception_code="MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
    ),
    QuestionSeed(
        code="Q.TRANSFER.EQUATION.02",
        skill_code="MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        purpose="transfer",
        prompt="Tìm x: x - 1/4 = 1/2",
        difficulty=2,
        explanation="Cộng 1/4 vào cả hai vế: x = 3/4.",
        options=(
            OptionSeed("A", "1/4", False, "1/4 - 1/4 = 0."),
            OptionSeed("B", "2/4", False, "2/4 - 1/4 = 1/4."),
            OptionSeed("C", "3/4", True, "Đúng vì 3/4 - 1/4 = 2/4 = 1/2."),
            OptionSeed("D", "4/4", False, "4/4 - 1/4 = 3/4."),
        ),
    ),
)

REMEDIATION_UNITS = (
    {
        "code": "UNIT.COMMON_MULTIPLE.CHECK_BOTH_NUMBERS",
        "skill_code": "MATH6.MULTIPLES.COMMON_MULTIPLE",
        "misconception_code": None,
        "title": "Kiểm tra bội của cả hai số",
        "summary": "Một số chỉ là bội chung khi chia hết cho cả hai số đã cho.",
        "explanation": (
            "Em có thể thử chia số đó cho từng số hoặc liệt kê vài bội đầu tiên "
            "của mỗi số để tìm phần giao nhau."
        ),
        "worked_example": "12 là bội chung của 3 và 4 vì 12 chia hết cho cả 3 và 4.",
        "practice_instruction": "Mỗi lần chọn đáp án, hãy kiểm tra đủ cả hai số.",
        "sort_order": 5,
    },
    {
        "code": "UNIT.EQUIVALENT.MULTIPLY_BOTH",
        "skill_code": "MATH6.FRACTIONS.EQUIVALENT_FRACTION",
        "misconception_code": "MATH6.MIS.KEEP_NUMERATOR_WHEN_SCALING",
        "title": "Nhân cả tử và mẫu",
        "summary": "Khi đổi mẫu số, em cần nhân tử số và mẫu số với cùng một số.",
        "explanation": (
            "Nhân cả tử và mẫu với cùng một số khác 0 sẽ tạo ra " "phân số bằng phân số ban đầu."
        ),
        "worked_example": "2/3 = 8/12 vì 2 x 4 = 8 và 3 x 4 = 12.",
        "practice_instruction": "Tìm số cần nhân rồi áp dụng cho cả tử và mẫu.",
        "sort_order": 10,
    },
    {
        "code": "UNIT.LCM.SMALLEST_COMMON",
        "skill_code": "MATH6.MULTIPLES.LCM",
        "misconception_code": "MATH6.MIS.LCM_USE_PRODUCT_ALWAYS",
        "title": "Chọn bội chung nhỏ nhất",
        "summary": "Không phải lúc nào tích hai số cũng là BCNN.",
        "explanation": (
            "Hãy liệt kê vài bội đầu tiên hoặc dùng phân tích thừa số " "để tìm bội chung nhỏ nhất."
        ),
        "worked_example": "BCNN của 4 và 6 là 12, không phải 24.",
        "practice_instruction": "So sánh các bội chung nhỏ trước khi quyết định.",
        "sort_order": 20,
    },
    {
        "code": "UNIT.COMMON_DENOMINATOR.FIND_TRUE_COMMON",
        "skill_code": "MATH6.FRACTIONS.COMMON_DENOMINATOR",
        "misconception_code": "MATH6.MIS.COMMON_DENOMINATOR_ADD_DENOMINATORS",
        "title": "Tìm mẫu chung thật sự",
        "summary": "Mẫu chung phải là bội của cả hai mẫu số.",
        "explanation": "Cộng hai mẫu số không đảm bảo phân số mới bằng phân số ban đầu.",
        "worked_example": "Với 1/4 và 1/6, mẫu chung nhỏ nhất là 12 vì 12 chia hết cho 4 và 6.",
        "practice_instruction": "Tìm BCNN của hai mẫu trước, rồi đổi mỗi phân số về mẫu đó.",
        "sort_order": 30,
    },
    {
        "code": "UNIT.SUBTRACT_SAME.KEEP_DENOMINATOR",
        "skill_code": "MATH6.FRACTIONS.SUBTRACT_SAME_DENOMINATOR",
        "misconception_code": "MATH6.MIS.SUBTRACT_NUMERATOR_AND_DENOMINATOR",
        "title": "Giữ nguyên mẫu số",
        "summary": "Khi hai phân số đã cùng mẫu, em chỉ trừ các tử số.",
        "explanation": (
            "Mẫu số cho biết các phần bằng nhau đã được chia sẵn, "
            "nên không thay đổi trong phép trừ cùng mẫu."
        ),
        "worked_example": "5/8 - 1/8 = 4/8 vì 5 - 1 = 4 và mẫu vẫn là 8.",
        "practice_instruction": (
            "Nhìn kỹ xem hai mẫu đã bằng nhau chưa, nếu rồi thì " "chỉ xử lý phần tử số."
        ),
        "sort_order": 40,
    },
    {
        "code": "UNIT.SUBTRACT_DIFFERENT.REWRITE_THEN_SUBTRACT",
        "skill_code": "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
        "misconception_code": None,
        "title": "Quy đồng rồi mới trừ",
        "summary": "Khi hai mẫu khác nhau, em cần đưa về cùng mẫu trước khi trừ.",
        "explanation": (
            "Sau khi quy đồng, em sẽ có hai phân số cùng mẫu số. "
            "Lúc đó em mới trừ các tử số và giữ nguyên mẫu số."
        ),
        "worked_example": "1/2 - 1/3 = 3/6 - 2/6 = 1/6.",
        "practice_instruction": "Tìm mẫu chung trước, rồi viết lại từng phân số về mẫu đó.",
        "sort_order": 45,
    },
    {
        "code": "UNIT.EQUATION.INVERSE_OPERATION",
        "skill_code": "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
        "misconception_code": "MATH6.MIS.EQUATION_MOVE_TERM_WITHOUT_INVERSE",
        "title": "Dùng phép toán ngược",
        "summary": "Muốn tìm x, em thực hiện phép toán ngược ở cả hai vế.",
        "explanation": "Cộng thì dùng trừ, trừ thì dùng cộng để giữ hai vế vẫn bằng nhau.",
        "worked_example": "x + 1/4 = 3/4 thì x = 3/4 - 1/4 = 2/4.",
        "practice_instruction": (
            "Xác định phép toán đang đi cùng x rồi chọn " "phép ngược cho cả hai vế."
        ),
        "sort_order": 50,
    },
)

ASSIGNMENT_TARGET_SKILL_CODES = (
    "MATH6.FRACTIONS.SUBTRACT_DIFFERENT_DENOMINATOR",
    "MATH6.FRACTIONS.SIMPLE_FRACTION_EQUATION",
)


def _require_development_environment() -> None:
    settings = get_settings()
    if settings.app_env not in {"development", "test"}:
        raise RuntimeError("Content development seeding is only allowed in development or test.")


def _upsert_package(repository: ContentRepository) -> ContentPackage:
    package = repository.get_package_by_code(PACKAGE_CODE)
    if package is None:
        package = repository.add(
            ContentPackage(
                code=PACKAGE_CODE,
                title=PACKAGE_TITLE,
                subject="math",
                grade=6,
                version=1,
                status="published",
                description=PACKAGE_DESCRIPTION,
            )
        )
        repository.session.flush()
        return package

    package.title = PACKAGE_TITLE
    package.subject = "math"
    package.grade = 6
    package.version = 1
    package.status = "published"
    package.description = PACKAGE_DESCRIPTION
    repository.session.flush()
    return package


def _upsert_skills(repository: ContentRepository, package: ContentPackage) -> dict[str, Skill]:
    skills_by_code: dict[str, Skill] = {}
    for item in SKILLS:
        skill = repository.get_skill_by_code(item["code"])
        if skill is None:
            skill = repository.add(
                Skill(
                    content_package_id=package.id,
                    code=item["code"],
                    name=item["name"],
                    description=item["description"],
                    grade=item["grade"],
                    sort_order=item["sort_order"],
                    is_active=True,
                )
            )
        else:
            skill.content_package_id = package.id
            skill.name = item["name"]
            skill.description = item["description"]
            skill.grade = item["grade"]
            skill.sort_order = item["sort_order"]
            skill.is_active = True
        skills_by_code[item["code"]] = skill
    repository.session.flush()
    return skills_by_code


def _upsert_prerequisites(
    repository: ContentRepository,
    skills_by_code: dict[str, Skill],
) -> None:
    existing_edges = {
        (edge.skill.code, edge.prerequisite_skill.code): edge
        for edge in repository.list_skill_prerequisites_by_package_id(
            next(iter(skills_by_code.values())).content_package_id
        )
    }
    for skill_code, prerequisite_code, priority in PREREQUISITES:
        edge = existing_edges.get((skill_code, prerequisite_code))
        if edge is None:
            repository.add(
                SkillPrerequisite(
                    skill_id=skills_by_code[skill_code].id,
                    prerequisite_skill_id=skills_by_code[prerequisite_code].id,
                    priority=priority,
                )
            )
        else:
            edge.priority = priority
    repository.session.flush()


def _upsert_misconceptions(
    repository: ContentRepository,
    skills_by_code: dict[str, Skill],
) -> dict[str, Misconception]:
    misconceptions_by_code: dict[str, Misconception] = {}
    for item in MISCONCEPTIONS:
        misconception = repository.get_misconception_by_code(item["code"])
        if misconception is None:
            misconception = repository.add(
                Misconception(
                    skill_id=skills_by_code[item["skill_code"]].id,
                    code=item["code"],
                    name=item["name"],
                    description=item["description"],
                    teacher_note=item["teacher_note"],
                    is_active=True,
                )
            )
        else:
            misconception.skill_id = skills_by_code[item["skill_code"]].id
            misconception.name = item["name"]
            misconception.description = item["description"]
            misconception.teacher_note = item["teacher_note"]
            misconception.is_active = True
        misconceptions_by_code[item["code"]] = misconception
    repository.session.flush()
    return misconceptions_by_code


def _sync_question_options(question: QuestionItem, option_seeds: tuple[OptionSeed, ...]) -> None:
    option_by_code = {option.code: option for option in question.options}
    incoming_codes = {item.code for item in option_seeds}

    for option in list(question.options):
        if option.code not in incoming_codes:
            question.options.remove(option)

    for index, item in enumerate(option_seeds):
        option = option_by_code.get(item.code)
        if option is None:
            option = QuestionOption(
                code=item.code,
                label=item.label,
                is_correct=item.is_correct,
                feedback=item.feedback,
                sort_order=index,
            )
            question.options.append(option)
            continue

        option.label = item.label
        option.is_correct = item.is_correct
        option.feedback = item.feedback
        option.sort_order = index


def _upsert_questions(
    repository: ContentRepository,
    package: ContentPackage,
    skills_by_code: dict[str, Skill],
    misconceptions_by_code: dict[str, Misconception],
) -> None:
    for item in QUESTIONS:
        question = repository.get_question_item_by_code(item.code)
        misconception = (
            misconceptions_by_code[item.misconception_code]
            if item.misconception_code is not None
            else None
        )
        if question is None:
            question = repository.add(
                QuestionItem(
                    content_package_id=package.id,
                    skill_id=skills_by_code[item.skill_code].id,
                    misconception_id=misconception.id if misconception else None,
                    code=item.code,
                    purpose=item.purpose,
                    question_type="single_choice",
                    prompt=item.prompt,
                    difficulty=item.difficulty,
                    explanation=item.explanation,
                    is_active=True,
                )
            )
        else:
            question.content_package_id = package.id
            question.skill_id = skills_by_code[item.skill_code].id
            question.misconception_id = misconception.id if misconception else None
            question.purpose = item.purpose
            question.question_type = "single_choice"
            question.prompt = item.prompt
            question.difficulty = item.difficulty
            question.explanation = item.explanation
            question.is_active = True

        _sync_question_options(question, item.options)

    repository.session.flush()


def _upsert_remediation_units(
    repository: ContentRepository,
    package: ContentPackage,
    skills_by_code: dict[str, Skill],
    misconceptions_by_code: dict[str, Misconception],
) -> None:
    for item in REMEDIATION_UNITS:
        unit = repository.get_remediation_unit_by_code(item["code"])
        if item["misconception_code"] is None:
            misconception = None
        else:
            misconception = misconceptions_by_code[item["misconception_code"]]
        if unit is None:
            repository.add(
                RemediationUnit(
                    content_package_id=package.id,
                    skill_id=skills_by_code[item["skill_code"]].id,
                    misconception_id=misconception.id if misconception else None,
                    code=item["code"],
                    title=item["title"],
                    summary=item["summary"],
                    explanation=item["explanation"],
                    worked_example=item["worked_example"],
                    practice_instruction=item["practice_instruction"],
                    sort_order=item["sort_order"],
                    is_active=True,
                )
            )
            continue

        unit.content_package_id = package.id
        unit.skill_id = skills_by_code[item["skill_code"]].id
        unit.misconception_id = misconception.id if misconception else None
        unit.title = item["title"]
        unit.summary = item["summary"]
        unit.explanation = item["explanation"]
        unit.worked_example = item["worked_example"]
        unit.practice_instruction = item["practice_instruction"]
        unit.sort_order = item["sort_order"]
        unit.is_active = True

    repository.session.flush()


def _upsert_assignment_targets(
    repository: ContentRepository,
    package: ContentPackage,
    skills_by_code: dict[str, Skill],
) -> None:
    assignment = repository.get_assignment_by_title(ASSIGNMENT_TITLE)
    if assignment is None:
        raise RuntimeError(
            "Development assignment was not found. Run 'python -m app.cli.seed_dev_core' first."
        )

    for skill_code in ASSIGNMENT_TARGET_SKILL_CODES:
        target = repository.get_assignment_target(
            assignment_id=assignment.id,
            target_skill_id=skills_by_code[skill_code].id,
        )
        if target is None:
            repository.add(
                AssignmentContentTarget(
                    assignment_id=assignment.id,
                    content_package_id=package.id,
                    target_skill_id=skills_by_code[skill_code].id,
                )
            )
            continue

        target.content_package_id = package.id

    repository.session.flush()


def seed_dev_content() -> dict[str, int]:
    _require_development_environment()

    with session_scope() as session:
        repository = ContentRepository(session)
        package = _upsert_package(repository)
        skills_by_code = _upsert_skills(repository, package)
        _upsert_prerequisites(repository, skills_by_code)
        misconceptions_by_code = _upsert_misconceptions(repository, skills_by_code)
        _upsert_questions(repository, package, skills_by_code, misconceptions_by_code)
        _upsert_remediation_units(repository, package, skills_by_code, misconceptions_by_code)
        _upsert_assignment_targets(repository, package, skills_by_code)

        ContentService(
            repository=repository,
            skill_graph=SkillGraphService(),
        ).validate_package_content(PACKAGE_CODE)

        return {
            "skills": len(SKILLS),
            "prerequisites": len(PREREQUISITES),
            "misconceptions": len(MISCONCEPTIONS),
            "diagnostic_questions": len(
                [item for item in QUESTIONS if item.purpose == "diagnostic"]
            ),
            "remediation_questions": len(
                [item for item in QUESTIONS if item.purpose == "remediation"]
            ),
            "transfer_questions": len([item for item in QUESTIONS if item.purpose == "transfer"]),
            "remediation_units": len(REMEDIATION_UNITS),
            "assignment_targets": len(ASSIGNMENT_TARGET_SKILL_CODES),
        }


def main() -> None:
    summary = seed_dev_content()
    print(
        "Seeded content package "
        f"{PACKAGE_CODE} with "
        f"{summary['skills']} skills, "
        f"{summary['diagnostic_questions']} diagnostic questions, "
        f"{summary['remediation_questions']} remediation questions, "
        f"{summary['transfer_questions']} transfer questions."
    )


if __name__ == "__main__":
    main()
