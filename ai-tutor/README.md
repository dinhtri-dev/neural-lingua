# Train gia sư Neural-Lingua bằng một lần bấm Run

Máy đã chuẩn bị: Windows, Python 3.12, RTX 4050 6 GB. Đây là dự án QLoRA trên Qwen3-1.7B, **không huấn luyện từ đầu**. Bộ dữ liệu là bản khởi đầu để học và thử nghiệm; chưa được giáo viên độc lập nghiệm thu.

## Bắt đầu trong VS Code

1. Mở `neural-lingua-ai.code-workspace` bằng VS Code, chấp nhận Workspace Trust nếu bạn tin cậy mã này.
2. Mở **Run and Debug** ở thanh bên trái.
3. Chọn **Train gia sư** trong danh sách, rồi bấm nút ▶ hoặc **F5**.

Không cần tự cài từng thư viện hoặc tạo môi trường. Lần đầu cần Internet và tối thiểu 18 GB trống. Chương trình tạo `.venv`, cài thư viện đã khóa, kiểm tra GPU/dữ liệu, chạy thử 10 bước rồi nạp model nền sạch để train tối đa ba epoch. Sau đó chương trình sinh câu trả lời của ba phiên bản để so sánh; bước này cũng dùng GPU và có thể mất thêm thời gian.

Lượt kiểm tra, train đầy đủ và đánh giá chạy lần lượt trong các tiến trình riêng. Mỗi tiến trình kết thúc trước giai đoạn kế tiếp để trả VRAM cho Windows. Workspace tắt việc debugger tự bám vào các tiến trình con; lỗi vẫn hiển thị trong terminal.

Python và tiện ích Python/Debugger cho VS Code đã có trên máy hiện tại. Nếu chuyển sang máy khác, cần Python 3.12, driver NVIDIA tương thích CUDA 13.0, GPU đủ bộ nhớ và hai tiện ích `ms-python.python`, `ms-python.debugpy`. Bộ thư viện ngày 08/10 dùng PyTorch `2.14.1+cu130`; máy kiểm thử có driver `610.78`. Bộ kiểm tra GPU dừng khi không tương thích, không tự đổi model hoặc chuyển train sang CPU.

**Nút Train không push Git, không deploy, không upload model hoặc dữ liệu lên Hugging Face.** Model được tải từ Hugging Face; việc huấn luyện chạy local.

## Các chế độ Run

| Chế độ | Tác dụng |
|---|---|
| Train gia sư | Chạy thử → train đầy đủ → so sánh ba phiên bản |
| Kiểm tra nhanh (10 bước GPU) | Kiểm tra kỹ thuật; adapter chỉ là thử nghiệm |
| Tiếp tục train | Chọn lượt train đầy đủ gần nhất; chỉ tiếp tục khi fingerprint còn khớp |
| Thử gia sư (local) | Backend ở http://127.0.0.1:8832; chỉ nạp adapter đã nghiệm thu |
| Thử gia sư (thử nghiệm, chưa nghiệm thu) | Nạp adapter gần nhất để thử local, có nhãn chưa nghiệm thu |
| Đánh giá model | So sánh lại 52 ca test; tạo bảng chấm mới |

Chọn **Thử gia sư (thử nghiệm, chưa nghiệm thu)** để thử ngay adapter 10 bước đã bàn giao. Sau khi model tải xong, mở http://127.0.0.1:8832, vào một bài và dùng mục **Gia sư Anh–Việt**. Chỉ chạy một tác vụ GPU tại một thời điểm; dừng server trước khi train. Ctrl+C trong terminal dừng tác vụ; các checkpoint đã hoàn thành được giữ lại.

Nếu thích terminal, mở terminal tại thư mục `ai-tutor`:

```powershell
python run.py train
python run.py smoke
python run.py resume
python run.py serve --experimental
python run.py evaluate
```

`--run-dir` cho phép chọn một thư mục trong `ai-tutor/runs`; đường dẫn tương đối được tính từ thư mục terminal đang đứng. Dừng server trước khi thử checkpoint hoặc train tiếp.

Chỉ dùng checkpoint do chính bạn tạo trên máy và giữ thư mục `runs` dưới quyền tài khoản của bạn. Không chép checkpoint không rõ nguồn vào đó. Model nền được khóa theo revision, chỉ nạp Safetensors và không chạy mã model tải từ xa. Backend không nhận upload model/checkpoint; huấn luyện và sinh câu trả lời không bật biên dịch TorchScript/PT2.

## Dữ liệu và cách học

