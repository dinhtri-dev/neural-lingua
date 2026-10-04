# Báo cáo ba lượt trải nghiệm độc lập

Điểm thuộc đúng revision được đánh giá; cùng một reviewer độc lập, không sửa mã. Hai lượt đầu đã sửa các đề xuất trong phạm vi; lượt ba trên 8 nên dừng theo yêu cầu.

# Đánh giá độc lập — lượt 1

Revision: bbef8f7654c16c75914d006a95d8cb928b37900a. Điểm **7,8/10**: nội dung 2,1/3; chức năng 2,4/3; UX 1,6/2; hỗ trợ tiếp cận 0,8/1; riêng tư/nguồn 0,9/1.

Reviewer dùng tab IAB riêng qua CUA, thử 390×844 và 320×640. Fresh Edge 154.0.4258.48 bổ sung kiểm tra phát thật bài 1/26/52: currentTime>1s, readyState4, pausedfalse, errornull. Thực hiện tìm kiếm có/không dấu, quiz trống/0/4/5 điểm, làm lại/hoàn thành/reload, lưu/thẻ ôn, dịch thật vi↔en và en→ja, clipboard, hủy, opt-in/tắt history, tắt lưu/reset. Timeout15s được mô phỏng, không phải một lỗi dịch vụ thực tế.

| Ưu tiên | Bước tái hiện / quan sát | Cách sửa và kiểm tra lại | Xử lý |
|---|---|---|---|
| P1 | Bài26: ba câu đầu đúng, câu4 sai, câu5 should →3/5 dù should và ought to cùng đúng. | Hỗ trợ đủ hai đáp án; cả hai kịch bản phải đạt4/5 và mở hoàn thành. | Đã sửa ở34d5b8b; bài giải thích hai cấu trúc. |
| P2 | Lưu symbol/should; symbol→Đã nhớ vẫn hiện symbol. | Chọn tiếp theo ID sau sắp xếp; phải hiện should khi còn cần ôn. | Đã sửa ở34d5b8b. |
| P2 | Quiz phần lớn là sao lại nghĩa/ví dụ ngay phía trên. | Ít nhất một câu tình huống mỗi bài; lời giải và đáp án rõ ràng. | Đã thêm52 câu tình huống, giữ5 câu/bài. |
| P2 | Bản nháp bài52 chỉ có tiêu chí chung, thiếu mẫu đối chiếu. | Rubric theo bài và mẫu mở sau tự viết; thử1/26/52. | Đủ52 rubric/mẫu, mỗi mẫu dùng≥3 mục từ của bài. |
| P2 | Mobile390×844: guide chiếm~270px trước video. | Thu gọn hướng dẫn, giữ liên kết phần; thử320/390 và bàn phím. | Native disclosure đóng mặc định trên mobile, guide<160px trong kiểm thử. |
| P3 | Đạt5/5 rồi reload không thấy điểm tốt nhất. | Hiện điểm đã lưu ở đầu bài, giữ điểm cao nhất qua lượt thấp hơn. | Đã sửa và thử reload. |
| P2 | Tắt lưu xóa bản lưu nhưng giải thích chỉ có ở trang nguồn/thông báo sau thao tác. | Đặt giải thích cạnh checkbox trước hành động. | Đã thêm dòng mô tả và aria-describedby. |

Ngoài đề xuất: đổi đáp án sẽ xóa lời giải cũ; reset từ bài học trở về lộ trình trống; preview từ chối Host không hợp lệ. 31 nhóm kiểm thử qua trước lượt2.

Giới hạn reviewer: chưa xem toàn bộ video, chưa thử hết video bổ sung, chưa thẩm định từng câu trong260 câu, chưa dùng micro hoặc xác nhận âm thanh nghe được, screen reader, điện thoại thật hay production. Điểm thuộc đúng revision đã đánh giá; không tự nâng điểm sau sửa.

# Đánh giá độc lập — lượt 2

