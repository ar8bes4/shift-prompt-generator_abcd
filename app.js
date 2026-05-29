// 医師の初期データ
const defaultDoctors = [
  { name: '大野', request: '5/10 不可\n5/20-5/22 休み希望' },
  { name: '服部', request: '土日休日は休み希望\n5/15 不可' },
  { name: '新村', request: '5/3 夜勤不可\n5/4 休み希望' },
  { name: '泉', request: '5/24 不可' }
];

// 状態管理
let doctors = JSON.parse(localStorage.getItem('shift_doctors')) || defaultDoctors;
let year = new Date().getFullYear();
let month = 5;
let customPeriod = '';
let doctorMappings = {}; // 実名 -> 匿名記号

// DOM要素
const doctorListContainer = document.getElementById('doctorList');
const addDoctorBtn = document.getElementById('addDoctorBtn');
const yearSelect = document.getElementById('yearSelect');
const monthSelect = document.getElementById('monthSelect');
const customPeriodInput = document.getElementById('customPeriodInput');
const promptOutput = document.getElementById('promptOutput');
const copyBtn = document.getElementById('copyBtn');
const copyBadge = document.getElementById('copyBadge');
const mappingBody = document.getElementById('mappingBody');
const decodeInput = document.getElementById('decodeInput');
const decodeBtn = document.getElementById('decodeBtn');
const decodeOutput = document.getElementById('decodeOutput');

// 初期設定
function init() {
  // 年月のセレクトボックス初期化
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = '';
  for (let y = currentYear - 2; y <= currentYear + 3; y++) {
    const option = document.createElement('option');
    option.value = y;
    option.textContent = y;
    if (y === year) option.selected = true;
    yearSelect.appendChild(option);
  }

  monthSelect.value = month;

  // イベントリスナーの登録
  addDoctorBtn.addEventListener('click', addDoctorRow);
  yearSelect.addEventListener('change', (e) => { year = parseInt(e.target.value); updatePrompt(); });
  monthSelect.addEventListener('change', (e) => { month = parseInt(e.target.value); updatePrompt(); });
  customPeriodInput.addEventListener('input', (e) => { customPeriod = e.target.value; updatePrompt(); });
  copyBtn.addEventListener('click', copyPromptToClipboard);
  decodeBtn.addEventListener('click', runDecode);

  // 医師リストの描画
  renderDoctors();
  updatePrompt();
}

// 医師リストを UI に描画
function renderDoctors() {
  doctorListContainer.innerHTML = '';
  doctors.forEach((doc, index) => {
    createDoctorRow(doc.name, doc.request, index);
  });
  saveToLocalStorage();
}

// 医師行の作成
function createDoctorRow(name, request, index) {
  const row = document.createElement('div');
  row.className = 'doctor-item';
  row.innerHTML = `
    <input type="text" class="doc-name" placeholder="氏名" value="${name}" style="flex: 1;">
    <textarea class="doc-request" placeholder="スケジュール希望・制約 (改行で複数)" style="flex: 2; height: 38px; min-height: 38px; resize: vertical;">${request}</textarea>
    <button class="btn btn-danger btn-icon btn-small delete-btn" title="削除">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
    </button>
  `;

  // イベントリスナー
  const nameInput = row.querySelector('.doc-name');
  const requestInput = row.querySelector('.doc-request');
  const deleteBtn = row.querySelector('.delete-btn');

  nameInput.addEventListener('input', (e) => {
    doctors[index].name = e.target.value;
    saveToLocalStorage();
    updateMappings();
    updatePrompt();
  });

  requestInput.addEventListener('input', (e) => {
    doctors[index].request = e.target.value;
    saveToLocalStorage();
    updatePrompt();
  });

  deleteBtn.addEventListener('click', () => {
    doctors.splice(index, 1);
    renderDoctors();
    updateMappings();
    updatePrompt();
  });

  doctorListContainer.appendChild(row);
}

// 医師行の追加
function addDoctorRow() {
  doctors.push({ name: '', request: '' });
  renderDoctors();
  updateMappings();
  updatePrompt();
}