- Model nền: Qwen/Qwen3-1.7B, revision `70d244cc86ccca08cf5af4e1e306ecf908b1ad5e`, giấy phép Apache 2.0.
- 520 mẫu: **416 train / 52 validation / 52 test**, mỗi tập có đủ 52 bài.
- Kho bài là bản chụp `course.snapshot.json`; video không tải về và transcript đầy đủ chưa được bổ sung.
- Train gồm giải thích từ, phân biệt từ, ngữ pháp, sửa lựa chọn sai, giữ câu đã đúng, gợi ý, hội thoại nhiều lượt, nhận xét bài viết, hỏi lại và xử lý thiếu bằng chứng video.
- Validation gồm tình huống ứng dụng. Test gồm 52 câu sai mới cần sửa/giải thích; kết quả hiện chỉ đo tốt nhất phạm vi sửa câu, chưa đại diện mọi chức năng của gia sư.
- `prepare_data.py` là công cụ biên soạn/xuất dữ liệu offline. **Run train không gọi công cụ này và không tự sinh dữ liệu.** Bản xuất có nguồn và thông tin rà soát; không coi nhãn rà soát của Codex là đánh giá của giáo viên độc lập.
- Dữ liệu được kiểm tra độ dài trước khi train. Mẫu vượt 512 token làm chương trình dừng; không cắt đáp án. Token prompt và padding không tham gia loss.

Sửa dữ liệu bằng cách cập nhật bản biên soạn, chạy lại `prepare_data.py`, rà soát thay đổi và chạy kiểm thử. Không sửa hash chỉ để bỏ qua lỗi. Bộ hiện tại giữ cấu trúc 520 mẫu cố định; mở rộng lên hàng nghìn mẫu cần cập nhật bộ kiểm tra số lượng/chia tập và lập bộ test rộng hơn. Thay đổi dữ liệu/cấu hình làm checkpoint cũ mất điều kiện tiếp tục.

## Kết quả và nghiệm thu

Mỗi lượt có thư mục riêng trong `runs/`, gồm:

- `run.json`: model, cấu hình, fingerprint, thời gian, loss, bộ nhớ và trạng thái.
- `adapter/`: adapter Safetensors và tokenizer. Muốn dùng cần model nền đúng revision; adapter không phải model đầy đủ độc lập.
- `checkpoints/`: trạng thái Trainer, adapter và optimizer để tiếp tục.
- `dependencies.lock.txt`: phiên bản thư viện thực tế của lượt chạy.
- `reload-test.json`: một câu trả lời thử sau khi lưu/nạp lại.
- `evaluation/answers.json`: câu trả lời model gốc, model gốc có bài và adapter có bài.
- `evaluation/review.csv`: bảng chấm 156 câu trả lời, chưa điền điểm tự động.

Loss hữu hạn và adapter thay đổi chỉ chứng minh pipeline hoạt động. Để nghiệm thu, người rà soát đọc câu hỏi, đáp án tham chiếu và ba phản hồi, điền **0 hoặc 1** cho mọi tiêu chí trong `review.csv`. `severe_error=1` nghĩa là có lỗi nghiêm trọng; các cột còn lại `1` nghĩa là đạt. Ghi nhận xét ở cột note.

Sau khi điền đủ, tại thư mục `ai-tutor` chạy:

```powershell
.venv\Scripts\python.exe approve_review.py
```

Chương trình chỉ tạo `approval.json` khi lượt train đầy đủ đã hoàn thành, độ đúng ít nhất 90%, không có lỗi nghiêm trọng, và tổng điểm năm tiêu chí tốt hơn model gốc có ngữ cảnh. Đây là kết quả của bảng chấm người rà soát, không phải AI tự chấm hoặc chứng nhận CEFR. Sửa adapter/bảng chấm/câu trả lời sẽ làm dấu xác nhận không còn khớp. Đánh giá lại ghi đè bảng chấm, nên cần lưu bản cũ riêng trước nếu muốn giữ lịch sử.

## Hỏi bài và nhận xét bản nháp

Trong mỗi bài, liên kết **Gia sư AI** đưa bạn đến phần hỏi đáp và giữ bản nháp khi chuyển giữa các phần của cùng bài. Có bốn gợi ý: hỏi từ đang chọn, giải thích mẫu câu, luyện hội thoại và nhận xét bản nháp ở phần luyện viết. Khi hỏi từ bằng gợi ý, backend chỉ đưa từ được chọn và mẫu câu của bài vào ngữ cảnh. Sửa câu hỏi thủ công bỏ lựa chọn từ này để bạn có thể hỏi điều khác. Chỉ gửi khi bạn bấm **Gửi gia sư** hoặc Ctrl/⌘ + Enter. Nếu ô hỏi đang có nội dung, bạn xem gợi ý rồi chọn **Dùng gợi ý này** hoặc **Giữ câu đang viết**.

Phản hồi vẫn là thử nghiệm. Bản nháp cần được tự đối chiếu tiêu chí trong phần luyện viết; gia sư chưa được dùng làm bộ chấm điểm. Lượt thử ngày 08/10 thấy nhận xét sai với một câu hỏi dài về đoạn đúng và lời mở hội thoại chưa làm theo yêu cầu. Câu hỏi nhận xét đã được rút gọn và nhắc giữ câu đúng, nhưng một vài phản hồi tốt hơn chưa chứng minh chất lượng chung. Xem [báo cáo phát triển](TUTOR_DEVELOPMENT_2026-10-08.md).

