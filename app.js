const landingPage = document.getElementById('landingPage');
const gameScreen = document.getElementById('gameScreen');
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
const optimalResult = document.getElementById('optimalResult'); // 追加
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
let seenTeamsHistory = []; // ★追加：DFS計算用に「出現した全チーム」を保存する配列

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
        startGameBtn.textContent = "読み込みエラー";
        startPracticeBtn.textContent = "エラー";
        alert("データの読み込みに失敗しました。ページを再読み込みしてください。");
        console.error(error);
    }
}

startGameBtn.addEventListener('click', () => {
    isPracticeMode = false; 
    practiceBadge.style.display = 'none'; 
    resetGameBtn.style.display = 'none'; 
    landingPage.style.display = 'none';
    draftZone.style.display = 'block'; 
    gameScreen.style.display = 'block';
    
    usedTeams = []; 
    seenTeamsHistory = []; // 初期化
    startNextRound();
});

startPracticeBtn.addEventListener('click', () => {
    isPracticeMode = true; 
    practiceBadge.style.display = 'inline-block'; 
    resetGameBtn.style.display = 'block'; 
    landingPage.style.display = 'none';
    draftZone.style.display = 'block'; 
    gameScreen.style.display = 'block';
    
    usedTeams = []; 
    seenTeamsHistory = []; // 初期化
    startNextRound();
});

resetGameBtn.addEventListener('click', () => {
    currentRound = 1;
    redrawsLeft = 1;
    myTeam = {
        "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null,
        "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null
    };
    usedTeams = []; 
    seenTeamsHistory = []; // 初期化

    createBoardSlots();                     
    redrawBtn.textContent = "パスして引き直す（残り1回）";
    redrawBtn.disabled = false;            
    
    hrResult.style.display = 'none';       
    optimalResult.style.display = 'none';
    resultZone.style.display = 'none';     
    resultBtn.style.display = 'block';     
    shareControls.style.display = 'none';  
    
    startNextRound(); 
});

