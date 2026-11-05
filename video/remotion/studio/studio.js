// ハコよみ 収録・プレゼンスタジオ フロントエンド ロジック
let cuts = [];
let currentIndex = 0;
let currentPlayingAudio = null;

// 単独カット録音用
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordStartTime = 0;
let recordTimerInterval = null;

// 通し収録モード用
let isContinuousMode = false;
let continuousStream = null;
let continuousRecorder = null;
let continuousChunks = [];
let continuousStartTime = 0;
let continuousCutStartTime = 0;
let continuousSplits = []; // [{ id, startSec, endSec }]
let continuousTimerInterval = null;

// DOM 要素
const slideStage = document.getElementById("slide-stage");
const slideViewport = document.getElementById("slide-viewport");
const dynamicSlideContent = document.getElementById("dynamic-slide-content");
const scriptText = document.getElementById("script-text");
const scriptNextText = document.getElementById("script-next-text");
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
const btnContinuousRecord = document.getElementById("btn-continuous-record");
const btnContinuousLabel = document.getElementById("btn-continuous-label");
const continuousBanner = document.getElementById("continuous-banner");
const continuousTotalTimer = document.getElementById("continuous-total-timer");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownNum = document.getElementById("countdown-num");
const renderModal = document.getElementById("render-modal");
const renderLogs = document.getElementById("render-logs");
const btnCloseModal = document.getElementById("btn-close-modal");

// 原稿編集用 DOM 要素
const scriptRowView = document.getElementById("script-row-view");
const scriptRowEdit = document.getElementById("script-row-edit");
const btnStartEdit = document.getElementById("btn-start-edit");
const inputEditText = document.getElementById("input-edit-text");
const inputEditSpeak = document.getElementById("input-edit-speak");
const btnSaveScript = document.getElementById("btn-save-script");
const btnCancelEdit = document.getElementById("btn-cancel-edit");
const btnResetDefault = document.getElementById("btn-reset-default");
const toastMsg = document.getElementById("toast-msg");

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
      if (isContinuousMode) {
        if (!confirm("通し収録を中断して移動しますか？")) return;
        abortContinuousRecording();
      }
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
  cancelEditScript();
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

  // 次のカットの予告
  if (index < cuts.length - 1) {
    scriptNextText.textContent = cuts[index + 1].text;
    document.getElementById("script-next-preview").style.display = "flex";
  } else {
    document.getElementById("script-next-preview").style.display = "none";
  }

  // インジケーター & 前後ボタン
  cutIndicator.textContent = `${String(index + 1).padStart(2, "0")} / ${cuts.length}`;
  btnPrev.disabled = index === 0;
  btnNext.disabled = index === cuts.length - 1;

  // タイマー表示（通し収録中でなければ保存済み秒数または目標秒数）
  if (!isContinuousMode) {
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
  } else {
    timeTarget.textContent = `目標: ${cut.targetSec}s (最大 ${cut.maxSec}s)`;
    statusBadge.className = "status-badge recorded";
    statusBadge.textContent = "通し収録中";
  }

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

// ==========================================
// 6. 通し収録モード（矢印キーで自分のペースで通し録音）
// ==========================================

async function startContinuousRecording() {
  if (isRecording) stopRecording();

  try {
    continuousStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    alert("マイクへのアクセスが許可されていません: " + err.message);
    return;
  }

  // 3秒カウントダウン
  countdownOverlay.style.display = "flex";
  let count = 3;
  countdownNum.textContent = count;

  const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
      countdownNum.textContent = count;
    } else {
      clearInterval(countInterval);
      countdownOverlay.style.display = "none";
      beginContinuousSession();
    }
  }, 1000);
}

