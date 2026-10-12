# Kiểm tra trước push — lộ trình cá nhân hóa

Ngày 13/10/2026, Asia/Saigon. Hành động được người dùng yêu cầu: commit và push
mã lên `dinhtri-dev/neural-lingua`, nhánh `archive/year2`. Không push `main`,
không triển khai public hoặc thay đổi tài khoản dịch vụ.

## Phiên bản và phạm vi bằng chứng

- Base commit: `1944e90589e9b7598dcca3afb90252c3b1a87845`.
- Git tree của toàn bộ index nguồn/cấu hình đã kiểm tra, trước khi thêm hai
  báo cáo chỉ chứa văn bản này:
  `e216c7641d526eed01f3b27528f02b538a0e9256`.
- Sau khi thêm báo cáo, phải xác nhận tất cả blob nguồn trong index không đổi,
  quét thêm tài liệu và commit mới, rồi báo SHA commit chính xác trước push.
- Preview thật: `http://127.0.0.1:8841`. Backend hiện hữu chỉ bind
  `127.0.0.1`, một worker; kiểm thử API qua FastAPI TestClient và decoder thật.
- GitHub API đã xác minh Pages lấy `main:/`, HTTPS enforced, chỉ có workflow
  Pages quản lý bởi GitHub, không workflow triển khai tùy chỉnh, không webhook
  hoạt động hoặc cấu hình hosting trong tree archive. `main` vẫn là
  `d8e79ecd0434dc736852758001fd6a83d9d4b098`.

Không dùng báo cáo bảo mật cũ để chứng nhận lần thay đổi này. Các kết quả dưới
đây đến từ đọc nguồn hiện tại và chạy kiểm tra lại trên máy.

| STT | Mục kiểm tra | Trạng thái | Bằng chứng | Lỗi đã sửa hoặc việc còn thiếu |
|---|---|---|---|---|
| 1 | Bảo vệ API key và bí mật | ĐẠT | Gitleaks quét snapshot toàn bộ index, 0 phát hiện; rà HTML/JS/config/log, không có secret xuất cho browser. | Đáp án đầu vào chỉ xử lý local; credentials dùng đọc GitHub không đưa vào nguồn/log. |
| 2 | Kiểm tra biến môi trường | ĐẠT | `ai-tutor/run.py`, `config.json`, `pipeline.py`: model/cổng local rõ ràng; biến Python chỉ điều khiển cache/telemetry/UTF-8. Không có biến secret hoặc .env theo dõi/xuất sang JS. | Không có staging/production backend được triển khai trong hành động này. |
| 3 | Kiểm tra bí mật trong Git | ĐẠT | Gitleaks `git --all` quét 12 commit trước commit mới, 0 phát hiện; snapshot index 0 phát hiện; kiểm tra ignore cho .env, môi trường, cache, model, test output. | Quét lại cả commit mới và tài liệu ngay trước push; không viết lại lịch sử. |
| 4 | Bảo vệ trang và API quản trị | KHÔNG ÁP DỤNG | Không có trang/API quản trị hoặc thao tác admin từ web; train/evaluate là CLI local. | Không thêm hệ thống admin không cần thiết. |
| 5 | Kiểm tra xác thực | KHÔNG ÁP DỤNG | Không tài khoản, mật khẩu, login hoặc phiên xác thực; dữ liệu học trên thiết bị một người dùng. | Không mở backend ra mạng hoặc thêm đăng nhập. |
| 6 | Kiểm tra quyền người dùng | KHÔNG ÁP DỤNG | Không dữ liệu server đa người dùng/ID người dùng. API chỉ dùng ID bài học công khai; origin/host local được kiểm tra riêng. | Không có dữ liệu của người khác để truy cập bằng thay ID. |
| 7 | Kiểm tra dữ liệu đầu vào | ĐẠT | `store.js` whitelist 15 đáp án, phiên bản/sequence/điểm/skill; 20 browser tests gồm dữ liệu hỏng. API tests xác minh ID, role, độ dài, body size, history/focus. | Bỏ dữ liệu không hợp lệ; tối đa 5 lượt mỗi bài. Kiểm tra server áp dụng cho API hiện hữu, không chỉ UI. |
| 8 | Chống XSS | ĐẠT | `dom.js` dùng text nodes, không chèn HTML từ đáp án; test payload HTML trong lesson/quiz/dịch và persisted state qua; CSP preview đúng. | Gợi ý và giải thích mới là văn bản. Không nhận HTML tùy ý. |
| 9 | Chống SQL injection | KHÔNG ÁP DỤNG | Không SQL, ORM hoặc truy vấn cơ sở dữ liệu; không thêm backend cho đầu vào. | Không có câu SQL cần tham số hóa. |
| 10 | Quyền và quy tắc cơ sở dữ liệu | KHÔNG ÁP DỤNG | Không database server/RLS/tài khoản DB; localStorage và model cache cùng origin. | Không có dữ liệu DB public hoặc tài khoản DB để cấu hình. |
| 11 | Giới hạn tần suất yêu cầu | ĐẠT | `LocalRequestBudget`: chat 12/phút, ASR 6/phút, Retry-After; test hết cửa sổ và giữ headers; semaphore/lock một tác vụ, server một worker. | Đầu vào không gọi API. Nếu chuyển nhiều instance/public phải thiết kế lại rate limiting; Google dịch không thuộc hạ tầng app. |
| 12 | Giới hạn chi phí | KHÔNG ÁP DỤNG | Model/ASR chạy máy; không cấu hình khóa inference trả phí, tài khoản billing hoặc GPU cloud; archive push không chạy model. | Không có chi tiêu dịch vụ trả phí để đặt quota. Endpoint dịch thử nghiệm không có cam kết/quota do app quản lý. |
| 13 | Bảo vệ upload file | ĐẠT | API unit tests và decoder PyAV thật từ chối sai nội dung/duration/silence; giới hạn 10 MB/30 giây; không dùng filename ghi file, đóng UploadFile trong finally. | Upload hiện hữu xử lý trong bộ nhớ, không lưu/thực thi; tính năng đầu vào không upload. |
| 14 | Chống CSRF | KHÔNG ÁP DỤNG | Không xác thực bằng cookie; GET chỉ đọc. Chat/ASR chỉ POST và bắt buộc Origin local đúng, được unit test. | Không cần CSRF token phiên cookie; vẫn giữ kiểm tra Origin cho thao tác tốn tài nguyên. |
| 15 | Kiểm tra CORS | ĐẠT | `server.py` whitelist Host/Origin đúng cổng; test origin lạ/thiếu bị từ chối; không wildcard/reflect credentials. Preview không phát CORS tùy ý; fetch dùng credentials omit. | Không coi CORS là đăng nhập; backend vẫn chỉ dùng loopback. |
| 16 | Bật HTTPS | KHÔNG ÁP DỤNG | Chỉ push archive, không triển khai; preview/backend HTTP loopback. Đã đọc Pages source main và HTTPS enforced qua API; URL ngoài trong nguồn là HTTPS. | Không chứng nhận TLS, mixed content hoặc production của mã mới; phải kiểm tra riêng nếu triển khai. |
| 17 | Kiểm tra security headers | ĐẠT | GET preview thật 200 có CSP/frame-ancestors none, nosniff, DENY, Referrer-Policy; browser tests xác nhận UI hoạt động. API tests kiểm tra cả phản hồi lỗi/rate limit. | Chỉ chứng nhận môi trường preview/local đã kiểm; không gán kết quả này cho Pages production. |
| 18 | Bảo vệ cookie | KHÔNG ÁP DỤNG | Không cookie phiên/nhạy cảm hoặc Set-Cookie của app; GET preview thật không Set-Cookie; không SessionMiddleware/set_cookie trong nguồn. | Không có phiên để xoay/vô hiệu hóa; cookie nhà cung cấp ngoài không do app thiết lập. |
| 19 | Tắt chế độ debug | ĐẠT | FastAPI debug mặc định tắt, docs/redoc/openapi tắt; uvicorn access_log false; preview không request log; lỗi model/audio trả thông báo chung. | Unit tests đường dẫn/denial và browser errors qua. Không log đáp án/audio/secret; experimental là nhãn model, không debugger. |
| 20 | Kiểm tra cấu hình production/phát hành | ĐẠT | Full npm suite trên preview; 20 personalization tests và reviewer 20/20; 24 Python unit tests; JS syntax, pip check, git diff check. Npm audit 0; pip-audit 75 package không advisory, torch base 2.14.1 không advisory. | Sửa pip 24.2 có advisory lên 26.2 trong env riêng và bootstrap/lock. Site thuần static, không có bước build bundle. Không triển khai production hoặc đổi model. |

