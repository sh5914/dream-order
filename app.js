// ==========================================
// 1. Firebaseの設定（あなたの暗号キーを埋め込み済み）
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBfEa4WGw9icggORrj1z5GIEw4nlwMoB7o",
    authDomain: "draft-maker-e8f7b.firebaseapp.com",
    projectId: "draft-maker-e8f7b",
    storageBucket: "draft-maker-e8f7b.firebasestorage.app",
    messagingSenderId: "509382175409",
    appId: "1:509382175409:web:9e5787c889b1f0c4465090",
    measurementId: "G-ZBLZ9P2KWC"
};

// Firebaseの初期化
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// ==========================================
// 2. ゲームの基本設定
// ==========================================
const landingPage = document.getElementById('landingPage');
const gameScreen = document.getElementById('gameScreen');
const teamZone = document.getElementById('teamZone'); 
const boardTitle = document.getElementById('boardTitle'); 
const startGameBtn = document.getElementById('startGameBtn');
const startPracticeBtn = document.getElementById('startPracticeBtn');
const practiceBadge = document.getElementById('practiceBadge');
const resetGameBtn = document.getElementById('resetGameBtn'); 

// ▼ 追加：タイトル画面でのランキングボタン類 ▼
const viewRankingBtn = document.getElementById('viewRankingBtn');
const titleRankingScreen = document.getElementById('titleRankingScreen');
const backToTitleBtn = document.getElementById('backToTitleBtn');
const titleRankingList = document.getElementById('titleRankingList');
const titleTabDiffBtn = document.getElementById('titleTabDiffBtn');
const titleTabHrBtn = document.getElementById('titleTabHrBtn');

const playerList = document.getElementById('playerList');
const board = document.getElementById('board');
const resultZone = document.getElementById('resultZone');
const resultBtn = document.getElementById('resultBtn');
const hrResult = document.getElementById('hrResult');
const totalHrValue = document.getElementById('totalHrValue');
const resultTitle = document.getElementById('resultTitle');
const optimalSummary = document.getElementById('optimalSummary'); 
const roundText = document.getElementById('roundText');
const randomTeamText = document.getElementById('randomTeamText');
const draftZone = document.getElementById('draftZone');
const redrawBtn = document.getElementById('redrawBtn');

const shareControls = document.getElementById('shareControls');
const saveImgBtn = document.getElementById('saveImgBtn');
const copyImgBtn = document.getElementById('copyImgBtn');
const retryBtn = document.getElementById('retryBtn');
const captureArea = document.getElementById('captureArea'); 

// 結果画面ランキング用
const rankingZone = document.getElementById('rankingZone');
const rankingInputArea = document.getElementById('rankingInputArea');
const submitScoreBtn = document.getElementById('submitScoreBtn');
const playerNameInput = document.getElementById('playerNameInput');
const rankingList = document.getElementById('rankingList');
const tabDiffBtn = document.getElementById('tabDiffBtn');
const tabHrBtn = document.getElementById('tabHrBtn');

let allData = {}; 
let isPracticeMode = false; 
let usedTeams = []; 
let seenTeamsHistory = []; 

let currentDiff = 0;   
let currentTotalHr = 0; 
let currentRankTab = 'diff'; 
let titleRankTab = 'diff'; // タイトル画面用のタブ状態

const POSITIONS = ["捕手", "一塁手", "二塁手", "三塁手", "遊撃手", "左翼手", "中堅手", "右翼手", "DH"];
const TEAM_ABBR = {
    "広島": "広", "巨人": "巨", "阪神": "神", "DeNA": "De", "ヤクルト": "ヤ", "中日": "中",
    "ソフトバンク": "ソ", "日本ハム": "日", "ロッテ": "ロ", "西武": "西", "オリックス": "オ", "楽天": "楽"
};

let myTeam = { "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null, "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null };
let currentRound = 1;
const MAX_ROUNDS = 9;
let redrawsLeft = 1; 
let currentRandomYear = "";
let currentRandomTeam = "";

