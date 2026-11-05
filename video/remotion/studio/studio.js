// ハコよみ 収録・プレゼンスタジオ フロントエンド ロジック
let cuts = [];
let currentIndex = 0;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordStartTime = 0;
let recordTimerInterval = null;
let currentPlayingAudio = null;

// DOM 要素
const slideStage = document.getElementById("slide-stage");
const slideViewport = document.getElementById("slide-viewport");
const dynamicSlideContent = document.getElementById("dynamic-slide-content");
const scriptText = document.getElementById("script-text");
const scriptSpeakHint = document.getElementById("script-speak-hint");
const scriptTip = document.getElementById("script-tip");
const cutIndicator = document.getElementById("cut-indicator");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnRecord = document.getElementById("btn-record");
const btnRecordLabel = document.getElementById("btn-record-label");
const btnPlayVoice = document.getElementById("btn-play-voice");
const btnPlayTts = document.getElementById("btn-play-tts");
const btnRestoreTts = document.getElementById("btn-restore-tts");
const timeCur = document.getElementById("time-cur");
const timeTarget = document.getElementById("time-target");
const statusBadge = document.getElementById("status-badge");
const progressBarFill = document.getElementById("progress-bar-fill");
const cutListEl = document.getElementById("cut-list");
const recordedCountEl = document.getElementById("recorded-count");
const btnHeaderRender = document.getElementById("btn-header-render");
const btnSidebarRender = document.getElementById("btn-sidebar-render");
const renderModal = document.getElementById("render-modal");
const renderLogs = document.getElementById("render-logs");
const btnCloseModal = document.getElementById("btn-close-modal");

// 1. スライドのリサイズスケール計算 (1920x1080 をアスペクト比維持で最大化)
function resizeSlide() {
  const wrapper = document.getElementById("slide-wrapper");
  const availW = wrapper.clientWidth - 32;
  const availH = wrapper.clientHeight - 32;

  let w = availW;
  let h = w * (9 / 16);

  if (h > availH) {
    h = availH;
    w = h * (16 / 9);
  }

  slideViewport.style.width = `${w}px`;
  slideViewport.style.height = `${h}px`;

  const scale = w / 1920;
  slideStage.style.transform = `scale(${scale})`;
}

window.addEventListener("resize", resizeSlide);

// 2. 初期化・データ取得
async function init() {
  resizeSlide();
  try {
    const res = await fetch("/api/cuts");
    const data = await res.json();
    if (data.ok) {
      cuts = data.cuts;
      renderSidebar();
      loadCut(0);
    } else {
      alert("カットデータの読み込みに失敗しました: " + data.error);
    }
  } catch (err) {
    console.error(err);
    alert("サーバーとの通信に失敗しました。record-studio-server.mjs が起動しているか確認してください。");
  }
}

// 3. サイドバーの描画
function renderSidebar() {
  cutListEl.innerHTML = "";
  let recordedCount = 0;

  cuts.forEach((cut, idx) => {
    if (cut.isUserRecorded) recordedCount++;

    const item = document.createElement("div");
    item.className = `cut-item ${idx === currentIndex ? "active" : ""}`;
    item.innerHTML = `
      <div class="cut-item-left">
        <span class="cut-item-id">${cut.id.toUpperCase()} • ${cut.sceneTitle}</span>
        <span class="cut-item-text">${cut.text}</span>
      </div>
      <div class="cut-item-right">
        <span style="font-size: 11px; color: #94A3B8;">${cut.currentSec ? cut.currentSec + "s" : ""}</span>
        <div class="cut-check ${cut.isUserRecorded ? "recorded" : "tts"}" title="${cut.isUserRecorded ? "あなたの録音" : "お手本TTS"}">
          ${cut.isUserRecorded ? "✓" : "•"}
        </div>
      </div>
    `;
    item.addEventListener("click", () => {
      if (isRecording) stopRecording();
      loadCut(idx);
    });
    cutListEl.appendChild(item);
  });

  recordedCountEl.textContent = `${recordedCount} / ${cuts.length} 録音済`;
}

