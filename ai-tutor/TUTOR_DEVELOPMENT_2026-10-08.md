# Phát triển gia sư Neural-Lingua — 08/10/2026

**Bổ sung trước push:** Các kết quả bên dưới ghi nhận lượt phát triển trước khi nâng thư viện. Bộ thư viện, giới hạn yêu cầu và kiểm tra tương thích GPU sau đó được ghi riêng trong [báo cáo bảo mật trước push](SECURITY_PRE_PUSH_2026-10-08.md). Lượt kiểm tra mới không ghi đè adapter train đầy đủ hoặc bảng chấm chất lượng cũ.

## Phần đã triển khai

- Gợi ý hỏi từ được chọn, giải thích mẫu câu, luyện hội thoại và nhận xét bản nháp của bài đang mở. Gợi ý điền ô hỏi để người học xem/sửa và tự gửi. Nội dung đang viết được giữ cho đến khi chủ động chọn thay bằng gợi ý hoặc transcript.
- Nhận xét bản nháp dùng câu hỏi ngắn và nhắc giữ câu đúng. Bản nháp luyện viết vẫn giữ nguyên; không tự gửi, lưu hay cắt khi vượt giới hạn.
- Hỏi từ bằng gợi ý gửi lựa chọn riêng, được backend đối chiếu với từ trong bài. Ngữ cảnh chỉ chứa từ đó cùng mẫu câu; sửa câu hỏi thủ công bỏ lựa chọn này.
- Backend dùng tokenizer thật, bỏ từng cặp hỏi–đáp cũ khi vượt 1.536 token đầu vào. Tài liệu bài và câu hỏi mới nhất được giữ nguyên. API trả số lượt còn dùng; giao diện thông báo và bỏ đúng phần lịch sử đã bị loại khỏi các yêu cầu tiếp theo.
- Hội thoại mới có thể dùng khi đang chờ model, ASR, cấp quyền hoặc ghi âm. Phiên cũ không thể đưa phản hồi/transcript quay lại hoặc thay trạng thái tác vụ mới; micro đến muộn được dừng.
- Hủy yêu cầu giữ câu đang hỏi. Thông báo phân biệt hủy với hết thời gian chờ. Hủy trên trình duyệt không bảo đảm dừng tính toán model đã nhận yêu cầu.
- Gợi ý nghe không lấy các mảnh chữ ASCII nằm trong câu tiếng Việt hoặc tự chọn câu sai ban đầu để đọc. Câu tiếng Anh vẫn có thể nhập/sửa trước khi nghe.
- Có Ctrl/⌘ + Enter và liên kết Gia sư AI trong menu bài học; chuyển giữa các phần cùng bài giữ bản nháp.

## Kiểm tra

- 20 kiểm thử Python qua: API, dữ liệu, tokenizer/mask, giới hạn, nguồn từ được chọn, xử lý câu trả lời trống, ngữ cảnh dài, upload và vòng đời train.
- Bộ npm test qua, gồm hồi quy bài học/dịch/lưu dữ liệu/nhiều tab, gia sư cũ, 16 nhóm tutor-flow mới và 17 nhóm vòng đời voice.
- 6 kiểm tra tích hợp với adapter thật qua Edge/API: sửa câu, hỏi từ, mẫu câu, bản nháp, hội thoại và lịch sử dài. “Qua” ở đây chỉ xác nhận yêu cầu/phản hồi, đúng bài/model, hiển thị và giới hạn; không phải điểm chất lượng.
- Đã xem ảnh giao diện mobile và desktop. Bộ UI kiểm tra không tràn ngang tại 320/375/1440 px.
- Kiểm tra cú pháp JavaScript và git diff --check qua.

Lệnh từ thư mục web: npm test; node tests/tutor-live.cjs khi backend thật chạy ở cổng 8832. Lệnh từ ai-tutor: .venv/Scripts/python.exe -X utf8 -m unittest discover -s . -p "test_*.py" -v. Bộ kiểm tra Python cần cache tokenizer đúng revision.

Bằng chứng cục bộ nằm ngoài Git trong test-results: tutor-flow-results.json, tutor-live-results.json, tutor-live-initial-results.json, tutor-prompt-probes.json, tutor-live-375.png, tutor-live-1440.png và tutor-development-verification.json. File xác minh ghi Git HEAD nền và SHA-256 mã đã kiểm tra; checkout có thay đổi chưa commit.

## Kết quả model và giới hạn thực tế

Model đang chạy: Qwen3-1.7B với adapter 20261004-101138-train-254410, trạng thái experimental. Lượt train này đã hoàn thành 78 bước; có 52 ca so sánh và 156 dòng chấm, nhưng 0 dòng được chấm và chưa có approval.json.

Quan sát ở bài 1:

| Ca | Quan sát |
|---|---|
| She go to school every day. | Sửa thành She goes to school every day. |
| Hỏi hello, trước khi thu hẹp ngữ cảnh | Trả cả danh sách từ của bài. |
| Hỏi hello, sau khi thu hẹp ngữ cảnh | hello nghĩa là xin chào. Ví dụ: Hello! I am Linh. |
| Đoạn Hello. My name is Anna. I am a new student., câu hỏi dài ban đầu | Nhận xét sai rằng câu Hello chưa đúng và buộc về mẫu I am Linh. |
| Cùng đoạn với câu hỏi nhận xét ngắn mới | Giữ đoạn và nói đúng theo mẫu; nhận xét còn sơ sài. |
| Mở hội thoại | Đề nghị người học nói lời chào bằng tiếng Việt; chưa làm theo yêu cầu hỏi một câu tiếng Anh. |
| Lịch sử dài với tokenizer thật | Bỏ một cặp cũ, dùng hai lượt gần nhất và sửa She go to school. thành She goes to school. |

Cải thiện trên một vài câu không chứng minh chất lượng chung. Gia sư vẫn cần dữ liệu nhận xét đa dạng và tình huống mở hội thoại, bộ test có câu đã đúng và bài ngoài ví dụ, cùng người rà soát độc lập. Không tự điền điểm hoặc nâng trạng thái nghiệm thu. Gợi ý nhận xét/hội thoại là tính năng thử nghiệm, không phải bộ chấm bài hay xác nhận trình độ.

Micro vật lý, chất lượng giọng người học, âm thanh TTS nghe được và chấm phát âm chưa xác minh trong lượt này. Model/dữ liệu/điều kiện nghiệm thu giữ nguyên; không chạy train hoặc đánh giá lại để ghi đè bảng chấm cũ. Không push, tạo bản phát hành hay deploy. Đây không phải báo cáo 20 mục để cấp điều kiện xuất bản.
