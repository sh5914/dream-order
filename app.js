const playerList = document.getElementById('playerList');
const board = document.getElementById('board');
const resultZone = document.getElementById('resultZone');
const resultBtn = document.getElementById('resultBtn');
const hrResult = document.getElementById('hrResult');
const totalHrValue = document.getElementById('totalHrValue');
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
        startNextRound(); 
    } catch (error) {
        playerList.innerHTML = `<p style="color:red;">データの読み込みに失敗しました: ${error}</p>`;
    }
}

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
    currentRandomYear = years[Math.floor(Math.random() * years.length)];

    const teams = Object.keys(allData[currentRandomYear]);
    currentRandomTeam = teams[Math.floor(Math.random() * teams.length)];

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
        // ▼▼ 変更ポイント：重複チェックを「名前」から「名前＋選ばれた年度」に変更しました ▼▼
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

        div.innerHTML = `
            <div class="player-info">
                <div>
                    <strong>${player.name}</strong><br>
                    <small>打席数: ${player.pa} | 守備: ${posText}</small>
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

    totalHrValue.textContent = `${totalHr} 本`;
    hrResult.style.display = 'block';
    resultBtn.style.display = 'none';
    shareControls.style.display = 'flex'; 
});

saveImgBtn.addEventListener('click', () => {
    html2canvas(captureArea, { backgroundColor: '#162447' }).then(canvas => {
        const link = document.createElement('a');
        link.download = 'dream_team.png'; 
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

    createBoardSlots();                     
    redrawBtn.textContent = "パスして引き直す（残り1回）";
    redrawBtn.disabled = false;            
    
    hrResult.style.display = 'none';       
    resultZone.style.display = 'none';     
    resultBtn.style.display = 'block';     
    shareControls.style.display = 'none';  
    draftZone.style.display = 'block';     

    startNextRound();
});

loadData();