function beginContinuousSession() {
  continuousChunks = [];
  continuousSplits = [];
  continuousRecorder = new MediaRecorder(continuousStream);

  continuousRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) continuousChunks.push(e.data);
  };

  continuousRecorder.onstop = async () => {
    const blob = new Blob(continuousChunks, { type: "audio/webm" });
    continuousStream.getTracks().forEach((track) => track.stop());
    await saveContinuousTake(blob);
  };

  continuousRecorder.start(200);
  isContinuousMode = true;
  continuousStartTime = Date.now();
  continuousCutStartTime = 0;

  // UI 更新
  continuousBanner.style.display = "flex";
  btnContinuousRecord.classList.add("recording-active");
  btnContinuousLabel.textContent = "⏹️ 通し収録を終了・一括保存";

  // カット01から開始
  loadCut(0);

  // タイマー駆動
  let cutTimerStart = Date.now();
  continuousTimerInterval = setInterval(() => {
    const totalElapsed = (Date.now() - continuousStartTime) / 1000;
    const cutElapsed = (Date.now() - cutTimerStart) / 1000;

    // 全体タイマー
    const m = Math.floor(totalElapsed / 60);
    const s = Math.floor(totalElapsed % 60);
    continuousTotalTimer.textContent = `${m}:${String(s).padStart(2, "0")} / 2:51`;

    // 現在のカットタイマー
    timeCur.textContent = `${cutElapsed.toFixed(1)}s`;
    const curCut = cuts[currentIndex];
    const pct = Math.min(100, (cutElapsed / curCut.maxSec) * 100);
    progressBarFill.style.width = `${pct}%`;

    if (cutElapsed > curCut.maxSec) {
      timeCur.classList.add("over");
      progressBarFill.className = "progress-bar-fill danger";
    } else if (cutElapsed > curCut.targetSec) {
      progressBarFill.className = "progress-bar-fill warn";
    } else {
      progressBarFill.className = "progress-bar-fill";
      timeCur.classList.remove("over");
    }
  }, 100);

  // カット移動時に cutTimerStart をリセットするためのフック
  window.__resetCutTimer = () => {
    cutTimerStart = Date.now();
  };
}

// 通し収録中に矢印キー（→）が押された時の処理
function advanceContinuousCut() {
  if (!isContinuousMode) return;

  const currentTotalElapsed = (Date.now() - continuousStartTime) / 1000;
  const curCut = cuts[currentIndex];

  // 現在のカットの区間（startSec, endSec）を記録
  continuousSplits.push({
    id: curCut.id,
    startSec: continuousCutStartTime,
    endSec: currentTotalElapsed,
  });

  // 次のカットの開始秒を更新
  continuousCutStartTime = currentTotalElapsed;

  // もし最後のカットなら終了処理
  if (currentIndex === cuts.length - 1) {
    finishContinuousRecording();
  } else {
    // 次のカットへ進む
    loadCut(currentIndex + 1);
    if (window.__resetCutTimer) window.__resetCutTimer();
  }
}

// 通し収録中に矢印キー（←）が押された時の処理（やり直し）
function rewindContinuousCut() {
  if (!isContinuousMode) return;

  if (currentIndex > 0) {
    // 直前の split 記録を削除
    const lastSplit = continuousSplits.pop();
    const rewindTo = currentIndex - 1;
    // 戻った時点から再度カウント
    continuousCutStartTime = (Date.now() - continuousStartTime) / 1000;
    loadCut(rewindTo);
    if (window.__resetCutTimer) window.__resetCutTimer();
  }
}

// 通し収録の終了
function finishContinuousRecording() {
  if (!isContinuousMode || !continuousRecorder) return;

  const currentTotalElapsed = (Date.now() - continuousStartTime) / 1000;
  // 最後のカットが未記録なら追加
  if (continuousSplits.length <= currentIndex) {
    continuousSplits.push({
      id: cuts[currentIndex].id,
      startSec: continuousCutStartTime,
      endSec: currentTotalElapsed,
    });
  }

  clearInterval(continuousTimerInterval);
  continuousRecorder.stop();
  isContinuousMode = false;

  continuousBanner.style.display = "none";
  btnContinuousRecord.classList.remove("recording-active");
  btnContinuousLabel.textContent = "🎙️ 通し収録スタート (→キーで進行)";
}

function abortContinuousRecording() {
  if (continuousRecorder && continuousRecorder.state === "recording") {
    continuousRecorder.stop();
  }
  if (continuousStream) {
    continuousStream.getTracks().forEach((track) => track.stop());
  }
  clearInterval(continuousTimerInterval);
  isContinuousMode = false;
  continuousBanner.style.display = "none";
  btnContinuousRecord.classList.remove("recording-active");
  btnContinuousLabel.textContent = "🎙️ 通し収録スタート (→キーで進行)";
}

