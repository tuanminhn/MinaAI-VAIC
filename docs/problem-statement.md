# Tuyên bố Bài toán — Mina AI

## 1. Bối cảnh

Trong lớp học phổ thông Việt Nam có sĩ số lớn và trình độ không đồng đều, giáo viên thường nhìn thấy **kết quả sai** nhưng thiếu thời gian và dữ liệu để xác định **kỹ năng nền nào đang gây ra lỗi**. Một lỗi ở bài Toán lớp 7 có thể bắt nguồn từ kỹ năng phân số ở lớp trước; nếu chỉ giao thêm bài cùng dạng hiện tại, học sinh tiếp tục thất bại và giáo viên vẫn không biết nên can thiệp ở đâu.

Vấn đề càng rõ trong môi trường mạng yếu, thiết bị dùng chung hoặc cũ: giải pháp phụ thuộc kết nối liên tục và xử lý AI từ xa không phù hợp với workflow lớp thật.

Các con số về sĩ số, mức độ phổ biến và điều kiện thiết bị trong PRD hiện là **giả định discovery**, không phải bằng chứng nghiên cứu đã xác minh. Chúng phải được kiểm chứng trước khi dùng trong truyền thông hoặc quyết định thương mại.

## 2. Người dùng và công việc cần hoàn thành

### Giáo viên Toán THCS — người dùng chính

Khi nhiều học sinh làm sai, giáo viên cần nhanh chóng biết:

- Ai cần hỗ trợ trước?
- Kỹ năng nền hoặc misconception có khả năng gây lỗi là gì?
- Bằng chứng nào dẫn đến kết luận và mức tin cậy ra sao?
- Nên giao bài bù cá nhân, kèm nhóm nhỏ hay dạy lại cả lớp?
- Can thiệp có giúp học sinh quay lại bài hiện tại hay không?

### Học sinh — người hưởng lợi và người dùng trực tiếp

Khi mắc kẹt ở bài hiện tại, học sinh cần được luyện đúng kỹ năng còn thiếu trong một phiên ngắn, không bị gắn nhãn, không phải học lại cả chương và không mất tiến độ do mạng yếu.

## 3. Vấn đề cốt lõi

> Giáo viên lớp đông thiếu một cách nhanh, đáng tin và có thể hành động để truy từ lỗi sai hiện tại về khoảng trống kiến thức nền; vì vậy việc chia nhóm và giao bài thường dựa trên điểm tổng hoặc cảm tính, còn học sinh nhận can thiệp quá rộng hoặc sai thời điểm.

## 4. Hậu quả

- Học sinh hổng nền làm sai lặp lại, mất thời gian và tự tin.
- Học sinh đã thành thạo không nhận được thử thách phù hợp.
- Giáo viên tốn công phân tích thủ công nhưng vẫn khó ưu tiên.
- Lỗi chung của cả lớp bị phát hiện muộn hoặc bị nhầm với lỗi cá nhân.
- Nhà trường khó biết hoạt động phụ đạo có đóng được lỗ hổng hay không.

## 5. Khoảng trống của cách làm hiện tại

Công cụ chấm điểm và lộ trình tuyến tính thường cho biết học sinh sai chủ đề nào, nhưng không kết hợp đầy đủ:

1. Đồ thị prerequisite bản địa hóa theo GDPT 2018.
2. Misconception mapping từ phương án sai và bằng chứng làm bài.
3. Lộ trình “Repair and Return” ngắn, có transfer/retention check.
4. Dashboard ưu tiên hành động cho giáo viên.
5. Hoạt động khi mạng yếu/offline sau khi tải nhiệm vụ.

Đây là giả thuyết cạnh tranh cần nghiên cứu thị trường có nguồn; chưa được coi là tuyên bố độc quyền đã chứng minh.

## 6. Outcome mong muốn

- Giáo viên giảm thời gian từ khi có kết quả đến khi chọn can thiệp phù hợp.
- Diagnosis có evidence/confidence, cho phép “chưa đủ dữ liệu” và giáo viên override.
- Học sinh hoàn thành remediation ngắn, vượt transfer test và duy trì kỹ năng ở retention check.
- Attempts không mất khi mạng gián đoạn và đồng bộ lại không tạo trùng.
- Không sử dụng diagnosis cho quyết định điểm chính thức, kỷ luật hoặc gắn nhãn học sinh.

## 7. Ràng buộc

- Nội dung phù hợp Chương trình GDPT 2018 và có provenance/kiểm duyệt.
- MVP chỉ xử lý dữ liệu bộ Kết nối tri thức với cuộc sống, môn Toán lớp 6, 7, 8 và 9; không mở rộng sang bộ sách, môn hoặc khối khác.
- Diagnostic không truy ngược sang dữ liệu lớp 5 trở xuống trong MVP; trường hợp vượt phạm vi phải được báo rõ thay vì suy đoán.
- Diagnostic realtime không phụ thuộc LLM.
- Giáo viên giữ quyền quyết định; AI chỉ đề xuất và giải thích.
- Dữ liệu trẻ em được tối thiểu hóa, phân quyền và không gửi PII sang LLM/tracing bên thứ ba.
- Offline MVP là offline-after-download cho nhiệm vụ đã tải, trừ khi có quyết định khác.

## 8. Cách kiểm chứng bài toán

- Phỏng vấn 10–15 giáo viên Toán THCS và quan sát workflow với bài làm thật đã khử định danh.
- Kiểm tra ít nhất 5 giáo viên có sẵn sàng dùng prototype và hành động từ diagnosis.
- Khảo sát thiết bị/mạng, quy trình đồng ý và khả năng đưa sản phẩm vào lớp.
- So sánh nhóm theo root cause với nhóm theo điểm về mức hữu ích và thời gian ra quyết định.
- Chạy pilot theo [Kế hoạch Pilot & Đo lường](/docs/pilot-and-measurement.md).

Các câu hỏi chưa có câu trả lời được quản lý tại [Product Decisions](/docs/product-decisions.md).
