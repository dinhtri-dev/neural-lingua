# Kiểm tra bảo mật trước push `archive/year2`

Phạm vi: ứng dụng static và server preview loopback trong commit phát hành; giữ GitHub Pages trên `main`, không deploy. Phiên bản sản phẩm đã đánh giá: `1cd5b8d5a31f7133ebef334435bdca183f821cdf`. Commit bàn giao cuối chứa báo cáo này cùng dữ liệu nguồn; SHA và kết quả quét cuối được ghi trong Google Doc và biên nhận push. Các file runtime của commit bàn giao phải khớp phiên bản đã kiểm thử; nếu khác phải kiểm tra lại.

| STT | Mục kiểm tra | Trạng thái | Bằng chứng | Lỗi đã sửa hoặc việc còn thiếu |
|---|---|---|---|---|
| 1 | API key và bí mật | ĐẠT | Gitleaks quét file và lịch sử; app không dùng khóa dịch/VOA. Cấu hình, HTML, JS và phản hồi lỗi đã rà soát. | Không có bí mật phát hiện; không ghi văn bản dịch vào log server. |
| 2 | Biến môi trường | KHÔNG ÁP DỤNG | App không có biến môi trường runtime hoặc .env; preview chỉ có cổng CLI, biến kiểm thử chỉ chọn đường dẫn/browser. | Chưa có staging/production cần tách môi trường; không thêm bí mật vào client. |
| 3 | Bí mật trong Git | ĐẠT | Quét Gitleaks 8.30.1 file, toàn bộ lịch sử --all và staged; 0 phát hiện. .gitignore loại .env, cache, test-results. | Giữ lịch sử; danh sách tracked được kiểm tra trước commit. |
| 4 | Trang/API quản trị | KHÔNG ÁP DỤNG | Không có trang quản trị hay endpoint thao tác nhạy cảm phía server; server chỉ phục vụ static whitelist. | Không thêm chức năng quản trị. |
| 5 | Xác thực | KHÔNG ÁP DỤNG | Không có đăng nhập, mật khẩu, phiên/token của ứng dụng. | Không có cơ chế xác thực cần đánh giá. |
| 6 | Quyền người dùng | KHÔNG ÁP DỤNG | Không có tài khoản hoặc dữ liệu của người khác trên server; dữ liệu học chỉ ở trình duyệt. | ID bài/từ được đối chiếu danh mục; không coi tiến độ là chứng nhận. |
| 7 | Dữ liệu đầu vào | ĐẠT | Giới hạn dịch 1–5000, response≤20000, writing≤3000; validate storage và course; preview từ chối traversal/Host lạ/POST. | Server không nhận biểu mẫu/API/upload; giới hạn thực tế đã thử. |
| 8 | XSS | ĐẠT | Không innerHTML/eval; DOM dùng text nodes/value, URL nguồn HTTPS, iframe allowlist. HTML độc hại trong bài/quiz/dịch không thực thi. | CSP giới hạn script/style/connect/frame; không nhập HTML từ nguồn. |
| 9 | SQL injection | KHÔNG ÁP DỤNG | Không có SQL, ORM hoặc cơ sở dữ liệu. | Không có truy vấn để kiểm tra. |
| 10 | Quyền cơ sở dữ liệu | KHÔNG ÁP DỤNG | Không có database/service rules/RLS hoặc credential database. | Chỉ dùng localStorage tùy chọn. |
| 11 | Giới hạn tần suất | KHÔNG ÁP DỤNG | Không có API/login/upload/backend tốn tài nguyên do app vận hành; preview static chỉ loopback. | Dịch ngoại dịch vụ do người dùng bấm, tối đa một yêu cầu, hủy/15s; không chứng nhận rate limit của Google. |
| 12 | Giới hạn chi phí | KHÔNG ÁP DỤNG | Không có khóa/API tính phí, tài khoản billing hay dịch vụ trả phí được cấu hình. | Không thể chứng nhận quota nhà cung cấp; app không gắn hạn mức chi tiêu của tài khoản nào. |
| 13 | Upload file | KHÔNG ÁP DỤNG | Không có upload UI/endpoint/file execution; POST bị từ chối. | Chỉ static whitelist được phục vụ; không tải video về repo. |
| 14 | CSRF | KHÔNG ÁP DỤNG | Không có xác thực cookie hoặc thao tác đổi dữ liệu trên server. | Dữ liệu cục bộ được thay đổi theo thao tác người dùng. |
| 15 | CORS | ĐẠT | Preview không phát Access-Control-Allow-Origin/Credentials; fetch dịch credentials:omit, HTTPS cố định; dịch thật đã chạy. | Không phản chiếu origin hoặc wildcard credentials. |
| 16 | HTTPS | KHÔNG ÁP DỤNG | Chỉ push nhánh lưu trữ và dùng HTTP loopback; không deploy website. Nguồn/iframe/dịch ngoài đều HTTPS. | Chưa chứng nhận chứng chỉ/proxy/HSTS production; Pages main giữ nguyên. |
| 17 | Security headers | ĐẠT | GET preview xác nhận CSP frame-ancestors none, nosniff, DENY, Referrer-Policy strict-origin-when-cross-origin và no-store. | Video chính đã phát thật với CSP/referrer hiện tại; chỉ chứng nhận preview. |
| 18 | Cookie | KHÔNG ÁP DỤNG | App không phát cookie phiên/nhạy cảm; response preview không Set-Cookie; dịch credentials omit. | Cookie của trình phát ngoài thuộc nhà cung cấp, được thông báo trước kết nối. |
| 19 | Debug | ĐẠT | Không debugger/runtime console log dữ liệu; preview tắt request log, 404/405 thông báo chung. | Không có endpoint thử nghiệm hoặc stack trace phía client/server. |
| 20 | Cấu hình/build/dependency | ĐẠT | Python/JS kiểm tra cú pháp, browser và media checks, npm audit 0; GitHub API xác nhận Pages main, không hook/custom workflow. | Chỉ archive/year2; không chứng nhận production chưa triển khai. |

Kết luận: **ĐỦ ĐIỀU KIỆN cho push lưu mã nguồn**, sau khi các bằng chứng cuối khớp SHA được công bố. Không chứng nhận production hoặc an toàn tuyệt đối.

Kiểm tra thực tế: 44 nhóm chức năng/boundary/nhiều tab, phát thật video 1/13/26/39/52 (clock>3s, readyState4, hình1280×720), HTTP 52 nguồn chính và104 video bổ sung, cú pháp Python/JS, security headers/path/Host/POST, Gitleaks file/staged/lịch sử --all, npm audit0. Không dùng HTTP200/iframe load làm bằng chứng đã phát. Speech/network lỗi dùng fixture; dịch thật và video thật được reviewer thử riêng.

Giới hạn: chưa xem trọn mọi video, thẩm định giáo dục độc lập toàn bộ260 câu, nghe âm thanh/micro thật, screen reader/điện thoại thật, production. Trình duyệt thiếu Web Locks chỉ hỗ trợ lưu ổn định ở một tab và được thông báo. Dịch Google là endpoint thử nghiệm không có cam kết dịch vụ; quota và hạ tầng nhà cung cấp không do app quản lý.

Hành động tiếp theo: fast-forward `archive/year2`, push không force, đối chiếu toàn bộ blob GitHub và xác nhận `main`/Pages không đổi; cập nhật Google Doc. Một lượt deploy sau này phải kiểm tra staging/production riêng.
