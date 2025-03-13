/**
 * 将棋ゲームのメインスクリプト
 * ゲームの初期化と制御を行う
 */

// DOMが読み込まれたら実行
document.addEventListener('DOMContentLoaded', () => {
    // 将棋盤の要素を取得
    const boardElement = document.getElementById('shogi-board');
    
    // 持ち駒エリアの要素を取得
    const playerCapturedElement = document.getElementById('player-captured');
    const opponentCapturedElement = document.getElementById('opponent-captured');
    
    // 手番表示エリアの要素を取得
    const turnDisplayElement = document.getElementById('turn-display');
    
    // 将棋盤のインスタンスを作成
    let shogiBoard = new ShogiBoard(
        boardElement,
        playerCapturedElement,
        opponentCapturedElement,
        turnDisplayElement
    );
    
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
    
    // 視覚的UI強化機能の設定ボタンを追加
    addVisualSettingsButtons();
    
    /**
     * ゲームをリセットする
     */
    function resetGame() {
        // 古い将棋盤を破棄
        boardElement.innerHTML = '';
        playerCapturedElement.innerHTML = '';
        opponentCapturedElement.innerHTML = '';
        
        // 新しい将棋盤のインスタンスを作成
        shogiBoard = new ShogiBoard(boardElement, playerCapturedElement, opponentCapturedElement, turnDisplayElement);
        
        // 視覚的UI強化機能の設定を復元
        const showAllMovableCells = localStorage.getItem('showAllMovableCells') === 'false' ? false : true;
        const showCapturableMarks = localStorage.getItem('showCapturableMarks') === 'false' ? false : true;
        
        shogiBoard.showAllMovableCells = showAllMovableCells;
        shogiBoard.showCapturableMarks = showCapturableMarks;
        
        // 設定ボタンの状態を更新
        updateVisualSettingsButtons();
        
        // 全駒の移動可能マスと駒を取る・取られる表示を更新
        shogiBoard.updateAllMovableCellsAndMarks();
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
        // 設定ボタンを追加するコンテナを作成
        const settingsContainer = document.createElement('div');
        settingsContainer.classList.add('visual-settings');
        settingsContainer.innerHTML = `
            <h3>視覚的UI設定</h3>
            <div class="settings-options">
                <div class="setting-option">
                    <label for="show-movable-cells">移動可能マス表示</label>
                    <button id="show-movable-cells" class="toggle-btn active">ON</button>
                </div>
                <div class="setting-option">
                    <label for="show-capturable-marks">駒を取る・取られる表示</label>
                    <button id="show-capturable-marks" class="toggle-btn active">ON</button>
                </div>
            </div>
        `;
        
        // コントロールボタンエリアの後に挿入
        const controlButtons = document.querySelector('.control-buttons');
        controlButtons.parentNode.insertBefore(settingsContainer, controlButtons.nextSibling);
        
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
        const showAllMovableCells = localStorage.getItem('showAllMovableCells') === 'false' ? false : true;
        const showCapturableMarks = localStorage.getItem('showCapturableMarks') === 'false' ? false : true;
        
        shogiBoard.showAllMovableCells = showAllMovableCells;
        shogiBoard.showCapturableMarks = showCapturableMarks;
        
        // 設定ボタンの状態を更新
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
}); 