## Kiểm tra thực tế và giới hạn

- `PREVIEW_URL=http://127.0.0.1:8841 npm test`: browser, multi-tab,
  translation boundaries, tutor smoke, tutor flow, voice lifecycle,
  personalization. Các API/audio fixtures không chứng minh chất lượng model.
- `.venv/Scripts/python.exe -X utf8 -m unittest discover -s . -p test_*.py -v`:
  24/24; `pip check`: không lỗi dependency.
- `npm audit --json`: 0 advisory; `pip-audit --path .../.venv/Lib/site-packages`:
  75 package đã audit, 0 advisory; torch CUDA-suffixed không có trên PyPI,
  kiểm tra riêng base `torch==2.14.1`: 0 advisory. Không audit driver/GPU binary.
- Gitleaks có redaction: Git history toàn bộ refs và snapshot index; sau khi
  thêm hai báo cáo phải quét lại snapshot và cả commit mới.
- HTTP GET preview thật, kiểm tra GitHub Pages/workflows/webhooks, ignore,
  source/lock/syntax và diff. Không có custom hook Git local đang hoạt động.

Chưa chạy lại inference model/ASR thật, micro vật lý, mọi video, screen reader,
trình duyệt/điện thoại khác hoặc public production trong lần này. Tính năng
mới không gọi model hay gửi đáp án ra mạng. Chưa thử nghiệm tính hiệu quả học
hoặc chuẩn hóa 15 câu; không xác nhận CEFR/nghe/nói. Browser không hỗ trợ Web
Locks được thông báo chỉ dùng một tab. Các phạm vi này không bị chứng nhận bởi
bản kiểm tra source/local này; triển khai public sẽ cần kiểm tra riêng.

## Kết luận

**ĐỦ ĐIỀU KIỆN cho push mã nguồn lên `archive/year2`**, sau bước xác nhận blob
không đổi và quét cả tài liệu/commit mới ngay trước push. Không có mục áp dụng
KHÔNG ĐẠT hoặc CHƯA XÁC MINH. Không có kết luận an toàn tuyệt đối.

Hành động tiếp theo: báo SHA và đủ 20 mục cho người dùng; push không force đúng
nhánh; đọc lại GitHub để xác nhận SHA remote, `main` và Pages source không đổi.
