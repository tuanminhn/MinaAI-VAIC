# Mina AI Brand Guidelines

## 1. Brand Personality

Mina AI là:

- Hỗ trợ.
- Rõ ràng.
- Bình tĩnh.
- Tiến bộ.

Giọng điệu và giao diện phải giúp người học tiếp tục bước kế tiếp, không tạo áp lực hoặc cảm giác bị phán xét.

## 2. Mina AI Là Gì / Không Là Gì

### Mina AI là

- Công cụ học thích ứng dựa trên bằng chứng.
- Giao diện học tập và hỗ trợ giáo viên theo từng bước.
- Sản phẩm ưu tiên khả năng đọc, khả năng thao tác và độ tin cậy.

### Mina AI không phải

- Chatbot giải bài.
- App trẻ em quá màu mè.
- Dashboard doanh nghiệp lạnh lẽo.
- Sản phẩm gamification ồn ào.

## 3. Color Palette

### Core palette

| Token | Value | Usage |
|---|---:|---|
| Primary | `#0F766E` | CTA chính, focus, action state |
| Primary subtle | `#DCEFEA` | surface-tinted, emphasis nhẹ, badge skill |
| Accent | `#C97A1A` | cảnh báo tiến trình, callout hạn chế |
| Background | `#F7FAFB` | nền app |
| Surface | `#FFFFFF` | card, input, popover |
| Text primary | `#16313A` | heading, body chính |
| Border | `#CFE0DD` | border mặc định |
| Border strong | `#95B3AE` | teacher compact surfaces, divider rõ hơn |
| Success | `#166534` | trạng thái thành công |
| Warning | `#B45309` | cảnh báo |
| Error | `#B42318` | lỗi |
| Info | `#1D4ED8` | link, thông tin |

### Usage rules

- `primary-subtle` không được dùng làm secondary button background mặc định.
- Secondary button phải là nền trắng, chữ teal, viền teal.
- Accent amber chỉ dùng cho điểm nhấn có kiểm soát.
- Không dùng màu là tín hiệu duy nhất cho đúng/sai, priority, mastered/gap.

## 4. Semantic Usage

### Surfaces

- `background`: nền tổng thể của app.
- `surface`: card, input, popover.
- `surface-muted`: các block phụ, skeleton, vùng thông tin ít ưu tiên.
- `surface-tinted`: nhấn nhẹ theo brand, không dùng toàn màn hình.

### Student surfaces

- Thoáng hơn, ít divider hơn.
- Một nhiệm vụ chính trên một card.
- CTA nổi bật và rõ thứ tự tiếp theo.

### Teacher surfaces

- Border và divider rõ hơn.
- Mật độ thông tin cao hơn student.
- Ưu tiên scan nhanh, filter, sort, evidence.

## 5. Contrast Ratios

| Pair | Ratio |
|---|---:|
| Primary button text `#FFFFFF` on `#0F766E` | `5.47:1` |
| Secondary button text `#0F766E` on `#FFFFFF` | `5.47:1` |
| Body text `#16313A` on `#F7FAFB` | `13.05:1` |
| Muted text `#5D6F77` on `#F7FAFB` | `4.97:1` |
| Input text `#16313A` on `#FFFFFF` | `13.56:1` |
| Placeholder `#5D6F77` on `#FFFFFF` | `5.17:1` |
| Error text `#B42318` on `#FFF2F0` | `6.05:1` |
| Success text `#166534` on `#EEF5F0` | `6.97:1` |
| Warning text `#B45309` on `#FFF7EB` | `5.07:1` |
| Link `#1D4ED8` on `#F7FAFB` | `6.70:1` |
| Focus ring `#0C625C` on `#F7FAFB` | `7.29:1` |
| Badge skill text `#16313A` on `#DCEFEA` | `10.37:1` |

## 6. Typography

- Primary font: `Be Vietnam Pro`
- Fallback: `Noto Sans`, `system-ui`, `sans-serif`
- Weights: `400`, `500`, `600`, `700`
- Default body size: `16px`
- Minimum size for main content: `14px`
- `12px` chỉ dùng hạn chế cho metadata phụ
- `font-variant-numeric: tabular-nums` cho số liệu

### Type scale

#### Mobile

- `14 / 16 / 18 / 20 / 24 / 30`

#### Desktop

- `14 / 16 / 18 / 20 / 24 / 32 / 40`

### Line height

- Heading: `1.2 - 1.3`
- Body: `1.5 - 1.6`
- Relaxed body/notes: `1.7`

### Rules

- Không dùng uppercase cho đoạn dài.
- Không dùng font lạ hoặc display font trang trí.
- Dấu tiếng Việt phải hiển thị đầy đủ, không cắt đầu/cắt chân ký tự.

## 7. Spacing

Spacing scale:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`
- `48`

## 8. Radius

| Token | Value |
|---|---:|
| small | `8px` |
| base | `10px` |
| card | `16px` |
| dialog | `16px` |
| pill | `9999px` |

## 9. Icon Rules

- Icon style: outlined.
- Stroke: khoảng `1.75 - 2`.
- Không dùng emoji làm icon sản phẩm.
- Decorative icon phải `aria-hidden`.
- Icon-only button phải có accessible name tại nơi sử dụng.

## 10. Motion Rules

- `duration-fast`: `150ms`
- `duration-normal`: `200ms`
- `duration-slow`: `300ms`
- Chỉ dùng opacity, transform nhẹ, color, border-color, box-shadow nhẹ.
- Không parallax.
- Không bounce mạnh.
- Không blur animation.
- Không stagger hàng loạt trên dashboard.
- `prefers-reduced-motion: reduce` phải tắt animation không thiết yếu.

## 11. Student UI Principles

- Một nhiệm vụ chính tại một thời điểm.
- Progress rõ, không làm học sinh xấu hổ.
- Ít navigation.
- Câu hỏi dễ đọc.
- CTA tiếp theo rõ ràng.
- Không hiển thị thuật ngữ kỹ thuật phức tạp như confidence score nếu chưa cần.

## 12. Teacher UI Principles

- Scan nhanh.
- Mật độ cao hơn student nhưng vẫn rõ.
- Ưu tiên filter, sort, evidence, next action.
- Priority không chỉ bằng màu.
- Không biến thành dashboard chứa quá nhiều metric rời rạc.

## 13. Accessibility Rules

- WCAG AA là baseline.
- Focus-visible phải rõ.
- Touch target tối thiểu `44x44`.
- Keyboard navigation đầy đủ.
- Error state không chỉ bằng viền đỏ.
- Chart hoặc visualization phải có text alternative khi xuất hiện sau này.

## 14. Sai Cách Cần Tránh

- Dùng gradient dày đặc làm nền hoặc nút chính.
- Dùng amber làm màu chính toàn app.
- Dùng claymorphism hoặc glassmorphism nặng.
- Dùng shadow đậm để tạo cảm giác “nổi” quá mức.
- Dùng minh họa mascot xuyên suốt.
- Dùng màu làm tín hiệu duy nhất.
- Nhồi nhiều card metric kiểu dashboard doanh nghiệp lên màn hình học sinh.
