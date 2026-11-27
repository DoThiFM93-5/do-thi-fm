# Đô Thị FM 93.5 – hướng dẫn nhanh cho nhóm

## Mở xem
Bấm đúp `index.html` là chạy, không cần cài gì. Bản đồ và font chữ cần có Internet.

## Những chỗ cần sửa (tất cả nằm trong `js/config.js`, tìm chữ `TODO`)
1. **File thu âm bản tin sáng**: chép vào `audio/ban-tin-sang.mp3` (hoặc sửa `LIVE.audio`).
2. **Mốc thời gian 8 phần** (`SECTIONS`, tính bằng giây): nghe lại bản thu rồi ghi giây bắt đầu của từng phần.
3. **Chương trình đã phát** (`ARCHIVE`): thay 5 mục mẫu bằng bài tập trên lớp, chép mp3 vào `audio/luu-tru/`.
4. **Thông tin nhóm**: `TEAM`, `STATION.className`, `school`, `lecturer`, `hotline`, `email`.
5. **Chủ đề số phát sóng**: `LIVE.topic`, `LIVE.hosts`.
6. **Chế độ phát**: `LIVE_MODE: 'per-viewer'` (mỗi người bấm là nghe từ đầu) hoặc `'scheduled'` (phát cố định 8:00 sáng giờ Việt Nam).

## Đưa lên mạng miễn phí
- **Netlify Drop**: vào app.netlify.com/drop, kéo cả thư mục vào là có link.
- **GitHub Pages**: tạo repo, tải toàn bộ file lên, vào Settings → Pages → chọn nhánh `main`.

Lưu ý: tên file mp3 nên viết không dấu, không khoảng trắng. File mp3 lớn (trên 25 MB) nên nén lại (128 kbps là đủ cho giọng nói).
