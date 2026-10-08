# Sửa lỗi giữ VRAM sau lượt kiểm tra — 04/10/2026

Tiến trình Python của lượt Train gia sư đang dừng ở lỗi preflight giữ 2.905 MiB bộ nhớ GPU theo bộ đếm Windows. Tổng VRAM NVIDIA đang dùng là 3.332 MiB. Dừng đúng worker này đưa mức dùng về 426 MiB; không đóng VS Code, Codex hoặc dịch vụ Windows.

Nguyên nhân trong `pipeline.py`: lượt smoke lưu/nạp lại adapter để thử câu trả lời, nhưng model nạp lại chưa được giải phóng trước khi lượt train đầy đủ kiểm tra VRAM. Debugger còn có thể giữ tham chiếu đến khung thực thi. GPU không tính toán vẫn có thể giữ bộ nhớ model.

Đã sửa:

- Xóa tham chiếu model/trainer và trả bộ nhớ đệm trong `finally` sau train và thử adapter.
- Smoke, train đầy đủ và đánh giá chạy trong các tiến trình riêng, chờ tiến trình trước kết thúc trước khi chạy tiến trình sau. Không chọn kết quả bằng cách đoán thư mục mới nhất; truyền chính xác thư mục worker trả về.
- Workspace đặt `subProcess=false` cho các lựa chọn Run, tránh debugger tự bám tiến trình con. Lỗi vẫn có log trong terminal.
- Lượt smoke thất bại dừng toàn bộ luồng; không chạy train đầy đủ hoặc đánh giá. Khi hủy coordinator, dừng cây tiến trình worker do coordinator tạo trên Windows.

Kiểm tra thực tế:

- 15 kiểm thử Python qua (11 kiểm tra đã có và 4 kiểm tra luồng giai đoạn).
- `verify_vram_lifecycle.py` chạy thật 10 bước trên RTX 4050, adapter thay đổi, loss hữu hạn 3,691899; lưu/nạp lại và sinh phản hồi thành công.
- Trước smoke: dùng 414 MiB, trống 5.507 MiB. Sau smoke: dùng 399 MiB, trống 5.522 MiB.
- Preflight của giai đoạn tiếp theo chạy trong tiến trình mới và qua; sau đó vẫn trống 5.522 MiB. Không còn worker train chạy sau kiểm tra.
- Lượt thử: `runs/20261004-100856-smoke-a78e90`. Số đo và SHA-256 mã đã kiểm tra ở `VRAM_FIX_VERIFICATION.json`.

Chưa chạy train đầy đủ trong lượt sửa này. Chưa thao tác nút F5 trực tiếp trên VS Code; đã kiểm tra đường chạy pipeline và đọc cấu hình workspace. Không thay model, tham số train, dữ liệu hoặc hạ ngưỡng 3,5 GiB. Không push/deploy hoặc thay đổi ứng dụng khởi động cùng Windows.

Mở workspace hiện tại, chọn **Train gia sư** và bấm F5 để train đầy đủ. Dừng phiên gia sư local nếu đang dùng GPU trước khi train.
