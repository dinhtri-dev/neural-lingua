# Báo cáo kiểm thử bộ AI Neural-Lingua — 04/10/2026

**Bổ sung:** Báo cáo này ghi nhận phiên bản ban đầu theo SHA-256 trong VERIFICATION.json. Sau khi sửa việc giữ VRAM giữa các giai đoạn, bằng chứng cho pipeline/workspace mới nằm trong [VRAM_FIX_VERIFICATION.md](VRAM_FIX_VERIFICATION.md) và VRAM_FIX_VERIFICATION.json.

## Kết quả kỹ thuật

- Dữ liệu: 520 mẫu, đủ 52 bài ở từng tập; 416 train / 52 validation / 52 test. Không trùng ID/nhóm giữa các tập, không có đáp án cuối giống hệt xuyên tập. Kiểm tra này không chứng minh không có mọi dạng tương đồng ngữ nghĩa.
- Tokenizer đúng revision: độ dài cao nhất 298 token train, 249 validation, 267 test; không mẫu nào bị cắt. Prompt/padding không tính loss, đáp án và EOS được giữ.
- GPU thật RTX 4050 6 GB: 10 bước, loss hữu hạn, adapter thay đổi; peak VRAM 3,071 GB. Adapter lưu/nạp lại và sinh văn bản thành công. Đây không phải điểm chất lượng.
- Profile thật: accumulation 16, evaluation 52 mẫu validation, save/select checkpoint. Nạp lại model nền và khôi phục optimizer/checkpoint từ bước 1 để tiếp tục đến bước 2 thành công. Chỉ là kiểm tra ngắn, không chạy trọn ba epoch.
- 11 kiểm thử Python qua: dữ liệu/token mask, API/giới hạn/role/Host/Origin, upload/giải mã âm thanh/30 giây/im lặng, thiếu dữ liệu, fingerprint resume và gate nghiệm thu.
- 44 nhóm hồi quy web hiện có qua. Kiểm thử gia sư thêm qua: ngữ cảnh bài, lịch sử, reset, XSS, hủy kết quả đến muộn, micro/ASR/TTS bằng stub, không lưu hội thoại, màn hình 375 px.
- ASR thật CPU small.en nhận đúng: “Hello. My name is Anna. I am learning English.” Nguồn audio là giọng Windows tổng hợp; không phải người học hoặc micro thật.
- API thật cùng origin đã nạp adapter cuối và trả lời sửa câu; upload WAV thật qua endpoint ASR nhận đúng transcript. Browser thật cũng gửi câu đến backend/model local và hiển thị câu trả lời.
- Pipeline so sánh ba phiên bản được kiểm tra thử với hai ca trên adapter của lượt dữ liệu trước; chưa chạy/chấm đủ 52 ca trên adapter sau lượt train đầy đủ.
- Thư viện được khóa theo phiên bản đã cài; pip check qua. Đã sửa không tương thích faster-whisper/PyAV bằng av 16.0.1.

## Bằng chứng và phiên bản

Fingerprint, SHA-256 mã và phiên bản model nằm trong VERIFICATION.json. Lượt GPU cuối: `runs/20261004-093419-smoke-f18842`; profile/resume: `runs/20261004-093835-profile-check-45d45a`. Bằng chứng audio/API ở `runs/audio-check`, screenshot ở thư mục test-results của web. Các thư mục chạy/cache/checkpoint được Git bỏ qua.

## Giới hạn và hành động tiếp theo

Chất lượng gia sư chưa nghiệm thu. Dữ liệu đã được Codex đối chiếu nội dung nguồn và rà soát biên soạn, chưa có giáo viên độc lập xác nhận. Bộ test 52 ca hiện tập trung sửa câu; nên mở rộng khi làm sản phẩm.

Micro thật, giọng người học đa dạng, chất lượng audio đầu ra trình duyệt và đánh giá phát âm chưa xác minh. Chưa gọi Azure, chưa phát sinh phí API, chưa triển khai website hoặc push Git. Đây không phải báo cáo đủ 20 mục để cấp điều kiện xuất bản.

Mở workspace, chọn Train gia sư và F5 để chạy đầy đủ. Sau đó rà soát 156 phản hồi trong review.csv trước khi nghiệm thu; xem README và PRONUNCIATION_PILOT.md.