Tổng câu hỏi kèm yêu cầu tối đa 2.000 ký tự. Bản nháp quá dài được giữ nguyên và cần rút ngắn, không tự cắt. Model dùng tài liệu bài cùng tối đa ba lượt hỏi–đáp gần nhất. Khi vượt 1.536 token đầu vào, backend bỏ từng cặp hỏi–đáp cũ và thông báo số lượt còn dùng. Tài liệu bài và câu hỏi mới nhất luôn giữ nguyên; nếu riêng hai phần này đã quá dài, yêu cầu bị từ chối trước khi gọi model.

**Hội thoại mới** xóa hội thoại, ô hỏi và bản ghi của gia sư, đồng thời ngăn phản hồi hoặc transcript cũ quay lại; bản nháp luyện viết phía trên vẫn giữ. **Hủy yêu cầu** dừng chờ và giữ câu hỏi để thử lại. Model trên máy có thể tiếp tục xử lý yêu cầu đã nhận; nếu báo bận, hãy đợi rồi gửi lại.

Server local dùng một worker, xử lý từng tác vụ model và giới hạn toàn ứng dụng **12 yêu cầu hỏi đáp/phút**, **6 yêu cầu nhận diện giọng nói/phút**. Khi đạt giới hạn, API trả `429` và `Retry-After`. Giới hạn được kiểm tra trước khi đọc upload; yêu cầu không hợp lệ từ đúng origin cũng tính vào hạn mức. Cấu hình này dành cho một người trên máy, cần thiết kế lại nếu phục vụ nhiều máy/instance.

## Giọng nói

ASR dùng faster-whisper `small.en`, chạy CPU INT8. Lần đầu ghi âm cần tải model ASR vào `.cache/asr`. Giọng đọc dùng tiếng Anh sẵn có của trình duyệt; cần có giọng tiếng Anh trên thiết bị.

1. Bấm **Ghi âm tiếng Anh**, tối đa 30 giây; bấm dừng khi nói xong.
2. Nghe lại bản ghi nếu cần. ASR đưa transcript vào ô nhập.
3. Sửa transcript nếu nhận sai rồi bấm **Gửi gia sư**.
4. Sửa/chọn câu trong ô **Câu tiếng Anh để nghe**, rồi bấm **Nghe tiếng Anh**. Việc tự lấy câu tiếng Anh chỉ là gợi ý; không thay thế việc kiểm tra nội dung.

Backend giải mã nội dung thật, giới hạn 10 MB/30 giây và không tin tên file/MIME. Audio nhận diện nằm trong bộ nhớ; parser upload có thể dùng tệp tạm với bản ghi lớn, đóng/xóa sau yêu cầu. Không thêm audio vào dữ liệu train. Browser giữ bản ghi hiện tại để nghe lại và bỏ khi đổi bài/hội thoại. TTS của trình duyệt có thể dùng dịch vụ của nhà cung cấp tùy loại giọng. Không dùng transcript để chấm phát âm.

## Xử lý lỗi

| Lỗi | Cách xử lý |
|---|---|
| CUDA không khả dụng | Kiểm tra driver, GPU NVIDIA và Python 3.12; chương trình không train CPU |
| Thiếu VRAM / hết VRAM | Dừng phiên train/gia sư khác bằng Shift+F5 hoặc Ctrl+C rồi chạy lại. GPU 0% vẫn có thể giữ model trong VRAM; không cần tắt dịch vụ Windows |
| Mất mạng khi tải | Kết nối lại và Run lại; model/thư viện đã tải được giữ trong cache |
| Mẫu quá dài / hash không khớp | Đọc token-audit/manifest, sửa và rà soát dữ liệu; không tự cắt hoặc bỏ qua |
| Resume bị từ chối | Model/cấu hình/dữ liệu khác lượt chạy hoặc thiếu checkpoint; bắt đầu lượt mới |
| Gia sư chưa sẵn sàng | Chờ tải; dùng chế độ thử nghiệm hoặc hoàn thành nghiệm thu |
| Micro bị từ chối | Cấp quyền micro cho địa chỉ local hoặc nhập bằng chữ |
| Không có giọng tiếng Anh | Cài/bật giọng tiếng Anh trên thiết bị hoặc tiếp tục học bằng chữ |
| Audio không hợp lệ / quá dài | Ghi đoạn ngắn hơn; âm thanh được kiểm tra thực tế, không đổi đuôi file để vượt kiểm tra |

## Kiểm thử

```powershell
.venv\Scripts\python.exe -X utf8 -m unittest discover -s . -p "test_*.py" -v
```

Web tiếp tục có thể chạy bằng `serve.py` khi không cần AI. Backend này chỉ bind loopback, không phải cấu hình deploy production. Không mở cổng public. Khi có yêu cầu push/deploy, cần kiểm tra lại đủ 20 mục bảo mật theo AGENTS.md.

Tại thư mục web, `npm test` chạy thêm `tests/tutor-flow.cjs` cho gợi ý, bản nháp, lịch sử, hủy/reset và vòng đời micro bằng dữ liệu giả lập. Sau khi gia sư thật đã chạy ở cổng 8832, `node tests/tutor-live.cjs` kiểm tra giao diện/API với model và tokenizer thật; câu trả lời được giữ ngoài Git trong `test-results/tutor-live-results.json`. Kiểm tra live không chấm chất lượng và không thử micro vật lý.
