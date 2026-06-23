const landingPage = document.getElementById('landingPage');
const gameScreen = document.getElementById('gameScreen');
const teamZone = document.getElementById('teamZone'); // 追加
const boardTitle = document.getElementById('boardTitle'); // 追加
const startGameBtn = document.getElementById('startGameBtn');
const startPracticeBtn = document.getElementById('startPracticeBtn');
const practiceBadge = document.getElementById('practiceBadge');
const resetGameBtn = document.getElementById('resetGameBtn'); 

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

let allData = {}; 
let isPracticeMode = false; 
let usedTeams = []; 
let seenTeamsHistory = []; 

const POSITIONS = ["捕手", "一塁手", "二塁手", "三塁手", "遊撃手", "左翼手", "中堅手", "右翼手", "DH"];

const TEAM_ABBR = {
    "広島": "広", "巨人": "巨", "阪神": "神", "DeNA": "De", "ヤクルト": "ヤ", "中日": "中",
    "ソフトバンク": "ソ", "日本ハム": "日", "ロッテ": "ロ", "西武": "西", "オリックス": "オ", "楽天": "楽"
};

let myTeam = {
    "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null,
    "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null
};

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
        currentRound = 1; redrawsLeft = 1;
        myTeam = { "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null, "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null };
        usedTeams = []; seenTeamsHistory = [];
        createBoardSlots();                     
        redrawBtn.textContent = "パスして引き直す（残り1回）";
        redrawBtn.disabled = false;            
        hrResult.style.display = 'none';       
        resultZone.style.display = 'none';     
        resultBtn.style.display = 'block';     
        shareControls.style.display = 'none';  
        startNextRound(); 
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

// DFS 最適解計算
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
    let totalHr = 0;
    const optimal = calculateOptimalDraft(seenTeamsHistory);
    
    // 画面を拡張
    teamZone.classList.add('expanded');
    boardTitle.textContent = "【ドラフト結果・最強との比較】";

    POSITIONS.forEach(pos => {
        const player = myTeam[pos];
        const optP = optimal.optimalLineup.find(o => o.pos === pos);
        
        // ユーザーの表示更新
        if (player) {
            totalHr += player.hr;
            const abbr = TEAM_ABBR[player.team] || player.team; 
            document.getElementById(`player-user-${pos}`).innerHTML = 
                `${player.year} ${player.name}(${abbr}) <span style="color:#f1c40f; font-weight:bold;">${player.hr}本</span>`;
        }

        // 最適解の表示更新
        if (optP && optP.year !== "----") {
            const optAbbr = TEAM_ABBR[optP.team] || optP.team;
            document.getElementById(`player-best-${pos}`).innerHTML = 
                `${optP.year} ${optP.player.name}(${optAbbr}) <span style="color:#f1c40f; font-weight:bold;">${optP.player.hr}本</span>`;
        }
    });

    if (isPracticeMode) {
        resultTitle.innerHTML = `チーム合計ホームラン数 <br><span style="font-size:14px; color:#aaa;">※練習モード</span>`;
    } else {
        resultTitle.textContent = `チーム合計ホームラン数`;
    }

    totalHrValue.textContent = `${totalHr} 本`;
    
    // サマリー表示
    if (totalHr >= optimal.maxHr) {
        optimalSummary.innerHTML = `<p style="color:#4ecc71; font-weight:bold;">👑 パーフェクト！理論上の最大値（${optimal.maxHr}本）を達成しました！</p>`;
    } else {
        optimalSummary.innerHTML = `<p style="color:#f1c40f; font-weight:bold;">💡 理論上の最大値は ${optimal.maxHr}本 でした。</p>`;
    }

    hrResult.style.display = 'block';
    resultBtn.style.display = 'none';
    shareControls.style.display = 'flex'; 
});

saveImgBtn.addEventListener('click', () => {
    html2canvas(captureArea, { backgroundColor: '#162447', width: captureArea.offsetWidth }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'dream_team_result.png'; 
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

retryBtn.addEventListener('click', () => {
    currentRound = 1; redrawsLeft = 1;
    myTeam = { "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null, "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null };
    usedTeams = []; seenTeamsHistory = [];
    createBoardSlots();                     
    hrResult.style.display = 'none';       
    resultZone.style.display = 'none';     
    resultBtn.style.display = 'block';     
    shareControls.style.display = 'none';  
    gameScreen.style.display = 'none';     
    landingPage.style.display = 'block';     
});

loadData();