# Ghi âm trên Brave, Edge và Opera

Công cụ Dịch dùng **Whisper tiny đa ngôn ngữ chạy ngay trong trình duyệt**, thay cho dịch vụ `SpeechRecognition` của trình duyệt. Không cần API key, tài khoản hoặc backend nhận âm thanh. Giữ phần gia sư AI local riêng; thay đổi này chỉ áp dụng nút ghi âm trong công cụ Dịch.

## Sử dụng

1. Mở web trên HTTPS hoặc địa chỉ local `http://127.0.0.1:8831/#translate`.
2. Chọn ngôn ngữ nguồn. “Tự phát hiện” để model tự nhận ngôn ngữ; chọn rõ ngôn ngữ thường ổn định hơn.
3. Bấm **Chuẩn bị ghi âm**. Trình duyệt tải bộ model/runtime khoảng **63 MiB** từ máy chủ của web; chưa bật micro. Các file được chuẩn bị từ nguồn chính thức, khóa phiên bản và kiểm tra hash.
4. Khi sẵn sàng, bấm **Ghi âm**, cấp quyền micro, nói một đoạn ngắn rồi bấm **Dừng ghi âm**. Giới hạn mỗi lượt 30 giây.
5. Model nhận diện trên CPU trong worker để giao diện vẫn thao tác được. Chữ được thêm vào nội dung đang có, tối đa 5.000 ký tự. Kiểm tra và sửa trước khi bấm Dịch.

**Hủy ghi âm / nhận diện** tắt micro và bỏ kết quả đang chờ. Đổi trang, đổi ngôn ngữ, sửa/xóa ô nhập hoặc khôi phục lịch sử cũng hủy công việc đang chạy. Micro đã tắt trong lúc nhận diện.

## Quyền riêng tư và giới hạn

- Audio chỉ nằm tạm trong bộ nhớ trình duyệt; không gửi lên server, Google hoặc dịch vụ nhận diện bên ngoài và không lưu trong lịch sử. Văn bản mới gửi tới Google khi người dùng bấm Dịch. Lịch sử dịch vẫn mặc định tắt.
- Trình duyệt có thể lưu **file model**, không lưu audio. Nút **Xóa model đã lưu trong trình duyệt** chỉ xóa các file model của tính năng này; không xóa tiến độ, sổ từ hay lịch sử dịch. Chế độ riêng tư/quota thấp có thể không lưu model được.
- Model nhỏ ưu tiên dung lượng và khả năng chạy trên CPU; tiếng Việt, âm thanh nhiễu, giọng địa phương và tên riêng có thể nhận sai. Không dùng kết quả này để chấm phát âm.
- Cần trình duyệt hiện đại có MediaRecorder, Web Audio, Worker và WebAssembly SIMD; micro phải được người dùng cấp quyền. Không cam kết mọi phiên bản cũ hoặc thiết bị đều hỗ trợ. Nếu không hỗ trợ, phần nhập văn bản vẫn dùng được.
- Giọng đọc **Nghe bản dịch** vẫn tùy giọng có sẵn và chính sách của trình duyệt/hệ điều hành; thay đổi này chỉ thay cơ chế chuyển lời nói thành chữ.

## Chuẩn bị bản local trên máy khác

Tại thư mục dự án, chạy:

```powershell
python tools/prepare_voice.py
python serve.py
```

Script đầu chỉ tải runtime/model công khai, không đọc hoặc upload audio. Model là `Xenova/whisper-tiny`, revision `5332fcc35e32a33b86612b9a57a89be7906102b1`; runtime Transformers.js `3.8.1`. Bộ assets được bỏ qua bởi Git; danh mục nguồn, kích thước và SHA-256 nằm tại `data/voice-assets-manifest.json`. Không sửa hash để bỏ qua kiểm tra lỗi tải.

Khi đưa lên một máy chủ khác, cần phục vụ bộ `voice-assets` đã chuẩn bị cùng website, đặt MIME `.mjs` là `text/javascript`, `.wasm` là `application/wasm`, dùng HTTPS, và giữ CSP cho worker cùng nguồn/`wasm-unsafe-eval`. Không cần mở `unsafe-eval` cho JavaScript hoặc thêm các miền nhận audio. `serve.py` chỉ là preview loopback.

## Nguồn và kiểm tra thực tế

- [Transformers.js — cấu hình model local](https://huggingface.co/docs/transformers.js/v3.8.1/en/custom_usage), Apache-2.0.
- [Whisper tiny ONNX — model card](https://huggingface.co/Xenova/whisper-tiny), Apache-2.0 cho bản chuyển đổi; [Whisper gốc](https://github.com/openai/whisper), MIT.
- [Quyền micro và secure context](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Ngày 04/10/2026: kiểm tra model WASM thật qua getUserMedia/MediaRecorder với WAV tiếng Anh được tạo trên máy, trên **Edge 154.0.4258.53** và **Brave 154.0.8037.98**. Nhận diện đúng đoạn “My name is Anna. I live in Washington.”, giữ chữ đã có và không có request ra ngoài trong luồng ASR. Đây là audio thử qua micro giả lập; chưa kiểm tra giọng của người dùng hoặc đánh giá độ chính xác tiếng Việt. Opera chưa chạy thử vì máy không có executable Opera; cơ chế dùng các API tương thích của trình duyệt, không dựa vào dịch vụ Web Speech riêng của Opera.
