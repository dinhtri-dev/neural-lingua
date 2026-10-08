# Sửa nút gia sư bị khóa — 04/10/2026

Backend đang sẵn sàng với adapter `20261004-101138-train-254410`. Giao diện cũ không thử lại khi yêu cầu `/api/health` đầu tiên thất bại, khiến nút gửi/ghi âm có thể bị khóa. Thông báo TTS dùng cùng vùng trạng thái nên có thể che mất lỗi kết nối. Chưa xác định được lỗi mạng ban đầu trên trình duyệt trong ảnh người dùng.

Đã thêm kiểm tra kết nối mỗi 5 giây, timeout, nút kiểm tra thủ công và vùng trạng thái kết nối riêng. Nút ghi âm giữ trạng thái khóa trong lúc đang xin micro. Khi đổi bài, hủy kiểm tra kết nối và dọn timer. Không đổi model hoặc dữ liệu train.

Kiểm tra `tests/tutor.cjs` đã qua trên server local: lỗi kết nối ban đầu, tự phục hồi, mất kết nối sau khi đã sẵn sàng, kết nối lại thủ công, thông báo TTS không che trạng thái kết nối; các ca hội thoại, ghi âm/ASR/TTS giả lập, XSS, hủy kết quả muộn, riêng tư và màn hình nhỏ vẫn qua.

Thử trên trình duyệt với model thật: hai nút mở và câu “Sửa câu: She go to school every day.” nhận được phản hồi sửa thành “She goes to school every day.” Ảnh ở `test-results/tutor-connected.jpg`. Kiểm tra cú pháp JavaScript và `git diff --check` qua. Chưa kiểm tra ghi âm micro thật trong lượt sửa này.

Để nhận bản sửa, sao chép câu đang nhập rồi tải lại trang. Server đang chạy phục vụ mã giao diện mới ngay; không cần train hoặc khởi động model lại.
