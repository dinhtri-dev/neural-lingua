# Kiểm tra bảo mật bản public — nghiệm thu preview

Snapshot trước push/promote, ngày 13/10/2026. Đã kiểm tra preview sau khi chủ tài
khoản cho phép riêng draft để xác minh runtime. Reviewer vòng ba đạt **9,3/10**,
không còn P1/P2 chưa xử lý. Đây **không phải chứng nhận production trước promote**;
domain chính thức phải được kiểm tra lại sau khi xuất bản đúng deploy đã nghiệm thu.

Phạm vi: static course mới tại `neural-lingua-course.netlify.app`, Netlify team
`tricucdu`, không Git/CI connection; chỉ source `archive/year2`. `main`/Pages
cũ và dự án Netlify cũ không thay đổi. Không triển khai AI backend local.

Cây mã source/test đã kiểm tra: `cc06c5d81e325e9dd8c38fa063f51043630d2ea6`
(trước khi thêm hai tài liệu báo cáo, không chứa báo cáo tự tham chiếu).
Gói: `58b0fbbde8e1f5822407f1f8fbdfe939e3587f56b5733965542d77b2a2af547c`,
28 file + `build-manifest.json`, commit cha `dc912c7`. Preview deploy
`6acda443b5598e52e8bb5c6d`:
[HTTPS preview](https://6acda443b5598e52e8bb5c6d--neural-lingua-course.netlify.app/).
Đã hash bytes tải thật 27 file từ CDN theo manifest; `_headers` là control file
Netlify tiêu thụ, xác minh bằng header trả thật thay vì URL của control file.
Test đã sửa để chờ app tải xong và chấp nhận Netlify từ chối traversal bằng 400
(local dùng 404); verifier tính lại fingerprint canonical, không tin remote
declaration. Không đổi bundle/app sau vòng 2. Tree cuối gồm cả hai báo cáo sẽ
được ghi trong receipt kiểm tra/commit và thông báo trước push; nếu tree hoặc
gói khác phiên bản đã kiểm tra, phải dừng và kiểm tra lại mục bị ảnh hưởng.

| STT | Mục kiểm tra | Trạng thái | Bằng chứng | Lỗi đã sửa hoặc việc còn thiếu |
|---|---|---|---|---|
| 1 | API key và bí mật | ĐẠT | Gitleaks gói public, kiểm tra manifest/allowlist; không key runtime | 1 cảnh báo tokenizer trong bundle chuẩn là biểu thức mã, không credential; allowlist đúng biểu thức, kèm SHA256 bundle aa5002…365fa |
| 2 | Biến môi trường | ĐẠT | Netlify getEnvVars: 0; site-mode local false/public true; không xuất process.env | Token CLI/API nằm ngoài repository; không đi vào dist/URL/log |
| 3 | Bí mật trong Git | ĐẠT | Gitleaks 8.30.1: 14 commit và staged diff không phát hiện bí mật; kiểm tra .gitignore | Ignore .env, môi trường, models, voice-assets, dist, .netlify, audio/test output |
| 4 | Trang và API quản trị | KHÔNG ÁP DỤNG | Static course không có admin hoặc thao tác server nhạy cảm; tutor.js không trong dist | Netlify admin là nền tảng quản lý riêng, không phải trang quản trị được ứng dụng triển khai |
| 5 | Xác thực | KHÔNG ÁP DỤNG | Người học không đăng nhập; không user/password/token/session ứng dụng | Không thêm cơ chế đăng nhập không cần thiết |
| 6 | Quyền người dùng | KHÔNG ÁP DỤNG | Không bảng dữ liệu người dùng/server IDs; localStorage chỉ origin của trình duyệt | Không tuyên bố có đồng bộ/khôi phục dữ liệu giữa người dùng |
| 7 | Đầu vào server | KHÔNG ÁP DỤNG | Không API/form server nhận dữ liệu người học; ASR Float32Array và quiz xử lý tại máy | Builder kiểm tra paths/junctions/version/size/hash; xác thực client không được coi là xác thực server |
| 8 | XSS | ĐẠT | tests/browser, translation-boundaries, personalization: HTML độc hại/malformed được hiển thị như chữ | Dùng textContent/value/createTextNode; không nhận HTML người dùng để chèn trực tiếp |
| 9 | SQL injection | KHÔNG ÁP DỤNG | Không SQL/ORM/query server | Không cơ sở dữ liệu |
| 10 | Quyền cơ sở dữ liệu | KHÔNG ÁP DỤNG | Không cơ sở dữ liệu, Supabase/Firebase/RLS hoặc credential DB | Không dữ liệu riêng tư công khai trên server |
| 11 | Rate limiting | KHÔNG ÁP DỤNG | Không login/reset/API/upload/compute người học trên server; file CDN tĩnh | ASR chạy local, 30 giây/10MB/5000 ký tự/timeouts; bandwidth chịu quota provider, không cam kết chống mọi DoS |
| 12 | Chi phí/quota | ĐẠT | Dashboard Free Legacy, 100GB/300minutes; API accumulate_overages=false, block_builds_when_usage_exceeded=true, subscribe_to_add_ons=false; không lưu thẻ | Không upgrades/add-ons/domain purchases; hết quota có thể tạm dừng các site trong team |
| 13 | Upload file | KHÔNG ÁP DỤNG | Không endpoint nhận upload/audio từ người học; real voice chỉ GET cùng origin | Upload triển khai chỉ từ allowlist/hash của người quản lý, không upload repo/env/audio |
| 14 | CSRF | KHÔNG ÁP DỤNG | Không cookie xác thực hoặc mutation server của ứng dụng | Không state-changing GET ứng dụng |
| 15 | CORS | ĐẠT | Header preview không ACAO wildcard/credentials; app fetch credentials:omit; không API proxy | CSP chỉ self/Google cho connect; Google/VOA là dịch vụ bên ngoài, không giả vờ kiểm soát cấu hình của họ |
| 16 | HTTPS | ĐẠT | Preview 200 qua TLS xác minh mặc định; HTTP 301 tới HTTPS; public test không mixed content | Node/Edge không bỏ qua certificate error; kiểm tra lại domain chính thức sau promote |
| 17 | Security headers | ĐẠT | Header thật có CSP/frame-ancestors none, nosniff, DENY, referrer, permissions và HSTS; không unsafe-inline/JS unsafe-eval | Model/audio, video và chức năng đều chạy dưới CSP này; Blob chỉ dùng bytes runtime đã kiểm tra |
| 18 | Cookie | KHÔNG ÁP DỤNG | Ứng dụng không tạo cookie phiên/nhạy cảm; tiến độ localStorage | Không có session rotation/logout của ứng dụng; iframe provider có chính sách riêng |
| 19 | Debug | ĐẠT | Dist không có server/debug/test/source map; lỗi tải/model thông báo chung, không nội bộ | Netlify API/private paths trả 404; traversal 400, foreign Host bị từ chối; không SPA-rewrite thiếu model thành HTML |
| 20 | Cấu hình/dependency | ĐẠT | Build --verify + 5 builder tests; CDN 27 file hash/size/MIME; 31 browser, 8 multi-tab, 20 personalization, 5 translation, 18 voice, 5 public, 3 integrity và model/audio/video thật trên preview đạt; test/publisher npm audit 0 | Native full-transformers npm audit 6 cảnh báo nhưng 5 native modules liên quan vắng mặt trong 131 sources của browser bundle chính thức; không gọi native paths |

## Kiểm tra đã thực sự chạy

Kết quả thô (không commit) trong `test-results/public-local`,
`public-local-v2`, `public-local-regression`, `public-netlify` và các file
`public-*-secrets.json`. Preview có 0 uncaught errors/0 CSP violation ở luồng app
kiểm tra; model và video đều chạy thật, không chỉ đọc cấu hình hoặc HTTP 200.

- 31 browser, 8 multi-tab, 20 personalization, 5 translation, 18 voice lifecycle;
  5 public groups, 5 builder tests, 3 voice-integrity regression scenarios.
- Model Whisper/WASM thật qua WAV mẫu/micro giả lập: nhận Anna/Washington,
  giữ draft trước, verified cache reload; không POST/audio request/ngoài origin.
  Thử timer thật dừng sau 29819ms (local) và 29813ms (Netlify), ngoài bài fixture
  tăng tốc timer. Model/audio không bị mock trong nhóm real-model.
- Video VOA thật bài1/13/26/39/52: clock>3s, unpaused, decoded1280×720;
  không đánh giá âm thanh chỉ từ HTTP200 hoặc screenshot.
- Tutor local +16 flow groups với mocks, không đánh giá chất lượng model tutor.
- Fresh provenance: npm tar SHA512 khớp khóa, JS hash khớp manifest; sourcemap
  chính thức không chứa onnxruntime-node/sharp/global-agent/roarr/sprintf-js.
  Full npm transformers có6 cảnh báo native, không nói toàn package sạch.
- Công cụ CLI đầy đủ dùng cho Authorize/create có16 cảnh báo các nhánh dev/build/
  image/native không cần dùng; upload/promotion dùng bộ API chính thức riêng
  @netlify/api15.1.2 + @netlify/dev-utils6.0.3, audit35dependencies:0.
- GitHub API: archive dc912c7, main d8e79ec; Pages main:/ HTTPS/built,
  chỉ dynamic Pages workflow, active webhooks0. Netlify mới không nối repo,
  publishedDeploy=null, envCount0. Không thay đổi dự án cũ/billing.
- Kiểm tra bổ sung môi trường AI local (không trong public): pip-audit đọc 76
  package, 75 không có cảnh báo đã biết, Torch 2.14.1+cu130 không có trên PyPI
  nên bị skip; audit riêng bản base PyPI 2.14.1 không có cảnh báo. Không khẳng
  định đã kiểm chứng toàn bộ binary CUDA. Không thay đổi model/adapter local.

Giới hạn: đã có preview, chưa chứng nhận production trước promote; chưa micro vật lý, chưa thử mọi
thiết bị thật/giọng tiếng Việt. Không đánh giá toàn bộ bảo mật nội bộ Netlify,
Google hoặc VOA. Quét dependency/secret không chứng minh an toàn tuyệt đối.

**Kết luận: ĐỦ ĐIỀU KIỆN cho commit/push `archive/year2` và promote đúng deploy
đã kiểm tra sau khi quét/đối chiếu cuối xác nhận khớp.** Các kiểm tra đã chạy và
giới hạn nằm ở trên, không tuyên bố an toàn tuyệt đối. Hành động tiếp theo: ghi
receipt tree cuối, quét báo cáo/test mới, công bố bảng 20 mục trước hành động;
push không force, promote deploy `6acda443b5598e52e8bb5c6d`, kiểm tra lại HTTPS/
header/chức năng/hash trên domain chính thức và xác nhận GitHub/Pages cũ không đổi.
