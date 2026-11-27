/* ==========================================================================
   ĐÔ THỊ FM – player.js
   - Trình phát TRỰC TIẾP: có "mốc trực tiếp" chạy theo thời gian thực,
     chỉ cho tua lùi, không bao giờ vượt mốc trực tiếp.
   - Trình phát NGHE LẠI: tua tự do hai chiều.
   - Mini-player cố định ở đáy trang, lưu trạng thái vào localStorage và
     tự nối tiếp khi chuyển sang trang khác.
   Phần nội dung (đường dẫn audio, mốc thời gian...) nằm trong js/config.js.
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.DTFM_CONFIG || {};
  var DT = window.DTFM || {};
  var U = DT.util;
  var ICON = DT.icons || {};
  if (!U) return; // main.js chưa tải → bỏ qua để không gây lỗi trang

  var LIVE_CFG = CFG.LIVE || {};
  var MODE = CFG.LIVE_MODE === 'scheduled' ? 'scheduled' : 'per-viewer';
  var SECTIONS = (CFG.SECTIONS || []).slice().sort(function (a, b) { return a.start - b.start; });
  var ARCHIVE = CFG.ARCHIVE || [];
  var STATION = CFG.STATION || {};
  var IS_HOME = !!document.getElementById('live-player');
  var STORE_KEY = 'dtfm-player-v1';
  var MAX_AGE = 3 * 3600 * 1000;      // phiên nghe cũ hơn 3 giờ thì bỏ
  var LAG_SHOW = 2.5;                 // trễ hơn bao nhiêu giây thì hiện "Trễ ... so với trực tiếp"
  var LIVE_REPLAY_ID = '__ban-tin-truc-tiep__';

  /* ---------------- Lưu trữ (bọc try/catch vì có trình duyệt chặn localStorage) ---------------- */
  var Store = {
    read: function () {
      try { var raw = localStorage.getItem(STORE_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    write: function (obj) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify(obj)); } catch (e) { /* bỏ qua */ }
    },
    clear: function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* bỏ qua */ }
    }
  };

  var activeMode = null;   // 'live' | 'replay' | null – trình phát nào đang "giữ" mini-player
  var unloading = false;
  var lastPersist = 0;

  function persist() {
    var st = { v: 1, savedAt: Date.now(), mode: activeMode };
    if (Live.state === 'active') {
      st.live = { mode: MODE, startEpoch: Live.startEpoch, position: Live.position(), playing: Live.wantPlay };
    }
    if (Replay.item) {
      st.replay = { id: Replay.item.id, position: Replay.position(), playing: Replay.wantPlay };
    }
    if (!st.live && !st.replay) { Store.clear(); return; }
    Store.write(st);
  }
  function persistSoon() {
    var n = Date.now();
    if (n - lastPersist > 1000) { lastPersist = n; persist(); }
  }

  /* ---------------- Thông báo nhỏ (toast) ---------------- */
  var toastEl = document.createElement('div');
  toastEl.className = 'toast';
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(toastEl);
  var toastTimer = null, lastToast = '', lastToastAt = 0;
  function toast(msg) {
    var n = Date.now();
    if (msg === lastToast && n - lastToastAt < 2500) return;
    lastToast = msg; lastToastAt = n;
    toastEl.textContent = msg;
    toastEl.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-show'); }, 2600);
  }

  /* ---------------- Tiện ích ---------------- */
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function setText(el, txt) { if (el && el.textContent !== txt) el.textContent = txt; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function showWhen(root, state) {
    var list = root.querySelectorAll('[data-when]');
    for (var i = 0; i < list.length; i++) {
      var hide = list[i].getAttribute('data-when').split(' ').indexOf(state) === -1;
      if (list[i].hidden !== hide) list[i].hidden = hide;
    }
  }
  function setPlayBtn(btn, playing, labels) {
    if (!btn) return;
    var want = playing ? 'pause' : 'play';
    if (btn.getAttribute('data-icon') !== want) {
      btn.setAttribute('data-icon', want);
      btn.innerHTML = playing ? ICON.pause : ICON.play;
    }
    btn.setAttribute('aria-label', playing ? labels[1] : labels[0]);
  }
  function paintTrack(track, played, avail) {
    if (!track) return;
    track.style.setProperty('--played', (clamp(played, 0, 1) * 100).toFixed(3) + '%');
    track.style.setProperty('--avail', (clamp(avail, 0, 1) * 100).toFixed(3) + '%');
    track.style.setProperty('--avail-n', clamp(avail, 0, 1).toFixed(5));
  }
  /* Ô thời gian nhỏ phía trên nút tròn khi đang kéo */
  function renderTip(v, shown, dur) {
    if (!v.tip) return;
    if (!v.dragging) return;
    var w = v.track.clientWidth;
    v.tip.style.left = (8 + clamp(dur ? shown / dur : 0, 0, 1) * Math.max(0, w - 16)) + 'px';
    setText(v.tip, U.fmt(shown));
  }
  function sectionIndexAt(t) {
    var idx = -1;
    for (var i = 0; i < SECTIONS.length; i++) { if (t >= SECTIONS[i].start) idx = i; }
    return SECTIONS.length ? Math.max(0, idx) : -1;
  }
  function sectionText(i, long) {
    var s = SECTIONS[i];
    if (!s) return '';
    return s.code + ' · ' + s.name + (long && s.vi ? ' – ' + s.vi : '');
  }

  /* Khung giờ phát cố định (chế độ 'scheduled'), tính theo giờ Việt Nam */
  function scheduleWindow(durSec) {
    var parts = String(CFG.SCHEDULED_TIME || '08:00').split(':');
    var h = Number(parts[0]) || 0, m = Number(parts[1]) || 0;
    var n = U.vnNow();
    var now = Date.now();
    var start = U.vnEpoch(n.y, n.mo, n.d, h, m);
    var end = start + durSec * 1000;
    var label = h + ':' + U.pad(m);
    if (now >= start && now < end) return { onAir: true, start: start, end: end, label: label };
    if (now < start) return { onAir: false, next: start, tomorrow: false, label: label };
    return { onAir: false, next: start + 86400000, tomorrow: true, label: label };
  }

  /* Gắn các nút/thanh tua trong một khối giao diện vào bộ điều khiển (Live hoặc Replay).
     Các phần tử được nhận diện qua thuộc tính data-role. */
  function makeView(root, ctrl) {
    function q(r) { return root.querySelector('[data-role="' + r + '"]'); }
    var v = {
      root: root, dragging: false,
      play: q('play'), back10: q('back10'), fwd10: q('fwd10'), seek: q('seek'), track: q('track'),
      ticks: q('ticks'), cur: q('cur'), dur: q('dur'), lag: q('lag'), golive: q('golive'), livepill: q('livepill'),
      section: q('section'), resume: q('resume'), close: q('close'), start: q('start'), restart: q('restart'),
      title: q('title'), sub: q('sub'), badge: q('badge'), badgeText: q('badge-text'), countdown: q('countdown'),
      nextTime: q('next-time'), cover: q('cover')
    };
    on(v.play, 'click', function () { ctrl.toggle(); });
    on(v.back10, 'click', function () { ctrl.skip(-10, true); });
    on(v.fwd10, 'click', function () { ctrl.skip(10, true); });
    on(v.golive, 'click', function () { if (ctrl.goLive) ctrl.goLive(); });
    on(v.resume, 'click', function () { ctrl.resume(); });
    on(v.close, 'click', function () { ctrl.close(); });
    on(v.start, 'click', function () { ctrl.start(); });
    on(v.restart, 'click', function () { ctrl.restart(); });
    if (v.seek && v.track) {
      /* Kéo thanh tiến độ kiểu YouTube: nhấn giữ rồi kéo, nút tròn đi theo chuột/ngón tay,
         hiện thời gian đang trỏ tới; thả ra mới tua âm thanh (đỡ giật khi file nằm trên mạng).
         Nghe trực tiếp: nút tròn dừng ở mốc trực tiếp, không kéo vượt qua được. */
      var tip = document.createElement('span');
      tip.className = 'progress__tip';
      tip.setAttribute('aria-hidden', 'true');
      v.track.appendChild(tip);
      v.tip = tip;
      var dragPreview = function (clientX) {
        var r = v.track.getBoundingClientRect();
        var ratio = clamp((clientX - r.left - 8) / Math.max(1, r.width - 16), 0, 1);
        var t = ratio * (ctrl.duration || 0);
        var lim = ctrl.maxSeekable();
        if (t > lim) {
          t = lim;
          if (!v.hitEdge) { v.hitEdge = true; toast('Đây là mốc trực tiếp – không thể tua tới.'); }
        }
        v.dragValue = Math.max(0, t);
        ctrl.render();
      };
      var dragEnd = function (commit) {
        if (!v.dragging) return;
        v.dragging = false;
        v.track.classList.remove('is-dragging');
        if (commit) ctrl.seekTo(v.dragValue, false);
        else ctrl.render();
      };
      v.track.addEventListener('pointerdown', function (e) {
        if ((e.pointerType === 'mouse' && e.button !== 0) || !ctrl.canSeek()) return;
        e.preventDefault();
        v.dragging = true;
        v.hitEdge = false;
        v.track.classList.add('is-dragging');
        try { v.track.setPointerCapture(e.pointerId); } catch (err) { /* bỏ qua */ }
        try { v.seek.focus({ preventScroll: true }); } catch (err) { /* bỏ qua */ }
        dragPreview(e.clientX);
      });
      v.track.addEventListener('pointermove', function (e) { if (v.dragging) dragPreview(e.clientX); });
      v.track.addEventListener('pointerup', function () { dragEnd(true); });
      v.track.addEventListener('lostpointercapture', function () { dragEnd(true); });
      v.track.addEventListener('pointercancel', function () { dragEnd(false); });
      // Trường hợp thanh tua nhận giá trị từ công cụ hỗ trợ (trình đọc màn hình...)
      v.seek.addEventListener('input', function () {
        var t = ctrl.seekTo(parseFloat(v.seek.value) || 0, true);
        v.seek.value = t;
      });
      // Phím trên thanh tua: tự xử lý để chặn tua vượt mốc trực tiếp
      v.seek.addEventListener('keydown', function (e) {
        var map = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -30, PageUp: 30 };
        if (Object.prototype.hasOwnProperty.call(map, e.key)) { e.preventDefault(); ctrl.skip(map[e.key], true); }
        else if (e.key === 'Home') { e.preventDefault(); ctrl.seekTo(0, true); }
        else if (e.key === 'End') { e.preventDefault(); if (ctrl.goLive) ctrl.goLive(); else ctrl.seekTo(ctrl.duration, true); }
      });
    }
    ctrl.views.push(v);
    return v;
  }

  function renderTicks(ctrl) {
    var dur = ctrl.duration;
    ctrl.views.forEach(function (v) {
      if (!v.ticks || !dur) return;
      v.ticks.innerHTML = SECTIONS.filter(function (s) { return s.start > 0 && s.start < dur; })
        .map(function (s) { return '<span style="left:' + (s.start / dur * 100).toFixed(3) + '%"></span>'; }).join('');
    });
  }

  function updateMediaSession(title, artist) {
    if (!('mediaSession' in navigator) || typeof window.MediaMetadata !== 'function') return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: title, artist: artist || (STATION.name + ' ' + STATION.frequency), album: STATION.tagline || ''
      });
    } catch (e) { /* bỏ qua */ }
  }

  /* ======================================================================
     TRÌNH PHÁT TRỰC TIẾP
     state: 'idle'        – chưa bắt đầu, chờ bấm "Nghe trực tiếp"
            'waiting'     – (scheduled) ngoài giờ phát
            'active'      – đang trong phiên nghe (phát hoặc tạm dừng)
            'ended'       – đã hết chương trình
            'unavailable' – chưa có file audio hoặc file lỗi
     ====================================================================== */
  var Live = {
    views: [],
    audio: null,
    state: 'idle',
    startEpoch: null,     // thời điểm (ms) ứng với giây 0 của chương trình → mốc trực tiếp = now - startEpoch
    duration: Number(LIVE_CFG.durationFallback) || 1380,
    available: null,      // null = chưa biết, true = đọc được file, false = không có/lỗi
    wantPlay: false,
    needsResume: false,
    pendingSeek: null,
    srcSet: false,

    ensureAudio: function () {
      if (this.audio) return this.audio;
      var self = this;
      var a = this.audio = document.createElement('audio');
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () {
        if (isFinite(a.duration) && a.duration > 0) self.duration = a.duration;
        self.available = true;
        if (self.pendingSeek != null) {
          var t = self.state === 'active' ? Math.min(self.pendingSeek, self.edge()) : self.pendingSeek;
          try { a.currentTime = t; } catch (e) { /* bỏ qua */ }
          self.pendingSeek = null;
        }
        if (self.state === 'idle' || self.state === 'waiting') self.state = self.idleState();
        renderTicks(self);
        self.render();
      });
      a.addEventListener('error', function () {
        if (!a.getAttribute('src')) return;
        self.available = false;
        self.wantPlay = false;
        self.needsResume = false;
        if (self.state === 'active') { self.startEpoch = null; self.state = 'unavailable'; }
        else if (self.state === 'idle' || self.state === 'waiting') self.state = self.idleState();
        persist(); updateDock(); self.render();
      });
      a.addEventListener('playing', function () {
        // Chế độ per-viewer: mốc trực tiếp bắt đầu chạy từ lúc âm thanh thực sự phát
        if (self.startEpoch == null) self.startEpoch = Date.now() - a.currentTime * 1000;
        self.needsResume = false;
        activeMode = 'live';
        updateMediaSession(LIVE_CFG.title || 'Trực tiếp', (STATION.name || '') + ' · Trực tiếp');
        persist(); updateDock(); self.render();
      });
      a.addEventListener('play', function () { Replay.pause(); self.render(); });
      a.addEventListener('pause', function () {
        if (!unloading && !a.ended) self.wantPlay = false;
        persist(); self.render();
      });
      a.addEventListener('seeking', function () { self.enforce(); });
      a.addEventListener('timeupdate', function () { self.enforce(); persistSoon(); });
      a.addEventListener('ended', function () { self.onEnded(); });
      return a;
    },

    setSource: function () {
      var a = this.ensureAudio();
      if (this.srcSet) return;
      this.srcSet = true;
      var src = String(LIVE_CFG.audio || '').trim();
      if (!src) { this.available = false; return; }
      a.src = src;
    },

    idleState: function () {
      if (MODE === 'scheduled' && !scheduleWindow(this.duration).onAir) return 'waiting';
      return this.available === false ? 'unavailable' : 'idle';
    },

    /* Mốc trực tiếp (giây) */
    edge: function () {
      if (this.state !== 'active') return 0;
      if (this.startEpoch == null) return Math.max(0, this.position());
      return clamp((Date.now() - this.startEpoch) / 1000, 0, this.duration);
    },
    position: function () {
      if (this.pendingSeek != null) return this.pendingSeek;
      return this.audio ? (this.audio.currentTime || 0) : 0;
    },
    canSeek: function () { return this.state === 'active'; },
    maxSeekable: function () { return this.edge(); },   // không kéo vượt mốc trực tiếp

    /* Lưới an toàn: nếu vị trí phát vượt mốc trực tiếp (do phím tắt, công cụ trình duyệt...) thì kéo lại */
    enforce: function () {
      if (this.state !== 'active' || !this.audio || this.startEpoch == null || this.pendingSeek != null) return;
      var edge = this.edge();
      if (this.audio.currentTime > edge + 1) {
        this.audio.currentTime = Math.max(0, edge - 0.25);
        toast('Đang nghe trực tiếp – không thể tua vượt mốc hiện tại.');
      }
    },

    seekRaw: function (t) {
      var a = this.ensureAudio();
      if (this.available && a.readyState >= 1) {
        try { a.currentTime = t; } catch (e) { /* bỏ qua */ }
        this.pendingSeek = null;
      } else {
        this.pendingSeek = t;
      }
    },

    /* Bấm "Nghe trực tiếp" */
    start: function () {
      this.setSource();
      if (this.available === false) { this.state = 'unavailable'; this.render(); return; }
      if (MODE === 'scheduled') {
        var w = scheduleWindow(this.duration);
        if (!w.onAir) { this.state = 'waiting'; this.render(); return; }
        this.startEpoch = w.start;
        this.state = 'active';
        this.seekRaw(this.edge());
      } else {
        // Như vừa lên sóng: bắt đầu từ giây 0, mốc trực tiếp tính từ lúc âm thanh phát
        this.startEpoch = null;
        this.state = 'active';
        this.seekRaw(0);
      }
      activeMode = 'live';
      this.play();
      updateDock();
    },

    play: function () {
      var self = this, a = this.ensureAudio();
      if (this.state !== 'active') return;
      this.wantPlay = true;
      Replay.pause();
      var p;
      try { p = a.play(); } catch (e) { p = null; }
      if (p && p.catch) {
        p.catch(function (err) {
          if (err && err.name === 'NotAllowedError') { self.needsResume = true; self.render(); updateDock(); }
        });
      }
      this.render();
    },
    pause: function () {
      if (this.audio && !this.audio.paused) this.audio.pause();
      this.wantPlay = false;
      this.render();
    },
    toggle: function () {
      if (this.state === 'idle' || this.state === 'waiting') return this.start();
      if (this.state === 'ended') return this.restart();
      if (this.state !== 'active') return;
      if (this.needsResume) return this.resume();
      if (this.audio.paused) this.play(); else this.pause();
    },
    resume: function () { this.needsResume = false; this.play(); },

    skip: function (d, user) {
      if (this.state !== 'active') return;
      this.seekTo(this.position() + d, user);
    },

    /* Tua tới vị trí t (giây) – luôn bị chặn ở mốc trực tiếp */
    seekTo: function (t, user) {
      if (this.state !== 'active') return this.position();
      var edge = this.edge();
      if (t > edge + 0.05) {
        t = edge;
        if (user) toast('Đây là mốc trực tiếp – không thể tua tới.');
      }
      t = Math.max(0, t);
      this.seekRaw(t);
      this.render();
      persist();
      return t;
    },

    goLive: function () {
      if (this.state !== 'active') return;
      this.seekRaw(Math.max(0, this.edge() - 0.3));
      if (this.audio.paused || this.needsResume) this.resume();
      this.render();
    },

    /* "Nghe lại từ đầu" sau khi chương trình kết thúc */
    restart: function () {
      if (MODE === 'scheduled') {
        // Chế độ phát theo giờ: nghe lại bản đầy đủ, tua tự do
        this.state = this.idleState();
        this.render();
        Replay.open(liveReplayItem(), { position: 0 });
        return;
      }
      this.start();
    },

    onEnded: function () {
      this.wantPlay = false;
      this.needsResume = false;
      this.startEpoch = null;
      this.state = 'ended';
      persist(); updateDock(); this.render();
    },

    /* Nút đóng trên mini-player */
    close: function () {
      this.pause();
      this.startEpoch = null;
      this.needsResume = false;
      this.state = this.idleState();
      if (activeMode === 'live') activeMode = Replay.item ? 'replay' : null;
      persist(); updateDock(); this.render();
    },

    /* Khôi phục phiên đang nghe từ trang trước */
    restore: function (saved, tryAutoplay) {
      this.setSource();
      if (this.available === false) { this.state = 'unavailable'; return; }
      this.startEpoch = typeof saved.startEpoch === 'number' ? saved.startEpoch : null;
      if (MODE === 'scheduled' && this.startEpoch == null) this.startEpoch = scheduleWindow(this.duration).start || null;
      this.state = 'active';
      var pos = Math.max(0, Number(saved.position) || 0);
      if (this.startEpoch != null) pos = Math.min(pos, this.edge());
      this.seekRaw(pos);
      this.wantPlay = !!saved.playing;
      if (tryAutoplay && this.wantPlay) this.play();
    },

    tick: function () {
      if (this.state === 'active') this.enforce();
      if (this.state === 'idle' || this.state === 'waiting' || (this.state === 'unavailable' && MODE === 'scheduled')) {
        var s = this.idleState();
        if (s !== this.state) this.state = s;
      }
      this.render();
    },

    render: function () {
      var self = this;
      var a = this.audio;
      var t = this.position();
      var dur = this.duration || 1;
      var edge = this.state === 'active' ? this.edge() : 0;
      var playing = !!(a && !a.paused && !a.ended);
      var lag = Math.max(0, edge - t);
      var behind = this.state === 'active' && this.startEpoch != null && lag > LAG_SHOW;
      var secIdx = sectionIndexAt(t);
      var win = MODE === 'scheduled' ? scheduleWindow(dur) : null;

      var badge;
      if (this.state === 'ended') badge = ['ĐÃ KẾT THÚC', true];
      else if (this.state === 'waiting') badge = ['CHƯA LÊN SÓNG', true];
      else if (this.state === 'unavailable') badge = ['SẮP LÊN SÓNG', true];
      else badge = ['ĐANG PHÁT TRỰC TIẾP', false];

      this.views.forEach(function (v) {
        var r = v.root;
        if (r.getAttribute('data-state') !== self.state) r.setAttribute('data-state', self.state);
        r.classList.toggle('is-playing', playing);
        r.classList.toggle('is-behind', behind);
        r.classList.toggle('needs-resume', self.needsResume);
        showWhen(r, self.state);
        setPlayBtn(v.play, playing && !self.needsResume, ['Phát', 'Tạm dừng']);
        var shown = v.dragging ? v.dragValue : t;   // đang kéo: hiển thị vị trí đang kéo tới
        if (v.seek) {
          if (String(v.seek.max) !== String(Math.round(dur))) v.seek.max = Math.round(dur);
          v.seek.value = shown;
          v.seek.setAttribute('aria-valuetext', U.fmt(shown) + ' trên ' + U.fmt(dur) + (self.state === 'active' ? ', mốc trực tiếp ' + U.fmt(edge) : ''));
        }
        paintTrack(v.track, shown / dur, edge / dur);
        renderTip(v, shown, dur);
        setText(v.cur, U.fmt(shown));
        setText(v.dur, U.fmt(dur));
        setText(v.lag, behind ? 'Trễ ' + U.fmt(lag) + ' so với trực tiếp' : 'Bạn đang ở mốc trực tiếp');
        if (v.golive) v.golive.hidden = !behind;
        if (v.livepill) {
          v.livepill.classList.toggle('is-behind', behind);
          setText(v.livepill, behind ? 'ĐANG TRỄ' : 'TRỰC TIẾP');
        }
        setText(v.section, secIdx >= 0 ? sectionText(secIdx, r.id === 'live-player') : '');
        if (v.resume) v.resume.hidden = !self.needsResume;
        if (v.badge) v.badge.classList.toggle('is-off', badge[1]);
        setText(v.badgeText, badge[0]);
        if (win && !win.onAir) {
          setText(v.nextTime, win.label + (win.tomorrow ? ' sáng mai' : ''));
          setText(v.countdown, U.fmt(Math.max(0, (win.next - Date.now()) / 1000), true));
        }
      });
      renderChapters(secIdx, edge, t);
    }
  };

  /* Danh sách các phần trong chương trình (bên cạnh player trang chủ) */
  var chaptersEl = null;
  function buildChapters() {
    chaptersEl = document.getElementById('live-chapters');
    if (!chaptersEl) return;
    chaptersEl.innerHTML = SECTIONS.map(function (s, i) {
      return '<li class="chapter" data-i="' + i + '">' +
        '<button type="button" class="chapter__btn" data-chapter="' + i + '">' +
        '<span class="chapter__code">' + U.esc(s.code) + '</span>' +
        '<span class="chapter__body"><strong>' + U.esc(s.name) + ' <span class="chapter__now">· đang phát</span></strong><span>' + U.esc(s.vi || '') + '</span></span>' +
        '<span class="chapter__time">' + U.fmt(s.start) + '</span>' +
        '</button></li>';
    }).join('');
    chaptersEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-chapter]');
      if (!b || b.disabled) return;
      var s = SECTIONS[Number(b.getAttribute('data-chapter'))];
      if (s) { Live.seekTo(s.start + 0.05, true); if (Live.audio && Live.audio.paused) Live.play(); }
    });
  }
  function renderChapters(secIdx, edge, t) {
    if (!chaptersEl) return;
    var active = Live.state === 'active';
    var items = chaptersEl.children;
    for (var i = 0; i < items.length; i++) {
      var s = SECTIONS[i];
      var locked = !active || s.start > edge;
      var li = items[i];
      li.classList.toggle('is-current', active && i === secIdx);
      li.classList.toggle('is-done', active && i < secIdx);
      li.classList.toggle('is-locked', active && locked);
      var btn = li.firstChild;
      if (btn.disabled !== locked) btn.disabled = locked;
      btn.setAttribute('aria-label', s.code + ' ' + s.name + ', bắt đầu ' + U.fmt(s.start) +
        (active && s.start > edge ? ', chưa phát tới' : '') + (active && i === secIdx ? ', đang phát' : ''));
    }
  }

  /* ======================================================================
     TRÌNH PHÁT NGHE LẠI (tua tự do hai chiều)
     ====================================================================== */
  function liveReplayItem() {
    return {
      id: LIVE_REPLAY_ID, title: LIVE_CFG.title || 'Bản tin sáng', tag: 'Bản tin sáng',
      date: '', duration: U.fmt(Live.duration), audio: LIVE_CFG.audio, cover: ''
    };
  }
  function findItem(id) {
    if (id === LIVE_REPLAY_ID) return liveReplayItem();
    for (var i = 0; i < ARCHIVE.length; i++) if (String(ARCHIVE[i].id) === String(id)) return ARCHIVE[i];
    return null;
  }
  function itemIndex(item) {
    for (var i = 0; i < ARCHIVE.length; i++) if (ARCHIVE[i] === item || String(ARCHIVE[i].id) === String(item.id)) return i;
    return 0;
  }

  var Replay = {
    views: [],
    audio: null,
    item: null,
    available: null,
    duration: 0,
    wantPlay: false,
    needsResume: false,
    pendingSeek: null,

    ensureAudio: function () {
      if (this.audio) return this.audio;
      var self = this;
      var a = this.audio = document.createElement('audio');
      a.preload = 'metadata';
      a.addEventListener('loadedmetadata', function () {
        if (isFinite(a.duration) && a.duration > 0) self.duration = a.duration;
        self.available = true;
        if (self.pendingSeek != null) {
          try { a.currentTime = clamp(self.pendingSeek, 0, self.duration); } catch (e) { /* bỏ qua */ }
          self.pendingSeek = null;
        }
        self.render();
      });
      a.addEventListener('error', function () {
        if (!a.getAttribute('src')) return;
        self.available = false; self.wantPlay = false; self.needsResume = false;
        self.render();
      });
      a.addEventListener('play', function () { Live.pause(); self.render(); });
      a.addEventListener('playing', function () {
        self.needsResume = false;
        activeMode = 'replay';
        if (self.item) updateMediaSession(self.item.title, (STATION.name || '') + ' · Nghe lại');
        persist(); updateDock(); self.render();
      });
      a.addEventListener('pause', function () {
        if (!unloading && !a.ended) self.wantPlay = false;
        persist(); self.render();
      });
      a.addEventListener('timeupdate', function () { persistSoon(); self.render(); });
      a.addEventListener('ended', function () { self.wantPlay = false; persist(); self.render(); });
      return a;
    },

    position: function () {
      if (this.pendingSeek != null) return this.pendingSeek;
      return this.audio ? (this.audio.currentTime || 0) : 0;
    },
    canSeek: function () { return !!this.item && this.available !== false && this.duration > 0; },
    maxSeekable: function () { return this.duration || 0; },

    /* Mở một chương trình để nghe lại */
    open: function (idOrItem, opts) {
      opts = opts || {};
      var item = typeof idOrItem === 'object' ? idOrItem : findItem(idOrItem);
      if (!item) return;
      var a = this.ensureAudio();
      if (opts.autoplay !== false) Live.pause();     // player trực tiếp tạm dừng khi nghe lại
      if (!this.item || String(this.item.id) !== String(item.id)) {
        this.item = item;
        this.available = null;
        this.needsResume = false;
        this.duration = U.parseDur(item.duration) || 0;
        this.pendingSeek = Math.max(0, Number(opts.position) || 0);
        var src = String(item.audio || '').trim();
        if (src) a.src = src;
        else { a.removeAttribute('src'); this.available = false; }
        this.views.forEach(function (v) { if (v.cover) v.cover.innerHTML = U.cover(item, itemIndex(item)); });
      }
      activeMode = 'replay';
      updateDock();
      if (opts.autoplay !== false) {
        if (this.available === false) toast('Tập này chưa có file âm thanh.');
        else this.play();
      }
      persist();
      this.render();
    },

    play: function () {
      var self = this;
      if (!this.item || this.available === false) return;
      this.wantPlay = true;
      Live.pause();
      if (this.audio.ended) this.audio.currentTime = 0;
      var p;
      try { p = this.audio.play(); } catch (e) { p = null; }
      if (p && p.catch) {
        p.catch(function (err) {
          if (err && err.name === 'NotAllowedError') { self.needsResume = true; self.render(); }
        });
      }
      this.render();
    },
    pause: function () {
      if (this.audio && !this.audio.paused) this.audio.pause();
      this.wantPlay = false;
      this.render();
    },
    toggle: function () {
      if (!this.item) return;
      if (this.needsResume) return this.resume();
      if (this.audio.paused) this.play(); else this.pause();
    },
    resume: function () { this.needsResume = false; this.play(); },
    start: function () { this.play(); },
    restart: function () { this.seekTo(0); this.play(); },
    skip: function (d) { this.seekTo(this.position() + d); },
    seekTo: function (t) {
      if (!this.item) return 0;
      t = clamp(t, 0, this.duration || 0);
      if (this.audio && this.available && this.audio.readyState >= 1) {
        try { this.audio.currentTime = t; } catch (e) { /* bỏ qua */ }
        this.pendingSeek = null;
      } else {
        this.pendingSeek = t;
      }
      this.render();
      persist();
      return t;
    },
    close: function () {
      this.pause();
      this.item = null;
      this.needsResume = false;
      if (this.audio) { this.audio.removeAttribute('src'); try { this.audio.load(); } catch (e) { /* bỏ qua */ } }
      activeMode = Live.state === 'active' ? 'live' : null;
      persist(); updateDock(); this.render();
    },
    restore: function (saved, tryAutoplay) {
      var item = findItem(saved.id);
      if (!item) return;
      this.open(item, { position: saved.position, autoplay: false });
      this.wantPlay = !!saved.playing;
      if (tryAutoplay && this.wantPlay && this.available !== false) this.play();
    },

    render: function () {
      var self = this;
      var a = this.audio;
      var t = this.position();
      var dur = this.duration || 0;
      var playing = !!(a && this.item && !a.paused && !a.ended);
      var state = !this.item ? 'empty' : (this.available === false ? 'unavailable' : 'ready');
      this.views.forEach(function (v) {
        var r = v.root;
        r.setAttribute('data-state', state);
        r.classList.toggle('is-playing', playing);
        r.classList.toggle('needs-resume', self.needsResume);
        showWhen(r, state);
        setPlayBtn(v.play, playing && !self.needsResume, ['Phát', 'Tạm dừng']);
        var shown = v.dragging ? v.dragValue : t;   // đang kéo: hiển thị vị trí đang kéo tới
        if (v.seek) {
          var max = Math.max(1, Math.round(dur));
          if (String(v.seek.max) !== String(max)) v.seek.max = max;
          v.seek.value = shown;
          v.seek.setAttribute('aria-valuetext', U.fmt(shown) + ' trên ' + U.fmt(dur));
        }
        paintTrack(v.track, dur ? shown / dur : 0, 1);
        renderTip(v, shown, dur);
        setText(v.cur, U.fmt(shown));
        setText(v.dur, U.fmt(dur));
        if (self.item) {
          setText(v.title, self.item.title);
          setText(v.sub, 'Nghe lại' + (self.item.date ? ' · ' + U.fmtDate(self.item.date) : '') + (self.item.tag ? ' · ' + self.item.tag : ''));
        }
        if (v.resume) v.resume.hidden = !self.needsResume;
      });
      // Cập nhật trạng thái các nút "Nghe lại" trên trang
      var btns = document.querySelectorAll('[data-replay-id]');
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        var isCur = !!(this.item && String(b.getAttribute('data-replay-id')) === String(this.item.id));
        var card = b.closest('.ep');
        if (card) { card.classList.toggle('is-active', isCur); card.classList.toggle('is-playing', isCur && playing); }
        var lbl = b.querySelector('.btn__label');
        if (lbl) setText(lbl, isCur && playing ? 'Đang phát' : (isCur ? 'Tiếp tục nghe' : 'Nghe lại'));
        b.setAttribute('aria-pressed', isCur && playing ? 'true' : 'false');
      }
    }
  };

  /* ======================================================================
     MINI-PLAYER (cố định ở đáy trang)
     ====================================================================== */
  var dockLive = null, dockReplay = null;

  function buildDocks() {
    var progressLive =
      '<div class="progress progress--thin" data-role="track">' +
        '<div class="progress__rail"><span class="progress__avail"></span><span class="progress__played"></span></div>' +
        '<div class="progress__ticks" data-role="ticks"></div>' +
        '<span class="progress__edge" aria-hidden="true"></span>' +
        '<input type="range" min="0" max="100" step="1" value="0" data-role="seek" aria-label="Thanh tua chương trình trực tiếp (chỉ tua lùi tới mốc đã phát)">' +
      '</div>';

    dockLive = document.createElement('div');
    dockLive.className = 'dock dock--live';
    dockLive.hidden = true;
    dockLive.setAttribute('role', 'region');
    dockLive.setAttribute('aria-label', 'Trình phát trực tiếp thu nhỏ');
    dockLive.innerHTML =
      '<div class="container dock__bar" data-when="active">' + progressLive + '</div>' +
      '<div class="container dock__row">' +
        '<div class="dock__info">' +
          '<span class="dock__badge"><span class="onair-dot"></span><span class="dock__badge-text">Trực tiếp</span></span>' +
          '<div class="dock__text"><strong>' + U.esc(LIVE_CFG.title || 'Trực tiếp') + '</strong>' +
          '<span data-role="section" data-when="active"></span>' +
          '<span data-when="ended">Chương trình đã kết thúc</span>' +
          '<span data-when="unavailable idle waiting">Chương trình sắp lên sóng</span></div>' +
        '</div>' +
        '<div class="dock__meta" data-when="active"><span><span data-role="cur">00:00</span> / <span data-role="dur">00:00</span></span><span class="lag" data-role="lag"></span></div>' +
        '<div class="dock__controls" data-when="active">' +
          '<button type="button" class="btn btn--live btn--sm" data-role="golive" hidden>Về trực tiếp</button>' +
          '<button type="button" class="ctrl ctrl--sm" data-role="back10" aria-label="Tua lùi 10 giây">' + ICON.back10 + '</button>' +
          '<button type="button" class="ctrl ctrl--play" data-role="play" aria-label="Phát">' + ICON.play + '</button>' +
          '<button type="button" class="btn btn--primary btn--sm dock__resume" data-role="resume" hidden>' + ICON.play + 'Tiếp tục nghe</button>' +
        '</div>' +
        '<a class="btn btn--ghost btn--sm" href="index.html#da-phat" data-when="ended">Nghe chương trình khác</a>' +
        '<button type="button" class="ctrl ctrl--ghost" data-role="close" aria-label="Đóng trình phát">' + ICON.close + '</button>' +
      '</div>';

    dockReplay = document.createElement('div');
    dockReplay.className = 'dock dock--replay';
    dockReplay.hidden = true;
    dockReplay.setAttribute('role', 'region');
    dockReplay.setAttribute('aria-label', 'Trình phát nghe lại');
    dockReplay.innerHTML =
      '<div class="container dock__bar" data-when="ready">' +
        '<div class="progress progress--thin" data-role="track">' +
          '<div class="progress__rail"><span class="progress__played"></span></div>' +
          '<input type="range" min="0" max="100" step="1" value="0" data-role="seek" aria-label="Thanh tua chương trình nghe lại">' +
        '</div>' +
      '</div>' +
      '<div class="container dock__row">' +
        '<div class="dock__info">' +
          '<div class="dock__cover" data-role="cover" aria-hidden="true"></div>' +
          '<div class="dock__text"><strong data-role="title"></strong>' +
          '<span data-role="sub" data-when="ready"></span>' +
          '<span data-when="unavailable">Tập này chưa có file âm thanh – nhóm đang cập nhật.</span></div>' +
        '</div>' +
        '<div class="dock__meta" data-when="ready"><span><span data-role="cur">00:00</span> / <span data-role="dur">00:00</span></span></div>' +
        '<div class="dock__controls" data-when="ready">' +
          '<button type="button" class="ctrl ctrl--sm" data-role="back10" aria-label="Tua lùi 10 giây">' + ICON.back10 + '</button>' +
          '<button type="button" class="ctrl ctrl--play" data-role="play" aria-label="Phát">' + ICON.play + '</button>' +
          '<button type="button" class="ctrl ctrl--sm" data-role="fwd10" aria-label="Tua tới 10 giây">' + ICON.fwd10 + '</button>' +
          '<button type="button" class="btn btn--primary btn--sm dock__resume" data-role="resume" hidden>' + ICON.play + 'Tiếp tục nghe</button>' +
        '</div>' +
        '<button type="button" class="ctrl ctrl--ghost" data-role="close" aria-label="Đóng trình phát nghe lại">' + ICON.close + '</button>' +
      '</div>';

    document.body.appendChild(dockLive);
    document.body.appendChild(dockReplay);
    makeView(dockLive, Live);
    makeView(dockReplay, Replay);
  }

  function updateDock() {
    if (!dockLive) return;
    // Trang chủ đã có player trực tiếp lớn nên không hiện mini-player trực tiếp
    var showLive = !IS_HOME && activeMode === 'live' && (Live.state === 'active' || Live.state === 'ended' || Live.state === 'unavailable');
    var showReplay = activeMode === 'replay' && !!Replay.item;
    if (dockLive.hidden !== !showLive) dockLive.hidden = !showLive;
    if (dockReplay.hidden !== !showReplay) dockReplay.hidden = !showReplay;
    var any = showLive || showReplay;
    document.body.classList.toggle('has-dock', any);
    var h = any ? (showLive ? dockLive : dockReplay).offsetHeight : 0;
    document.documentElement.style.setProperty('--dock-h', h + 'px');
  }

  /* ======================================================================
     TRANG CHỦ: điền chữ vào khối player, gợi ý khi kết thúc
     ====================================================================== */
  function setupHero(hero) {
    function q(r) { return hero.querySelector('[data-role="' + r + '"]'); }
    setText(q('title'), LIVE_CFG.title || 'Bản tin sáng');
    setText(q('topic'), LIVE_CFG.topic || '');
    setText(q('hosts'), LIVE_CFG.hosts || '');
    setText(q('freq'), STATION.frequencyLabel || '');
    setText(q('slot'), 'Bản tin sáng · ' + (LIVE_CFG.slot || '8:00'));
    setText(q('idle-hint'), MODE === 'scheduled'
      ? 'Chương trình đang phát theo giờ. Bấm để vào đúng mốc trực tiếp.'
      : 'Trình duyệt cần bạn bấm để bắt đầu. Chương trình sẽ phát từ đầu, như vừa lên sóng.');
    var restartLabel = q('restart-label');
    if (restartLabel) restartLabel.textContent = 'Nghe lại từ đầu';
    var sug = q('suggest');
    if (sug) {
      sug.innerHTML = '<p class="suggest__title">Có thể bạn muốn nghe</p>' + ARCHIVE.slice(0, 3).map(function (it, i) {
        return '<div class="suggest__item">' +
          '<div class="suggest__cover" aria-hidden="true">' + U.cover(it, i) + '</div>' +
          '<div class="suggest__text"><strong>' + U.esc(it.title) + '</strong><span>' + U.esc(it.tag || '') + ' · ' + U.esc(it.duration || '') + '</span></div>' +
          '<button type="button" class="btn btn--ghost btn--sm" data-replay-id="' + U.esc(it.id) + '" aria-label="Nghe lại ' + U.esc(it.title) + '"><span class="btn__label">Nghe lại</span></button>' +
        '</div>';
      }).join('');
    }
    makeView(hero, Live);
  }

  /* ======================================================================
     PHÍM TẮT & MEDIA SESSION
     ====================================================================== */
  function currentCtrl() {
    if (activeMode === 'replay' && Replay.item) return Replay;
    if (IS_HOME || Live.state === 'active') return Live;
    return null;
  }

  function setupKeys() {
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
      var el = e.target;
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable) return;
      var ctrl = currentCtrl();
      if (!ctrl) return;
      var k = e.key;
      if (k === ' ' || k === 'k' || k === 'K') {
        if (tag === 'button' || tag === 'a') return;
        e.preventDefault(); ctrl.toggle();
      } else if (k === 'ArrowLeft' || k === 'j' || k === 'J') {
        e.preventDefault(); ctrl.skip(-10, true);
      } else if (k === 'ArrowRight' || k === 'l' || k === 'L') {
        // Trực tiếp: tua tới bị chặn ở mốc trực tiếp (seekTo tự kẹp)
        e.preventDefault(); ctrl.skip(10, true);
      }
    });
  }

  function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    function set(action, fn) { try { navigator.mediaSession.setActionHandler(action, fn); } catch (e) { /* bỏ qua */ } }
    set('play', function () { var c = currentCtrl(); if (c) { if (c === Live && c.state !== 'active') c.start(); else c.resume(); } });
    set('pause', function () { var c = currentCtrl(); if (c) c.pause(); });
    set('seekbackward', function () { var c = currentCtrl(); if (c) c.skip(-10, true); });
    set('seekforward', function () { var c = currentCtrl(); if (c) c.skip(10, true); });
    set('seekto', function (d) { var c = currentCtrl(); if (c && d && typeof d.seekTime === 'number') c.seekTo(d.seekTime, true); });
  }

  /* ======================================================================
     KHỞI ĐỘNG
     ====================================================================== */
  function init() {
    buildDocks();

    var hero = document.getElementById('live-player');
    if (hero) {
      setupHero(hero);
      buildChapters();
      Live.setSource();
      Live.state = Live.idleState();
    }

    // Khôi phục trạng thái nghe từ trang trước
    var saved = Store.read();
    if (saved && (!saved.savedAt || Date.now() - saved.savedAt > MAX_AGE)) { Store.clear(); saved = null; }
    if (saved) {
      if (saved.live && saved.live.mode === MODE) Live.restore(saved.live, saved.mode === 'live');
      if (saved.replay) Replay.restore(saved.replay, saved.mode === 'replay');
      activeMode = saved.mode;
      if (activeMode === 'live' && Live.state !== 'active' && Live.state !== 'unavailable') activeMode = Replay.item ? 'replay' : null;
      if (activeMode === 'replay' && !Replay.item) activeMode = Live.state === 'active' ? 'live' : null;
    }

    renderTicks(Live);
    updateDock();
    Live.render();
    Replay.render();

    // Nút "Nghe lại" ở bất kỳ đâu trên trang
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-replay-id]');
      if (!b) return;
      e.preventDefault();
      var id = b.getAttribute('data-replay-id');
      if (Replay.item && String(Replay.item.id) === String(id)) Replay.toggle();
      else Replay.open(id);
    });

    setupKeys();
    setupMediaSession();

    setInterval(function () { Live.tick(); }, 250);
    window.addEventListener('resize', updateDock);

    // Lưu trạng thái trước khi rời trang
    function leave() { unloading = true; persist(); }
    window.addEventListener('pagehide', leave);
    window.addEventListener('beforeunload', leave);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') persist(); });
    // Quay lại bằng nút Back (trang lấy từ bộ nhớ đệm) → tải lại để đồng bộ trạng thái mới nhất
    window.addEventListener('pageshow', function (e) { if (e.persisted) window.location.reload(); });
  }

  // Cho phép xem/điều khiển từ Console khi cần kiểm tra
  window.DTFM_Player = { Live: Live, Replay: Replay, persist: persist, store: Store };

  init();
})();
