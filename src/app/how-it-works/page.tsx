import Link from "next/link";

const steps = [
  {
    number: "01",
    label: "Thu thập bằng chứng",
    title: "Một bài thăm dò ngắn, đúng trọng tâm",
    description:
      "Giáo viên giao diagnostic tổng hợp Toán lớp 9. Mỗi lựa chọn của học sinh trở thành một bằng chứng, không phải một nhãn đánh giá.",
    tag: "5–10 phút",
    tone: "green",
  },
  {
    number: "02",
    label: "Tìm nguyên nhân gốc",
    title: "Đi ngược từ lỗi sai tới kỹ năng nền",
    description:
      "Mina đối chiếu misconception và đồ thị kỹ năng đã duyệt để tìm phần kiến thức nền có khả năng đang cản trở bài hiện tại.",
    tag: "Rule-based · Có bằng chứng",
    tone: "blue",
  },
  {
    number: "03",
    label: "Giáo viên quyết định",
    title: "Biến kết quả thành hành động trong lớp",
    description:
      "Dashboard ưu tiên học sinh cần hỗ trợ, gom nhóm theo cùng nguyên nhân và giải thích vì sao Mina đưa ra đề xuất đó.",
    tag: "Giáo viên giữ quyền kiểm soát",
    tone: "amber",
  },
  {
    number: "04",
    label: "Repair & Return",
    title: "Bù đúng chỗ thiếu, rồi quay lại bài chính",
    description:
      "Học sinh nhận một lộ trình ngắn, làm transfer test bằng câu hỏi mới và quay lại mục tiêu ban đầu khi đã sẵn sàng.",
    tag: "Ngắn · Cá nhân hóa · Hữu hạn",
    tone: "violet",
  },
];

export default function HowItWorks() {
  return (
    <main className="how-page">
      <section className="how-hero shell">
        <div className="how-hero-copy">
          <div className="eyebrow">Mina hoạt động như thế nào?</div>
          <h1>Không dừng ở<br />“em làm sai”.</h1>
          <p>
            Mina giúp lớp học đi từ một lỗi sai quan sát được đến nguyên nhân có bằng chứng,
            một hành động rõ ràng và con đường quay lại bài học hiện tại.
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/teacher">Xem góc nhìn giáo viên</Link>
            <Link className="button secondary" href="/student">Thử vai học sinh</Link>
          </div>
        </div>
        <div className="diagnosis-visual" aria-label="Ví dụ cách Mina truy tìm nguyên nhân">
          <div className="visual-kicker">Từ tín hiệu đến nguyên nhân</div>
          <div className="skill-node current">
            <span>Lỗi quan sát được</span>
            <strong>Cộng phân số khác mẫu</strong>
          </div>
          <div className="node-connector"><span>truy ngược prerequisite</span></div>
          <div className="skill-node root">
            <span>Kỹ năng nền cần củng cố</span>
            <strong>Quy đồng mẫu số</strong>
            <em>Độ tin cậy 86% · 3 bằng chứng</em>
          </div>
        </div>
      </section>

      <section className="how-process shell" aria-labelledby="process-title">
        <div className="section-intro">
          <span className="eyebrow">Một vòng lặp khép kín</span>
          <h2 id="process-title">Từ phát hiện đến tiến bộ</h2>
          <p>Mỗi bước đều có mục đích rõ ràng, bằng chứng có thể kiểm tra và điểm dừng hữu hạn.</p>
        </div>
        <div className="process-list">
          {steps.map((step) => (
            <article className={`process-step ${step.tone}`} key={step.number}>
              <div className="step-number">{step.number}</div>
              <div className="step-copy">
                <span>{step.label}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
              <div className="step-tag">{step.tag}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="two-views shell" aria-label="Lợi ích theo vai trò">
        <article className="role-panel teacher-panel">
          <div className="role-icon" aria-hidden="true">G</div>
          <div className="eyebrow">Dành cho giáo viên</div>
          <h2>Biết hôm nay cần giúp ai — và vì sao.</h2>
          <ul>
            <li>Danh sách ưu tiên có giải thích</li>
            <li>Nhóm học sinh theo cùng kỹ năng cần luyện</li>
            <li>Bằng chứng và độ tin cậy trước khi hành động</li>
          </ul>
          <Link href="/teacher">Mở dashboard demo <span>→</span></Link>
        </article>
        <article className="role-panel student-panel">
          <div className="role-icon" aria-hidden="true">H</div>
          <div className="eyebrow">Dành cho học sinh</div>
          <h2>Được giúp đúng phần đang cản mình.</h2>
          <ul>
            <li>Hoạt động ngắn, không gắn nhãn năng lực</li>
            <li>Gợi ý vừa đủ để tự tìm ra cách làm</li>
            <li>Quay lại bài chính sau khi vượt transfer test</li>
          </ul>
          <Link href="/student">Trải nghiệm bài học <span>→</span></Link>
        </article>
      </section>

      <section className="trust-strip shell">
        <div>
          <span>01</span>
          <strong>Không dùng LLM để chẩn đoán</strong>
          <p>Engine xác định, dựa trên rule và knowledge graph đã duyệt.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Không kết luận khi thiếu dữ liệu</strong>
          <p>Mina nói rõ khi chưa đủ bằng chứng hoặc nằm ngoài phạm vi.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Không thay giáo viên quyết định</strong>
          <p>Mọi chẩn đoán là đề xuất có thể xem, sửa hoặc bác bỏ.</p>
        </div>
      </section>

      <section className="how-cta shell">
        <div>
          <span className="eyebrow">Sẵn sàng xem luồng thật?</span>
          <h2>Bắt đầu từ một lớp học demo.</h2>
        </div>
        <Link className="button primary" href="/teacher">Khám phá Mina AI</Link>
      </section>
    </main>
  );
}
