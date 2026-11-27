/* ==========================================================================
   ĐÔ THỊ FM – FILE CẤU HÌNH
   --------------------------------------------------------------------------
   Mọi nội dung nhóm hay sửa đều nằm ở đây: tên kênh, tần số, hotline, lịch,
   thành viên, danh sách chương trình, mốc thời gian các phần, đường dẫn audio,
   chế độ phát trực tiếp...
   Dùng file .js (không dùng .json) để mở trực tiếp file HTML vẫn chạy.

   Lưu ý khi sửa:
   - Giữ nguyên dấu phẩy, dấu ngoặc. Chuỗi chữ đặt trong dấu nháy đơn '...'.
   - Thời gian trong ngày ghi dạng 'HH:MM' (24 giờ, giờ Việt Nam).
   - Mốc thời gian các phần trong chương trình tính bằng GIÂY.
   ========================================================================== */

window.DTFM_CONFIG = {

  /* ---------------- 1. Thông tin kênh ---------------- */
  STATION: {
    name: 'Đô Thị FM',
    frequency: '93.5',                 // tần số giả định
    frequencyLabel: 'FM 93.5 MHz',
    tagline: 'Kết nối nhịp đường phố',
    intro: 'Đô Thị FM là kênh phát thanh chuyên về giao thông, đô thị và đời sống người dân TP.HCM. ' +
           'Chúng tôi cập nhật tình hình đường sá từng giờ, chuyển phản ánh của thính giả tới cơ quan chức năng ' +
           'và kể những câu chuyện đang diễn ra trên từng con phố.',
    coverage: 'TP.HCM và vùng lân cận',
    hotline: '0901 234 567',           // số hiển thị trên web
    hotlineTel: '0901234567',          // số dùng cho nút bấm gọi trên điện thoại (viết liền, không dấu cách)
    email: 'radiowebproject@gmail.com',
    address: 'Số 8 Nguyễn Văn Tráng, phường Bến Thành, Thành phố Hồ Chí Minh',
    // Vị trí trụ sở kênh – hiện trên trang Bản đồ (lat, lng lấy từ Google Maps: chuột phải vào địa điểm)
    location: { lat: 10.7709, lng: 106.6917 },
    onAirHours: 'Phát sóng 24/7',
    // Thông tin bài tập – hiện ở chân trang và trang Giới thiệu
    course: 'Sản xuất chương trình giải trí phát thanh',
    className: 'Lớp ... – Truyền thông Đa phương tiện', // TODO: nhóm cập nhật tên lớp
    school: 'Trường ...',                               // TODO: nhóm cập nhật tên trường, khoa
    lecturer: 'Giảng viên: ...',                        // TODO: nhóm cập nhật tên giảng viên
    year: '2026'
  },

  /* ---------------- 2. Chương trình trực tiếp (sản phẩm của nhóm) ---------------- */
  LIVE: {
    title: 'Bản tin sáng Đô Thị FM',
    slot: '8:00 sáng hằng ngày',
    // TODO: nhóm cập nhật chủ đề của số phát sóng
    topic: 'Giờ cao điểm ở cửa ngõ phía Đông: đi sớm 15 phút có kịp?',
    hosts: 'MC: Thành viên 1 & Thành viên 2',            // TODO: nhóm cập nhật tên MC
    // TODO: nhóm cập nhật – chép file thu âm vào thư mục audio/ và sửa tên file ở đây
    audio: 'audio/ban-tin-sang.mp3',
    // Thời lượng dự phòng (giây) khi chưa đọc được file. Khi có file, web tự lấy thời lượng thật.
    durationFallback: 1410             // 23 phút 30 giây
  },

  /* Chế độ phát trực tiếp:
     - 'per-viewer' (mặc định): mỗi người xem bấm "Nghe trực tiếp" thì chương trình
        bắt đầu từ giây 0, như vừa lên sóng. Phù hợp để thầy và cả lớp mở link nghe.
     - 'scheduled': phát cố định lúc SCHEDULED_TIME hằng ngày theo giờ Việt Nam.
        Người vào trễ sẽ nghe từ giữa chương trình; ngoài giờ hiện "Chương trình tiếp theo lúc 8:00". */
  LIVE_MODE: 'per-viewer',
  SCHEDULED_TIME: '08:00',
  TIMEZONE_OFFSET: 7,                  // giờ Việt Nam = UTC+7

  /* ---------------- 3. Cấu trúc chương trình + mốc thời gian (giây) ----------------
     start: thời điểm bắt đầu phần đó trong file audio, tính bằng giây.
     Ví dụ 5 phút 30 giây = 330.
     TODO: nhóm cập nhật mốc thời gian thật khi có file thu âm. */
  SECTIONS: [
    { code: '01', start: 0,    name: 'Opening',              vi: 'Mở chương trình',
      desc: 'Nhạc hiệu, MC chào thính giả, giới thiệu chủ đề và câu "hook" giữ chân người nghe.' },
    { code: '02', start: 90,   name: 'Traffic update',      vi: 'Cập nhật giao thông',
      desc: 'Các tuyến đang ùn tắc, tai nạn, sự cố, phương án phân luồng và điểm nóng sáng nay.' },
    { code: '03', start: 300,  name: 'Main story',           vi: 'Nội dung trọng tâm',
      desc: 'Phóng sự thực địa về một vấn đề giao thông đang được người dân quan tâm.' },
    { code: '04', start: 600,  name: 'Interview / Voice report', vi: 'Phỏng vấn',
      desc: 'Ý kiến chuyên gia, người tham gia giao thông, cơ quan chức năng và các soundbite.' },
    { code: '05', start: 840,  name: 'Listener interaction', vi: 'Tương tác thính giả',
      desc: 'Đọc phản ánh của thính giả, có cuộc gọi của người dân báo tai nạn về tổng đài.' },
    { code: '06', start: 1020, name: 'Practical information', vi: 'Thông tin hữu ích',
      desc: 'Quy định mới, cảnh báo an toàn và mẹo tránh ùn tắc giờ cao điểm.' },
    { code: '07', start: 1110, name: 'Bài hát',              vi: 'Bài hát trước phần kết',
      desc: 'Một ca khúc nhẹ nhàng gửi tới người đang trên đường.' },
    { code: '08', start: 1320, name: 'Closing',              vi: 'Kết chương trình',
      desc: 'Tóm tắt, nhắc thông tin quan trọng, mời gửi phản ánh và nhạc outro.' }
  ],

  /* ---------------- 4. Chương trình đã phát (nghe lại) ----------------
     TODO: nhóm cập nhật – thay 5 mục mẫu bằng các bài tập đã làm trên lớp.
     - id: mã riêng, không trùng nhau, không dấu
     - date: 'YYYY-MM-DD'
     - duration: 'mm:ss' (chỉ để hiển thị, khi phát web dùng thời lượng thật)
     - audio: đường dẫn file mp3 trong thư mục audio/
     - cover: đường dẫn ảnh trong thư mục img/ (để trống '' thì web tự vẽ ảnh bìa)
     - tag: nhãn thể loại ngắn */
  ARCHIVE: [
    // TODO: nhóm cập nhật – ngày phát và mô tả đang để tạm, sửa lại cho đúng nội dung từng bài
    {
      id: 'nhip-dap-giao-thong',
      title: 'Nhịp đập Giao thông',
      tag: 'Chương trình',
      date: '2026-11-20',
      duration: '11:26',
      description: 'Chương trình phát thanh về nhịp sống trên đường phố: thông tin giao thông, câu chuyện của người tham gia giao thông và những lời nhắc an toàn.',
      audio: 'audio/luu-tru/nhip-dap-giao-thong.mp3',
      cover: ''
    },
    {
      id: 'phong-su-lop-hoc-radio',
      title: 'Lớp học Radio',
      tag: 'Phóng sự',
      date: '2026-11-13',
      duration: '01:43',
      description: 'Phóng sự ngắn về một lớp học làm phát thanh, nơi những giọng đọc mới tập làm quen với micro.',
      audio: 'audio/luu-tru/phong-su-lop-hoc-radio.mp3',
      cover: ''
    },
    {
      id: 'talkshow-the-exception',
      title: 'The Exception',
      tag: 'Talkshow',
      date: '2026-11-06',
      duration: '29:52',
      description: 'Talkshow trò chuyện cùng khách mời, mở rộng góc nhìn quanh những câu chuyện "ngoại lệ" trong đời sống.',
      audio: 'audio/luu-tru/talkshow-the-exception.mp3',
      cover: ''
    },
    {
      id: 'giai-dieu-duong-pho',
      title: 'Giai điệu đường phố',
      tag: 'Âm nhạc',
      date: '2026-10-30',
      duration: '13:37',
      description: 'Chương trình âm nhạc gửi tới thính giả những ca khúc về phố phường, đi cùng lời dẫn nhẹ nhàng.',
      audio: 'audio/luu-tru/giai-dieu-duong-pho.mp3',
      cover: ''
    },
    {
      id: 'truyen-ma-dem-khuya',
      title: 'Truyện ma đêm khuya',
      tag: 'Truyện kể',
      date: '2026-10-23',
      duration: '03:59',
      description: 'Một câu chuyện rùng rợn kể lúc nửa đêm, dành cho thính giả thích cảm giác hồi hộp. Nên nghe bằng tai nghe.',
      audio: 'audio/luu-tru/truyen-ma-dem-khuya.mp3',
      cover: ''
    }
  ],

  /* ---------------- 5. Tin nhanh chạy ngang (ticker) – dữ liệu minh họa ---------------- */
  TICKER: [
    'Cầu Sài Gòn hướng về trung tâm đông xe, tốc độ trung bình dưới 15 km/h',
    'Nút giao An Phú: phân luồng xe tải từ 6:00 đến 9:00',
    'Va chạm giữa xe máy và ô tô trên đường Cộng Hòa, một làn bị chiếm dụng',
    'Mưa lớn dự báo chiều nay, đường Nguyễn Hữu Cảnh có thể ngập cục bộ',
    'Hotline phản ánh giao thông Đô Thị FM: 0901 234 567',
    'Bản tin sáng phát lúc 8:00 hằng ngày trên FM 93.5 MHz'
  ],

  /* ---------------- 6. Lịch phát sóng (giờ Việt Nam) ----------------
     Mỗi ngày dùng một trong ba khung: weekday (Thứ Hai – Thứ Sáu), saturday, sunday.
     featured: true = chương trình của nhóm (được tô nổi bật). */
  SCHEDULE: {
    weekday: [
      { start: '00:00', end: '05:00', title: 'Phát lại trong ngày', desc: 'Phát lại các chương trình nổi bật hôm qua.' },
      { start: '05:00', end: '06:00', title: 'Chào ngày mới', desc: 'Thời tiết, tình hình đường sá đầu ngày và nhạc nhẹ.' },
      { start: '06:00', end: '08:00', title: 'Giờ cao điểm sáng', desc: 'Cập nhật liên tục các cửa ngõ, cầu và nút giao lớn.' },
      { start: '08:00', end: '08:25', title: 'Bản tin sáng Đô Thị FM', desc: 'Bản tin giao thông 20–25 phút: phóng sự, phỏng vấn, phản ánh thính giả.', featured: true },
      { start: '08:25', end: '09:00', title: 'Âm nhạc trên đường', desc: 'Nhạc Việt nhẹ nhàng xen thông tin giao thông nhanh.' },
      { start: '09:00', end: '10:30', title: 'Đô thị hôm nay', desc: 'Quy hoạch, dịch vụ công và chuyện sống ở thành phố.' },
      { start: '10:30', end: '11:30', title: 'Hỏi đáp luật giao thông', desc: 'Luật sư trả lời câu hỏi của thính giả qua tổng đài.' },
      { start: '11:30', end: '13:00', title: 'Trưa nay đường phố', desc: 'Tin tổng hợp buổi trưa và gợi ý lộ trình buổi chiều.' },
      { start: '13:00', end: '14:00', title: 'Chuyện người cầm lái', desc: 'Tài xế xe buýt, xe công nghệ, shipper kể chuyện nghề.' },
      { start: '14:00', end: '16:00', title: 'Nhịp sống đô thị', desc: 'Đời sống, môi trường, những sáng kiến nhỏ của người dân.' },
      { start: '16:00', end: '19:00', title: 'Giờ cao điểm chiều', desc: 'Trực tiếp tình hình tan tầm, phân luồng, điểm ngập.' },
      { start: '19:00', end: '20:00', title: 'Bản tin tối', desc: 'Tổng kết giao thông trong ngày và thông tin cho ngày mai.' },
      { start: '20:00', end: '22:00', title: 'Đêm thành phố', desc: 'Âm nhạc và câu chuyện của những người làm việc đêm.' },
      { start: '22:00', end: '24:00', title: 'Nhạc khuya', desc: 'Nhạc không lời, nhắc lái xe an toàn về đêm.' }
    ],
    saturday: [
      { start: '00:00', end: '06:00', title: 'Phát lại trong tuần', desc: 'Những số phát sóng được nghe nhiều nhất.' },
      { start: '06:00', end: '08:00', title: 'Sáng cuối tuần', desc: 'Thời tiết, đường đi chơi xa và các cửa ngõ ra khỏi thành phố.' },
      { start: '08:00', end: '08:25', title: 'Bản tin sáng Đô Thị FM', desc: 'Bản tin giao thông 20–25 phút: phóng sự, phỏng vấn, phản ánh thính giả.', featured: true },
      { start: '08:25', end: '10:00', title: 'Cuối tuần đi đâu', desc: 'Gợi ý điểm đến, cách đi bằng xe buýt, metro và xe đạp.' },
      { start: '10:00', end: '12:00', title: 'Gara cuối tuần', desc: 'Chăm sóc xe máy, ô tô và kiến thức lái xe an toàn.' },
      { start: '12:00', end: '14:00', title: 'Giai điệu đường phố', desc: 'Nhạc theo yêu cầu thính giả.' },
      { start: '14:00', end: '17:00', title: 'Sài Gòn cuối tuần', desc: 'Sự kiện, lễ hội và những tuyến đường cấm xe.' },
      { start: '17:00', end: '19:00', title: 'Giao thông chiều thứ Bảy', desc: 'Tình hình các tuyến về quê, ra bến xe, sân bay.' },
      { start: '19:00', end: '21:00', title: 'Tối thứ Bảy', desc: 'Âm nhạc, trò chuyện và kết nối thính giả.' },
      { start: '21:00', end: '24:00', title: 'Nhạc khuya', desc: 'Nhạc không lời, nhắc lái xe an toàn về đêm.' }
    ],
    sunday: [
      { start: '00:00', end: '06:00', title: 'Phát lại trong tuần', desc: 'Những số phát sóng được nghe nhiều nhất.' },
      { start: '06:00', end: '08:00', title: 'Chủ nhật thong thả', desc: 'Nhạc nhẹ và thông tin đường sá cuối tuần.' },
      { start: '08:00', end: '08:25', title: 'Bản tin sáng Đô Thị FM', desc: 'Bản tin giao thông 20–25 phút: phóng sự, phỏng vấn, phản ánh thính giả.', featured: true },
      { start: '08:25', end: '10:00', title: 'Tuần qua trên đường phố', desc: 'Nhìn lại những sự việc giao thông đáng chú ý trong tuần.' },
      { start: '10:00', end: '12:00', title: 'Gia đình và con đường', desc: 'An toàn giao thông cho trẻ em và người lớn tuổi.' },
      { start: '12:00', end: '15:00', title: 'Giai điệu đường phố', desc: 'Nhạc theo yêu cầu thính giả.' },
      { start: '15:00', end: '19:00', title: 'Chiều Chủ nhật về phố', desc: 'Cập nhật dòng xe trở lại thành phố sau cuối tuần.' },
      { start: '19:00', end: '21:00', title: 'Chuẩn bị tuần mới', desc: 'Lịch phân luồng, công trình và lời khuyên cho sáng thứ Hai.' },
      { start: '21:00', end: '24:00', title: 'Nhạc khuya', desc: 'Nhạc không lời, nhắc lái xe an toàn về đêm.' }
    ]
  },

  /* Lịch có đến hết ngày nào (trang Lịch phát sóng cho xem tới ngày này). TODO: nhóm cập nhật khi soạn thêm lịch */
  SCHEDULE_UNTIL: '2026-12-24',

  /* Tiết mục cố định hằng tuần, ghép đè lên khung lịch ở trên.
     Số ở đầu là thứ trong tuần: 0 = Chủ nhật, 1 = Thứ Hai, ... 6 = Thứ Bảy.
     Chương trình trùng giờ trong khung sẽ tự được cắt bớt hoặc thay thế. */
  SCHEDULE_WEEKLY: {
    3: [
      { start: '20:00', end: '21:00', title: 'Talkshow giữa tuần', desc: 'Trò chuyện cùng người trẻ thành phố về đi lại, việc làm và những lựa chọn rất riêng.' }
    ],
    5: [
      { start: '23:00', end: '23:30', title: 'Truyện ma đêm khuya', desc: 'Một câu chuyện rùng rợn trước giờ đi ngủ. Nên nghe bằng tai nghe.' }
    ]
  },

  /* Chương trình đặc biệt theo ngày ('YYYY-MM-DD'), ghép đè lên lịch của ngày đó.
     badge: nhãn nhỏ hiện cạnh tên chương trình. */
  SCHEDULE_SPECIAL: {
    '2026-11-28': [
      { start: '19:00', end: '21:00', title: 'Phát lại: Talkshow The Exception', desc: 'Phát lại số talkshow được nghe nhiều nhất tháng 11.', badge: 'Phát lại' }
    ],
    '2026-12-01': [
      { start: '09:00', end: '10:30', title: 'Chuyên đề: Mưa cuối mùa và những điểm ngập', desc: 'Các tuyến hay ngập khi mưa lớn, lộ trình thay thế và cách xử lý khi xe chết máy giữa đường.', badge: 'Chuyên đề' }
    ],
    '2026-12-06': [
      { start: '10:00', end: '12:00', title: 'Talkshow cuối tuần: Đi làm bằng metro', desc: 'Thính giả kể trải nghiệm đi metro số 1 mỗi ngày: tiện ở đâu, còn vướng ở đâu.', badge: 'Đặc biệt' }
    ],
    '2026-12-09': [
      { start: '10:30', end: '11:30', title: 'Hỏi đáp đặc biệt: Đã uống rượu bia, không lái xe', desc: 'Luật sư giải đáp quy định về nồng độ cồn khi tham gia giao thông, mùa tiệc cuối năm đang tới gần.', badge: 'Đặc biệt' }
    ],
    '2026-12-12': [
      { start: '19:00', end: '21:00', title: 'Gala Giai điệu đường phố', desc: 'Hai giờ âm nhạc về Sài Gòn theo yêu cầu của thính giả, có khách mời hát trực tiếp tại phòng thu.', badge: 'Gala' }
    ],
    '2026-12-15': [
      { start: '14:00', end: '16:00', title: 'Chuyên đề: An toàn giao thông mùa lễ cuối năm', desc: 'Lượng xe tăng, tiệc tùng nhiều: những điều cần nhớ để về nhà an toàn.', badge: 'Chuyên đề' }
    ],
    '2026-12-18': [
      { start: '16:00', end: '19:00', title: 'Giờ cao điểm chiều – cuối tuần trước Giáng sinh', desc: 'Cập nhật liên tục các cửa ngõ, bến xe và sân bay trong buổi chiều đông xe nhất tháng.', badge: 'Trực tiếp' }
    ],
    '2026-12-19': [
      { start: '08:25', end: '10:00', title: 'Cuối tuần đi đâu: Sài Gòn mùa Noel', desc: 'Gợi ý điểm vui chơi dịp Giáng sinh và cách đến đó bằng xe buýt, metro để khỏi lo chỗ gửi xe.', badge: 'Đặc biệt' }
    ],
    '2026-12-20': [
      { start: '08:25', end: '10:00', title: 'Nhìn lại giao thông TP.HCM năm 2026', desc: 'Những công trình, quy định mới và câu chuyện trên đường phố đáng nhớ nhất trong năm.', badge: 'Tổng kết' }
    ],
    '2026-12-23': [
      { start: '20:00', end: '22:00', title: 'Sẵn sàng cho đêm Giáng sinh', desc: 'Dự kiến phân luồng khu trung tâm, điểm gửi xe và lời khuyên cho gia đình có trẻ nhỏ.', badge: 'Đặc biệt' }
    ],
    '2026-12-24': [
      { start: '16:00', end: '19:00', title: 'Giờ cao điểm chiều – đêm Giáng sinh', desc: 'Dòng xe đổ về trung tâm từ sớm. Cập nhật các tuyến nên tránh và giờ cấm xe.', badge: 'Trực tiếp' },
      { start: '19:00', end: '23:00', title: 'Trực tiếp: Đêm Giáng sinh trên phố', desc: 'Phóng viên có mặt quanh khu trung tâm, cập nhật phân luồng, điểm kẹt xe và chỗ gửi xe còn trống.', badge: 'Trực tiếp' },
      { start: '23:00', end: '24:00', title: 'Nhạc Giáng sinh', desc: 'Những ca khúc Giáng sinh quen thuộc cho người đang trên đường về nhà.', badge: 'Đặc biệt' }
    ]
  },

  /* ---------------- 7. Tin giao thông – DỮ LIỆU MINH HỌA ----------------
     type: 'un-tac' | 'tai-nan' | 'phan-luong' | 'canh-bao' */
  NEWS: [
    { type: 'un-tac', time: '07:42', title: 'Ùn ứ kéo dài trên cầu Sài Gòn hướng vào trung tâm',
      place: 'Cầu Sài Gòn – Điện Biên Phủ', desc: 'Dòng xe nối dài khoảng 1,5 km, xe máy di chuyển chậm. Nên đi vòng qua cầu Thủ Thiêm 2 hoặc hầm sông Sài Gòn.' },
    { type: 'tai-nan', time: '07:30', title: 'Va chạm giữa xe máy và ô tô trên đường Cộng Hòa',
      place: 'Cộng Hòa – gần cầu vượt Hoàng Hoa Thám', desc: 'Một làn đường hướng ra sân bay bị chiếm dụng. Lực lượng chức năng đang có mặt điều tiết.' },
    { type: 'phan-luong', time: '06:00', title: 'Cấm xe tải qua nút giao An Phú giờ cao điểm sáng',
      place: 'Nút giao An Phú – Xa lộ Hà Nội', desc: 'Từ 6:00 đến 9:00, xe tải trên 2,5 tấn đi theo hướng Vành đai 2. Xe máy đi đúng làn dành riêng.' },
    { type: 'canh-bao', time: '07:15', title: 'Dự báo mưa lớn chiều nay, nguy cơ ngập cục bộ',
      place: 'Nguyễn Hữu Cảnh, Ung Văn Khiêm', desc: 'Người đi đường nên chuẩn bị áo mưa, tránh đi vào đoạn trũng và không dừng xe dưới cây lớn.' },
    { type: 'un-tac', time: '07:20', title: 'Vòng xoay Hàng Xanh đông xe từ bốn hướng',
      place: 'Vòng xoay Hàng Xanh', desc: 'Xe máy dồn ứ trên Xô Viết Nghệ Tĩnh và Điện Biên Phủ. Đèn tín hiệu hoạt động bình thường.' },
    { type: 'tai-nan', time: '06:50', title: 'Xe container hỏng giữa đường, gây kẹt xe Quốc lộ 1',
      place: 'Quốc lộ 1 – gần bến xe Miền Tây', desc: 'Xe đang được cứu hộ kéo vào lề. Dự kiến thông xe trong 30 phút tới.' },
    { type: 'phan-luong', time: '05:30', title: 'Rào chắn thi công một phần đường Lê Văn Việt',
      place: 'Lê Văn Việt – khu vực Thủ Đức', desc: 'Thu hẹp còn hai làn mỗi chiều trong thời gian thi công cống thoát nước, kéo dài đến cuối tháng.' },
    { type: 'canh-bao', time: '06:10', title: 'Nhắc nhở: không dừng đỗ trên cầu để chụp ảnh',
      place: 'Cầu Ba Son (cầu Thủ Thiêm 2)', desc: 'Dừng xe trên cầu dễ gây va chạm liên hoàn, nhất là giờ cao điểm sáng và chiều.' },
    { type: 'un-tac', time: '07:05', title: 'Ngã tư Bảy Hiền chậm, xe buýt trễ chuyến',
      place: 'Ngã tư Bảy Hiền – Cách Mạng Tháng Tám', desc: 'Công trình metro số 2 thu hẹp mặt đường. Các tuyến xe buýt qua khu vực trễ 10–15 phút.' },
    { type: 'phan-luong', time: '05:45', title: 'Đóng hầm sông Sài Gòn hướng Thủ Đức để bảo trì đêm nay',
      place: 'Hầm sông Sài Gòn', desc: 'Từ 23:00 đến 4:00 sáng mai, xe đi qua cầu Thủ Thiêm hoặc cầu Ba Son.' },
    { type: 'tai-nan', time: '07:48', title: 'Hai xe máy va chạm tại giao lộ Phan Văn Trị – Nguyễn Oanh',
      place: 'Phan Văn Trị – Nguyễn Oanh, Gò Vấp', desc: 'Không có thương vong nghiêm trọng. Giao thông đã trở lại bình thường sau 20 phút.' },
    { type: 'canh-bao', time: '06:30', title: 'Sương mù nhẹ trên cao tốc TP.HCM – Long Thành',
      place: 'Cao tốc TP.HCM – Long Thành – Dầu Giây', desc: 'Tầm nhìn giảm, tài xế bật đèn chiếu gần và giữ khoảng cách an toàn.' }
  ],

  /* ---------------- 8. Điểm nóng trên bản đồ – DỮ LIỆU MINH HỌA ----------------
     level: 'thong-thoang' | 'dong' | 'un-tac'
     lat, lng: tọa độ (có thể lấy bằng cách bấm chuột phải trên Google Maps) */
  HOTSPOTS: [
    { name: 'Cầu Sài Gòn', road: 'Xa lộ Hà Nội – Điện Biên Phủ', level: 'un-tac', lat: 10.7983, lng: 106.7268, note: 'Hướng vào trung tâm kẹt dài khoảng 1,5 km.', updated: '07:42' },
    { name: 'Vòng xoay Hàng Xanh', road: 'Xô Viết Nghệ Tĩnh – Điện Biên Phủ', level: 'un-tac', lat: 10.8018, lng: 106.7112, note: 'Xe máy dồn ứ từ bốn hướng.', updated: '07:20' },
    { name: 'Nút giao An Phú', road: 'Xa lộ Hà Nội – Mai Chí Thọ', level: 'dong', lat: 10.8019, lng: 106.7476, note: 'Đang phân luồng xe tải, xe máy đi chậm.', updated: '07:35' },
    { name: 'Ngã tư Bảy Hiền', road: 'Cách Mạng Tháng Tám – Hoàng Văn Thụ', level: 'un-tac', lat: 10.7930, lng: 106.6531, note: 'Mặt đường thu hẹp do công trình metro.', updated: '07:05' },
    { name: 'Vòng xoay Lăng Cha Cả', road: 'Hoàng Văn Thụ – Cộng Hòa', level: 'dong', lat: 10.8010, lng: 106.6596, note: 'Đông xe hướng ra sân bay Tân Sơn Nhất.', updated: '07:25' },
    { name: 'Cộng Hòa – Hoàng Hoa Thám', road: 'Đường Cộng Hòa', level: 'dong', lat: 10.8018, lng: 106.6480, note: 'Va chạm giao thông, một làn bị chiếm dụng.', updated: '07:30' },
    { name: 'Ngã sáu Gò Vấp', road: 'Nguyễn Oanh – Quang Trung – Nguyễn Kiệm', level: 'dong', lat: 10.8262, lng: 106.6790, note: 'Xe đông nhưng vẫn di chuyển được.', updated: '07:40' },
    { name: 'Cầu Bình Triệu', road: 'Quốc lộ 13', level: 'thong-thoang', lat: 10.8232, lng: 106.7142, note: 'Lưu thông bình thường.', updated: '07:38' },
    { name: 'Ngã tư Thủ Đức', road: 'Xa lộ Hà Nội – Võ Văn Ngân', level: 'dong', lat: 10.8493, lng: 106.7740, note: 'Đông xe hướng về cầu Rạch Chiếc.', updated: '07:33' },
    { name: 'Vòng xoay Phú Lâm', road: 'Hồng Bàng – Kinh Dương Vương', level: 'thong-thoang', lat: 10.7524, lng: 106.6344, note: 'Lưu thông ổn định.', updated: '07:28' },
    { name: 'Nút giao An Lạc', road: 'Quốc lộ 1 – Kinh Dương Vương', level: 'un-tac', lat: 10.7400, lng: 106.6170, note: 'Xe container hỏng, đang cứu hộ.', updated: '06:50' },
    { name: 'Cầu Kênh Tẻ', road: 'Nguyễn Hữu Thọ', level: 'thong-thoang', lat: 10.7518, lng: 106.7008, note: 'Lưu thông bình thường.', updated: '07:22' },
    { name: 'Nguyễn Văn Linh – Nguyễn Hữu Thọ', road: 'Khu vực Nam Sài Gòn', level: 'dong', lat: 10.7337, lng: 106.7012, note: 'Đông xe hướng vào trung tâm.', updated: '07:18' },
    { name: 'Hầm sông Sài Gòn', road: 'Đại lộ Võ Văn Kiệt – Mai Chí Thọ', level: 'thong-thoang', lat: 10.7670, lng: 106.7097, note: 'Thông thoáng. Đóng hướng Thủ Đức từ 23:00 đêm nay.', updated: '07:10' },
    { name: 'Nguyễn Hữu Cảnh', road: 'Đoạn chân cầu Thủ Thiêm 2', level: 'dong', lat: 10.7880, lng: 106.7175, note: 'Đông xe, có nguy cơ ngập khi mưa lớn.', updated: '07:15' }
  ],

  /* ---------------- 9. Nhóm thực hiện ----------------
     TODO: nhóm cập nhật tên thành viên, vai trò, phần việc. */
  TEAM: [
    { name: 'Thành viên 1', role: 'Trưởng nhóm – Biên tập', task: 'Lên kịch bản tổng, duyệt nội dung, điều phối nhóm.' },
    { name: 'Thành viên 2', role: 'MC dẫn chương trình', task: 'Dẫn Opening, Traffic update và Closing.' },
    { name: 'Thành viên 3', role: 'Phóng viên thực địa', task: 'Thực hiện phóng sự, ghi âm hiện trường.' },
    { name: 'Thành viên 4', role: 'Phỏng vấn – Voice report', task: 'Liên hệ khách mời, phỏng vấn, cắt soundbite.' },
    { name: 'Thành viên 5', role: 'Kỹ thuật âm thanh', task: 'Thu âm, dựng, mix nhạc hiệu và hiệu ứng.' },
    { name: 'Thành viên 6', role: 'Tương tác & Web', task: 'Kịch bản cuộc gọi thính giả, thiết kế website.' }
  ]
};
