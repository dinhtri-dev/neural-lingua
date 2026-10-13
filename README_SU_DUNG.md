# Neural-Lingua — hướng dẫn mở và sử dụng cho người mới

Nếu bạn chỉ muốn học **bản online**, chỉ cần Internet và trình duyệt hiện đại
trên điện thoại hoặc máy tính. Không cần tải mã, cài Python, Git, Node.js, VS Code,
GPU hoặc đăng nhập. Các mục 2–4 dành riêng cho người muốn chạy bản local trên
**Windows 10/11**, cần Python 3.12 trở lên.

Hướng dẫn cập nhật cho bản public/local ngày 13/10/2026. Dùng link chính thức
bên dưới; không dùng link preview để giữ tiến độ học lâu dài.

Đi nhanh: [Mở bản online](#1-chọn-đúng-bản-website) · [Tải mã nguồn](#2-tải-mã-nguồn-và-giải-nén) ·
[Mở website](#4-mở-website-trên-máy) ·
[Học và ôn từ](#5-bắt-đầu-học-và-dùng-lộ-trình-cá-nhân-hóa) ·
[Dịch và ghi âm](#7-dịch-văn-bản-và-nghe-bản-dịch) ·
[Gia sư AI tùy chọn](#9-tùy-chọn-nâng-cao-gia-sư-ai-anhviệt) ·
[Giữ tiến độ / xử lý lỗi](#10-giữ-tiến-độ-và-xử-lý-lỗi-thường-gặp).

## 1. Chọn đúng bản website

Bản đầy đủ nằm ở [GitHub — nhánh archive/year2](https://github.com/dinhtri-dev/neural-lingua/tree/archive/year2).
Bản này có 52 bài, lộ trình cá nhân hóa, bài tập, flashcard và công cụ dịch.

[Website GitHub Pages cũ](https://dinhtri-dev.github.io/neural-lingua/) vẫn chạy
nhánh `main`, là bản dịch cũ. **Mở link online đó không phải là mở bản học 52 bài.**

### Dùng bản online đầy đủ bằng một đường link

1. Mở
   [Neural-Lingua — khóa học 52 bài](https://neural-lingua-course.netlify.app/).
2. Bạn sẽ thấy **Lộ trình**, **Bài học**, **Ôn tập** và **Dịch**. Không cần đăng nhập.
3. Chọn **Kiểm tra đầu vào · 15 câu** nếu muốn gợi ý bài phù hợp, hoặc mở ngay
   bất kỳ bài nào. Xem mục 5 để học và lưu từ; mục 7 để dịch.
4. Chia sẻ một bài cụ thể bằng link như
   [Bài 1](https://neural-lingua-course.netlify.app/#lesson/1) hoặc
   [Bài 52](https://neural-lingua-course.netlify.app/#lesson/52).
   Có thể tải lại trang hoặc lưu dấu trang và mở trực tiếp.
5. Muốn ghi âm: vào **Dịch → Chuẩn bị ghi âm**, chờ tải khoảng **63 MiB**,
   rồi bấm **Ghi âm** và cho phép micro. Không chạy lệnh chuẩn bị model ở mục 8.
   Mỗi lượt tối đa 30 giây; kiểm tra chữ nhận diện trước khi bấm **Dịch**.

Gia sư AI thử nghiệm chỉ có ở bản local, không có nút gia sư không hoạt động
trong bản online. Tiến độ/từ/đầu vào lưu theo **trình duyệt, thiết bị và địa chỉ
web**; không có đồng bộ. Dữ liệu ở localhost hoặc Pages cũ không bị xóa nhưng
không tự chuyển sang link Netlify. Link preview cũng có bộ lưu riêng.

Netlify đang dùng **Free Legacy**, không mua tên miền/nâng gói. Hạn mức dùng
chung cả team; nếu hết hạn mức, trang có thể tạm dừng. Video VOA, dịch Google và
trình duyệt cũng có thể gặp lỗi riêng; có thể thử lại hoặc nhập văn bản khi micro
không được hỗ trợ. Không có cam kết hoạt động liên tục.

Nếu muốn chạy đầy đủ trên máy với gia sư AI tùy chọn, làm mục 2 → 3 → 4.

| Bạn muốn dùng | Cần chuẩn bị |
|---|---|
| Học 52 bài online, kiểm tra đầu vào, quiz, flashcard | Link Netlify, trình duyệt và Internet |
| Học 52 bài local | Mã nguồn và Python; không cần GPU hoặc cài thư viện Python |
| Xem video VOA, dịch văn bản | Cần thêm Internet |
| Ghi âm trong công cụ Dịch | Online: bấm Chuẩn bị ghi âm; local: chuẩn bị model theo mục 8 |
| Gia sư AI Anh–Việt | Cài riêng, cần GPU NVIDIA phù hợp và adapter local; xem mục 9 |

## 2. Tải mã nguồn và giải nén

1. Bấm [Tải ZIP bản đầy đủ](https://github.com/dinhtri-dev/neural-lingua/archive/refs/heads/archive/year2.zip).
   Hoặc vào link nhánh ở mục 1, kiểm tra đang chọn `archive/year2`, rồi bấm
   **Code → Download ZIP**. Không tải nhầm `main`.
2. Trong Downloads, tìm `neural-lingua-archive-year2.zip`.
3. Bấm chuột phải file ZIP → **Extract All… / Giải nén tất cả** → **Extract**.
4. Mở thư mục đã giải nén. Nếu còn một thư mục con, mở tiếp đến khi thấy
   **`serve.py` và `index.html` nằm cùng chỗ**. Cùng thư mục phải có `js`,
   `data` và `ai-tutor`.
5. Giữ nguyên các thư mục này. Không chỉ chép riêng `index.html` ra Desktop.

Ví dụ thư mục đúng có dạng:

```text
neural-lingua-archive-year2/
  index.html
  serve.py
  styles.css
  js/
  data/
  tools/
  ai-tutor/
```

Bạn có thể đổi tên/thay vị trí thư mục, nhưng phải giữ các file bên trong.
Cách tải ZIP tham khảo [hướng dẫn chính thức của GitHub](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives).

## 3. Kiểm tra hoặc cài Python

1. Mở **Start**, gõ **PowerShell**, mở **Windows PowerShell** hoặc **Terminal**.
2. Nhập lệnh sau, bấm Enter:

   ```powershell
   python --version
   ```

3. Nếu thấy `Python 3.12...` hoặc bản mới hơn, chuyển sang mục 4.
4. Nếu chưa có Python, lệnh báo lỗi/mở Store, hoặc phiên bản dưới 3.12: vào [Python cho Windows](https://www.python.org/downloads/windows/),
   tải **Python install manager**, mở file tải về và chọn **Install**.
5. Đóng rồi mở lại PowerShell. Chạy:

   ```powershell
   pymanager install 3.14
   python --version
   ```

   Chỉ tiếp tục khi lệnh cuối hiển thị Python 3.12 trở lên. Nếu `python`
   vẫn trỏ sai bản, kiểm tra `py -3.14 --version`; khi lệnh này đúng, có thể
   thay `python` trong các lệnh web ở hướng dẫn này bằng `py -3.14`.

Cách cài và chọn bản Python: [tài liệu Python chính thức cho Windows](https://docs.python.org/3/using/windows.html).
Gia sư AI ở mục 9 có yêu cầu riêng **đúng Python 3.12**, không dùng 3.14 để chạy AI.

## 4. Mở website trên máy

1. Trong File Explorer, mở thư mục chứa `serve.py` như mục 2.
2. Bấm thanh địa chỉ của File Explorer, gõ `powershell`, bấm Enter.
   Cửa sổ lệnh sẽ mở ngay tại thư mục này.
3. Kiểm tra đang đứng đúng thư mục:

   ```powershell
   Get-Item serve.py
   ```

   Nếu báo không tìm thấy file, quay lại mục 2. Không chạy lệnh tiếp ở Downloads
   hoặc thư mục ngoài khi `serve.py` còn nằm trong thư mục con.
4. Chạy:

   ```powershell
   python serve.py
   ```

5. Khi thấy `Neural-Lingua: http://127.0.0.1:8831`, **giữ cửa sổ này mở**.
   Việc chưa xuất hiện dòng lệnh mới là bình thường: server đang chạy.
6. Mở Edge hoặc trình duyệt hiện đại, nhập địa chỉ vào thanh địa chỉ:

   ```text
   http://127.0.0.1:8831/#roadmap
   ```

7. Đúng bản khi thấy menu **Lộ trình · Bài học · Ôn tập · Dịch**, phần
   **Lộ trình học cá nhân hóa** và danh sách 52 bài.

**Không bấm đúp `index.html`.** Website cần được mở bằng địa chỉ HTTP ở trên
để đọc dữ liệu bài học. Địa chỉ `127.0.0.1` chỉ có tác dụng trên máy đang chạy
server, không phải link để bạn bè mở từ máy khác.

Để dừng: chọn cửa sổ PowerShell đang chạy server, nhấn **Ctrl+C**. Lần sau chỉ
cần mở PowerShell tại cùng thư mục, chạy `python serve.py`, rồi mở cùng địa chỉ.
Không cần tải/cài lại mỗi lần.

## 5. Bắt đầu học và dùng lộ trình cá nhân hóa

### Làm đầu vào hoặc bỏ qua

1. Trên **Lộ trình**, bấm **Kiểm tra đầu vào · 15 câu**.
2. Chọn một đáp án cho mỗi câu. Nếu không biết, chọn **Chưa biết**.
3. Bấm **Câu tiếp →**; dùng **← Câu trước** nếu muốn sửa câu đã chọn.
4. Ở câu cuối, bấm **Xem lộ trình của tôi**.
5. Đọc điểm, nhóm kỹ năng và bài được gợi ý. Bấm **Bắt đầu bài … →**.

Bạn có thể bỏ qua đầu vào và chọn bài 1 hoặc bất kỳ bài nào. Các bài không bị
khóa. Bài đầu vào có 3 câu/chặng; chặng đầu dưới 2/3 là mốc cần học. Nếu tất cả
chặng đều đạt, hệ thống gợi ý từ bài 41 để xác nhận bằng kết quả học tiếp.
Đây là gợi ý tự luyện, **không đánh giá nghe/nói hoặc cấp chứng nhận CEFR**.

### Học một bài

1. Trên thẻ bài ở **Lộ trình**, bấm liên kết chủ đề có mũi tên **→**, hoặc
   bấm nút bài gợi ý. Tên bài phía trên thẻ chỉ là tiêu đề, không phải nút mở.
2. Bấm **Mở video VOA**, rồi bấm Play trong trình phát. Cần Internet;
   video không tự phát và không tải kèm mã nguồn.
3. Đọc **Từ & cụm từ** và mẫu câu. Bấm **Lưu từ** ở từ muốn ôn.
4. Đọc yêu cầu ở **Dùng điều vừa học**, nói thành tiếng hoặc viết vào
   **Bản nháp luyện viết**. Tự viết trước rồi mở **Đối chiếu bài mẫu sau khi tự viết**.
5. Ở **Kiểm tra điều đã học**, chọn đủ 5 câu, bấm **Kiểm tra đáp án**.
6. Khi **điểm tốt nhất** của bài đạt ít nhất 4/5, bấm **Đánh dấu hoàn thành**
   nếu bài chưa hoàn thành. Chấm quiz không tự đánh dấu hoàn thành. Nếu cần,
   đọc giải thích rồi bấm **Làm lại**.
7. Đọc **Bước học được gợi ý** hoặc quay lại **Lộ trình** để chọn bài tiếp.

Lượt quiz mới nhất dưới 4/5 sẽ ưu tiên củng cố bài/phần còn yếu, dù trước đó
bạn từng đạt điểm cao. Điểm tốt nhất và trạng thái hoàn thành vẫn giữ. Bảng
lộ trình hiển thị tối đa 5 bài tiếp theo. **Làm lại bài kiểm tra đầu vào** chỉ
thay mốc gợi ý, không xóa các bài đã học hoặc từ đã lưu.

## 6. Ôn từ bằng flashcard

1. Trong bài, bấm **Lưu từ**; nút đổi thành **Đã lưu ✓**.
2. Bấm **Ôn tập** trên menu.
3. Tự nhớ nghĩa, rồi bấm **Xem nghĩa & ví dụ**.
4. Bấm **Đã nhớ** hoặc **Chưa nhớ**. Từ chưa nhớ được ưu tiên ôn.
5. Dùng **Thẻ tiếp →** hoặc chọn **Ôn tất cả** nếu muốn xem cả từ đã nhớ.
6. Trong **Sổ từ của bạn**, bấm **Bỏ từ** nếu muốn bỏ một từ khỏi danh sách.

## 7. Dịch văn bản và nghe bản dịch

1. Bấm **Dịch** trên menu.
2. Chọn **Ngôn ngữ nguồn** và **Ngôn ngữ đích**.
3. Nhập văn bản vào **Văn bản cần dịch**, tối đa 5.000 ký tự.
4. Bấm **Dịch văn bản** hoặc **Ctrl+Enter**.
5. Đọc và kiểm tra kết quả. Bấm **Sao chép** nếu muốn dùng ở nơi khác.
6. Bấm **Nghe bản dịch**, **Dừng nghe** để phát/dừng; giọng phụ thuộc
   trình duyệt và hệ điều hành, có thể không có giọng cho mọi ngôn ngữ.

Giọng đọc có thể sử dụng dịch vụ của nhà cung cấp trình duyệt/hệ điều hành;
không bảo đảm giọng đọc luôn chạy offline.

Cần Internet. Khi bấm dịch, văn bản được gửi tới dịch vụ Google bên ngoài;
không nhập mật khẩu hoặc thông tin riêng tư. Dịch vụ thử nghiệm có thể lỗi
hoặc gián đoạn; bấm **Thử lại** hoặc thử sau, không coi bản dịch là luôn đúng.

**Lưu lịch sử dịch** mặc định tắt. Nếu tự bật, giữ tối đa 20 mục trên trình
duyệt này; tắt lại sẽ xóa lịch sử đã lưu. Có nút **Xóa toàn bộ lịch sử** riêng.

## 8. Tùy chọn: dùng micro trong công cụ Dịch

Không cần làm mục này nếu chỉ nhập văn bản. ZIP/Git không có sẵn `voice-assets`.
Model ghi âm này chạy trên CPU trình duyệt, **không cần GPU NVIDIA hay gia sư AI**.

1. Dừng server bằng **Ctrl+C**.
2. Tại thư mục có `serve.py`, có Internet, chạy:

   ```powershell
   python tools/prepare_voice.py
   ```

3. Chờ đến thông báo `Ready: ... verified assets ...`. Bộ file được tạo tại
   `voice-assets`, khoảng 63 MiB cho runtime/model. Nếu tải/hash báo lỗi, dừng
   ở đây và chạy lại khi mạng ổn; không sửa hash để bỏ qua kiểm tra.
4. Mở lại server:

   ```powershell
   python serve.py
   ```

5. Vào **Dịch**, chọn ngôn ngữ nguồn, bấm **Chuẩn bị ghi âm**. Bước này nạp
   model vào trình duyệt, chưa bật micro.
6. Khi sẵn sàng, bấm **Ghi âm**, chọn **Allow / Cho phép** khi hỏi quyền micro.
7. Nói một đoạn ngắn, tối đa 30 giây, bấm **Dừng ghi âm**.
8. Đợi chữ được thêm vào ô nhập. Sửa nếu nhận sai, rồi tự bấm **Dịch văn bản**.

Âm thanh được nhận diện trên trình duyệt, không gửi ra ngoài hoặc lưu. Văn bản
chỉ được gửi tới Google nếu bạn bấm dịch. Model nhỏ có thể nhận sai, không dùng
để chấm phát âm. **Hủy ghi âm / nhận diện** bỏ tác vụ đang chờ. Nút **Xóa model
đã lưu trong trình duyệt** xóa cache trình duyệt, không xóa bộ file `voice-assets`
trên ổ đĩa hoặc tiến độ học.

Chi tiết: [VOICE_GUIDE.md](https://github.com/dinhtri-dev/neural-lingua/blob/archive/year2/VOICE_GUIDE.md).

## 9. Tùy chọn nâng cao: gia sư AI Anh–Việt

**Tải mã từ GitHub không có nghĩa là gia sư dùng ngay.** `.venv`, model cache
và `ai-tutor/runs` không nằm trong Git. Một lượt train trên máy tác giả cũng
không tự xuất hiện trên máy của bạn. Phần AI hiện là thử nghiệm, có thể trả lời sai.

Điều kiện: Windows, **Python đúng 3.12**, GPU NVIDIA/driver tương thích CUDA 13.0,
tối thiểu 18 GB ổ đĩa trống cho bootstrap. Bộ đã thử trên RTX 4050 6 GB; chương
trình kiểm tra tối thiểu 3,5 GB VRAM trống và không tự chuyển train sang CPU.
Đây không phải cam kết mọi GPU đạt mức đó đều chạy được. Nếu không đáp ứng,
bỏ qua mục này và dùng phần tự học bình thường.

### Chuẩn bị trên máy chưa có adapter

1. Nếu dùng Python install manager, cài thêm:

   ```powershell
   pymanager install 3.12
   py -3.12 --version
   ```

2. Từ thư mục gốc có `serve.py`, mở PowerShell và vào thư mục AI:

   ```powershell
   cd ai-tutor
   ```

3. **Chỉ khi muốn tự huấn luyện và đáp ứng điều kiện trên**, chạy:

   ```powershell
   py -3.12 run.py train
   ```

   Lần đầu tạo môi trường riêng, tải nhiều GB thư viện/model, chạy thử rồi train
   và đánh giá. Có thể mất nhiều thời gian; không đưa ra thời gian cố định.
   Chờ lệnh kết thúc thành công và có thư mục kết quả trong `ai-tutor/runs`.
   Nếu lỗi, chưa có adapter hoàn chỉnh thì không chuyển sang bước phục vụ.
   Không sửa dữ liệu, hash hoặc khóa model chỉ để bỏ qua lỗi.

### Mở gia sư đã có kết quả train

1. Dừng tác vụ GPU khác, chỉ chạy một tác vụ train/gia sư tại một thời điểm.
2. Trong thư mục `ai-tutor`, với lượt train local hoàn chỉnh của chính bạn, chạy:

   ```powershell
   py -3.12 run.py serve --experimental
   ```

   Đây là chế độ thử adapter chưa nghiệm thu. Kết quả thực nằm trong
   `ai-tutor/runs/<tên-lượt>/run.json` và
   `ai-tutor/runs/<tên-lượt>/adapter/adapter_model.safetensors`, không phải
   một thư mục `runs/adapter` dùng chung. Kiểm tra `run.json` của lượt đã chọn
   có `"status": "completed"` và `"mode": "train"` trước khi thử. Có thư mục
   nhưng lượt chưa hoàn tất hoặc cấu hình/dữ liệu không khớp vẫn bị từ chối.
   Lệnh phục vụ không tự huấn luyện hoặc cung cấp model gia sư sẵn.
3. Giữ terminal mở. Mở **đúng địa chỉ của backend**, không dùng cổng 8831:

   ```text
   http://127.0.0.1:8832/#roadmap
   ```

4. Mở một bài → **Gia sư AI**. Đợi trạng thái sẵn sàng; nếu nút còn khóa,
   bấm **Kiểm tra kết nối lại** sau khi model tải xong.
5. Nhập câu hỏi hoặc chọn **Hỏi về từ đã chọn / Giải thích mẫu câu / Luyện hội thoại**.
   Kiểm tra ô hỏi, rồi tự bấm **Gửi gia sư**. Gợi ý không tự gửi.
6. Muốn nhận xét bài viết: viết bản nháp trong bài, bấm **Nhờ nhận xét bản nháp**,
   kiểm tra câu hỏi rồi gửi. Tổng nội dung gửi tối đa 2.000 ký tự.
7. Muốn dùng tiếng nói: **Ghi âm tiếng Anh → Dừng ghi âm**, kiểm tra transcript
   rồi gửi. Audio gửi tới backend trên máy này; khác với ghi âm mục 8 chạy
   hoàn toàn trong trình duyệt. Lần đầu cần tải thêm model ASR; mỗi lượt tối đa 30 giây.
8. Muốn nghe một câu: nhập/chọn câu trong **Câu tiếng Anh để nghe (có thể sửa)**,
   bấm **Nghe tiếng Anh**, bấm **Dừng đọc** để dừng. Nếu máy không có giọng
   tiếng Anh, có thể tiếp tục học bằng chữ.
9. Nhấn **Ctrl+C** trong terminal để dừng backend.

Nếu máy có nhiều lượt, lệnh không có `--run-dir` tự chọn thư mục theo tên mới
nhất, có thể là lượt smoke hoặc lượt thất bại. Để chọn đúng kết quả của mình:

1. Tại thư mục `ai-tutor`, chạy `Get-ChildItem .\runs -Directory` để xem tên lượt.
2. Chọn lượt train đã hoàn tất. Trong hai lệnh dưới, **thay `TEN_LUOT` bằng tên
   thư mục thực vừa chọn**, không để nguyên chữ này:

   ```powershell
   Get-Content ".\runs\TEN_LUOT\run.json"
   py -3.12 run.py serve --experimental --run-dir "runs\TEN_LUOT"
   ```

   Chỉ chạy lệnh thứ hai sau khi kiểm tra lệnh đầu: `status` là `completed`,
   `mode` là `train`, adapter tồn tại và bạn không đổi dữ liệu/cấu hình của lượt đó.
   Không chạy server thứ hai đồng thời với server cũ; dừng server cũ bằng Ctrl+C.

Backend phục vụ cả giao diện và API cùng cổng 8832. **Mở web ở 8831 rồi bật
backend 8832 sẽ không tự nối được gia sư**, vì giao diện gọi API cùng địa chỉ.
Mở 8832 là origin khác: dữ liệu tiến độ từ 8831 không tự chuyển sang đó.
Không mở cổng backend ra Internet hoặc gửi checkpoint không rõ nguồn vào máy.

Muốn ghi âm trong **công cụ Dịch**, dùng server 8831 ở mục 8. Backend gia sư
8832 hiện không phục vụ bộ `voice-assets`; ghi âm gia sư là luồng riêng.
Hội thoại gia sư không lưu sau khi tải lại trang/đổi bài; bản ghi xử lý tạm,
không được thêm vào dữ liệu train. Giọng đọc **Nghe tiếng Anh** cũng có thể dùng
dịch vụ của nhà cung cấp trình duyệt/hệ điều hành, không bảo đảm hoàn toàn offline.

Để dùng chế độ không thử nghiệm, cần hoàn thành quy trình chấm/nghiệm thu adapter;
không chỉ bỏ `--experimental`. Xem [ai-tutor/README.md](https://github.com/dinhtri-dev/neural-lingua/blob/archive/year2/ai-tutor/README.md)
cho quy trình kỹ thuật và các giới hạn chất lượng.

## 10. Giữ tiến độ và xử lý lỗi thường gặp

Ở cuối trang có **Lưu tiến độ trên thiết bị này**. Bật để giữ điểm, kết quả đầu
vào, bài hoàn thành và sổ từ sau khi đóng trình duyệt. Dữ liệu không đồng bộ tài
khoản hoặc máy khác. Dùng cùng trình duyệt, profile và địa chỉ/port để thấy lại.

**Bản nháp luyện viết không được lưu**: đổi bài hoặc tải lại trang sẽ mất;
nhảy giữa các phần của cùng bài vẫn giữ. Hãy tự sao chép ra nơi khác nếu muốn giữ.
Chế độ riêng tư hoặc xóa dữ liệu trình duyệt có thể làm mất bản lưu. Tắt lưu
sẽ xóa bản lưu trên thiết bị, chỉ giữ dữ liệu trong phiên đang mở. **Xóa dữ liệu
học** xóa tiến độ/đầu vào/từ đã lưu, không thể hoàn tác; lịch sử dịch có nút xóa riêng.

| Hiện tượng | Làm gì |
|---|---|
| `python` không nhận diện hoặc mở Store | Hoàn thành mục 3, mở lại PowerShell; thử `py -3.14 --version` và dùng `py -3.14 serve.py` nếu bản này có sẵn. |
| Không tìm thấy `serve.py` | Mở đúng thư mục chứa cả `serve.py` và `index.html`, rồi mở PowerShell tại đó. |
| Địa chỉ không mở / Connection refused | Kiểm tra server đang chạy và terminal chưa đóng; mở đúng địa chỉ được terminal in ra. |
| Cổng 8831 đã được dùng / WinError 10048 | Không tắt tiến trình lạ. Ví dụ chọn cổng trống 8841: chạy `python serve.py --port 8841`, mở `http://127.0.0.1:8841/#roadmap`; nếu 8841 cũng bận, chọn một cổng trống khác. Mỗi port có bản lưu học riêng. |
| Chỉ thấy công cụ dịch cũ, không có 52 bài | Bạn đang mở Pages trên main hoặc tải nhầm main; làm lại mục 2 với archive/year2. |
| Trang báo chưa mở được khóa học | Không mở bằng file://; kiểm tra còn đủ thư mục `data`/`js`, server đúng thư mục, rồi Tải lại. |
| Video/dịch không chạy | Kiểm tra mạng hoặc nhà cung cấp; thử lại sau. Nội dung từ vựng/quiz local vẫn có thể dùng khi server đang chạy. |
| Chuẩn bị ghi âm lỗi / thiếu model | Máy mới cần chạy `python tools/prepare_voice.py` thành công trước; không chỉ bấm nút trong web. |
| Micro bị từ chối | Mở quyền website trong trình duyệt, cho phép Microphone; kiểm tra quyền micro Windows. Có thể tiếp tục nhập bằng chữ. |
| Không nghe giọng đọc | Kiểm tra âm lượng, giọng ngôn ngữ có sẵn trên hệ điều hành; phần văn bản vẫn dùng được. |
| Gia sư báo chưa sẵn sàng / nút khóa | Mục 9 cần adapter local và backend sẵn sàng; mở trang qua 8832, không phải 8831. Nếu nhiều lượt, kiểm tra run.json và chọn lượt train hoàn tất bằng --run-dir như mục 9. Không có GPU/model thì bỏ qua AI. |
| AI báo sai Python / CUDA / hết VRAM | Dùng đúng 3.12, kiểm tra GPU/driver, dừng tác vụ GPU của chính bạn; không bỏ qua kiểm tra hoặc đổi model tùy tiện. |
| Không thấy tiến độ cũ | Kiểm tra cùng browser/profile/origin; 127.0.0.1 khác localhost và mỗi port có lưu trữ riêng. Không xóa dữ liệu để “sửa” lỗi. |
| Trình duyệt cảnh báo chỉ nên dùng một tab | Dùng một tab học để tránh ghi đè khi trình duyệt không hỗ trợ Web Locks. |

## 11. Chia sẻ cho một người khác

Gửi người đó README này và link tải ZIP ở mục 2. Mỗi người chạy web trên máy
của mình theo mục 2–4. Không gửi riêng link `127.0.0.1`, không chép môi trường
`.venv` hay dữ liệu học cá nhân của bạn cho họ.

Muốn ai cũng mở bản đầy đủ bằng một link online cần một lần triển khai riêng.
`serve.py` chỉ nghe máy local, không phải máy chủ production. Bản online dùng
gói riêng theo [PUBLIC_DEPLOY.md](PUBLIC_DEPLOY.md). Hướng dẫn
này không hướng dẫn mở cổng hoặc bỏ các kiểm tra bảo mật để biến máy thành server.

Nếu dùng macOS/Linux: phần web thuần không cần GPU; dùng Python 3.12+ và lệnh
`python3 serve.py` trong thư mục gốc, mở cùng địa chỉ 8831. Các bước cài Windows,
PowerShell và cấu hình AI ở trên không được xem là đã xác minh cho hệ điều hành khác.
