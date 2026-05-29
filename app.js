// 医師の初期データ
const defaultDoctors = [
  { name: '佐藤', request: '5/10 不可\n5/20-5/22 休み希望', symbol: 'Aさん' },
  { name: '鈴木', request: '土日休日は休み希望\n5/15 不可', symbol: 'Bさん' },
  { name: '高橋', request: '5/3 夜勤不可\n5/4 休み希望', symbol: 'Cさん' },
  { name: '田中', request: '5/24 不可', symbol: 'Dさん' }
];

// 状態管理
let doctors = JSON.parse(localStorage.getItem('shift_doctors')) || defaultDoctors;

// doctors の各要素に symbol がない場合は自動で割り当てる
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
doctors.forEach((doc, index) => {
  if (!doc.symbol) {
    doc.symbol = alphabet[index % 26] + 'さん';
  }
});

const defaultRules = `平日
- 担当医師: 鈴木、高橋、佐藤の3名
- 割合の目安: 鈴木 (全体の2/5), 佐藤 (全体の2/5), 高橋 (全体の1/5)
- ICU当直: その日に電話待機を「兼任」する。前日および翌日に電話待機を割り当てても【よい】。
- 外科当直: その日に電話待機を「兼任」する。前日および翌日には電話待機を割り当てては【いけない】

土日休日
- 担当医師: 鈴木、佐藤、高橋、田中の4名
- 割合の目安: 4名で概ね均等
- ICU当直/日直: 割当日は電話待機を【必ず兼任】する。前日および翌日に割り当てても【よい】。
- 外科当直/日直: 割当日は電話待機を【必ず兼任】する。前日および翌日には割り当てては【いけない】。
- 連続アサイン: 土日などの連続した休日は、できる限り「同一人物が連続して担当」するように配置すること。田中は必ず連続させる`;

let rules = defaultRules; // 常にデフォルトルールを使用
let year = new Date().getFullYear();
let month = 5;
let customPeriod = '';
let doctorMappings = {}; // 実名 -> 匿名記号

// DOM要素
const doctorListContainer = document.getElementById('doctorList');
const addDoctorBtn = document.getElementById('addDoctorBtn');
const rulesInput = document.getElementById('rulesInput');
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
    updatePrompt(false); // 入力フォーカス維持のためマッピング表は再描画しない
  });

  requestInput.addEventListener('input', (e) => {
    doctors[index].request = e.target.value;
    saveToLocalStorage();
    updatePrompt(false);
  });

  deleteBtn.addEventListener('click', () => {
    doctors.splice(index, 1);
    renderDoctors();
    updatePrompt(true);
  });

  doctorListContainer.appendChild(row);
}

// 医師行の追加
function addDoctorRow() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nextSymbol = alphabet[doctors.length % 26] + 'さん';
  doctors.push({ name: '', request: '', symbol: nextSymbol });
  renderDoctors();
  updatePrompt(true);
}

