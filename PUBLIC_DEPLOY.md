# Đóng gói bản online Neural-Lingua

Người học chỉ cần link chính thức trong [README_SU_DUNG.md](README_SU_DUNG.md).
Tài liệu này dành cho người quản lý mã nguồn và triển khai. Bản local vẫn chạy
bằng `python serve.py`; gia sư AI thử nghiệm chỉ ở local.

## 1. Tạo gói công khai

Từ thư mục có `index.html`, dùng Python 3.12 trở lên:

```powershell
python tools/build_public.py
python tools/build_public.py --verify
python serve.py --public --port 8851
```

Mở `http://127.0.0.1:8851`. Bộ đóng gói đọc manifest đã khóa Transformers.js
3.8.1 và Whisper revision `5332fcc35e32a33b86612b9a57a89be7906102b1`;
kiểm tra 11 file bằng kích thước và SHA-256. Nếu thiếu assets, chỉ tải từ các URL
chính thức cố định; gói npm còn kiểm tra SHA-512. Nếu muốn không tải mạng, dùng
`python tools/build_public.py --offline` sau khi chuẩn bị assets.
Không đổi hash để bỏ qua lỗi. Trong trình duyệt, worker cũng kiểm tra asset và
model-cache trước khi nhận diện; chỉ tải sau thao tác Chuẩn bị ghi âm.

`dist` chỉ có file giao diện/dữ liệu khóa học, model/runtime đã xác minh, giấy
phép runtime, trang 404, `_headers` và `build-manifest.json`. Không có AI backend,
adapter, .env, môi trường Python, audio, lịch sử, test output hoặc Git. Không
triển khai thẳng thư mục repository. `dist/js/site-mode.js` bật public, trong
khi cờ trong mã nguồn local giữ nguyên. Bản public không đóng gói `tutor.js`.

Build cũ được giữ trong `.public-build-backup-*`, không xóa tự động. Nếu `dist`
có file lạ/hỏng hoặc không phải build được quản lý, script dừng để tránh ghi đè
dữ liệu. Không tự sửa/xóa một thư mục chưa xác định. Manifest ghi fingerprint
toàn gói, hash từng file và commit cha; commit cha không tự chứng nhận các thay
đổi chưa commit. Báo cáo release phải đối chiếu thêm cây mã sắp phát hành.

## 2. Kiểm thử trước khi xuất bản

```powershell
npm ci --ignore-scripts
python tests/public-build.py
$env:PREVIEW_URL = 'http://127.0.0.1:8851'
node tests/public.cjs
node tests/browser.cjs
node tests/multi-tab.cjs
node tests/personalization.cjs
node tests/translation-boundaries.cjs
node tests/voice.cjs
node tests/live-media.cjs
```

Trên preview HTTPS, chạy thêm `node tests/verify-public-package.cjs` để đối
chiếu size/SHA-256 và MIME của bytes thực tế từ CDN. Đặt `PUBLIC_PACKAGE_SHA256`
bằng fingerprint gói cần kiểm tra khi dùng bản khác; không mặc định kết quả của
gói cũ chứng nhận gói mới. `_headers` là control file, kiểm tra bằng header thật.

Các bài kiểm tra voice lifecycle dùng worker giả lập và micro giả lập; không
được coi là thử model thật. `tests/voice-real.cjs` dùng model thật và WAV mẫu
qua micro giả lập. Chuẩn bị WAV tiếng Anh nói “My name is Anna. I live in
Washington.” và đặt `$env:VOICE_TEST_WAV` tới file đó trước khi chạy. WAV chỉ
dùng kiểm thử trên máy, không nằm trong `dist`. Micro vật lý, độ chính xác nhiều
giọng và mọi loại điện thoại vẫn cần thử riêng. Không coi ASR là chấm phát âm.

## 3. Netlify — chỉ dự án riêng, gói Free

Tài khoản hiện có dùng **Free Legacy**: dashboard hiển thị 100 GB bandwidth và 300 build minutes
mỗi tháng, hạn mức dùng chung team; khi đạt giới hạn Free, Netlify có thể tạm
dừng các trang trong team và chặn build. Không mua tên miền, bật dịch vụ trả phí,
thêm thẻ, đổi gói hoặc chuyển sang gói credit. Kiểm tra lại dashboard trước mỗi
lần triển khai; thông tin gói có thể thay đổi.

Kết nối Netlify CLI bằng quy trình Authorize do chủ tài khoản tự xác nhận; không
chia sẻ token vào chat hoặc lưu token trong repo. CLI giữ đăng nhập ngoài mã
nguồn. Tạo dự án mới **neural-lingua-course** trong team **tricucdu**, không kết
nối Git/CI. Vì vậy push `archive/year2` không tự deploy. Giữ `main`/Pages và dự
án Netlify cũ nguyên trạng. Chỉ dùng miền `.netlify.app` được cấp.

Trước khi upload, áp dụng [20 mục bảo mật](SECURITY_CHECKLIST.md) cho hành động
đang thực hiện. Dùng **draft deploy** để xác minh các mục runtime, không dùng
Netlify Drop hoặc `--prod` làm preview. Không triển khai nếu điều kiện của hành
động còn mục áp dụng chưa đạt/chưa xác minh. Header thực tế, HTTPS và chức năng
phải kiểm tra trên preview; đọc `_headers` chưa chứng nhận production.

Khi bản preview và đúng 3 vòng review đều đạt, báo cáo đủ 20 mục gắn với cây mã
và fingerprint gói. Chỉ sau khi đủ điều kiện mới commit/push `archive/year2`
(không force) và **promote chính deploy đã kiểm tra**, không build lại âm thầm.
Sau đó kiểm tra lại domain chính thức, fingerprint file, HTTPS/headers/chức năng,
commit GitHub và Pages cũ. Không đặt redirect SPA cho file model/API bị thiếu:
chúng phải trả 404, không trả HTML giả thành model.

## Quyền riêng tư

Tiến độ chỉ lưu trên trình duyệt/origin; không có tài khoản hoặc đồng bộ. Model
có thể được cache, audio không được lưu/upload. Google chỉ nhận văn bản khi bấm
Dịch. Video do VOA phục vụ trong iframe sau thao tác mở. Netlify nhận các yêu
cầu tải file và metadata HTTP thông thường, không nhận đáp án/đầu vào/bản ghi
từ tính năng học. Dữ liệu localhost/Pages cũ không bị xóa hoặc tự chuyển.

Nguồn vận hành: [custom headers](https://docs.netlify.com/manage/routing/headers/),
[draft deploy API](https://docs.netlify.com/api-and-cli-guides/api-guides/get-started-with-api/#draft-deploys),
[giới hạn Free Legacy](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-legacy-plans/billing-faq-for-legacy-plans/).
