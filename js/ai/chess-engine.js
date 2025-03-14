/**
 * 将棋AIエンジン
 * ミニマックスアルゴリズムと評価関数による思考エンジン
 */
console.log('chess-engine.js loaded');

// AIの難易度レベルとプレイヤーの手番はindex.htmlで定義されています

/**
 * 駒の基本的な価値(歩=1とした相対値)
 */
const PIECE_VALUES = {
    [PIECE_TYPES.PAWN]: 1,      // 歩兵
    [PIECE_TYPES.LANCE]: 5,     // 香車
    [PIECE_TYPES.KNIGHT]: 5,    // 桂馬
    [PIECE_TYPES.SILVER]: 7,    // 銀将
    [PIECE_TYPES.GOLD]: 8,      // 金将
    [PIECE_TYPES.BISHOP]: 10,   // 角行
    [PIECE_TYPES.ROOK]: 12,     // 飛車
    [PIECE_TYPES.KING]: 10000   // 王将/玉将
};

/**
 * 成り駒の価値
 */
const PROMOTED_PIECE_VALUES = {
    [PIECE_TYPES.PAWN]: 8,      // と金
    [PIECE_TYPES.LANCE]: 8,     // 成香
    [PIECE_TYPES.KNIGHT]: 8,    // 成桂
    [PIECE_TYPES.SILVER]: 8,    // 成銀
    [PIECE_TYPES.BISHOP]: 14,   // 馬
    [PIECE_TYPES.ROOK]: 17      // 龍
};

/**
 * 盤面上の位置ごとの評価値（先手視点、9x9の盤面）
 * 数値が大きいほど有利な位置
 */
