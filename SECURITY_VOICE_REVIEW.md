# Kiểm tra bảo mật — ghi âm trên thiết bị

Phạm vi: chỉ push mã nguồn `archive/year2`, không thay `main` hoặc GitHub Pages. Bằng chứng áp dụng cho commit chứa báo cáo này và runtime fingerprint SHA-256 `af6a967716892b04118672935f91cb05bc7d99da9237910ea759bb71c2a472b2`. Bộ assets được tải/kiểm tra theo `data/voice-assets-manifest.json`; binary không đưa vào Git.

STT | Mục kiểm tra | Trạng thái | Bằng chứng | Lỗi đã sửa hoặc việc còn thiếu
---|---|---|---|---
1|API key và bí mật|ĐẠT|Gitleaks source/assets/staged; bundle hash khớp nguồn công khai; không API key nhận diện.|Không gửi audio lên server; một cảnh báo tokenizer giả được xác minh là biểu thức code và miễn trừ đúng biểu thức/path.
2|Biến môi trường|KHÔNG ÁP DỤNG|Không có .env hoặc biến runtime cần truyền vào browser; model/runtime dùng version/revision cố định.|Chỉ setup tải file công khai; không thông tin riêng trong mẫu cấu hình.
3|Bí mật trong Git|ĐẠT|Gitleaks staged và lịch sử --all; .gitignore bỏ voice-assets, cache, môi trường và output.|Không force-push/viết lại lịch sử; raw và bản scanner đã rà soát được giữ riêng.
4|Trang/API quản trị|KHÔNG ÁP DỤNG|Bản xuất bản không có chức năng/API quản trị.|Không đưa gia sư AI đang làm dở vào commit này.
5|Xác thực|KHÔNG ÁP DỤNG|Không đăng nhập, mật khẩu, phiên/token của app.|Không tự thêm tài khoản.
6|Quyền người dùng|KHÔNG ÁP DỤNG|Không tài khoản hoặc dữ liệu của người khác trên server.|Tiến độ/lịch sử ở thiết bị; nhận diện âm thanh trong browser.
7|Dữ liệu đầu vào|ĐẠT|Preview kiểm tra Host/đường dẫn/allowlist; worker giới hạn language, float hữu hạn, 480000 mẫu; audio 10 MB/30 giây; văn bản 5000.|Không có server nhận audio/text của ASR; hủy, sửa ô nhập, đổi ngôn ngữ và route bỏ kết quả đến muộn.
8|Chống XSS|ĐẠT|DOM dùng textContent/text nodes và textarea.value; fixtures HTML/Unicode qua; URL worker/model cố định.|CSP chỉ self script/worker; cho WASM bằng wasm-unsafe-eval, không mở unsafe-eval JavaScript.
9|SQL injection|KHÔNG ÁP DỤNG|Không SQL, ORM hoặc backend truy vấn.|Không thêm DB.
10|Quyền cơ sở dữ liệu|KHÔNG ÁP DỤNG|Không cơ sở dữ liệu server.|CacheStorage chỉ chứa model của cùng origin; xóa model không xóa tiến độ.
11|Rate limiting API|KHÔNG ÁP DỤNG|Không API nhận diện công khai hoặc thao tác server tốn tài nguyên; preview chỉ loopback.|Giới hạn local một job, 30 giây ghi, 120 giây nhận diện, 180 giây chuẩn bị; Google dịch thuộc dịch vụ bên ngoài.
12|Giới hạn chi phí|KHÔNG ÁP DỤNG|Không API trả phí/key/billing, ASR chạy CPU trên thiết bị.|Tải assets 63.1 MiB từ nguồn công khai; chưa triển khai hosting mới để phát sinh chi phí.
13|Upload file|KHÔNG ÁP DỤNG|Không upload audio/file lên server; POST preview trả 405.|Audio ghi trong bộ nhớ browser được kiểm tra kích thước/duration trước xử lý; không endpoint upload.
14|CSRF|KHÔNG ÁP DỤNG|Không cookie xác thực hoặc server endpoint thay đổi dữ liệu.|GET chỉ phục vụ static allowlist.
15|CORS|KHÔNG ÁP DỤNG|Không own cross-origin API/CORS credentials; preview không Access-Control-Allow-Origin/Credentials.|Dịch dùng credentials omit; ASR không gọi dịch vụ ngoài. CORS Google do nhà cung cấp quản lý.
16|HTTPS|KHÔNG ÁP DỤNG|Hành động là push archive/year2, không triển khai; preview chỉ HTTP loopback secure context.|Nguồn/tải/dịch/video dùng HTTPS. Chưa chứng nhận production phiên bản mới; khi deploy phải kiểm tra TLS lại.
17|Security headers|ĐẠT|GET preview xác nhận CSP, nosniff, DENY, Referrer-Policy, Permissions-Policy; MIME mjs/wasm đúng. Worker WASM chạy thật ở Brave/Edge.|Whitelist chính xác 10 assets có thể phục vụ; thư mục tools, LICENSE vendor, .git, traversal bị chặn.
18|Cookie|KHÔNG ÁP DỤNG|Không cookie phiên/nhạy cảm; preview không Set-Cookie.|Quyền micro là permission của trình duyệt, không phiên auth.
19|Debug|ĐẠT|Không debugger hoặc console log audio/transcript; worker lỗi trả thông báo chung; preview không request log/stack trong response.|Bỏ log tạm, xử lý client hủy tải để tránh stack lỗi đóng kết nối.
20|Cấu hình/build/dependency|ĐẠT|2 Python/12 JS qua syntax; 61 nhóm fixtures; ASR model thật Edge/Brave; 11 asset SHA256 đúng; npm app audit 0; GitHub Pages vẫn main, không hook/custom workflow.|Audit toàn gói Transformers báo sharp Node/libvips; bản browser được phục vụ không có sharp/.node/libvips và không cài Node runtime. Không áp dụng advisory này cho file phát hành; giữ audit gốc và bằng chứng phân tích.