async function loadData() {
    try {
        const response = await fetch('all_teams_2016_2024.json');
        allData = await response.json();
        createBoardSlots();
        startGameBtn.textContent = "本番ドラフトを開始";
        startGameBtn.disabled = false;
        startPracticeBtn.textContent = "練習モードで開始";
        startPracticeBtn.disabled = false;
    } catch (error) {
        alert("データ読み込み失敗");
    }
}

// ==========================================
// ▼ 追加：タイトル画面でのランキング表示制御 ▼
// ==========================================
viewRankingBtn.addEventListener('click', () => {
    landingPage.style.display = 'none';
    titleRankingScreen.style.display = 'block';
    
    // 開いたときに差分タブを初期選択して読み込む
    titleRankTab = 'diff';
    titleTabDiffBtn.classList.add('active');
    titleTabHrBtn.classList.remove('active');
    loadTitleRankings();
});

backToTitleBtn.addEventListener('click', () => {
    titleRankingScreen.style.display = 'none';
    landingPage.style.display = 'block';
});

window.switchTitleRankTab = function(tabType) {
    if (titleRankTab === tabType) return;
    titleRankTab = tabType;
    
    if (titleRankTab === 'diff') {
        titleTabDiffBtn.classList.add('active');
        titleTabHrBtn.classList.remove('active');
    } else {
        titleTabHrBtn.classList.add('active');
        titleTabDiffBtn.classList.remove('active');
    }
    loadTitleRankings();
}

async function loadTitleRankings() {
    titleRankingList.innerHTML = "<p style='text-align:center; color:#aaa; margin-top:30px;'>リーダーボードを読み込み中...</p>";
    try {
        let query;
        let scoreHeader = "";
        
        if (titleRankTab === 'diff') {
            query = db.collection("rankings").orderBy("diff", "asc").orderBy("timestamp", "asc");
            scoreHeader = "理論値との差";
        } else {
            query = db.collection("rankings").orderBy("totalHr", "desc").orderBy("timestamp", "asc");
            scoreHeader = "合計HR数";
        }

        const snapshot = await query.limit(10).get();

        let html = `<table class="ranking-table" style="font-size: 18px;">
                        <tr><th>順位</th><th>監督名</th><th>${scoreHeader}</th></tr>`;
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            let rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
            let scoreText = titleRankTab === 'diff' ? `-${data.diff}本` : `${data.totalHr}本`;
            
            html += `<tr>
                <td class="${rankClass}" style="text-align:center; padding: 12px;">${rank}位</td>
                <td style="padding: 12px;">${data.name}</td>
                <td style="text-align:center; color:#f1c40f; font-weight:bold; padding: 12px;">${scoreText}</td>
            </tr>`;
            rank++;
        });
        html += `</table>`;
        
        if (snapshot.empty) {
            html = "<p style='color:#aaa; text-align:center; margin-top:30px;'>まだデータがありません。</p>";
        }
        titleRankingList.innerHTML = html;
        
    } catch(e) {
        console.error(e);
        titleRankingList.innerHTML = "<p style='color:#ff6b6b; text-align:center; margin-top:30px;'>ランキングの取得に失敗しました。</p>";
    }
}
// ==========================================

startGameBtn.addEventListener('click', () => {
    isPracticeMode = false; 
    practiceBadge.style.display = 'none'; 
    resetGameBtn.style.display = 'none'; 
    landingPage.style.display = 'none';
    draftZone.style.display = 'block'; 
    gameScreen.style.display = 'block';
    usedTeams = []; seenTeamsHistory = []; 
    startNextRound();
});

startPracticeBtn.addEventListener('click', () => {
    isPracticeMode = true; 
    practiceBadge.style.display = 'inline-block'; 
    resetGameBtn.style.display = 'block'; 
    landingPage.style.display = 'none';
    draftZone.style.display = 'block'; 
    gameScreen.style.display = 'block';
    usedTeams = []; seenTeamsHistory = []; 
    startNextRound();
});

resetGameBtn.addEventListener('click', () => {
    if (confirm("ドラフトを最初からやり直しますか？")) {
        retryGame(); 
    }
});

