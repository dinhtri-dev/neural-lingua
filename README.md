# Neural-Lingua — Học tiếng Anh từng bước

Web tự học cho người Việt mới bắt đầu, hướng tới A1–A2. Gồm 52 bài theo thứ tự VOA Let’s Learn English Level 1, hướng dẫn tiếng Việt, 312 mục từ vựng, 260 câu hỏi tự luyện, flashcard và công cụ dịch/giọng nói.

## Chạy bản dùng thử

Cần Python 3.12 trở lên. Phần học/dịch không cần cài thư viện runtime; ghi âm trên thiết bị cần chuẩn bị bộ model riêng theo [VOICE_GUIDE.md](VOICE_GUIDE.md).

```powershell
python serve.py
```

Mở http://127.0.0.1:8831. Server chỉ nghe trên máy của bạn, giới hạn file phục vụ, có CSP và security headers. Có thể chọn cổng khác bằng `python serve.py --port 8832`. Dùng HTTP cục bộ thay vì mở trực tiếp index.html, vì dữ liệu bài học được đọc bằng fetch.

## Cách học

1. Chọn bài trên Lộ trình hoặc tiếp tục bài đang học.
2. Bấm Mở video VOA; bấm nút phát trong trình phát gốc. Chọn thêm Luyện nói/Phát âm khi có.
3. Đọc từ, mẫu câu và làm hoạt động nói/viết. Lưu từ để ôn bằng flashcard.
4. Trả lời đủ 5 câu rồi kiểm tra. Đạt ít nhất 4/5 để đánh dấu hoàn thành; có thể làm lại. Điểm tốt nhất được giữ.

Có thể tìm bài không cần dấu tiếng Việt, lọc chặng/trạng thái và mở mọi bài mà không cần đăng nhập. Công cụ Dịch hỗ trợ 7 ngôn ngữ, Ctrl/Cmd+Enter, hủy/timeout, sao chép và giọng nói tùy trình duyệt.

## Quyền riêng tư

Tiến độ, điểm và sổ từ lưu cục bộ khi bật lưu; có nút tắt và xóa. Các tab đồng bộ thay đổi bằng Web Locks/storage events; trình duyệt thiếu Web Locks có cảnh báo dùng một tab. Bản nháp luyện viết không được lưu hoặc gửi đi. Lịch sử dịch mặc định tắt, giới hạn 20 mục khi bật. Không có tài khoản hoặc đồng bộ thiết bị.

Video chỉ kết nối nhà cung cấp sau thao tác mở. Văn bản dịch được gửi tới Google qua HTTPS khi bấm Dịch; tránh thông tin riêng tư. Ghi âm trong công cụ Dịch dùng Whisper chạy ngay trong trình duyệt; audio không gửi ra ngoài hoặc lưu. Bấm Chuẩn bị ghi âm để tải model khoảng 63 MiB rồi cấp quyền micro khi bấm Ghi âm. Xem [hướng dẫn và các giới hạn](VOICE_GUIDE.md).

## Nội dung và nguồn

Video thuộc VOA và phát từ trình nhúng chính thức, không được lưu trong repository. Nội dung tiếng Việt và câu hỏi là phần biên soạn của Neural-Lingua. COURSE_SOURCES.md và data/source-audit.json ghi nguồn, quyền sử dụng và kiểm tra 52 video. British Council được tham khảo để định hướng mục tiêu trình độ; web không phải sản phẩm của họ. Điểm tự luyện không xác nhận đạt CEFR.

## Kiểm thử

Node 22+, Microsoft Edge, Python server đang chạy:

```powershell
npm ci --ignore-scripts
npm test
node tests/voice.cjs
node tests/live-media.cjs
```

Playwright 1.62.1 chỉ là dependency phát triển. Bộ chức năng dùng dịch/giọng nói và video giả để kiểm soát lỗi, còn live-media.cjs bấm trình phát thật ở bài 1/13/26/39/52, kiểm tra thời gian phát tiến lên và hình đã giải mã. Screenshot/kết quả nằm trong test-results và không được commit. Browser test có thể dùng PLAYWRIGHT_PATH để chọn bộ Playwright đã cài, PREVIEW_URL để chọn cổng, QA_OUT_DIR để đổi thư mục kết quả.

Bản bàn giao qua 44 nhóm kiểm thử (31 chức năng, 8 nhiều tab/bàn phím, 5 giới hạn dịch/HTML). Kiểm tra nguồn gồm 52 video chính và 104 video bổ sung qua HTTP; phát thật 5 bài trên với thời gian tiến lên và hình giải mã, không dùng HTTP 200 làm bằng chứng phát. Reviewer độc lập chấm lần lượt 7,8 → 7,9 → 8,9/10; dừng cải tiến ở lượt ba. Sáu đề xuất còn lại được ghi trong REVIEW_ROUNDS.md, chưa được triển khai hoặc tính như đã đạt.

## Cấu trúc

- index.html, styles.css: khung giao diện và responsive.
- js/: điều hướng, bài học, dữ liệu cục bộ và dịch.
- data/course.json: 52 bài với ID ổn định, từ vựng và bài tập.
- data/source-audit.json: nguồn video và bằng chứng kiểm tra HTTP, không đánh đồng HTTP 200 với phát video.
- tests/: chức năng, tình huống lỗi và kiểm tra video thật.

## Giới hạn và xuất bản

Dịch dùng endpoint Google thử nghiệm, có thể ngừng hoặc đổi. Chưa có cam kết chất lượng dịch. Nhận diện đã thử với model thật, audio mẫu qua micro giả lập trên Brave và Edge; Opera chưa thử trực tiếp. Model nhỏ có thể nhận sai, chưa kiểm tra giọng người dùng/độ chính xác tiếng Việt. Giọng đọc vẫn tùy browser/OS; không đánh giá phát âm. Trình phát/nguồn video ngoài có thể thay đổi. Server cục bộ không phải môi trường production.

Bản mới nằm trên archive/year2. GitHub Pages tiếp tục dùng main; lần cập nhật này không triển khai website. Không force-push hoặc viết lại lịch sử. Xem SECURITY_REVIEW.md và REVIEW_ROUNDS.md để biết phạm vi kiểm tra và đánh giá độc lập.
