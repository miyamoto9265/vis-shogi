/**
 * AI対戦機能のインターフェースを提供するモジュール
 * YaneuraOu WebAssembly版との通信を担当
 */

// AIの難易度レベル
const AI_DIFFICULTY = {
    BEGINNER: 'beginner',    // 初級
    INTERMEDIATE: 'intermediate', // 中級
    ADVANCED: 'advanced'     // 上級
};

// プレイヤーの手番
const PLAYER_SIDE = {
    FIRST: 'first',  // 先手
    SECOND: 'second' // 後手
};

// 持ち時間設定（秒）
const TIME_LIMIT = {
    NONE: 'none'     // 無制限
};

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
        this.timeLimit = TIME_LIMIT.NONE;
        
        // WebAssembly版YaneuraOuの読み込み状況
        this.engineLoaded = false;
        
        // モック用の思考時間（実際のAIが実装されるまでの仮実装）
        this.mockThinkingTime = {
            [AI_DIFFICULTY.BEGINNER]: 1000,      // 1秒
            [AI_DIFFICULTY.INTERMEDIATE]: 2000,  // 2秒
            [AI_DIFFICULTY.ADVANCED]: 3000       // 3秒
        };
    }
    
    /**
     * AI設定を更新する
     * @param {string} difficulty 難易度
     * @param {string} playerSide プレイヤーの手番
     * @param {string} timeLimit 持ち時間
     */
    updateSettings(difficulty, playerSide, timeLimit) {
        this.difficulty = difficulty;
        this.playerSide = playerSide;
        this.timeLimit = timeLimit;
        
        console.log(`AI設定を更新: 難易度=${difficulty}, プレイヤー手番=${playerSide}, 持ち時間=${timeLimit}`);
    }
    
    /**
     * AIの思考を開始する
     * @param {Function} moveCallback AIが指し手を決定した時のコールバック関数
     */
    startThinking(moveCallback) {
        if (this.isAIThinking) return;
        
        this.isAIThinking = true;
        this.showThinkingUI();
        
        // 現在の盤面状態を取得
        const boardState = this.shogiBoard.getBoardState();
        
        // モックAI思考処理（実際のAIが実装されるまでの仮実装）
        this.mockAIThinking(boardState, moveCallback);
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
     * モック実装: AIの思考をシミュレート
     * @param {Array} boardState 盤面状態
     * @param {Function} moveCallback AIが指し手を決定した時のコールバック関数
     */
    mockAIThinking(boardState, moveCallback) {
        // 難易度に応じた思考時間を設定
        const thinkingTime = this.mockThinkingTime[this.difficulty];
        
        // 思考時間後に指し手を返す
        setTimeout(() => {
            // 思考が中止されていたら何もしない
            if (!this.isAIThinking) return;
            
            // ランダムな合法手を生成
            const move = this.generateRandomLegalMove();
            
            // 思考を終了
            this.isAIThinking = false;
            this.hideThinkingUI();
            
            // コールバックで指し手を返す
            if (moveCallback && typeof moveCallback === 'function') {
                moveCallback(move);
            }
        }, thinkingTime);
    }
    
    /**
     * モック実装: ランダムな合法手を生成
     * @returns {Object} 指し手情報
     */
    generateRandomLegalMove() {
        // 現在の手番の駒のリストを取得
        const pieces = this.shogiBoard.getPiecesForCurrentTurn();
        
        // 合法手のリストを作成
        const legalMoves = [];
        
        // 各駒について移動可能なマスを調べる
        pieces.forEach(piece => {
            const movableCells = this.shogiBoard.getMovableCells(piece.row, piece.col, piece);
            
            // 各移動可能マスを合法手リストに追加
            movableCells.forEach(cell => {
                legalMoves.push({
                    fromRow: piece.row,
                    fromCol: piece.col,
                    toRow: cell.row,
                    toCol: cell.col,
                    piece: piece
                });
            });
        });
        
        // 持ち駒についても調べる
        const capturedPieces = this.shogiBoard.getCapturedPiecesForCurrentTurn();
        
        // 各持ち駒について打てるマスを調べる
        Object.entries(capturedPieces).forEach(([pieceType, count]) => {
            if (count > 0) {
                const droppableCells = this.shogiBoard.getDroppableCells(pieceType);
                
                // 各打てるマスを合法手リストに追加
                droppableCells.forEach(cell => {
                    legalMoves.push({
                        fromRow: -1,  // 持ち駒からの指し手を示す特殊値
                        fromCol: -1,
                        toRow: cell.row,
                        toCol: cell.col,
                        pieceType: pieceType
                    });
                });
            }
        });
        
        // 合法手がない場合は投了
        if (legalMoves.length === 0) {
            return { resign: true };
        }
        
        // ランダムに1手選択
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        return legalMoves[randomIndex];
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