// 4. カットの読み込み＆スライド描画
function loadCut(index) {
  if (index < 0 || index >= cuts.length) return;
  currentIndex = index;
  const cut = cuts[index];

  // サイドバーのアクティブ切り替え
  document.querySelectorAll(".cut-item").forEach((el, idx) => {
    el.classList.toggle("active", idx === index);
    if (idx === index) el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  // カンペ・原稿
  scriptText.textContent = cut.text;
  scriptSpeakHint.textContent = cut.speak !== cut.text ? `発音・読みガイド: ${cut.speak}` : "";
  scriptTip.textContent = cut.tip ? `💡 ${cut.tip}` : "";

  // インジケーター & 前後ボタン
  cutIndicator.textContent = `${String(index + 1).padStart(2, "0")} / ${cuts.length}`;
  btnPrev.disabled = index === 0;
  btnNext.disabled = index === cuts.length - 1;

  // タイマー表示初期化
  const secToShow = cut.currentSec || cut.targetSec;
  timeCur.textContent = `${secToShow.toFixed(1)}s`;
  timeCur.classList.remove("over");
  timeTarget.textContent = `目標: ${cut.targetSec}s (最大 ${cut.maxSec}s)`;

  // ステータスバッジ
  if (cut.isUserRecorded) {
    statusBadge.className = "status-badge recorded";
    statusBadge.textContent = "録音済み";
  } else {
    statusBadge.className = "status-badge tts";
    statusBadge.textContent = "お手本TTS";
  }

  // プログレスバー
  const pct = Math.min(100, (secToShow / cut.maxSec) * 100);
  progressBarFill.style.width = `${pct}%`;
  progressBarFill.className = `progress-bar-fill ${secToShow > cut.maxSec ? "danger" : secToShow > cut.targetSec ? "warn" : ""}`;

  // 試聴停止
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio = null;
  }

  // スライドの動的描画
  renderSlideContent(cut);
}

// 5. スライド内容の描画（デモ動画・レイアウト連動）
function renderSlideContent(cut) {
  const qrCard = document.getElementById("qr-card");

  // S1 実写ビデオ
  if (cut.slideType === "real-video") {
    qrCard.style.display = "flex";
    const bubbleText = cut.customerBubble || cut.noviceBubble || cut.veteranBubble || "";
    dynamicSlideContent.innerHTML = `
      <video class="s1-stage-video" src="${cut.videoSrc}" autoplay loop muted playsinline></video>
      <div class="speech-bubble-overlay">${bubbleText}</div>
    `;
    return;
  }

  // S1 実写背景
  if (cut.slideType === "real-bg") {
    qrCard.style.display = "flex";
    dynamicSlideContent.innerHTML = `
      <img src="${cut.imageSrc}" class="s1-stage-video" style="object-fit: cover;">
      <div style="position: absolute; inset: 0; background: rgba(11,21,36,0.65);"></div>
      <div class="speech-bubble-overlay">${cut.catchTitle}</div>
    `;
    return;
  }

  // S7 エンディング
  if (cut.slideType === "closing") {
    qrCard.style.display = "flex";
    dynamicSlideContent.innerHTML = `
      <img src="${cut.imageSrc}" class="s7-bg">
      <div class="s7-gradient"></div>
      <div class="s7-content">
        <div class="s7-pill">登録販売者の店頭業務を支える</div>
        <div class="s7-catch">ベテランの知恵を受け継ぐ。 誰もが自信を持って。</div>
        <div class="s7-line"></div>
        <div class="s7-logo-row">
          <svg width="88" height="88" viewBox="0 0 100 100" fill="none">
            <rect width="100" height="100" rx="22" fill="#1E3A5F"/>
            <path d="M50 18L78 34V66L50 82L22 66V34L50 18Z" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round"/>
            <path d="M50 18V82M22 34L50 50L78 34" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>
          </svg>
          <div class="s7-brand-text">ハコよみ</div>
        </div>
        <div class="s7-url-pill">
          <span style="font-weight: 700; color: #93C5FD;">hakoyomi.yutok.dev</span>
          <span style="opacity: 0.45;">|</span>
          <span>github.com/32Lwk/hakoyomi</span>
        </div>
      </div>
    `;
    return;
  }

  // S6 特大インフォグラフィック
  if (cut.slideType === "s6-infographic") {
    qrCard.style.display = "flex";
    dynamicSlideContent.innerHTML = `
      <!-- 左側スマホ枠＆デモ動画 -->
      <div class="phone-mockup">
        <video id="phone-video" src="${cut.videoSrc}" autoplay loop muted playsinline></video>
      </div>

      <!-- 右側特大インフォグラフィック -->
      <div class="slide-panel">
        <div class="section-badge">• 機能 05</div>
        <div class="slide-main-title">ベテランのコツを受け継ぐ</div>

        <div class="problem-solution-banner">
          <div class="prob-box">
            <div class="prob-label">現場の課題</div>
            <div class="prob-text">ベテランの接客ノウハウが個人の頭の中に埋もれ、属人化する</div>
          </div>
          <div class="arrow-icon">➔</div>
          <div class="sol-box">
            <div class="sol-label">ハコよみ</div>
            <div class="sol-text">1つの成分メモ → 全対象商品の最上部へ自動反映</div>
          </div>
        </div>

        <!-- インフォグラフィック本体 -->
        <div style="display: flex; align-items: stretch; gap: 20px; margin-top: 10px;">
          <!-- 左ブロック -->
          <div style="flex: 1.1; background: #F8F9FA; border: 1.5px solid rgba(30,58,95,0.18); border-radius: 14px; padding: 18px 22px;">
            <div style="font-size: 16px; font-weight: 700; color: #1E3A5F; margin-bottom: 8px;">• ベテランが1回入力</div>
            <div style="font-size: 26px; font-weight: 900; color: #1F2933; margin-bottom: 12px;">パブロンでメモ保存</div>
            <div style="background: #FFFFFF; border: 1px solid rgba(30,58,95,0.1); border-radius: 8px; padding: 12px 16px;">
              <div style="font-size: 17px; font-weight: 700; color: #1F2933;">「眠気・運転の予定を先に確認」</div>
              <div style="font-size: 13px; color: #64748B; margin-top: 4px;">成分：ジヒドロコデインリン酸塩</div>
            </div>
          </div>

          <!-- 中央矢印 -->
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 0 4px;">
            <div style="font-size: 32px; color: #1E3A5F; font-weight: 900;">➔</div>
            <span style="font-size: 12px; font-weight: 700; color: #1E3A5F; background: #E8EEF5; padding: 2px 8px; border-radius: 4px; white-space: nowrap;">同一成分を検知</span>
          </div>

          <!-- 右ブロック -->
          <div style="flex: 1.35; background: #EFF6FF; border: 2px solid #3B82F6; border-radius: 14px; padding: 18px 22px; box-shadow: 0 8px 24px rgba(59,130,246,0.15);">
            <div style="font-size: 16px; font-weight: 700; color: #1D4ED8; margin-bottom: 8px;">• 全対象商品の最上部へ自動浮上！</div>
            <div style="font-size: 26px; font-weight: 900; color: #1E3A5F; margin-bottom: 12px;">新ルル・他4商品の全画面へ即時共有</div>
            <div style="background: #FFFFFF; border: 1px solid rgba(59,130,246,0.25); border-radius: 8px; padding: 12px 16px;">
              <div style="font-size: 17px; font-weight: 700; color: #1E3A5F;">「先輩から受け継がれた接客のコツ」</div>
              <div style="font-size: 13px; color: #475569; margin-top: 4px;">同じ成分を含む薬を開いた瞬間、最優先で手元に表示</div>
            </div>
          </div>
        </div>

        <!-- 下部バナー -->
        <div style="margin-top: 20px; background: #1E3A5F; color: #FFFFFF; border-radius: 12px; padding: 14px 24px; display: flex; align-items: center; justify-content: space-between;">
          <div style="font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">属人化を解消。1人が書いた知恵が、店舗全体の資産へ自然継承。</div>
          <div style="background: #2563EB; color: #FFFFFF; font-size: 15px; font-weight: 800; padding: 4px 14px; border-radius: 999px;">新人も安心</div>
        </div>
      </div>
    `;

    // ループ再生時間設定
    setupVideoLoop(cut);
    return;
  }

  // 通常のアプリ画面 (S2, S2b, S3, S4, S5)
  qrCard.style.display = "flex";
  let itemsHtml = "";
  if (cut.items && cut.items.length) {
    itemsHtml = `
      <div class="feature-list">
        ${cut.items
          .map(
            (it, i) => `
          <div class="feature-item ${it.active ? "active" : ""}">
            <div class="item-num">0${i + 1}</div>
            <div class="item-content">
              <div class="item-title-row">
                <span class="item-badge">${it.badge}</span>
                <span class="item-title">${it.title}</span>
              </div>
              <div class="item-desc">${it.desc}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  dynamicSlideContent.innerHTML = `
    <!-- 左側スマホ枠＆デモ動画 -->
    <div class="phone-mockup">
      <video id="phone-video" src="${cut.videoSrc}" autoplay loop muted playsinline></video>
    </div>

    <!-- 右側情報パネル -->
    <div class="slide-panel">
      <div class="section-badge">${cut.sectionBadge}</div>
      <div class="slide-main-title">${cut.slideTitle}</div>

      <div class="problem-solution-banner">
        <div class="prob-box">
          <div class="prob-label">現場の課題</div>
          <div class="prob-text">${cut.problem}</div>
        </div>
        <div class="arrow-icon">➔</div>
        <div class="sol-box">
          <div class="sol-label">ハコよみ</div>
          <div class="sol-text">${cut.solution}</div>
        </div>
      </div>

      ${itemsHtml}
    </div>
  `;

  // デモ動画のループ再生区間設定
  setupVideoLoop(cut);
}

// デモ動画をカットの開始・終了秒に合わせてループさせる
function setupVideoLoop(cut) {
  const vid = document.getElementById("phone-video");
  if (!vid) return;

  const startT = cut.videoStartTime || 0;
  const endT = cut.videoEndTime || vid.duration || 10;

  vid.currentTime = startT;
  vid.play().catch(() => {});

  vid.ontimeupdate = () => {
    if (vid.currentTime >= endT || vid.currentTime < startT) {
      vid.currentTime = startT;
    }
  };
}

// 6. マイク録音機能
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      await saveAudio(blob);
      stream.getTracks().forEach((track) => track.stop());
    };

    mediaRecorder.start();
    isRecording = true;
    recordStartTime = Date.now();

    btnRecord.classList.add("recording");
    btnRecordLabel.textContent = "録音停止";

    const cut = cuts[currentIndex];
    recordTimerInterval = setInterval(() => {
      const elapsed = (Date.now() - recordStartTime) / 1000;
      timeCur.textContent = `${elapsed.toFixed(1)}s`;

      const pct = Math.min(100, (elapsed / cut.maxSec) * 100);
      progressBarFill.style.width = `${pct}%`;

      if (elapsed > cut.maxSec) {
        timeCur.classList.add("over");
        progressBarFill.className = "progress-bar-fill danger";
      } else if (elapsed > cut.targetSec) {
        progressBarFill.className = "progress-bar-fill warn";
      }
    }, 100);
  } catch (err) {
    alert("マイクへのアクセスが許可されていません: " + err.message);
  }
}