const POSITION_VALUES = {
    [PIECE_TYPES.PAWN]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [20, 20, 20, 20, 20, 20, 20, 20, 20],
        [15, 15, 15, 15, 15, 15, 15, 15, 15],
        [10, 10, 10, 10, 10, 10, 10, 10, 10],
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [2, 2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // 香車: 前方への進出を評価
    [PIECE_TYPES.LANCE]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [15, 15, 15, 15, 15, 15, 15, 15, 15],
        [10, 10, 10, 10, 10, 10, 10, 10, 10],
        [8, 8, 8, 8, 8, 8, 8, 8, 8],
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [3, 3, 3, 3, 3, 3, 3, 3, 3],
        [2, 2, 2, 2, 2, 2, 2, 2, 2],
        [1, 1, 1, 1, 1, 1, 1, 1, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // 桂馬: 前方への進出を評価
    [PIECE_TYPES.KNIGHT]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [15, 18, 20, 20, 20, 20, 20, 18, 15],
        [12, 15, 18, 18, 18, 18, 18, 15, 12],
        [8, 10, 12, 12, 15, 12, 12, 10, 8],
        [5, 8, 10, 10, 10, 10, 10, 8, 5],
        [3, 5, 8, 8, 8, 8, 8, 5, 3],
        [2, 2, 3, 3, 5, 3, 3, 2, 2],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // 銀将: 中央寄りの位置を評価
    [PIECE_TYPES.SILVER]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [10, 12, 15, 15, 15, 15, 15, 12, 10],
        [8, 10, 12, 12, 12, 12, 12, 10, 8],
        [5, 8, 10, 10, 10, 10, 10, 8, 5],
        [3, 5, 8, 8, 8, 8, 8, 5, 3],
        [2, 3, 5, 5, 5, 5, 5, 3, 2],
        [1, 2, 3, 3, 3, 3, 3, 2, 1],
        [0, 1, 2, 2, 2, 2, 2, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // 金将: 敵陣での働きを評価
    [PIECE_TYPES.GOLD]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [15, 18, 20, 20, 20, 20, 20, 18, 15],
        [12, 15, 18, 18, 18, 18, 18, 15, 12],
        [10, 12, 15, 15, 15, 15, 15, 12, 10],
        [5, 8, 10, 10, 10, 10, 10, 8, 5],
        [3, 5, 8, 8, 8, 8, 8, 5, 3],
        [2, 3, 5, 5, 5, 5, 5, 3, 2],
        [1, 2, 3, 3, 3, 3, 3, 2, 1],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
    ],
    // 角行: 中央からの働きを評価
    [PIECE_TYPES.BISHOP]: [
        [5, 5, 5, 5, 5, 5, 5, 5, 5],
        [5, 8, 8, 8, 8, 8, 8, 8, 5],
        [5, 8, 10, 10, 10, 10, 10, 8, 5],
        [5, 8, 10, 12, 12, 12, 10, 8, 5],
        [5, 8, 10, 12, 15, 12, 10, 8, 5],
        [5, 8, 10, 12, 12, 12, 10, 8, 5],
        [5, 8, 10, 10, 10, 10, 10, 8, 5],
        [5, 8, 8, 8, 8, 8, 8, 8, 5],
        [5, 5, 5, 5, 5, 5, 5, 5, 5]
    ],
    // 飛車: 中央からの働きを評価
    [PIECE_TYPES.ROOK]: [
        [5, 5, 5, 8, 8, 8, 5, 5, 5],
        [5, 5, 5, 8, 10, 8, 5, 5, 5],
        [5, 5, 5, 8, 10, 8, 5, 5, 5],
        [8, 8, 8, 10, 12, 10, 8, 8, 8],
        [8, 10, 10, 12, 15, 12, 10, 10, 8],
        [8, 8, 8, 10, 12, 10, 8, 8, 8],
        [5, 5, 5, 8, 10, 8, 5, 5, 5],
        [5, 5, 5, 8, 10, 8, 5, 5, 5],
        [5, 5, 5, 8, 8, 8, 5, 5, 5]
    ],
    // 王将: 安全性を重視
    [PIECE_TYPES.KING]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [1, 1, 1, 0, 0, 0, 1, 1, 1],
        [3, 5, 5, 0, 0, 0, 5, 5, 3],
        [5, 10, 15, 0, 0, 0, 15, 10, 5]
    ]
};

/**
 * 将棋AIエンジンクラス
 */
class ChessEngine {
    /**
     * コンストラクタ
     * @param {ShogiBoard} shogiBoard 将棋盤のインスタンス
     */
    constructor(shogiBoard) {
        this.shogiBoard = shogiBoard;
        this.maxDepth = 3; // 標準的な探索の深さ
        this.aiPlayer = PIECE_OWNER.OPPONENT; // AIは後手として設定
    }
    
    /**
     * AIの難易度を設定
     * @param {string} difficulty 難易度 (beginner, intermediate, advanced)
     */
    setDifficulty(difficulty) {
        switch(difficulty) {
            case AI_DIFFICULTY.BEGINNER:
                this.maxDepth = 2;
                break;
            case AI_DIFFICULTY.INTERMEDIATE:
                this.maxDepth = 3;
                break;
            case AI_DIFFICULTY.ADVANCED:
                this.maxDepth = 4;
                break;
            default:
                this.maxDepth = 3;
        }
        console.log(`AI難易度を設定: ${difficulty}, 探索深さ: ${this.maxDepth}`);
    }
    
    /**
     * AIのプレイヤー側を設定
     * @param {string} playerSide プレイヤーの手番 (first, second)
     */
    setPlayerSide(playerSide) {
        this.aiPlayer = playerSide === PLAYER_SIDE.FIRST ? 
                        PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
    }
    
    /**
     * 最善手を見つける
     * @param {boolean} forceMove 合法手がない場合に投了するか
     * @return {Object} 最善手の情報
     */
    findBestMove(forceMove = false) {
        // 現在の手番を保存
        const originalTurn = this.shogiBoard.currentTurn;
        
        try {
            // 自分の王がないか確認（これは通常起こりえないが、念のためチェック）
            let aiKingExists = false;
            
            for (let row = 0; row < BOARD_SIZE; row++) {
                for (let col = 0; col < BOARD_SIZE; col++) {
                    const piece = this.shogiBoard.board[row][col];
                    if (piece && piece.type === PIECE_TYPES.KING && piece.owner === this.aiPlayer) {
                        aiKingExists = true;
                        break;
                    }
                }
                if (aiKingExists) break;
            }
            
            // AIの王がない場合は投了
            if (!aiKingExists) {
                this.shogiBoard.currentTurn = originalTurn; // 元の手番に戻す
                return { resign: true, message: '投了しました' };
            }
            
            // 合法手を生成
            this.shogiBoard.currentTurn = this.aiPlayer;
            const legalMoves = this.shogiBoard.generateLegalMoves();
            
            // 合法手がない場合
            if (legalMoves.length === 0) {
                this.shogiBoard.currentTurn = originalTurn; // 元の手番に戻す
                if (forceMove) {
                    return { resign: true, message: '投了しました' };
                } else {
                    console.error('AIの合法手がありません');
                    return null;
                }
            }
            
            // 最善手を探索
            let bestScore = -Infinity;
            let bestMove = null;
            
            // 各合法手について評価
            for (let i = 0; i < legalMoves.length; i++) {
                const move = legalMoves[i];
                
                // 手を適用
                const capturedPiece = this.shogiBoard.makeMove(move);
                
                // ミニマックスでスコアを評価（次の手番は相手なのでfalse）
                const score = this.minimax(this.maxDepth - 1, -Infinity, Infinity, false);
                
                // 手を元に戻す
                this.shogiBoard.undoMove(move, capturedPiece);
                
                // より良いスコアが見つかったら更新
                if (score > bestScore) {
                    bestScore = score;
                    bestMove = move;
                }
            }
    
            // 初級モードでは10%の確率でランダムな手を選ぶ
            if (this.maxDepth === 2 && Math.random() < 0.1) {
                const randomIndex = Math.floor(Math.random() * legalMoves.length);
                bestMove = legalMoves[randomIndex];
            }
            
            // 元の手番に戻す
            this.shogiBoard.currentTurn = originalTurn;
            return bestMove;
        } catch (error) {
            // エラーが発生した場合でも必ず元の手番に戻す
            console.error('findBestMoveでエラーが発生しました:', error);
            this.shogiBoard.currentTurn = originalTurn;
            throw error; // エラーを再スロー
        }
    }
    
    /**
     * minimax アルゴリズムで最善手を見つける
     * @param {number} depth 探索の深さ
     * @param {number} alpha アルファ値
     * @param {number} beta ベータ値
     * @param {boolean} isMaximizingPlayer 最大化プレイヤーか
     * @return {number} 評価値
     */
    minimax(depth, alpha, beta, isMaximizingPlayer) {
        // 探索の終了条件
        if (depth === 0) {
            return this.evalScore(depth);
        }

        // 現在の手番を保存
        const currentPlayer = this.shogiBoard.currentTurn;
        
        try {
            this.shogiBoard.currentTurn = isMaximizingPlayer ? this.aiPlayer : 
                (this.aiPlayer === PIECE_OWNER.PLAYER ? PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER);
            
            // 合法手を生成
            const legalMoves = this.shogiBoard.generateLegalMoves();
            
            // クイーサーチ（末端ノードでの評価の安定化）
            if (depth === 1 && legalMoves.length > 5) {
                // 駒を取る手と成る手のみを抽出
                const captureMoves = legalMoves.filter(move => 
                    (move.capturedPiece || 
                    (move.promotion && this.shogiBoard.canPromote(move.piece.type, move.toRow))));
                    
                if (captureMoves.length > 0) {
                    // 駒を取る手や成る手があれば、それらのみを評価
                    const bestMoveValue = this.evaluateCaptureMoves(captureMoves, alpha, beta, isMaximizingPlayer);
                    this.shogiBoard.currentTurn = currentPlayer;
                    return bestMoveValue;
                }
            }
            
            if (legalMoves.length === 0) {
                // 合法手がない場合（詰み）
                this.shogiBoard.currentTurn = currentPlayer;
                return isMaximizingPlayer ? -9999 : 9999;
            }
    
            if (isMaximizingPlayer) {
                let maxEval = -Infinity;
                
                for (const move of legalMoves) {
                    // 手を実行
                    const capturedPiece = this.shogiBoard.makeMove(move);
                    
                    // 次の深さで探索
                    const evalValue = this.minimax(depth - 1, alpha, beta, false);
                    
                    // 手を元に戻す
                    this.shogiBoard.undoMove(move, capturedPiece);
                    
                    // 評価値の更新
                    maxEval = Math.max(maxEval, evalValue);
                    alpha = Math.max(alpha, evalValue);
                    
                    // アルファベータ枝刈り
                    if (beta <= alpha) {
                        break;
                    }
                }
                
                // 手番を元に戻す
                this.shogiBoard.currentTurn = currentPlayer;
                return maxEval;
            } else {
                let minEval = Infinity;
                
                for (const move of legalMoves) {
                    // 手を実行
                    const capturedPiece = this.shogiBoard.makeMove(move);
                    
                    // 次の深さで探索
                    const evalValue = this.minimax(depth - 1, alpha, beta, true);
                    
                    // 手を元に戻す
                    this.shogiBoard.undoMove(move, capturedPiece);
                    
                    // 評価値の更新
                    minEval = Math.min(minEval, evalValue);
                    beta = Math.min(beta, evalValue);
                    
                    // アルファベータ枝刈り
                    if (beta <= alpha) {
                        break;
                    }
                }
                
                // 手番を元に戻す
                this.shogiBoard.currentTurn = currentPlayer;
                return minEval;
            }
        } catch (error) {
            // エラーが発生した場合でも手番を元に戻す
            console.error('minimaxでエラーが発生しました:', error);
            this.shogiBoard.currentTurn = currentPlayer;
            throw error; // エラーを再スロー
        }
    }
    
    /**
     * 駒を取る手と成る手のみを評価（クイーサーチ）
     * @param {Array} captureMoves 駒を取る手や成る手の配列
     * @param {number} alpha アルファ値
     * @param {number} beta ベータ値
     * @param {boolean} isMaximizingPlayer 最大化プレイヤーか
     * @return {number} 評価値
     */
    evaluateCaptureMoves(captureMoves, alpha, beta, isMaximizingPlayer) {
        // 現在の手番を保存
        const currentPlayer = this.shogiBoard.currentTurn;
        
        try {
            if (captureMoves.length === 0) {
                return this.evalScore(0);
            }
            
            if (isMaximizingPlayer) {
                let maxEval = -Infinity;
                
                for (const move of captureMoves) {
                    // 手を実行
                    const capturedPiece = this.shogiBoard.makeMove(move);
                    
                    // 次の深さで探索（駒を取る手のみ）
                    const evalValue = this.evalScore(0);
                    
                    // 手を元に戻す
                    this.shogiBoard.undoMove(move, capturedPiece);
                    
                    // 評価値の更新
                    maxEval = Math.max(maxEval, evalValue);
                    alpha = Math.max(alpha, evalValue);
                    
                    // アルファベータ枝刈り
                    if (beta <= alpha) {
                        break;
                    }
                }
                
                // 手番を元に戻す
                this.shogiBoard.currentTurn = currentPlayer;
                return maxEval;
            } else {
                let minEval = Infinity;
                
                for (const move of captureMoves) {
                    // 手を実行
                    const capturedPiece = this.shogiBoard.makeMove(move);
                    
                    // 次の深さで探索（駒を取る手のみ）
                    const evalValue = this.evalScore(0);
                    
                    // 手を元に戻す
                    this.shogiBoard.undoMove(move, capturedPiece);
                    
                    // 評価値の更新
                    minEval = Math.min(minEval, evalValue);
                    beta = Math.min(beta, evalValue);
                    
                    // アルファベータ枝刈り
                    if (beta <= alpha) {
                        break;
                    }
                }
                
                // 手番を元に戻す
                this.shogiBoard.currentTurn = currentPlayer;
                return minEval;
            }
        } catch (error) {
            // エラーが発生した場合でも手番を元に戻す
            console.error('evaluateCaptureMoves でエラーが発生しました:', error);
            this.shogiBoard.currentTurn = currentPlayer;
            throw error; // エラーを再スロー
        }
    }
    
    /**
     * 盤面を評価する
     * @param {number} depth 現在の探索深さ
     * @return {number} 評価値
     */
    evalScore(depth) {
        let score = 0;
        
        // 駒の価値と位置による評価
        score += this.evaluateMaterial();
        
        // 攻撃力の評価（自分の駒が相手の駒を攻撃できる数）
        score += this.evaluateAttackPotential() * 0.8;
        
        // 駒の機動性評価（合法手の数に基づく評価）
        score += this.evaluateMobility() * 0.5;
        
        // 玉の安全性評価
        score += this.evaluateKingSafety() * 1.2;
        
        // 持ち駒の評価
        score += this.evaluateHand() * 0.7;
        
        // 深さによるボーナス（早く勝つ/遅く負ける判断のため）
        if (score > 0) {
            score += (this.maxDepth - depth) * 0.1; // 勝ちそうなら早く決着
        } else if (score < 0) {
            score -= (this.maxDepth - depth) * 0.1; // 負けそうなら遅らせる
        }
        
        // AIが先手の場合は評価値を反転
        if (this.aiPlayer === PIECE_OWNER.PLAYER) {
            score = -score;
        }
        
        return score;
    }
    
    /**
     * 駒の機動性評価（合法手の数に基づく評価）
     * @return {number} 評価値
     */
    evaluateMobility() {
        const originalTurn = this.shogiBoard.currentTurn;
        
        try {
            // 現在の手番の合法手の数
            this.shogiBoard.currentTurn = this.aiPlayer;
            const aiMoves = this.shogiBoard.generateLegalMoves().length;
            
            // 相手の手番の合法手の数
            const opponentPlayer = this.aiPlayer === PIECE_OWNER.PLAYER ? PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
            this.shogiBoard.currentTurn = opponentPlayer;
            const opponentMoves = this.shogiBoard.generateLegalMoves().length;
            
            // 元の手番に戻す
            this.shogiBoard.currentTurn = originalTurn;
            
            // 自分の合法手数 - 相手の合法手数
            return (aiMoves - opponentMoves) * 0.1;
        } catch (error) {
            // エラーが発生した場合でも手番を元に戻す
            console.error('evaluateMobilityでエラーが発生しました:', error);
            this.shogiBoard.currentTurn = originalTurn;
            throw error; // エラーを再スロー
        }
    }
    
    /**
     * 玉の安全性評価
     * @return {number} 評価値
     */
    evaluateKingSafety() {
        const board = this.shogiBoard.board;
        let score = 0;
        
        // 自分の玉と相手の玉の位置を取得
        let aiKingPos = null;
        let opponentKingPos = null;
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece && piece.type === PIECE_TYPES.KING) {
                    if (piece.owner === this.aiPlayer) {
                        aiKingPos = { row, col };
                    } else {
                        opponentKingPos = { row, col };
                    }
                }
            }
        }
        
        if (aiKingPos && opponentKingPos) {
            // 自分の玉の周りの駒の数（守りの評価）
            const aiKingRow = aiKingPos.row;
            const aiKingCol = aiKingPos.col;
            let aiKingDefenders = 0;
            
            for (let r = Math.max(0, aiKingRow - 1); r <= Math.min(8, aiKingRow + 1); r++) {
                for (let c = Math.max(0, aiKingCol - 1); c <= Math.min(8, aiKingCol + 1); c++) {
                    if (r === aiKingRow && c === aiKingCol) continue;
                    
                    const piece = board[r][c];
                    if (piece && piece.owner === this.aiPlayer) {
                        aiKingDefenders++;
                    }
                }
            }
            
            // 相手の玉の周りの駒の数（攻めの評価）
            const opponentKingRow = opponentKingPos.row;
            const opponentKingCol = opponentKingPos.col;
            let opponentKingAttackers = 0;
            
            for (let r = Math.max(0, opponentKingRow - 1); r <= Math.min(8, opponentKingRow + 1); r++) {
                for (let c = Math.max(0, opponentKingCol - 1); c <= Math.min(8, opponentKingCol + 1); c++) {
                    if (r === opponentKingRow && c === opponentKingCol) continue;
                    
                    const piece = board[r][c];
                    if (piece && piece.owner === this.aiPlayer) {
                        opponentKingAttackers++;
                    }
                }
            }
            
            // 玉の安全性スコア
            score += aiKingDefenders * 5;       // 自玉の守り
            score += opponentKingAttackers * 3; // 相手玉への攻め
        }
        
        return score;
    }
    
    /**
     * 持ち駒の評価
     * @return {number} 評価値
     */
    evaluateHand() {
        const aiHand = this.shogiBoard.getHand(this.aiPlayer);
        const opponentHand = this.shogiBoard.getHand(this.aiPlayer === PIECE_OWNER.PLAYER ? PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER);
        
        let score = 0;
        
        // AIの持ち駒の価値
        for (const [pieceType, count] of Object.entries(aiHand)) {
            if (count > 0 && PIECE_VALUES[pieceType]) {
                score += PIECE_VALUES[pieceType] * count * 0.8; // 盤上の駒より価値を低く
            }
        }
        
        // 相手の持ち駒の価値
        for (const [pieceType, count] of Object.entries(opponentHand)) {
            if (count > 0 && PIECE_VALUES[pieceType]) {
                score -= PIECE_VALUES[pieceType] * count * 0.8; // 盤上の駒より価値を低く
            }
        }
        
        return score;
    }
    
    /**
     * 盤面をコピーする
     * @param {Array} board 盤面
     * @returns {Array} コピーされた盤面
     */
    copyBoard(board) {
        return JSON.parse(JSON.stringify(board));
    }
    
    /**
     * 持ち駒をコピーする
     * @param {Object} capturedPieces 持ち駒
     * @returns {Object} コピーされた持ち駒
     */
    copyCapturedPieces(capturedPieces) {
        return JSON.parse(JSON.stringify(capturedPieces));
    }

    /**
     * 駒の価値と位置の評価
     * @return {number} 評価値
     */
    evaluateMaterial() {
        const board = this.shogiBoard.board;
        let score = 0;
        
        // 盤上の駒の価値と位置評価
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const piece = board[row][col];
                if (piece) {
                    // 基本駒の価値
                    let pieceValue = piece.promoted ? 
                        PROMOTED_PIECE_VALUES[piece.type] : 
                        PIECE_VALUES[piece.type];
                    
                    // 位置による価値の補正
                    let posValue = 0;
                    
                    // 駒の種類に応じた位置評価マトリックスを取得
                    let posMatrix = POSITION_VALUES[piece.type];
                    
                    // 位置評価マトリックスがある場合は評価値を取得
                    if (posMatrix) {
                        // 先手と後手で位置の評価を反転
                        if (piece.owner === PIECE_OWNER.PLAYER) {
                            posValue = posMatrix[8 - row][col]; // 先手視点
                        } else {
                            posValue = posMatrix[row][col]; // 後手視点
                        }
                    }
                    
                    // 合計評価値の計算
                    const totalValue = pieceValue + posValue * 0.1;
                    
                    // 所有者に応じてスコアに加減
                    if (piece.owner === this.aiPlayer) {
                        score += totalValue;
                    } else {
                        score -= totalValue;
                    }
                }
            }
        }
        
        return score;
    }

    /**
     * 攻撃力の評価（自分の駒が相手の駒を攻撃できる数）
     * @return {number} 評価値
     */
    evaluateAttackPotential() {
        const board = this.shogiBoard.board;
        let score = 0;
        
        // 盤上の駒を走査
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = board[row][col];
                if (!piece) continue;
                
                // 自分の駒の場合
                if (piece.owner === this.aiPlayer) {
                    // 駒の移動可能なマスを取得
                    const movableCells = this.shogiBoard.getMovableCells(row, col, piece);
                    
                    // 各移動可能なマスについて
                    movableCells.forEach(cell => {
                        const targetPiece = board[cell.row][cell.col];
                        
                        // 相手の駒があれば攻撃ポイントを加算
                        if (targetPiece && targetPiece.owner !== this.aiPlayer) {
                            // 駒の価値に応じてスコアを加算
                            let targetValue = targetPiece.promoted ? 
                                PROMOTED_PIECE_VALUES[targetPiece.type] : 
                                PIECE_VALUES[targetPiece.type];
                            
                            // 攻撃対象の駒の価値に応じてスコアを調整
                            score += (targetValue * 0.1);
                        }
                    });
                }
            }
        }
        
        return score;
    }
} 