function createBoardSlots() {
    board.innerHTML = '';
    teamZone.classList.remove('expanded');
    boardTitle.textContent = "【獲得選手】";
    POSITIONS.forEach(pos => {
        const div = document.createElement('div');
        div.className = 'position-slot';
        div.id = `slot-${pos}`;
        div.innerHTML = `
            <span class="slot-title">${pos}</span>
            <span class="slot-player" id="player-user-${pos}">未指名</span>
            <span class="slot-best" id="player-best-${pos}">--</span>
        `;
        board.appendChild(div);
    });
}

function rollTeam() {
    const years = Object.keys(allData);
    while (true) {
        let tempYear = years[Math.floor(Math.random() * years.length)];
        const teams = Object.keys(allData[tempYear]);
        let tempTeam = teams[Math.floor(Math.random() * teams.length)];
        let comboKey = `${tempYear}_${tempTeam}`;
        if (!usedTeams.includes(comboKey)) {
            currentRandomYear = tempYear;
            currentRandomTeam = tempTeam;
            usedTeams.push(comboKey); 
            seenTeamsHistory.push({ year: tempYear, team: tempTeam, players: allData[tempYear][tempTeam] });
            break;
        }
    }
    randomTeamText.textContent = `${currentRandomYear}年 ${currentRandomTeam}`;
    displayPlayers();
}

window.startNextRound = function() {
    if (currentRound > MAX_ROUNDS) {
        draftZone.style.display = 'none'; 
        resultZone.style.display = 'block'; 
        return;
    }
    roundText.textContent = `第 ${currentRound} 巡 選択希望選手`;
    rollTeam();
}

window.useRedraw = function() {
    if (redrawsLeft > 0) {
        redrawsLeft--; 
        redrawBtn.textContent = "引き直し完了（残り0回）";
        redrawBtn.disabled = true;
        rollTeam(); 
    }
}

window.skipRound = function() {
    currentRound++;
    startNextRound();
}

function displayPlayers() {
    playerList.innerHTML = '';
    const players = allData[currentRandomYear][currentRandomTeam];
    if (!players) return;
    let anyoneCanBeDrafted = false; 
    players.forEach(player => {
        const isAlreadyDrafted = Object.values(myTeam).some(p => p && p.name === player.name && p.year === currentRandomYear);
        if (isAlreadyDrafted) return;
        const div = document.createElement('div');
        div.className = 'player-card';
        const posText = player.positions.join('、');
        let buttonsHtml = '';
        let hasAvailableSlot = false;
        player.positions.forEach(pos => {
            if (myTeam[pos] === null) {
                buttonsHtml += `<button class="draft-btn" onclick="draftPlayer('${player.name}', ${player.hr}, '${pos}')">${pos}で指名</button>`;
                hasAvailableSlot = true; anyoneCanBeDrafted = true;
            }
        });
        if (myTeam["DH"] === null) {
            buttonsHtml += `<button class="draft-btn dh-btn" onclick="draftPlayer('${player.name}', ${player.hr}, 'DH')">DHで指名</button>`;
            hasAvailableSlot = true; anyoneCanBeDrafted = true;
        }
        if (!hasAvailableSlot) buttonsHtml = `<span class="no-slot">※空き枠なし</span>`;
        let hrDisplay = isPracticeMode ? ` | <span style="color:#f1c40f; font-weight:bold;">HR: ${player.hr}本</span>` : "";
        div.innerHTML = `
            <div class="player-info"><div><strong>${player.name}</strong><br><small>打席: ${player.pa} | ${posText}${hrDisplay}</small></div></div>
            <div class="action-buttons">${buttonsHtml}</div>
        `;
        playerList.appendChild(div);
    });
}

window.draftPlayer = function(name, hr, chosenPosition) {
    myTeam[chosenPosition] = { name: name, hr: hr, year: currentRandomYear, team: currentRandomTeam };
    document.getElementById(`player-user-${chosenPosition}`).textContent = `${name} (${currentRandomYear})`;
    document.getElementById(`player-user-${chosenPosition}`).style.color = '#4ecc71';
    currentRound++;
    startNextRound();
}

