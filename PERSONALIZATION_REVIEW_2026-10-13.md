# Lộ trình cá nhân hóa — ba vòng đánh giá

Ngày: 13/10/2026, Asia/Saigon. Phạm vi: bản học đầy đủ trên
`dinhtri-dev/neural-lingua`, nhánh `archive/year2`, không triển khai Pages.

## Kết quả

Một reviewer subagent độc lập, chỉ đọc và kiểm thử, thực hiện đúng ba vòng.
Reviewer không sửa, commit hoặc push. Rubric: chức năng 3 điểm, logic sư phạm 2,
dữ liệu/riêng tư 2, trải nghiệm/accessibility 2, kiểm thử/minh bạch 1.

| Vòng | Điểm | Phát hiện và xử lý |
|---|---:|---|
| 1 | 7,8/10 | Chặn placement/quiz đang chờ Web Lock ghi lại dữ liệu sau reset; khóa điều khiển lúc nộp, chấm snapshot cố định; thêm ngôn ngữ câu hỏi, số bài gợi ý thực tế và liên kết trực tiếp phần mẫu câu. |
| 2 | 9,0/10 | Kết quả đã hoàn thành ở tab A còn link cũ khi tab B làm lại đầu vào. Thêm vùng gợi ý hiện hành cập nhật giữa tab, giữ riêng điểm/đáp án của lần làm A; không thay bản đang làm. Sửa nhãn thống kê khi chưa có dữ liệu. |
| 3 | 9,4/10 | Reviewer tự chạy 20/20 ca thành công; xác nhận các lỗi hai vòng trước đã sửa. Không thấy lỗi chặn mới trong phạm vi tính năng local. |

Vòng cuối: chức năng 2,9/3; sư phạm 1,7/2; dữ liệu/riêng tư 1,9/2;
UX/accessibility 1,9/2; kiểm thử/minh bạch 1/1.

## Hành vi đã kiểm tra

- 15 câu gốc, 3 câu/chặng; chặng đầu dưới 2/3 là mốc bắt đầu. Nếu tất cả
  đều đạt, gợi ý chặng cuối để xác nhận bằng bài học. Chấp nhận “Chưa biết”.
- Sau mỗi quiz, lấy kết quả mới nhất, không chỉ điểm tốt nhất; ưu tiên củng cố
  bài dưới 4/5 và phần kỹ năng phù hợp, sau đó gợi ý bài chưa hoàn thành.
- Giữ 52 bài mở, điểm tốt nhất, hoàn thành và sổ từ cũ. Không tự đánh dấu các
  bài trước mốc đầu vào là hoàn thành. Tối đa 5 lượt gần nhất cho mỗi bài.
- Tắt lưu, storage bị chặn/hỏng, reset và cập nhật giữa tab không làm lộ hoặc
  phục hồi đáp án đã xóa. Bài đầu vào không gửi đáp án đến server/dịch vụ AI.
- Nộp bài dùng snapshot bất biến; điểm cũ và lộ trình hiện hành được tách rõ.
- Điều hướng bàn phím, focus phần mẫu câu và viewport 320/375/1440 không tràn ngang.

Kiểm thử: `tests/personalization.cjs`, 20 ca; reviewer output cục bộ tại
`test-results/reviewer-personalization-round3/personalization-results.json`.
Output phát sinh được ignore, không đưa dữ liệu hoặc ảnh QA vào Git.

Hash SHA-256 tổng hợp tám file reviewer kiểm tra:
`dd66b7e19a456b40a1c23ef3e520cbd1ef56946c127b9684fe8a52916039d62c`.
Các file: `js/app.js`, `js/course.js`, `js/store.js`, `js/personalization.js`,
`js/personalization-view.js`, `styles.css`, `index.html`, `tests/personalization.cjs`.
Default port của test mới đã đồng bộ 8831 với preview và các test khác;
các lần kiểm thử này đặt `PREVIEW_URL=http://127.0.0.1:8841`.

## Giới hạn và cải tiến sau

Đây là heuristic tự luyện 15 câu cố định, chưa chuẩn hóa hoặc thử nghiệm hiệu
quả học. Không đánh giá nghe/nói hoặc xác nhận CEFR. Có thể thêm biến thể câu
hỏi để giảm nhớ đáp án khi làm lại. Chưa kiểm thử screen reader, điện thoại
thật hoặc trình duyệt khác; phần giải thích đáp án còn có đoạn tiếng Anh trong
văn bản tiếng Việt chưa đánh dấu ngôn ngữ riêng. Các điểm này không bị reviewer
xếp là lỗi chặn cho bản tính năng local hiện tại.

Điểm reviewer không thay thế kiểm tra bảo mật hoặc chứng nhận production.
Quy trình một reviewer, ba vòng và checklist trước push được ghi trong
`AGENTS.md` và `SECURITY_CHECKLIST.md` để áp dụng cho các lần sửa tiếp theo.
