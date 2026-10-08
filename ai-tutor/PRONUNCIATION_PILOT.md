# Giai đoạn phát âm sau khi gia sư và hội thoại đạt kiểm thử

Chưa gọi Azure, chưa tạo tài khoản và chưa phát sinh chi phí dịch vụ trong lượt triển khai này. Chưa tự train model âm thanh.

## Thử nghiệm dịch vụ

1. Chuẩn bị 30–50 câu A1–A2 từ nội dung được phép dùng, phủ âm cuối, cặp âm, trọng âm và nhịp câu.
2. Thu bản ghi của người học Việt Nam có đồng ý riêng cho thử nghiệm; lưu mã người nói thay tên thật. Có bản thu đúng, có lỗi và có nhiễu. Không lấy lại bản ghi hội thoại mà chưa xin đồng ý.
3. Nhờ người có chuyên môn gán lỗi và nhận xét; giữ người nói trong tập thử tách khỏi dữ liệu dùng điều chỉnh ngưỡng.
4. Dùng Azure Pronunciation Assessment theo câu đọc mẫu `en-US`; khóa dịch vụ chỉ nằm trong backend/env local, không trong Git hoặc trình duyệt.
5. Đo lỗi phát hiện sai/bỏ sót theo từ/âm vị, độ nhất quán với người rà soát, độ trễ và chi phí thực tế. Không so sánh bản thân transcript để kết luận phát âm.
6. Chỉ tích hợp khi nhận xét hữu ích với người học mục tiêu. Thiết lập quota ứng dụng và hạn mức phút/ngày trước khi bật; xác minh riêng khả năng chặn chi phí của tài khoản dịch vụ, không coi cảnh báo ngân sách là giới hạn cứng.

Tài liệu: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment

## Nếu chọn tự train thành đề tài riêng

Cần audio thật, câu mục tiêu, transcript, ranh giới từ/âm và nhãn thay/bỏ/thêm âm do người có chuyên môn rà soát. Có thể khảo sát L2-ARCTIC; kiểm tra LICENSE của bản tải trước khi sử dụng. Dùng model âm thanh nền thích hợp cho phát hiện lỗi âm vị, không dùng adapter gia sư chữ làm bộ chấm phát âm. Thiết kế tập test tách người nói, bổ sung trường hợp câu chưa thấy và thử trên micro/thiết bị khác.

Tài liệu bộ dữ liệu: https://psi.engr.tamu.edu/l2-arctic-corpus-docs/