// サーバーに通し音声と各カットの区間（splits）を送信して一括スライス
async function saveContinuousTake(blob) {
  renderModal.style.display = "flex";
  document.getElementById("render-modal-title").textContent = "🎙️ 通し音声の分割・自動マスタリング中...";
  renderLogs.textContent = `全${continuousSplits.length}カットの音声を処理しています...\n・前後の無音自動トリミング\n・息吸い込み・うっ音の自動カット\n・声の輪郭クリア化（イコライザー＆コンプレッサー）\n・動画尺（シーン枠）の自動最適化\n\nしばらくお待ちください...\n`;

  try {
    const res = await fetch("/api/save-continuous-take", {
      method: "POST",
      headers: {
        "x-splits": encodeURIComponent(JSON.stringify(continuousSplits)),
      },
      body: blob,
    });

    const data = await res.json();
    if (data.ok) {
      renderLogs.textContent += `\n🎉 全${data.cuts.length}カットのクリーンアップ＆マスタリングが完了しました！\nマスター音声尺: ${data.masterDuration}秒\n最適化後の動画総尺: ${data.totalDuration}秒（180秒以内 厳守クリア）\n\n`;
      data.cuts.forEach((c) => {
        renderLogs.textContent += `✓ ${c.id}: ${c.durationSec}s (区間 ${c.startSec.toFixed(1)}s - ${c.endSec.toFixed(1)}s)\n`;
      });

      // cuts 配列のステータスを一括更新
      data.cuts.forEach((sc) => {
        const found = cuts.find((c) => c.id === sc.id);
        if (found) {
          found.isUserRecorded = true;
          found.currentSec = sc.durationSec;
          found.audioUrl = sc.audioUrl;
        }
      });

      renderSidebar();
      loadCut(0);
      document.getElementById("render-modal-title").textContent = "🎉 通し収録＆タイムライン最適化が完了しました！";
    } else {
      renderLogs.textContent += `\n❌ エラーが発生しました: ${data.error}`;
      document.getElementById("render-modal-title").textContent = "保存エラー";
    }
  } catch (err) {
    renderLogs.textContent += `\n❌ 通信エラー: ${err.message}`;
  }
}

// ==========================================
// 7. 単独カット録音機能（撮り直し・ピンポイント録音）
// ==========================================

async function startRecording() {
  if (isContinuousMode) return;

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

// 単独音声データの保存
async function saveAudio(blob) {
  const cut = cuts[currentIndex];
  btnRecordLabel.textContent = "保存中...";

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
  if (isContinuousMode) rewindContinuousCut();
  else if (currentIndex > 0) loadCut(currentIndex - 1);
});

btnNext.addEventListener("click", () => {
  if (isContinuousMode) advanceContinuousCut();
  else if (currentIndex < cuts.length - 1) loadCut(currentIndex + 1);
});

btnRecord.addEventListener("click", () => {
  if (isContinuousMode) return;
  if (isRecording) stopRecording();
  else startRecording();
});

btnContinuousRecord.addEventListener("click", () => {
  if (isContinuousMode) finishContinuousRecording();
  else startContinuousRecording();
});

btnPlayVoice.addEventListener("click", () => {
  const cut = cuts[currentIndex];
  playAudio(cut.audioUrl);
});

btnPlayTts.addEventListener("click", () => {
  const cut = cuts[currentIndex];
  playAudio(cut.ttsAudioUrl);
});

// ==========================================
// 10. 原稿編集機能（インライン編集＆動画字幕同期）
// ==========================================

function showToast(text, duration = 2500) {
  if (!toastMsg) return;
  toastMsg.textContent = text;
  toastMsg.style.display = "block";
  toastMsg.style.opacity = "1";
  setTimeout(() => {
    toastMsg.style.opacity = "0";
    setTimeout(() => {
      toastMsg.style.display = "none";
    }, 300);
  }, duration);
}