function stopRecording() {
  if (!isRecording || !mediaRecorder) return;
  mediaRecorder.stop();
  isRecording = false;
  clearInterval(recordTimerInterval);
  btnRecord.classList.remove("recording");
  btnRecordLabel.textContent = "録音開始";
}

// 7. 音声データの保存（サーバーへ送信）
async function saveAudio(blob) {
  const cut = cuts[currentIndex];
  btnRecordLabel.textContent = "保存・変換中...";

  try {
    const res = await fetch(`/api/save-audio?id=${cut.id}`, {
      method: "POST",
      body: blob,
    });
    const data = await res.json();
    if (data.ok) {
      cut.isUserRecorded = true;
      cut.currentSec = data.durationSec;
      cut.audioUrl = data.audioUrl;

      statusBadge.className = "status-badge recorded";
      statusBadge.textContent = "録音済み";
      timeCur.textContent = `${data.durationSec.toFixed(1)}s`;

      renderSidebar();
      btnRecordLabel.textContent = "録音開始";

      // 録音直後に自動プレビュー再生
      playAudio(cut.audioUrl);
    } else {
      alert("保存に失敗しました: " + data.error);
      btnRecordLabel.textContent = "録音開始";
    }
  } catch (err) {
    alert("通信エラー: " + err.message);
    btnRecordLabel.textContent = "録音開始";
  }
}