// 匿名化マッピングの更新
function updateMappings() {
  const activeDoctors = doctors.filter(doc => doc.name.trim() !== '');
  doctorMappings = {};
  mappingBody.innerHTML = '';

  activeDoctors.forEach((doc, index) => {
    doctorMappings[doc.name.trim()] = doc.symbol;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding: 4px;">
        <input type="text" class="mapping-symbol-input" data-index="${doctors.indexOf(doc)}" value="${doc.symbol}" style="width: 100%; background: var(--bg-dark); color: #a7f3d0; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; font-family: inherit;">
      </td>
      <td style="padding: 4px;">
        <input type="text" class="mapping-name-input" data-index="${doctors.indexOf(doc)}" value="${doc.name.trim()}" style="width: 100%; background: var(--bg-dark); color: var(--text-light); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; font-family: inherit;">
      </td>
    `;
    mappingBody.appendChild(tr);
  });

  // マッピング編集時のイベントリスナー登録
  mappingBody.querySelectorAll('.mapping-symbol-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      doctors[idx].symbol = e.target.value;
      saveToLocalStorage();
      
      // マッピングオブジェクトを更新し、プロンプトを再生成（マッピング表は再描画しない）
      doctorMappings[doctors[idx].name.trim()] = e.target.value;
      updatePrompt(false);
    });
  });

  mappingBody.querySelectorAll('.mapping-name-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const idx = parseInt(e.target.dataset.index);
      const oldName = doctors[idx].name;
      const newName = e.target.value;
      
      doctors[idx].name = newName;
      saveToLocalStorage();

      // 左側の医師リストの入力欄も同期
      const docItems = doctorListContainer.querySelectorAll('.doctor-item');
      if (docItems[idx]) {
        docItems[idx].querySelector('.doc-name').value = newName;
      }

      // マッピングオブジェクトを更新
      delete doctorMappings[oldName.trim()];
      doctorMappings[newName.trim()] = doctors[idx].symbol;
      
      updatePrompt(false);
    });
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

// テキストをアノニマイズ（匿名化）する共通関数
function anonymizeText(text, activeDoctors) {
  let result = text;
  const originalNames = ['大野', '服部', '新村', '泉'];
  const replacePairs = [];
  
  // 現在登録されている医師名とシンボルのペアを追加
  activeDoctors.forEach((doc) => {
    if (doc.name.trim()) {
      replacePairs.push({ target: doc.name.trim(), symbol: doc.symbol });
    }
  });
  
  // 初期の医師名とシンボルのペアも追加（インデックスで連動）
  originalNames.forEach((origName, idx) => {
    if (doctors[idx] && doctors[idx].symbol) {
      replacePairs.push({ target: origName, symbol: doctors[idx].symbol });
    }
  });
  
  // 重複を排除し、文字数の長い順にソート（置換の競合を防ぐため）
  const uniquePairs = [];
  const seen = new Set();
  replacePairs.forEach(p => {
    if (!seen.has(p.target)) {
      seen.add(p.target);
      uniquePairs.push(p);
    }
  });
  uniquePairs.sort((a, b) => b.target.length - a.target.length);
  
  // 置換の実行
  uniquePairs.forEach(pair => {
    const regex = new RegExp(escapeRegExp(pair.target), 'g');
    result = result.replace(regex, pair.symbol);
  });
  
  return result;
}

// プロンプトの生成
function updatePrompt(shouldUpdateMappings = true) {
  if (shouldUpdateMappings) {
    updateMappings();
  }
  const activeDoctors = doctors.filter(doc => doc.name.trim() !== '');
  const periodText = customPeriod.trim() !== '' ? customPeriod.trim() : `${year}年${month}月`;

  // 匿名化された医師リストの生成
  const anonymizedDocsList = activeDoctors.map((doc, idx) => {
    const symbol = doc.symbol || `医師${idx + 1}`;
    
    // スケジュール制約のテキストもアノニマイズ
    let requestText = doc.request.trim();
    if (requestText) {
      requestText = anonymizeText(requestText, activeDoctors);
      const bulletedRequest = requestText.split('\n').map(line => `   - ${line.trim()}`).join('\n');
      return `${idx + 1}. ${symbol}:\n${bulletedRequest}`;
    } else {
      return `${idx + 1}. ${symbol}:\n   - 特になし`;
    }
  }).join('\n');

  // ルールの匿名化（プロンプト用）
  let anonymizedRules = rules.trim();
  if (anonymizedRules) {
    anonymizedRules = anonymizeText(anonymizedRules, activeDoctors);
  }

  // ルールの実名プレビュー（画面表示用、匿名化前）
  let previewRules = rules.trim();
  if (previewRules) {
    const originalNames = ['大野', '服部', '新村', '泉'];
    const replacePairs = [];
    
    // 初期の医師名から現在の実名（doctors[idx].name）への置換ペアを作成
    originalNames.forEach((origName, idx) => {
      if (doctors[idx] && doctors[idx].name.trim()) {
        replacePairs.push({ target: origName, replacement: doctors[idx].name.trim() });
      }
    });

    // 競合防止のためターゲットの長い順にソートして置換
    replacePairs.sort((a, b) => b.target.length - a.target.length);
    replacePairs.forEach(pair => {
      const regex = new RegExp(escapeRegExp(pair.target), 'g');
      previewRules = previewRules.replace(regex, pair.replacement);
    });
  }

  // 画面上のルールプレビューエリアには実名版（匿名化前）を表示
  rulesInput.value = previewRules;

  // 基本テンプレート（通常版と統一したプロンプト構成）
  let template = `あなたは医療現場の高度なシフト作成を支援する専門AIアシスタントです。
複雑な制約条件と医師の希望を完全に遵守し、公平でミスのない当番表を作成します。

【各医師のスケジュール制約・希望】
${anonymizedDocsList}

ルール：
${anonymizedRules}

指示：
${periodText}の電話待機当番表を作製して

step1
確定業務と波及制約を整理する
全制約マトリクス（NGまとめ）を整理する

step2
平日の電話待機当番作製

step3
休日の電話待機当番作製

step4
検証と微調整

<output_format>
出力は必ずMarkdown形式で行うこと。
以下の構成で出力してください：
1. ${periodText}全体の電話待機当番表（Markdownテーブル形式：日付、曜日、担当者、付記）。外科当直やICU当直が割り振られている場合はその旨を付記
2. 各個人の担当日数【平日】【土日祝日】【合計】
3. 全制約マトリクス（NGまとめ）
4. 留意事項・コンフリクトの有無についての説明
</output_format>`;

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