// 匿名化マッピングの更新
function updateMappings() {
  const activeDoctors = doctors.filter(doc => doc.name.trim() !== '');
  doctorMappings = {};
  mappingBody.innerHTML = '';

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  activeDoctors.forEach((doc, index) => {
    // Aさん, Bさん, Cさん の形式で匿名記号を割り当てる
    const symbol = alphabet[index % 26] + 'さん';
    doctorMappings[doc.name.trim()] = symbol;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight: 500; color: #a7f3d0;">${symbol}</td>
      <td style="color: var(--text-muted);">${doc.name.trim()}</td>
    `;
    mappingBody.appendChild(tr);
  });

  if (activeDoctors.length === 0) {
    mappingBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted);">医師が登録されていません</td></tr>`;
  }
}

// ローカルストレージに保存
function saveToLocalStorage() {
  localStorage.setItem('shift_doctors', JSON.stringify(doctors));
}

// 正規表現用エスケープ
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// プロンプトの生成
function updatePrompt() {
  const activeDoctors = doctors.filter(doc => doc.name.trim() !== '');
  updateMappings();

  const periodText = customPeriod.trim() !== '' ? customPeriod.trim() : `${year}年${month}月`;

  // 匿名化された医師リストの生成
  const anonymizedDocsList = activeDoctors.map((doc, idx) => {
    const symbol = doctorMappings[doc.name.trim()] || `医師${idx + 1}`;
    
    // スケジュール制約のテキストもアノニマイズ
    let requestText = doc.request.trim();
    if (requestText) {
      activeDoctors.forEach(d => {
        const s = doctorMappings[d.name.trim()];
        const regex = new RegExp(escapeRegExp(d.name.trim()), 'g');
        requestText = requestText.replace(regex, s);
      });
      const bulletedRequest = requestText.split('\n').map(line => `   - ${line.trim()}`).join('\n');
      return `${idx + 1}. ${symbol}:\n${bulletedRequest}`;
    } else {
      return `${idx + 1}. ${symbol}:\n   - 特になし`;
    }
  }).join('\n');

  // 担当者名の置換用リスト（プロンプト中のテンプレート置換用）
  const symbolA = doctorMappings['大野'] || '担当者Aさん';
  const symbolB = doctorMappings['服部'] || '担当者Bさん';
  const symbolC = doctorMappings['新村'] || '担当者Cさん';
  const symbolD = doctorMappings['泉'] || '担当者Dさん';

  // 基本テンプレート
  let template = `あなたは医療現場の高度なシフト作成を支援する専門AIアシスタントです。
以下の制約条件とスタッフの希望に基づき、最適な当番表（シフト表）を作成してください。

### 【作成対象】
* 対象期間: ${periodText}
* 役割の種類:
  - 当直 (夜間の緊急対応、主担当)
  - 日直 (日中の休日対応)
  - 備考 (待機、その他の支援業務)

### 【当番メンバー（アノニマイズ済）】
${anonymizedDocsList}

### 【全体ルールおよび制約条件】
1. 当番の均等割り当て:
   - 全体の「当直」および「日直」の割り当て回数が、可能な限りメンバー間で均等になるように配分してください。
2. 連続勤務の禁止:
   - 「当直」の翌日に「当直」または「日直」を割り当てることは禁止します（翌日は原則明け）。
3. 休日の特別ルール:
   - 土曜日・日曜日・祝日の「日直」と「当直」は、セットでアサインするか、別々にアサインするかを希望リストに沿って決定してください。

### 【標準的なシフトパターン例（参考）】
* 平日当番:
  - 担当医師: ${symbolB}、${symbolC}、${symbolA} の3名
  - 割合の目安: ${symbolB} (全体の2/5), ${symbolA} (全体の2/5), ${symbolC} (全体の1/5)
* 土日休日当番:
  - 担当医師: ${symbolB}、${symbolA}、${symbolC}、${symbolD} の4名
  - 割合の目安: 4名で概ね均等
  - 連続アサイン: 土日などの連続した休日は、できる限り「同一人物が連続して担当」するように配置すること。${symbolD}は必ず連続させる。

### 【出力フォーマット】
以下の構成で出力してください。
1. **月間カレンダー形式のシフト一覧** (日付、曜日、当直、日直、備考)
2. **各メンバーの合計担当回数集計表** (当直、日直のそれぞれの合計)
3. **制約条件がどのように遵守されたかの簡単な説明**

プロンプトは以上です。最適なシフトを作成してください。`;

  promptOutput.value = template;
}

// クリップボードにプロンプトをコピー
function copyPromptToClipboard() {
  promptOutput.select();
  navigator.clipboard.writeText(promptOutput.value).then(() => {
    copyBadge.style.display = 'block';
    setTimeout(() => {
      copyBadge.style.display = 'none';
    }, 2000);
  }).catch(err => {
    alert('コピーに失敗しました: ' + err);
  });
}

// 逆変換（デコード）の実行
function runDecode() {
  let text = decodeInput.value;
  if (!text.trim()) {
    decodeOutput.textContent = '逆変換するテキストを入力してください。';
    return;
  }

  // 匿名記号 -> 実名 のマッピングで置換
  // 置換の競合を防ぐため、文字列の長い順にソートして置換する
  const reverseMappings = Object.entries(doctorMappings).map(([name, symbol]) => ({ name, symbol }));
  reverseMappings.sort((a, b) => b.symbol.length - a.symbol.length);

  reverseMappings.forEach(mapping => {
    const regex = new RegExp(escapeRegExp(mapping.symbol), 'g');
    text = text.replace(regex, `${mapping.name}`);
  });

  decodeOutput.textContent = text;
}

// 起動
window.addEventListener('DOMContentLoaded', init);
