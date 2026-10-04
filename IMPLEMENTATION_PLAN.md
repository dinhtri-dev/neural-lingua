# Kế hoạch và kết quả thực hiện Neural-Lingua

## Vấn đề và hướng sửa

Ứng dụng ban đầu chỉ có công cụ dịch, thiếu lộ trình học, nội dung có nguồn, bài tập, ôn từ và tiến độ. Luồng dịch cần xử lý lỗi, hủy/timeout, kết quả đến muộn và quyền riêng tư. Bản mới hướng tới người Việt mới bắt đầu, định hướng A1–A2; không chứng nhận trình độ.

1. Giữ lịch sử, làm trên nhánh từ `archive/year2`; giữ mã cũ trong `old/`, không phục vụ thư mục này qua preview.
2. Kiểm kê 52 bài VOA Level 1 theo thứ tự, quyền dùng và URL trình phát chính thức; không tải video hoặc sao chép khóa học trả phí.
3. Xây toàn bộ luồng bằng bài 1/26/52: xem → từ/mẫu câu → luyện viết/nói → quiz → ôn; mở trực tiếp bài, lazy video và nguồn dự phòng.
4. Biên soạn đủ 52 bài: sáu từ/bài, năm câu/bài, tình huống, giải thích, rubric và mẫu luyện viết. Tách dữ liệu khỏi giao diện.
5. Hoàn thiện tìm/lọc, tiếp tục học, điểm tốt nhất, hoàn thành 4/5, flashcard và lưu tùy chọn; dịch, clipboard, giọng nói, timeout/hủy và lịch sử opt-in.
6. Kiểm thử dữ liệu, chức năng/lỗi, responsive/bàn phím, HTTP nguồn và phát video thật; trải nghiệm độc lập tối đa ba lượt.
7. Sửa toàn bộ đề xuất trong phạm vi từ hai lượt đầu; khóa giao dịch giữa tab, chống tab cũ khôi phục dữ liệu sau reset/opt-out, cải thiện focus và nội dung tình huống.
8. Chốt đánh giá, kiểm tra đủ 20 mục bảo mật trên commit bàn giao, push riêng `archive/year2`, kiểm tra cây file từ GitHub và cập nhật Google Doc.

## Bằng chứng và giới hạn

Kết quả từng lượt, các đề xuất đã sửa và việc để phát triển tiếp: [REVIEW_ROUNDS.md](REVIEW_ROUNDS.md). Danh mục 52 bài và quyền sử dụng: [COURSE_SOURCES.md](COURSE_SOURCES.md), [data/source-audit.json](data/source-audit.json). Phạm vi push và checklist: [SECURITY_REVIEW.md](SECURITY_REVIEW.md).

Không thêm tài khoản, database, backend hoặc dịch vụ trả phí. Giữ GitHub Pages trên `main`. Kiểm thử giả lập giọng nói không thay thế thử micro/âm thanh thật; kiểm tra HTTP không thay thế phát video. Bản dùng thử loopback không chứng nhận production.