**Kết luận: ĐỦ ĐIỀU KIỆN cho push mã nguồn archive/year2 khi các lệnh kiểm tra cuối và đối chiếu remote dưới đây tiếp tục đạt.** Các mục không áp dụng được giải thích theo đúng kiến trúc/hành động, không coi là đã kiểm tra production.

Thực tế: 61 nhóm kiểm thử (31 web, 8 nhiều tab, 5 giới hạn dịch/HTML, 17 ghi âm); model Whisper WASM thật với WAV tiếng Anh được tạo tại máy qua getUserMedia/MediaRecorder ở Edge 154.0.4258.53 và Brave 154.0.8037.98, không request ra ngoài trong ASR; 11 file đúng hash; kiểm tra MIME/headers/Host/traversal/POST; syntax 2 Python/12 JS; npm audit app 0; scan source/assets/staged/history.

Phân tích scanner: bundle vendor trùng SHA-256 với archive npm đã xác minh SHA-512. Cảnh báo generic-api-key duy nhất trỏ tới biểu thức `e.unk_token,this.max_input_chars_per_word`, là truy cập thuộc tính tokenizer, không chuỗi credential. Cấu hình scanner riêng chỉ miễn trừ đúng biểu thức trên đúng file; không bỏ qua cả bundle hoặc các rules mặc định.

Phân tích dependency: audit toàn package Transformers.js 3.8.1 báo 2 mục high do sharp và cảnh báo kế thừa từ sharp. Setup chỉ xuất browser bundle, WASM, loader và LICENSE; không cài hoặc phục vụ sharp/native Node/decoder ảnh. Bundle browser có 0 literal sharp, .node và libvips; luồng chỉ gọi automatic-speech-recognition. Cảnh báo ảnh Node không ảnh hưởng các file runtime này; nếu sau này dùng Transformers.js trên Node cần nâng dependency và audit lại. Không tuyên bố full package audit 0.

Giới hạn: chưa dùng micro thật của người dùng, chưa đánh giá độ chính xác tiếng Việt, chưa chạy Opera vì không có executable trên máy. Website public vẫn phiên bản main; chưa deploy code mới và chưa kiểm tra production của bản mới. Không đánh giá lần thứ tư hay tự tăng điểm 8.9 của phiên bản cũ.

Hành động tiếp theo: commit, xác nhận scanner/remote trên commit cuối, báo cáo đủ 20 mục trước push, push fast-forward archive/year2 và đối chiếu GitHub tree; không force-push. Sau đó cập nhật ghi chú và hướng dẫn trong Google Doc.
