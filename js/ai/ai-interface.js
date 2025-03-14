/**
 * AI対戦機能のインターフェースを提供するモジュール
 * 将棋AIエンジンとの通信を担当
 */
console.log('ai-interface.js loaded');

// AIの難易度レベル、プレイヤーの手番、持ち時間設定はindex.htmlで定義されています

/**
 * AI対戦機能を管理するクラス
 */
class AIInterface {
    /**
     * コンストラクタ
     * @param {ShogiBoard} shogiBoard 将棋盤のインスタンス
     */
    constructor(shogiBoard) {
        this.shogiBoard = shogiBoard;
        this.isAIThinking = false;
        this.aiThinkingElement = document.getElementById('ai-thinking');
        
        // AI設定
        this.difficulty = AI_DIFFICULTY.BEGINNER;
        this.playerSide = PLAYER_SIDE.FIRST;
        
        // AIエンジンのインスタンス
        this.chessEngine = new ChessEngine(shogiBoard);
        
        // 思考時間調整（ユーザー体験向上のため）
        this.minThinkingTime = {
            [AI_DIFFICULTY.BEGINNER]: 1000,      // 1秒
            [AI_DIFFICULTY.INTERMEDIATE]: 1500,  // 1.5秒
            [AI_DIFFICULTY.ADVANCED]: 2000       // 2秒
        };
    }
    
    /**
     * AI設定を更新する
     * @param {string} difficulty 難易度
     * @param {string} playerSide プレイヤーの手番
     */
    updateSettings(difficulty, playerSide) {
        this.difficulty = difficulty;
        this.playerSide = playerSide;
        
        // AIエンジンの設定を更新
        this.chessEngine.setDifficulty(difficulty);
        this.chessEngine.setPlayerSide(playerSide);
        
        console.log(`AI設定を更新: 難易度=${difficulty}, プレイヤー手番=${playerSide}`);
    }
    
    /**
     * AIの思考を開始する
     * @param {Function} moveCallback AIが指し手を決定した時のコールバック関数
     */
    startThinking(moveCallback) {
        if (this.isAIThinking) return;
        
        this.isAIThinking = true;
        this.showThinkingUI();
        
        // 現在の手番を保存
        const originalTurn = this.shogiBoard.currentTurn;
        
        // 最小思考時間
        const minThinkTime = this.minThinkingTime[this.difficulty];
        const startTime = Date.now();
        
        // タイムアウト処理（30秒以上かかったら強制終了）
        const timeoutID = setTimeout(() => {
            if (this.isAIThinking) {
                console.error('AIの思考がタイムアウトしました');
                this.isAIThinking = false;
                this.hideThinkingUI();
                
                // 手番を元に戻す
                this.shogiBoard.currentTurn = originalTurn;
                
                // ランダムな手を選択して返す
                const randomMove = this.selectRandomMove();
                if (moveCallback && typeof moveCallback === 'function') {
                    moveCallback(randomMove);
                }
            }
        }, 30000); // 30秒でタイムアウト
        
        // Web Workerでバックグラウンド処理を行いたいが、
        // シンプルにするために単一スレッドで実装
        setTimeout(() => {
            // 思考が中止されていたら何もしない
            if (!this.isAIThinking) {
                clearTimeout(timeoutID);
                // 手番を元に戻す
                this.shogiBoard.currentTurn = originalTurn;
                return;
            }
            
            try {
                // AIエンジンで最善手を計算
                const bestMove = this.chessEngine.findBestMove(true); // 強制的に手を返すように
                
                // タイムアウト処理をクリア
                clearTimeout(timeoutID);
                
                // 経過時間を計算
                const elapsedTime = Date.now() - startTime;
                
                // 最小思考時間を確保するための調整
                if (elapsedTime < minThinkTime) {
                    setTimeout(() => {
                        // 手番が変わっていた場合は元に戻す
                        if (this.shogiBoard.currentTurn !== originalTurn) {
                            this.shogiBoard.currentTurn = originalTurn;
                        }
                        this.finishThinking(bestMove, moveCallback);
                    }, minThinkTime - elapsedTime);
                } else {
                    // 手番が変わっていた場合は元に戻す
                    if (this.shogiBoard.currentTurn !== originalTurn) {
                        this.shogiBoard.currentTurn = originalTurn;
                    }
                    this.finishThinking(bestMove, moveCallback);
                }
            } catch (error) {
                // エラーが発生した場合
                console.error('AIの思考中にエラーが発生しました:', error);
                clearTimeout(timeoutID);
                this.isAIThinking = false;
                this.hideThinkingUI();
                
                // 手番を元に戻す
                this.shogiBoard.currentTurn = originalTurn;
                
                // ランダムな手を選択して返す
                const randomMove = this.selectRandomMove();
                if (moveCallback && typeof moveCallback === 'function') {
                    moveCallback(randomMove);
                }
            }
        }, 0);
    }
    