Revision: 34d5b8bc85ed8859abdd110fd632c0c4ed4eeab5. Điểm **7,9/10**: nội dung2,5/3; chức năng2,0/3; UX1,8/2; tiếp cận0,7/1; riêng tư/nguồn0,9/1. Lỗi nghiêm trọng giới hạn điểm≤8.

Fresh Edge154.0.4258.48 qua Playwright, desktop1280×900/mobile390×844; CUA không có browser khả dụng. Reviewer tự thử bài1/21/23/26/31/37/38/52, xác nhận should/ought to đạt4/5 và5/5, giữ điểm sau reload, chuyển symbol→should đúng; guide/mẫu viết đóng trên mobile và không tràn ngang. Video1/26/52 phát thật, bài1 cần thử lại. Dịch vi→en/en→vi/en→ja và clipboard hoạt động; history/tắt lưu/reset kiểm chứng; timeout là mô phỏng.

| Ưu tiên | Tái hiện / quan sát | Cách sửa và kiểm tra lại | Xử lý |
|---|---|---|---|
| P1 | A/B cùng mở bài1; A lưu hello, B lưu welcome → chỉ còn welcome. A hoàn thành5/5; B lưu apartment → mất điểm, mất hoàn thành. | Đọc dữ liệu mới nhất, hợp nhất/thao tác tuần tự, storage event; reset phiên bản và tắt lưu không cho tab cũ khôi phục. Thử đồng thời và tab cũ. | Khóa giao dịch Web Locks, điểm Math.max, đồng bộ storage, resetVersion; tested8 nhóm trước lượt3. |
| P2 | Đánh dấu Đã nhớ bằng Enter, activeElement về BODY. | Focus nút lật thẻ tiếp và live announcement; thử chuỗi bàn phím. | Đã focus thẻ mới, live region polite; screen reader thực chưa thử. |
| P2 | Mẫu1 chưa rõ ba từ độc lập; mẫu52 thiếu quá khứ dù mục tiêu nhìn lại. | Mẫu1 rõ hello/name/welcome/apartment; mẫu52 quá khứ→tương lai3–5 câu. | Mẫu1 có3 câu; mẫu52 có5 câu, failed/learned và going to/will. |
| P2 | Bài23 I am a food truck,31 When is your childhood,38 My hometown is a medicine dễ loại. | Câu thay thế tự nhiên cùng bối cảnh nhưng sai ý định/thời điểm/chức năng; chỉ một đáp án phù hợp. | Thay distractors51 bài; bài6 giữ lựa chọn chỉ đường cùng bối cảnh. |
| P3 | Bài52/Nguồn có title trang giống nhau. | Title theo tên/số bài hoặc Ôn/Dịch/Nguồn; thử điều hướng và reload. | Đã cập nhật title theo route. |
| P3 | Hàng đợi gồm cả từ đã nhớ, không chọn phạm vi. | Ôn từ cần ôn/Ôn tất cả, số thẻ tương ứng, thông báo khi không còn từ cần ôn. | Đã thêm bộ lọc và trạng thái rỗng; thử bàn phím. |

Lịch sử dịch cũng đồng bộ giữa tab và kiểm tra opt-out mới nhất trước ghi. Tổng44 nhóm kiểm thử bên triển khai qua trước lượt3 (31core,8multi-tab/keyboard,5boundary). Không dùng tổng này làm điểm reviewer.

Giới hạn: reviewer chưa xem hết video/thẩm định toàn bộ câu hỏi, chưa thử mọi video bổ sung, micro, âm thanh nghe được, screen reader, điện thoại thật hoặc production. Không tự nâng điểm sau sửa; điểm thuộc34d5b8b.

# Đánh giá độc lập — lượt 3 và cuối

Revision: 1cd5b8d5a31f7133ebef334435bdca183f821cdf. **8,9/10**: nội dung2,6/3; chức năng2,8/3; UX1,7/2; tiếp cận0,9/1; riêng tư/nguồn0,9/1. Không thấy lỗi nghiêm trọng trong phạm vi đã thử. Trên8 nên dừng cải tiến theo yêu cầu, không mở lượt4 và không tự nâng điểm sau sửa.