// 8. 試聴再生
function playAudio(url) {
  if (currentPlayingAudio) {
    currentPlayingAudio.pause();
    currentPlayingAudio = null;
  }
  const audio = new Audio(url);
  currentPlayingAudio = audio;
  audio.play().catch((err) => console.log("再生エラー:", err));
  audio.onended = () => {
    currentPlayingAudio = null;
  };
}

// 9. お手本TTSに戻す
btnRestoreTts.addEventListener("click", async () => {
  const cut = cuts[currentIndex];
  if (!confirm(`カット「${cut.id}」の音声を、元のお手本TTSに戻しますか？`)) return;

  try {
    const res = await fetch(`/api/restore-tts?id=${cut.id}`, { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      cut.isUserRecorded = false;
      cut.currentSec = cut.ttsSec;
      cut.audioUrl = `/public/narration/${cut.id}.wav?t=${Date.now()}`;
      loadCut(currentIndex);
      renderSidebar();
    } else {
      alert("復元に失敗しました: " + data.error);
    }
  } catch (err) {
    alert("通信エラー: " + err.message);
  }
});

// 10. イベントリスナー
btnPrev.addEventListener("click", () => {
  if (currentIndex > 0) loadCut(currentIndex - 1);
});

btnNext.addEventListener("click", () => {
  if (currentIndex < cuts.length - 1) loadCut(currentIndex + 1);
});

btnRecord.addEventListener("click", () => {
  if (isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
});

btnPlayVoice.addEventListener("click", () => {
  const cut = cuts[currentIndex];
  playAudio(cut.audioUrl);
});

btnPlayTts.addEventListener("click", () => {
  const cut = cuts[currentIndex];
  playAudio(cut.ttsAudioUrl);
});

// キーボードショートカット
window.addEventListener("keydown", (e) => {
  // input等にフォーカスがある時は無効
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  if (e.code === "Space") {
    e.preventDefault();
    if (isRecording) stopRecording();
    else startRecording();
  } else if (e.code === "KeyP") {
    e.preventDefault();
    const cut = cuts[currentIndex];
    playAudio(cut.audioUrl);
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    if (currentIndex > 0) loadCut(currentIndex - 1);
  } else if (e.code === "ArrowRight" || e.code === "Enter") {
    e.preventDefault();
    if (currentIndex < cuts.length - 1) loadCut(currentIndex + 1);
  }
});

// 11. 動画レンダリング機能
async function startVideoRender() {
  if (!confirm("現在の録音データで本番動画（out/main.mp4）をレンダリングしますか？\n（所要時間：約2分）")) return;

  renderModal.style.display = "flex";
  renderLogs.textContent = "レンダリングを開始しています...\n";

  try {
    await fetch("/api/render-video", { method: "POST" });
    pollRenderStatus();
  } catch (err) {
    renderLogs.textContent += "\nエラー: " + err.message;
  }
}

async function pollRenderStatus() {
  const interval = setInterval(async () => {
    try {
      const res = await fetch("/api/render-status");
      const data = await res.json();
      if (data.ok && data.render) {
        if (data.render.logs && data.render.logs.length) {
          renderLogs.textContent = data.render.logs.join("");
          renderLogs.scrollTop = renderLogs.scrollHeight;
        }

        if (data.render.status === "done") {
          clearInterval(interval);
          document.getElementById("render-modal-title").textContent = "🎉 動画レンダリング完了！";
          renderLogs.textContent += "\n\n完了しました！ファイル: out/main.mp4";
        } else if (data.render.status === "error") {
          clearInterval(interval);
          document.getElementById("render-modal-title").textContent = "❌ レンダリングエラー";
          renderLogs.textContent += "\n\nエラーが発生しました。終了コード: " + data.render.code;
        }
      }
    } catch (_) {}
  }, 1000);
}

btnHeaderRender.addEventListener("click", startVideoRender);
btnSidebarRender.addEventListener("click", startVideoRender);
btnCloseModal.addEventListener("click", () => {
  renderModal.style.display = "none";
});

// 起動
init();
