# Kế hoạch Neural-Lingua AI đã chọn

## 1. Bộ train local

Qwen3-1.7B QLoRA NF4 trên RTX 4050 6 GB, rank 8/alpha 16/dropout 0,05, tối đa 512 token, batch 1/accumulation 16, ba epoch, LR 1e-4, seed 42. Chat template non-thinking và loss chỉ trên câu trả lời mục tiêu. Workspace VS Code tự tạo môi trường và chạy pipeline. Mỗi lượt ghi model revision, fingerprint dữ liệu/cấu hình và dependencies.

Dữ liệu khởi đầu 520 mẫu có nguồn: 416 train, 52 validation, 52 test. Kho 52 bài tách khỏi model, tra cứu theo lesson_id. Không tự sinh thêm dữ liệu khi bấm train. Mẫu quá dài, dữ liệu không khớp hoặc GPU lỗi thì dừng.

## 2. Gia sư chữ và nghiệm thu

FastAPI cùng origin với web local. `/api/health` báo trạng thái; POST `/api/tutor/chat` nhận lesson_id, câu hỏi, lịch sử tối đa sáu message (ba cặp). Câu hỏi tối đa 2.000 ký tự, output tối đa 192 token, toàn prompt tối đa 1.536 token. Không lưu chat, không tự train lại, không thay điểm bài tập.

So sánh model gốc/model gốc có bài/adapter có bài trên cùng 52 test. Người rà soát chấm đủ 156 phản hồi. Adapter chỉ được dùng ở chế độ bình thường khi đạt >=90% đúng kiến thức, không lỗi nghiêm trọng, tốt hơn baseline có bài. Chế độ thử nghiệm được ghi nhãn rõ.

## 3. Hội thoại giọng nói

faster-whisper small.en CPU INT8; browser TTS tiếng Anh. POST `/api/tutor/asr` giới hạn nội dung audio thật 10 MB/30 giây. Transcript phải được người học xem/sửa rồi chủ động gửi. Dừng micro/đọc khi đổi bài. ASR không chấm phát âm.

## 4. Phát âm: cổng quyết định sau nghiệm thu

Chưa bật dịch vụ hoặc train âm thanh. Sau khi gia sư và hội thoại đạt kiểm thử, thử Azure trên dữ liệu được người thu đồng ý, đối chiếu nhãn chuyên môn và chi phí trước khi tích hợp. Nếu chọn tự train thì lập đề tài riêng với nhãn lỗi âm vị và tập test tách người nói. Xem PRONUNCIATION_PILOT.md.

## Bàn giao và giới hạn

Lượt này kiểm tra kỹ thuật bằng 10 bước GPU, kiểm tra profile train và resume ngắn, API, ASR và hồi quy web. Không chạy trọn ba epoch, không tự nâng trạng thái chất lượng. Không push/deploy; mọi yêu cầu xuất bản về sau áp dụng đủ 20 mục bảo mật.
