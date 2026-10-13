# Đánh giá độc lập bản public — 13/10/2026

Một reviewer duy nhất (`public_reviewer`), đúng ba vòng theo yêu cầu. Các điểm
trong tài liệu này chỉ cho tính năng public/local, không thay điểm lịch sử của
bản học ban đầu, lộ trình hoặc README trước đây.

## Vòng 1 — 7,6/10

Gói `6342c45042ee26942f93383b8ce99f88bf49d6ba0eb966d486f7a364e2c09836`.
Reviewer tự tái hiện lỗi: module được kiểm tra hash rồi `import()` tải lần thứ
hai, nên bytes chưa kiểm tra có thể thực thi. Chưa đủ điều kiện xuất bản.

Đã sửa: chạy đúng bytes đã kiểm tra bằng Blob URL; ONNX `.mjs` cũng dùng Blob
đã xác minh; WASM/model tải qua wrapper kiểm tra size/SHA-256. CSP cho phép Blob
script cần thiết, không thêm unsafe-inline hoặc JavaScript unsafe-eval. Thêm
kiểm thử hot-swap, hash sai và cache hỏng. README bổ sung cách học online,
giới hạn gia sư local và tiến độ riêng theo origin.

## Vòng 2 — 8,8/10

Gói `58b0fbbde8e1f5822407f1f8fbdfe939e3587f56b5733965542d77b2a2af547c`.
Reviewer chạy lại hot-swap độc lập: mỗi module chỉ tải một lần, không thực thi
mã chèn ở lần hai; Whisper chuẩn bị thành công. Đọc kết quả model/audio thật,
18 voice lifecycle tests và kiểm tra build. Vẫn chưa chốt xuất bản trước preview.

Đã sửa: README cuối file không còn nói lần này không triển khai website; các
điểm 7,8→7,9→8,9 ghi rõ là lịch sử bản học ban đầu. Quota dùng đúng **100 GB**
theo dashboard thay vì tự ghi GiB. Công cụ xuất bản chỉ dùng API chính thức
tách riêng, không chạy dev server/functions/image tool của CLI đầy đủ.

## Vòng 3 — 9,3/10

Gói không đổi `58b0fbbde8e1f5822407f1f8fbdfe939e3587f56b5733965542d77b2a2af547c`;
preview deploy `6acda443b5598e52e8bb5c6d`. Reviewer tự đối chiếu manifest remote
với local, tính fingerprint và tải/hash 27 file CDN theo inventory local; kiểm
tra HTTPS/301/header/404, mobile375px, direct links/reload bài1/26/52, hoàn thành
quiz và giữ tiến độ sau reload, không gọi API/tải model tự động/lỗi JavaScript.

Phát hiện trong vòng này đã sửa: verifier CDN trước đó chỉ tin chuỗi fingerprint
remote. Patch mới tính lại SHA-256 canonical inventory và có regression thay
hash một entry, nên entries bị đổi không thể giữ fingerprint đã biết. Reviewer
xác minh độc lập bằng inventory local và kiểm tra patch ngay trong vòng 3.
Không đổi app/dist, không mở vòng đánh giá thứ tư.

Đạt mục tiêu review preview, không còn P1/P2 chưa xử lý. Trước push/promote phải
quét lại cây mã cuối; promote đúng deploy đã kiểm tra rồi kiểm tra production.
Điểm không chứng nhận micro vật lý, mọi điện thoại/giọng nói hoặc bảo mật nội bộ
dịch vụ bên ngoài. Reviewer không dùng quyền tài khoản để tự xác minh quota/
GitHub; phần đó do main agent kiểm tra bằng tài khoản đã được chủ sở hữu cho phép.

**Tổng đúng ba vòng: 7,6 → 8,8 → 9,3/10.**

## Bằng chứng trên máy và giới hạn

- Build fail-closed: 28 file + manifest, 11 voice assets khóa version/size/hash;
  5 bài kiểm tra builder, không đóng gói AI backend, token, môi trường hoặc audio.
- 31 browser groups, 8 multi-tab, 20 personalization, 5 translation boundaries;
  direct-link/reload đủ 52 bài; mobile 320/375/768/1440 và bàn phím được kiểm tra.
- 18 voice lifecycle groups dùng worker/mock và micro giả lập; kiểm thử deadline
  ở nhóm đó tăng tốc timer. 3 regression integrity dùng model thật đều đạt.
- Whisper/WASM thật + WAV tiếng Anh mẫu nhận đúng Anna/Washington, giữ chữ trước
  đó, kiểm tra cache dùng lại; chỉ GET cùng origin, không request gửi audio.
  Kiểm tra bổ sung timer thực tế dừng khoảng 29,8 giây, không tăng tốc thời gian.
- Video VOA thật ở bài 1/13/26/39/52: thời gian phát >3 giây, không paused, khung
  hình đã giải mã; không coi HTTP200 là playback hoặc đánh giá âm thanh.
- Tutor local và 16 flow groups được kiểm tra hồi quy với API/audio fixtures;
  không chứng nhận chất lượng model AI thử nghiệm.
- Chưa kiểm tra micro vật lý, độ chính xác nhiều giọng hay tất cả điện thoại.
  Test mobile là viewport giả lập trên Edge, không phải kiểm thử thiết bị thật.

Kết quả thô/screenshot nằm trong `test-results`, bị bỏ qua bởi Git. Báo cáo
bảo mật phải gắn đúng gói và cây mã sắp phát hành, không dùng điểm để thay audit.