Reviewer không sửa mã; Windows/Edge154.0.4258.48, Playwright context riêng, desktop1280×900 và mobile mô phỏng320×640/390×844; CUA không khả dụng. Công cụ bị gián đoạn/khởi động lỗi không bị tính thành lỗi sản phẩm.

Bằng chứng tự trải nghiệm:
- A/B lưu hello/welcome đồng thời, tab mới giữ cả hai. A5/5 hoàn thành, B lưu apartment, tab mới giữ5/5 hoàn thành và3 từ.
- Reset A đưa cả A/B về0; B lưu meet, tab mới chỉ cómeet. Opt-out A đồng bộ checkbox B; lưu welcome ở B không tạo dữ liệu persistent/tab mới0.
- Ôn bàn phím chuyển hello→welcome, focus flipCard, live region nội dung mới. Hết từ cần ôn focus Ôn tất cả; mở lại2 từ.
- Đọc bài1/23/31/38/52: tình huống tự nhiên/cùng bối cảnh; mẫu52 có failed/learned và going to/will. Mẫu1 còn lệch cấu trúc rubric.
- Bài26 giữ5/5 hoàn thành sau reload. Video26 phát thật:1,204s, pausedfalse, readyState4, errornull.
- Dịch câu công khai en→vi và lịch sử đồng bộ; opt-out A khi phản hồi B đang chờ không cho phản hồi muộn khôi phục history.
- Không tràn ngang320/390; mobile guide đóng. Nháp giữ khi nhảy phần cùng bài, mất khi rời route, đúng thông báo không lưu.
- Đã đọc nguồn, quyền riêng tư và thông báo dịch vụ ngoài trên revision này.

| Ưu tiên | Quan sát / tái hiện | Cách cải thiện | Kiểm tra lại | Trạng thái |
|---|---|---|---|---|
| P2 | Rubric bài1 yêu cầu I am/You are, mẫu không có. | Thêm I am a new student, giữ3–5 câu và≥3 mục từ. | Đối chiếu từng tiêu chí rubric/mẫu. | Ghi để phát triển sau; dừng khi>8. |
| P2 | Sổ từ dưới flashcard lộ nghĩa trước khi lật. | Thu gọn sổ từ mặc định hoặc mở nghĩa chủ động. | Không thấy nghĩa trước lật desktop/mobile; mở sổ bằng bàn phím. | Chưa làm. |
| P2 | Quiz có thể làm mà chưa nghe video. | Thay một câu nhận diện bằng câu hiểu hội thoại kèm mốc video. | Đáp án/giải thích bám VOA, mốc đúng, không mơ hồ. | Chưa làm. |
| P3 | Rời route làm mất nháp, chưa có nút sao chép nháp. | Sao chép bản nháp, giữ không tự lưu/gửi. | Clipboard đúng; từ chối có fallback; không lưu tự động. | Chưa làm. |
| P3 | Từ/ví dụ chưa có nút nghe trực tiếp. | TTS tiếng Anh sau thao tác, có dừng/không hỗ trợ. | Đúng từ/lang, không autoplay; fallback video phát âm. | Chưa làm. |
| P3 | Liên kết phần ngoài viewport khi xuống quiz mobile. | Về đầu bài hoặc menu nhỏ cuối bài. | Focus đúng, nháp không mất, không che nội dung. | Chưa làm. |

Ảnh reviewer: giữ2 từ, giữ điểm sau tab khác, opt-out, ôn hết từ, sổ lộ nghĩa, history phản hồi muộn, mobile quiz, video26 đang phát. Bằng chứng gốc giữ ngoài repository để không công khai dữ liệu browser.

Giới hạn: chưa xem/thẩm định toàn bộ260 câu/156video, mọi race condition, browser khác, screen reader, micro/âm thanh nghe được, điện thoại thật hoặc production. Điểm trải nghiệm local không thay thế kiểm tra bảo mật.