function createBoardSlots() {
    board.innerHTML = '';
    POSITIONS.forEach(pos => {
        const div = document.createElement('div');
        div.className = 'position-slot';
        div.id = `slot-${pos}`;
        div.innerHTML = `
            <span class="slot-title">${pos}</span>
            <span class="slot-player" id="player-name-${pos}">未指名</span>
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
            
            // ★出現したチームの詳細データを履歴に保存する
            seenTeamsHistory.push({
                year: tempYear,
                team: tempTeam,
                players: allData[tempYear][tempTeam]
            });
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

    if (!players || players.length === 0) {
        playerList.innerHTML = `<p>選手データがありません。</p>`;
        if (redrawsLeft > 0) {
            playerList.innerHTML += `<p>「引き直す」ボタンを押してください。</p>`;
        } else {
            playerList.innerHTML += `<button class="draft-btn" onclick="skipRound()">指名を放棄して次の巡へ進む</button>`;
        }
        return;
    }

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
                buttonsHtml += `<button class="draft-btn" onclick="draftPlayer('${player.name}', ${player.pa}, ${player.hr}, '${pos}')">${pos}で指名</button>`;
                hasAvailableSlot = true;
                anyoneCanBeDrafted = true;
            }
        });

        if (myTeam["DH"] === null) {
            buttonsHtml += `<button class="draft-btn dh-btn" onclick="draftPlayer('${player.name}', ${player.pa}, ${player.hr}, 'DH')">DHで指名</button>`;
            hasAvailableSlot = true;
            anyoneCanBeDrafted = true;
        }

        if (!hasAvailableSlot) {
            buttonsHtml = `<span class="no-slot">※配置できる空き枠がありません</span>`;
        }

        let hrDisplay = isPracticeMode ? ` | <span style="color:#f1c40f; font-weight:bold;">HR: ${player.hr}本</span>` : "";

        div.innerHTML = `
            <div class="player-info">
                <div>
                    <strong>${player.name}</strong><br>
                    <small>打席数: ${player.pa} | 守備: ${posText}${hrDisplay}</small>
                </div>
            </div>
            <div class="action-buttons">
                ${buttonsHtml}
            </div>
        `;
        playerList.appendChild(div);
    });

    if (!anyoneCanBeDrafted && redrawsLeft === 0) {
        playerList.innerHTML += `
            <div style="background: #e74c3c; padding: 15px; border-radius: 6px; margin-top: 20px; text-align: center;">
                <strong>🚨 警告：指名できる選手がいません！</strong><br>
                引き直し回数も残っていないため、この巡の指名を放棄する必要があります。<br><br>
                <button class="draft-btn" style="background: #fff; color: #e74c3c;" onclick="skipRound()">指名放棄して次へ</button>
            </div>
        `;
    }
}

window.draftPlayer = function(name, pa, hr, chosenPosition) {
    if (myTeam[chosenPosition] !== null) {
        alert("エラー：そのポジションは既に埋まっています！");
        return;
    }

    myTeam[chosenPosition] = { name: name, hr: hr, pa: pa, year: currentRandomYear, team: currentRandomTeam };
    document.getElementById(`player-name-${chosenPosition}`).textContent = `${name} (${currentRandomYear})`;
    document.getElementById(`player-name-${chosenPosition}`).style.color = '#4ecc71';

    currentRound++;
    startNextRound();
}

// ▼▼ 追加：理論上の最強スタメンを計算するDFSアルゴリズム ▼▼
function calculateOptimalDraft(historyTeams) {
    const N = historyTeams.length; 
    const maxMatrix = historyTeams.map(teamData => {
        const posBest = {};
        POSITIONS.forEach(pos => {
            let bestPlayer = null;
            teamData.players.forEach(p => {
                if (pos === "DH" || p.positions.includes(pos)) {
                    if (!bestPlayer || p.hr > bestPlayer.hr) {
                        bestPlayer = p;
                    }
                }
            });
            posBest[pos] = bestPlayer;
        });
        return posBest; 
    });

    let bestTotalHr = -1;
    let bestAssignment = null;

    function dfs(posIndex, usedMask, currentTotalHr, currentAssignment) {
        if (posIndex === POSITIONS.length) {
            if (currentTotalHr > bestTotalHr) {
                bestTotalHr = currentTotalHr;
                bestAssignment = [...currentAssignment];
            }
            return;
        }

        const pos = POSITIONS[posIndex];
        let assigned = false;
        
        for (let i = 0; i < N; i++) {
            if ((usedMask & (1 << i)) === 0) {
                const bestPlayer = maxMatrix[i][pos];
                if (bestPlayer) {
                    assigned = true;
                    currentAssignment.push({
                        year: historyTeams[i].year, team: historyTeams[i].team, pos: pos, player: bestPlayer
                    });
                    dfs(posIndex + 1, usedMask | (1 << i), currentTotalHr + bestPlayer.hr, currentAssignment);
                    currentAssignment.pop();
                }
            }
        }
        
        if (!assigned) {
            currentAssignment.push({ year: "----", team: "該当なし", pos: pos, player: {name:"未指名", hr:0} });
            dfs(posIndex + 1, usedMask, currentTotalHr, currentAssignment);
            currentAssignment.pop();
        }
    }

    dfs(0, 0, 0, []);
    return { maxHr: bestTotalHr, optimalLineup: bestAssignment };
}
// ▲▲ ここまで ▲▲

resultBtn.addEventListener('click', () => {
    let totalHr = 0;

    POSITIONS.forEach(pos => {
        const player = myTeam[pos];
        if (player) {
            totalHr += player.hr;
            const abbr = TEAM_ABBR[player.team] || player.team; 
            document.getElementById(`player-name-${pos}`).innerHTML = 
                `${player.year} ${player.name}（${abbr}） <span style="color:#f1c40f; font-weight:bold;">${player.hr}本</span>`;
        }
    });

    if (isPracticeMode) {
        resultTitle.innerHTML = `チーム合計ホームラン数 <br><span style="font-size:16px; color:#aaa;">※練習モードの記録です</span>`;
    } else {
        resultTitle.textContent = `チーム合計ホームラン数`;
    }

    totalHrValue.textContent = `${totalHr} 本`;
    
    // ▼▼ 追加：結果発表時に最適解を計算して表示する ▼▼
    const optimal = calculateOptimalDraft(seenTeamsHistory);
    let optimalHtml = `<div style="margin-top:20px; padding:15px; background:#1f4068; border-radius:6px; border:1px solid #e94560;">`;
    
    if (totalHr >= optimal.maxHr) {
        optimalHtml += `<h3 style="color:#f1c40f; margin-top:0; margin-bottom:10px;">👑 理論値達成！: ${optimal.maxHr}本</h3>`;
        optimalHtml += `<p style="color:#4ecc71; font-weight:bold; margin:0;">パーフェクト！あなたは最強の監督です！</p>`;
    } else {
        let diff = optimal.maxHr - totalHr;
        optimalHtml += `<h3 style="color:#f1c40f; margin-top:0; margin-bottom:10px;">💡 理論上の最適解: ${optimal.maxHr}本</h3>`;
        optimalHtml += `<p style="margin-top:0; font-weight:bold; color:#ff6b6b;">あと ${diff} 本伸ばせました...！<br><span style="font-size:12px; color:#aaa;">（※スキップした球団も含めた最大値）</span></p>`;
        optimalHtml += `<div style="font-size:13px; text-align:left; background:#0f3460; padding:10px; border-radius:4px;">`;
        POSITIONS.forEach(pos => {
            let optP = optimal.optimalLineup.find(o => o.pos === pos);
            if(optP && optP.year !== "----") {
                let abbr = TEAM_ABBR[optP.team] || optP.team;
                optimalHtml += `<div style="margin-bottom:4px;"><span style="color:#4ecc71; width:50px; display:inline-block;">${pos}</span> ${optP.year} ${optP.player.name}(${abbr}) : ${optP.player.hr}本</div>`;
            }
        });
        optimalHtml += `</div>`;
    }
    optimalHtml += `</div>`;
    
    optimalResult.innerHTML = optimalHtml;
    optimalResult.style.display = 'block';
    // ▲▲ ここまで ▲▲

    hrResult.style.display = 'block';
    resultBtn.style.display = 'none';
    shareControls.style.display = 'flex'; 
});

saveImgBtn.addEventListener('click', () => {
    html2canvas(captureArea, { backgroundColor: '#162447' }).then(canvas => {
        const link = document.createElement('a');
        link.download = isPracticeMode ? 'dream_team_practice.png' : 'dream_team.png'; 
        link.href = canvas.toDataURL('image/png');
        link.click();
    });
});

copyImgBtn.addEventListener('click', () => {
    try {
        const makeImagePromise = new Promise(resolve => {
            html2canvas(captureArea, { backgroundColor: '#162447' }).then(canvas => {
                canvas.toBlob(blob => {
                    resolve(blob);
                });
            });
        });
        const item = new ClipboardItem({ 'image/png': makeImagePromise });
        navigator.clipboard.write([item]).then(() => {
            alert('画像をクリップボードにコピーしました！そのままSNS等に貼り付け（ペースト）できます。');
        }).catch(err => {
            console.error("クリップボードエラー:", err);
            alert('コピーに失敗しました。お使いのブラウザのセキュリティ設定が原因の可能性があります。「画像を保存」をお使いください。');
        });
    } catch (error) {
        console.error("未対応ブラウザ:", error);
        alert('お使いのブラウザは画像の直接コピーに未対応のようです。「画像を保存」ボタンをご利用ください。');
    }
});

retryBtn.addEventListener('click', () => {
    currentRound = 1;
    redrawsLeft = 1;
    myTeam = {
        "捕手": null, "一塁手": null, "二塁手": null, "三塁手": null,
        "遊撃手": null, "左翼手": null, "中堅手": null, "右翼手": null, "DH": null
    };
    usedTeams = []; 
    seenTeamsHistory = []; // 初期化

    createBoardSlots();                     
    redrawBtn.textContent = "パスして引き直す（残り1回）";
    redrawBtn.disabled = false;            
    
    hrResult.style.display = 'none';       
    optimalResult.style.display = 'none'; // 初期化
    resultZone.style.display = 'none';     
    resultBtn.style.display = 'block';     
    shareControls.style.display = 'none';  
    
    draftZone.style.display = 'block'; 
    
    gameScreen.style.display = 'none';     
    landingPage.style.display = 'block';     
});

loadData();