function calculateOptimalDraft(historyTeams) {
    const N = historyTeams.length; 
    const maxMatrix = historyTeams.map(teamData => {
        const posBest = {};
        POSITIONS.forEach(pos => {
            let bestPlayer = null;
            teamData.players.forEach(p => {
                if (pos === "DH" || p.positions.includes(pos)) {
                    if (!bestPlayer || p.hr > bestPlayer.hr) bestPlayer = p;
                }
            });
            posBest[pos] = bestPlayer;
        });
        return posBest; 
    });
    let bestTotalHr = -1; let bestAssignment = null;
    function dfs(posIndex, usedMask, currentTotalHr, currentAssignment) {
        if (posIndex === POSITIONS.length) {
            if (currentTotalHr > bestTotalHr) { bestTotalHr = currentTotalHr; bestAssignment = [...currentAssignment]; }
            return;
        }
        const pos = POSITIONS[posIndex];
        let assigned = false;
        for (let i = 0; i < N; i++) {
            if ((usedMask & (1 << i)) === 0) {
                const bestPlayer = maxMatrix[i][pos];
                if (bestPlayer) {
                    assigned = true;
                    currentAssignment.push({ year: historyTeams[i].year, team: historyTeams[i].team, pos: pos, player: bestPlayer });
                    dfs(posIndex + 1, usedMask | (1 << i), currentTotalHr + bestPlayer.hr, currentAssignment);
                    currentAssignment.pop();
                }
            }
        }
        if (!assigned) {
            currentAssignment.push({ year: "----", team: "なし", pos: pos, player: {name:"未指名", hr:0} });
            dfs(posIndex + 1, usedMask, currentTotalHr, currentAssignment);
            currentAssignment.pop();
        }
    }
    dfs(0, 0, 0, []);
    return { maxHr: bestTotalHr, optimalLineup: bestAssignment };
}

resultBtn.addEventListener('click', () => {
    currentTotalHr = 0; 
    const optimal = calculateOptimalDraft(seenTeamsHistory);
    teamZone.classList.add('expanded');
    boardTitle.textContent = "【ドラフト結果・最強との比較】";

    POSITIONS.forEach(pos => {
        const player = myTeam[pos];
        const optP = optimal.optimalLineup.find(o => o.pos === pos);
        if (player) {
            currentTotalHr += player.hr;
            const abbr = TEAM_ABBR[player.team] || player.team; 
            document.getElementById(`player-user-${pos}`).innerHTML = `${player.year} ${player.name}(${abbr}) <span style="color:#f1c40f; font-weight:bold;">${player.hr}本</span>`;
        }
        if (optP && optP.year !== "----") {
            const optAbbr = TEAM_ABBR[optP.team] || optP.team;
            document.getElementById(`player-best-${pos}`).innerHTML = `${optP.year} ${optP.player.name}(${optAbbr}) <span style="color:#f1c40f; font-weight:bold;">${optP.player.hr}本</span>`;
        }
    });

    if (isPracticeMode) resultTitle.innerHTML = `チーム合計ホームラン数 <span style="font-size:14px; color:#aaa;">※練習モード</span>`;
    else resultTitle.textContent = `チーム合計ホームラン数`;

    totalHrValue.textContent = `${currentTotalHr} 本`;

    currentDiff = optimal.maxHr - currentTotalHr;

    if (currentDiff === 0) {
        optimalSummary.innerHTML = `<p style="color:#4ecc71; font-weight:bold; margin:0; font-size:18px;">👑 パーフェクト！理論上の最大値を達成しました！</p>`;
    } else {
        optimalSummary.innerHTML = `<p style="color:#f1c40f; font-weight:bold; margin:0; font-size:18px;">💡 理論上の最大値は ${optimal.maxHr}本 でした。(マイナス ${currentDiff}本)</p>`;
    }

    hrResult.style.display = 'block';
    resultBtn.style.display = 'none';
    shareControls.style.display = 'flex'; 
    
    rankingZone.style.display = 'block';
    if (isPracticeMode) {
        rankingInputArea.style.display = 'none'; 
    } else {
        rankingInputArea.style.display = 'flex';
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = "スコアを登録";
    }
    
    currentRankTab = 'diff';
    tabDiffBtn.classList.add('active');
    tabHrBtn.classList.remove('active');
    loadRankings();
});