function startEditScript() {
  if (isRecording || isContinuousMode) return;
  const cut = cuts[currentIndex];
  inputEditText.value = cut.text;
  inputEditSpeak.value = cut.speak || "";
  scriptRowView.style.display = "none";
  scriptRowEdit.style.display = "flex";
  inputEditText.focus();
  inputEditText.select();
}

function cancelEditScript() {
  if (scriptRowEdit) scriptRowEdit.style.display = "none";
  if (scriptRowView) scriptRowView.style.display = "flex";
}

async function saveEditScript() {
  const cut = cuts[currentIndex];
  const newText = inputEditText.value.trim();
  const newSpeak = inputEditSpeak.value.trim() || newText;

  if (!newText) {
    alert("原稿テキストを入力してください");
    return;
  }

  btnSaveScript.disabled = true;
  btnSaveScript.textContent = "保存中...";

  try {
    const res = await fetch("/api/update-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: cut.id,
        text: newText,
        speak: newSpeak,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      cut.text = newText;
      cut.speak = newSpeak;

      if (cut.customerBubble) cut.customerBubble = newText;
      if (cut.noviceBubble) cut.noviceBubble = `新人「${newText}」`;
      if (cut.veteranBubble) cut.veteranBubble = `ベテラン「${newText}」`;
      if (cut.catchTitle) cut.catchTitle = newText;

      loadCut(currentIndex);
      renderSidebar();
      cancelEditScript();
      showToast("✓ 原稿を更新しました（動画字幕にも反映済）");
    } else {
      alert("保存に失敗しました: " + data.error);
    }
  } catch (err) {
    alert("通信エラー: " + err.message);
  } finally {
    btnSaveScript.disabled = false;
    btnSaveScript.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> 保存して反映`;
  }
}

async function resetDefaultScript() {
  const cut = cuts[currentIndex];
  if (!confirm(`カット「${cut.id}」の原稿を初期値に戻しますか？`)) return;

  try {
    const res = await fetch("/api/reset-script", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: cut.id }),
    });

    const data = await res.json();
    if (data.ok && data.cut) {
      Object.assign(cut, data.cut);
      loadCut(currentIndex);
      renderSidebar();
      cancelEditScript();
      showToast("✓ 初期原稿に戻しました（動画字幕にも反映済）");
    } else {
      alert("リセットに失敗しました: " + (data.error || ""));
    }
  } catch (err) {
    alert("通信エラー: " + err.message);
  }
}

// 編集イベント登録
scriptText.addEventListener("click", startEditScript);
btnStartEdit.addEventListener("click", startEditScript);
btnSaveScript.addEventListener("click", saveEditScript);
btnCancelEdit.addEventListener("click", cancelEditScript);
btnResetDefault.addEventListener("click", resetDefaultScript);

// キーボードショートカット
window.addEventListener("keydown", (e) => {
  // 原稿編集ボックス内のキー操作
  if (scriptRowEdit && scriptRowEdit.style.display !== "none") {
    if ((e.metaKey || e.ctrlKey) && e.code === "Enter") {
      e.preventDefault();
      saveEditScript();
      return;
    } else if (e.code === "Escape") {
      e.preventDefault();
      cancelEditScript();
      return;
    }
  }

  // input等にフォーカスがある時は通常のショートカットは無効
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

  // 通し収録中
  if (isContinuousMode) {
    if (e.code === "ArrowRight" || e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      advanceContinuousCut();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      rewindContinuousCut();
    } else if (e.code === "Escape") {
      e.preventDefault();
      abortContinuousRecording();
    }
    return;
  }

  // 通常モード
  if (e.code === "Space" && e.shiftKey) {
    e.preventDefault();
    startContinuousRecording();
  } else if (e.code === "Space") {
    e.preventDefault();
    if (isRecording) stopRecording();
    else startRecording();
  } else if (e.code === "KeyP") {
    e.preventDefault();
    const cut = cuts[currentIndex];
    playAudio(cut.audioUrl);
  } else if (e.code === "KeyE") {
    e.preventDefault();
    startEditScript();
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
  document.getElementById("render-modal-title").textContent = "動画レンダリング中...";
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