    /**
     * 思考を終了し、結果を返す
     * @param {Object} move AIが選択した指し手
     * @param {Function} moveCallback コールバック関数
     */
    finishThinking(move, moveCallback) {
        // 思考が中止されていたら何もしない
        if (!this.isAIThinking) return;
        
        // 思考を終了
        this.isAIThinking = false;
        this.hideThinkingUI();
        
        console.log('AI思考完了:', move);
        
        // AIの手番を設定（プレイヤーの設定によって決定）
        const aiTurn = this.playerSide === PLAYER_SIDE.FIRST ? 
                      PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
        
        // 現在の手番がAIの手番でない場合は修正（これが重要）
        if (this.shogiBoard.currentTurn !== aiTurn) {
            console.warn('手番が不正な状態です。AIの手番に修正します:', 
                        'Current:', this.shogiBoard.currentTurn, 
                        'Should be:', aiTurn);
            this.shogiBoard.currentTurn = aiTurn;
            this.shogiBoard.updateTurnDisplay();
        }
        
        // コールバックで指し手を返す
        if (moveCallback && typeof moveCallback === 'function') {
            moveCallback(move);
        }
    }
    
    /**
     * AIの思考を停止する
     */
    stopThinking() {
        if (!this.isAIThinking) return;
        
        this.isAIThinking = false;
        this.hideThinkingUI();
    }
    
    /**
     * AI思考中のUIを表示
     */
    showThinkingUI() {
        this.aiThinkingElement.style.display = 'flex';
    }
    
    /**
     * AI思考中のUIを非表示
     */
    hideThinkingUI() {
        this.aiThinkingElement.style.display = 'none';
    }
    
    /**
     * ランダムな手を選択する（エラー時や思考タイムアウト時のフォールバック用）
     * @returns {Object} ランダムな指し手
     */
    selectRandomMove() {
        console.log('ランダムな手を選択します');
        try {
            // 現在の手番を保存
            const originalTurn = this.shogiBoard.currentTurn;
            
            // AIの手番を設定
            const aiTurn = this.playerSide === PLAYER_SIDE.FIRST ? 
                          PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
            this.shogiBoard.currentTurn = aiTurn;
            
            // 合法手を生成
            const legalMoves = this.shogiBoard.generateLegalMoves();
            
            // 手番を元に戻す
            this.shogiBoard.currentTurn = originalTurn;
            
            // 合法手がある場合はランダムに選択
            if (legalMoves && legalMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * legalMoves.length);
                return legalMoves[randomIndex];
            }
        } catch (e) {
            console.error('ランダムな手の選択に失敗しました:', e);
        }
        
        // 最終手段として投了
        return { resign: true, message: '思考中にエラーが発生したため、投了します' };
    }
}

// グローバル変数としてAIインターフェースのインスタンスを保持
let aiInterface = null;

/**
 * AIインターフェースのインスタンスを初期化する
 * @param {ShogiBoard} shogiBoard 将棋盤のインスタンス
 */
function initializeAIInterface(shogiBoard) {
    aiInterface = new AIInterface(shogiBoard);
    return aiInterface;
} 