// ==========================================
// 3. 結果画面：2部門対応・ランキング送受信ロジック
// ==========================================
submitScoreBtn.addEventListener('click', async () => {
    const name = playerNameInput.value.trim() || "名無し監督";
    submitScoreBtn.disabled = true;
    submitScoreBtn.textContent = "送信中...";

    try {
        await db.collection("rankings").add({
            name: name,
            diff: currentDiff,
            totalHr: currentTotalHr,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        rankingInputArea.style.display = 'none';
        loadRankings(); 
    } catch (error) {
        console.error("エラー:", error);
        alert("ランキングの登録に失敗しました。");
        submitScoreBtn.disabled = false;
        submitScoreBtn.textContent = "スコアを登録";
    }
});

window.switchRankTab = function(tabType) {
    if (currentRankTab === tabType) return; 
    currentRankTab = tabType;
    
    if (currentRankTab === 'diff') {
        tabDiffBtn.classList.add('active');
        tabHrBtn.classList.remove('active');
    } else {
        tabHrBtn.classList.add('active');
        tabDiffBtn.classList.remove('active');
    }
    loadRankings(); 
}

async function loadRankings() {
    rankingList.innerHTML = "<p style='text-align:center; color:#aaa;'>リーダーボードを読み込み中...</p>";
    try {
        let query;
        let scoreHeader = "";
        
        if (currentRankTab === 'diff') {
            query = db.collection("rankings").orderBy("diff", "asc").orderBy("timestamp", "asc");
            scoreHeader = "理論値との差";
        } else {
            query = db.collection("rankings").orderBy("totalHr", "desc").orderBy("timestamp", "asc");
            scoreHeader = "合計HR数";
        }

        const snapshot = await query.limit(10).get();

        let html = `<table class="ranking-table">
                        <tr><th>順位</th><th>監督名</th><th>${scoreHeader}</th></tr>`;
        let rank = 1;
        snapshot.forEach(doc => {
            const data = doc.data();
            let rankClass = rank === 1 ? 'rank-1' : (rank === 2 ? 'rank-2' : (rank === 3 ? 'rank-3' : ''));
            let scoreText = currentRankTab === 'diff' ? `-${data.diff}本` : `${data.totalHr}本`;
            
            html += `<tr>
                <td class="${rankClass}" style="text-align:center;">${rank}位</td>
                <td>${data.name}</td>
                <td style="text-align:center; color:#f1c40f; font-weight:bold;">${scoreText}</td>
            </tr>`;
            rank++;
        });
        html += `</table>`;
        
        if (snapshot.empty) {
            html = "<p style='color:#aaa; text-align:center;'>まだデータがありません。</p>";
        }
        rankingList.innerHTML = html;
        
    } catch(e) {
        console.error(e);
        rankingList.innerHTML = "<p style='color:#ff6b6b; text-align:center;'>ランキングの取得に失敗しました。</p>";
    }
}

// ==========================================
// ボタン類・その他機能
// ==========================================
saveImgBtn.addEventListener('click', () => {
    html2canvas(captureArea, { backgroundColor: '#162447', width: captureArea.offsetWidth }).then(canvas => {
        const link = document.createElement('a');
        link.download = isPracticeMode ? 'dream_team_practice.png' : 'dream_team.png'; 
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

copyImgBtn.addEventListener('click', () => {
    html2canvas(captureArea, { backgroundColor: '#162447' }).then(canvas => {
        canvas.toBlob(blob => {
            const item = new ClipboardItem({ 'image/png': blob });
            navigator.clipboard.write([item]).then(() => alert('コピーしました！'));
        });
    });
});

function retryGame() {
    currentRound = 1; redrawsLeft = 1;
    myTeam = { "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null, "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null };
    usedTeams = []; seenTeamsHistory = [];
    createBoardSlots();     
    
    // パスして引き直すボタンを復活させる
    redrawBtn.textContent = "パスして引き直す（残り1回）";
    redrawBtn.disabled = false;            

    hrResult.style.display = 'none';       
    resultZone.style.display = 'none';     
    resultBtn.style.display = 'block';     
    shareControls.style.display = 'none';  
    rankingZone.style.display = 'none'; 
    gameScreen.style.display = 'none';     
    landingPage.style.display = 'block';     
}

retryBtn.addEventListener('click', retryGame);

loadData();