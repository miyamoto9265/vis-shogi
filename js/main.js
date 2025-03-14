/**
 * 将棋ゲームのメインスクリプト
 * ゲームの初期化と制御を行う
 */

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', () => {
    // 画面要素の取得
    const gameModeSelection = document.getElementById('game-mode-selection');
    const gameContainer = document.getElementById('game-container');
    const aiSettings = document.getElementById('ai-settings');
    const gameModeDisplay = document.getElementById('game-mode-display');
    
    // バージョン情報を表示
    displayVersionInfo();
    
    // ゲームモード選択ボタン
    const humanVsHumanBtn = document.getElementById('human-vs-human');
    const humanVsAiBtn = document.getElementById('human-vs-ai');
    
    // AI設定関連の要素
    const difficultyRadios = document.getElementsByName('difficulty');
    const playerSideRadios = document.getElementsByName('player-side');
    const startAiGameBtn = document.getElementById('start-ai-game');
    const backToModeSelectionBtn = document.getElementById('back-to-mode-selection');
    
    // ゲーム画面関連の要素
    const boardElement = document.getElementById('shogi-board');
    const playerCapturedElement = document.getElementById('player-captured');
    const opponentCapturedElement = document.getElementById('opponent-captured');
    const turnDisplayElement = document.getElementById('turn-display');
    const backToMenuButton = document.getElementById('back-to-menu-button');
    
    // 将棋盤のインスタンス
    let shogiBoard = null;
    
    // AIインターフェースのインスタンス
    let ai = null;
    
    // 現在のゲームモード
    let currentGameMode = 'human-vs-human';
    
    // ゲームモード選択イベントリスナー
    humanVsHumanBtn.addEventListener('click', () => {
        currentGameMode = 'human-vs-human';
        gameModeSelection.style.display = 'none';
        gameContainer.style.display = 'block';
        gameModeDisplay.textContent = '対人戦モード';
        initializeGame();
    });
    
    humanVsAiBtn.addEventListener('click', () => {
        currentGameMode = 'human-vs-ai';
        gameModeSelection.style.display = 'none';
        aiSettings.style.display = 'block';
    });
    
    // AI設定画面のイベントリスナー
    startAiGameBtn.addEventListener('click', () => {
        aiSettings.style.display = 'none';
        gameContainer.style.display = 'block';
        gameModeDisplay.textContent = 'AI対戦モード';
        
        // 選択された設定を取得
        const difficulty = getSelectedRadioValue(difficultyRadios);
        const playerSide = getSelectedRadioValue(playerSideRadios);
        
        // ゲームを初期化
        initializeGame();
        
        // AIインターフェースを初期化
        ai = initializeAIInterface(shogiBoard);
        ai.updateSettings(difficulty, playerSide);
        
        // プレイヤーが後手の場合、AIが先手として指す
        if (playerSide === PLAYER_SIDE.SECOND) {
            // プレイヤーとAIの手番を入れ替え
            shogiBoard.currentTurn = PIECE_OWNER.OPPONENT;
            shogiBoard.updateTurnDisplay();
            
            // AIの思考を開始
            setTimeout(() => {
                startAIThinking();
            }, 500);
        }
    });
    
    backToModeSelectionBtn.addEventListener('click', () => {
        aiSettings.style.display = 'none';
        gameModeSelection.style.display = 'block';
    });
    
    // メニューに戻るボタンのイベントリスナー
    backToMenuButton.addEventListener('click', () => {
        if (confirm('メニューに戻りますか？現在のゲームは終了します。')) {
            gameContainer.style.display = 'none';
            gameModeSelection.style.display = 'block';
            
            // AIの思考を停止
            if (ai && ai.isAIThinking) {
                ai.stopThinking();
            }
        }
    });
    
    // ヘルプボタンのイベントリスナーを設定
    const helpButton = document.getElementById('help-button');
    const helpDialog = document.getElementById('help-dialog');
    const closeHelpButton = document.getElementById('close-help');
    
    helpButton.addEventListener('click', () => {
        helpDialog.style.display = 'flex';
    });
    
    closeHelpButton.addEventListener('click', () => {
        helpDialog.style.display = 'none';
    });
    
    // 設定ボタンのイベントリスナーを設定
    const settingsButton = document.getElementById('settings-button');
    const settingsDialog = document.getElementById('settings-dialog');
    const closeSettingsButton = document.getElementById('close-settings');
    
    settingsButton.addEventListener('click', () => {
        settingsDialog.style.display = 'flex';
    });
    
    closeSettingsButton.addEventListener('click', () => {
        settingsDialog.style.display = 'none';
    });
    
    // 勝敗表示ダイアログのイベントリスナーを設定
    const newGameButton = document.getElementById('new-game-button');
    const closeResultButton = document.getElementById('close-result-button');
    const gameResultDialog = document.getElementById('game-result-dialog');
    
    newGameButton.addEventListener('click', () => {
        gameResultDialog.style.display = 'none';
        resetGame();
    });
    
    closeResultButton.addEventListener('click', () => {
        gameResultDialog.style.display = 'none';
    });
    
    // テーマ切り替えボタンのイベントリスナーを設定
    const lightModeButton = document.getElementById('light-mode');
    const darkModeButton = document.getElementById('dark-mode');
    const systemModeButton = document.getElementById('system-mode');
    
    lightModeButton.addEventListener('click', () => setTheme('light'));
    darkModeButton.addEventListener('click', () => setTheme('dark'));
    systemModeButton.addEventListener('click', () => setTheme('system'));
    
    // 初期テーマを設定
    initializeTheme();
    
    // リセットボタンのイベントリスナーを設定
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (confirm('ゲームをリセットしますか？')) {
                resetGame();
            }
        });
    }
    
    /**
     * ゲームを初期化する
     */
    function initializeGame() {
        // 古い将棋盤を破棄
        boardElement.innerHTML = '';
        playerCapturedElement.innerHTML = '';
        opponentCapturedElement.innerHTML = '';
        
        // 新しい将棋盤のインスタンスを作成
        shogiBoard = new ShogiBoard(boardElement, playerCapturedElement, opponentCapturedElement, turnDisplayElement);
        
        // AI対戦モードの場合、手番切り替え時のイベントハンドラを設定
        if (currentGameMode === 'human-vs-ai') {
            // 手番切り替え時のイベントをオーバーライド
            const originalSwitchTurn = shogiBoard.switchTurn;
            shogiBoard.switchTurn = function() {
                // 元の手番切り替え処理を実行
                originalSwitchTurn.call(shogiBoard);
                
                // AI対戦モードで、AIの手番になった場合
                if (currentGameMode === 'human-vs-ai' && ai && 
                    ((ai.playerSide === PLAYER_SIDE.FIRST && shogiBoard.currentTurn === PIECE_OWNER.OPPONENT) ||
                     (ai.playerSide === PLAYER_SIDE.SECOND && shogiBoard.currentTurn === PIECE_OWNER.PLAYER))) {
                    // AIの思考を開始
                    startAIThinking();
                }
            };
        }
        
        // 視覚的UI強化機能の設定を復元
        const showAllMovableCells = localStorage.getItem('showAllMovableCells') === 'false' ? false : true;
        const showCapturableMarks = localStorage.getItem('showCapturableMarks') === 'false' ? false : true;
        
        shogiBoard.showAllMovableCells = showAllMovableCells;
        shogiBoard.showCapturableMarks = showCapturableMarks;
        
        // 視覚的UI強化機能の設定ボタンを追加
        addVisualSettingsButtons();
    }
    
    /**
     * AIの思考を開始する
     */
    function startAIThinking() {
        if (!ai) return;
        
        // AIの現在の手番を確認（プレイヤーの設定に基づく）
        const aiTurn = ai.playerSide === PLAYER_SIDE.FIRST ? 
                     PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
        
        // 現在の手番がAIの手番でなければ修正（重要）
        if (shogiBoard.currentTurn !== aiTurn) {
            console.warn('手番の不整合を修正します。AIの思考前に手番を修正:', 
                       'Current:', shogiBoard.currentTurn, 
                       'Should be:', aiTurn);
            shogiBoard.currentTurn = aiTurn;
            shogiBoard.updateTurnDisplay();
        }
        
        // AIの思考を開始
        ai.startThinking((move) => {
            console.log('AIの指し手を実行します:', move);
            
            // 再度手番を確認（念のため）
            if (shogiBoard.currentTurn !== aiTurn) {
                console.warn('AIの指し手実行前に手番の不整合を検出:', 
                           'Current:', shogiBoard.currentTurn, 
                           'Should be:', aiTurn);
                shogiBoard.currentTurn = aiTurn;
                shogiBoard.updateTurnDisplay();
            }
            
            // AIの指し手を実行
            shogiBoard.executeAIMove(move);
        });
    }
    
    /**
     * ゲームをリセットする
     */
    function resetGame() {
        // AIの思考を停止
        if (ai && ai.isAIThinking) {
            ai.stopThinking();
        }
        
        // ゲームを初期化
        initializeGame();
        
        // AI対戦モードの場合、AI設定を更新
        if (currentGameMode === 'human-vs-ai' && ai) {
            const difficulty = getSelectedRadioValue(difficultyRadios);
            const playerSide = getSelectedRadioValue(playerSideRadios);
            
            ai = initializeAIInterface(shogiBoard);
            ai.updateSettings(difficulty, playerSide);
            
            // プレイヤーが後手の場合、AIが先手として指す
            if (playerSide === PLAYER_SIDE.SECOND) {
                // プレイヤーとAIの手番を入れ替え
                shogiBoard.currentTurn = PIECE_OWNER.OPPONENT;
                shogiBoard.updateTurnDisplay();
                
                // AIの思考を開始
                setTimeout(() => {
                    startAIThinking();
                }, 500);
            }
        }
    }
    
    /**
     * ラジオボタンの選択値を取得する
     * @param {NodeList} radios ラジオボタンのNodeList
     * @returns {string} 選択された値
     */
    function getSelectedRadioValue(radios) {
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                return radios[i].value;
            }
        }
        return null;
    }
    
    /**
     * テーマを設定する
     * @param {string} theme テーマ（'light', 'dark', 'system'）
     */
    function setTheme(theme) {
        // テーマボタンのアクティブ状態を更新
        lightModeButton.classList.toggle('active', theme === 'light');
        darkModeButton.classList.toggle('active', theme === 'dark');
        systemModeButton.classList.toggle('active', theme === 'system');
        
        // テーマを適用
        if (theme === 'system') {
            document.documentElement.removeAttribute('data-theme');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
        
        // テーマ設定をローカルストレージに保存
        localStorage.setItem('theme', theme);
    }
    
    /**
     * 初期テーマを設定する
     */
    function initializeTheme() {
        // ローカルストレージからテーマ設定を取得
        const savedTheme = localStorage.getItem('theme') || 'system';
        setTheme(savedTheme);
    }
    
    /**
     * 視覚的UI強化機能の設定ボタンを追加する
     */
    function addVisualSettingsButtons() {
        // 移動可能マス表示の切り替えボタン
        const showMovableCellsBtn = document.getElementById('show-movable-cells');
        showMovableCellsBtn.addEventListener('click', () => {
            // 設定を切り替え
            shogiBoard.showAllMovableCells = !shogiBoard.showAllMovableCells;
            
            // ボタンの表示を更新
            showMovableCellsBtn.classList.toggle('active', shogiBoard.showAllMovableCells);
            showMovableCellsBtn.textContent = shogiBoard.showAllMovableCells ? 'ON' : 'OFF';
            
            // 設定をローカルストレージに保存
            localStorage.setItem('showAllMovableCells', shogiBoard.showAllMovableCells);
            
            // 全駒の移動可能マスと駒を取る・取られる表示を更新
            shogiBoard.updateAllMovableCellsAndMarks();
        });
        
        // 駒を取る・取られる表示の切り替えボタン
        const showCapturableMarksBtn = document.getElementById('show-capturable-marks');
        showCapturableMarksBtn.addEventListener('click', () => {
            // 設定を切り替え
            shogiBoard.showCapturableMarks = !shogiBoard.showCapturableMarks;
            
            // ボタンの表示を更新
            showCapturableMarksBtn.classList.toggle('active', shogiBoard.showCapturableMarks);
            showCapturableMarksBtn.textContent = shogiBoard.showCapturableMarks ? 'ON' : 'OFF';
            
            // 設定をローカルストレージに保存
            localStorage.setItem('showCapturableMarks', shogiBoard.showCapturableMarks);
            
            // 全駒の移動可能マスと駒を取る・取られる表示を更新
            shogiBoard.updateAllMovableCellsAndMarks();
        });
        
        // 保存された設定を復元
        updateVisualSettingsButtons();
    }
    
    /**
     * 視覚的UI強化機能の設定ボタンの状態を更新する
     */
    function updateVisualSettingsButtons() {
        const showMovableCellsBtn = document.getElementById('show-movable-cells');
        const showCapturableMarksBtn = document.getElementById('show-capturable-marks');
        
        if (showMovableCellsBtn) {
            showMovableCellsBtn.classList.toggle('active', shogiBoard.showAllMovableCells);
            showMovableCellsBtn.textContent = shogiBoard.showAllMovableCells ? 'ON' : 'OFF';
        }
        
        if (showCapturableMarksBtn) {
            showCapturableMarksBtn.classList.toggle('active', shogiBoard.showCapturableMarks);
            showCapturableMarksBtn.textContent = shogiBoard.showCapturableMarks ? 'ON' : 'OFF';
        }
    }
    
    /**
     * バージョン情報を表示する
     */
    function displayVersionInfo() {
        const versionElement = document.getElementById('game-version');
        if (versionElement) {
            if (typeof GAME_VERSION !== 'undefined') {
                versionElement.textContent = `${GAME_VERSION.version} (${GAME_VERSION.commit})`;
                console.log('ゲームバージョン情報を表示:', GAME_VERSION.version);
            } else {
                versionElement.textContent = '0.1.1';
                console.warn('GAME_VERSIONが見つかりません。デフォルトバージョンを表示します。');
            }
        }
    }
}); 