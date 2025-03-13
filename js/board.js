/**
 * 将棋盤の描画と操作を担当するモジュール
 */

// 将棋盤のサイズ
const BOARD_SIZE = 9;

// 将棋盤の状態を管理するクラス
class ShogiBoard {
    /**
     * コンストラクタ
     * @param {HTMLElement} boardElement 将棋盤を表示する要素
     * @param {HTMLElement} playerCapturedElement プレイヤーの持ち駒を表示する要素
     * @param {HTMLElement} opponentCapturedElement 相手の持ち駒を表示する要素
     * @param {HTMLElement} turnDisplayElement 手番を表示する要素
     */
    constructor(boardElement, playerCapturedElement, opponentCapturedElement, turnDisplayElement) {
        this.boardElement = boardElement;
        this.playerCapturedElement = playerCapturedElement;
        this.opponentCapturedElement = opponentCapturedElement;
        this.turnDisplayElement = turnDisplayElement;
        
        // 将棋盤の状態（9x9の二次元配列）
        this.board = JSON.parse(JSON.stringify(INITIAL_BOARD));
        
        // 持ち駒の状態
        this.capturedPieces = {
            [PIECE_OWNER.PLAYER]: {},
            [PIECE_OWNER.OPPONENT]: {}
        };
        
        // 現在の手番（先手から始める）
        this.currentTurn = PIECE_OWNER.PLAYER;
        
        // 選択中の駒の位置
        this.selectedPiece = null;
        
        // 選択中の持ち駒
        this.selectedCapturedPiece = null;
        
        // 移動可能なマスのリスト
        this.movableCells = [];
        
        // 最後に動かした駒の位置
        this.lastMovedPiece = null;
        
        // ゲーム終了フラグ
        this.gameOver = false;
        
        // 全駒の移動可能マス表示フラグ
        this.showAllMovableCells = true;
        
        // 駒を取る・取られる表示フラグ
        this.showCapturableMarks = true;
        
        // 将棋盤の初期化
        this.initializeBoard();
        
        // 持ち駒エリアのイベントリスナーを設定
        this.setupCapturedPiecesListeners();
        
        // 手番表示の更新
        this.updateTurnDisplay();
        
        // 全駒の移動可能マスと駒を取る・取られる表示を更新
        this.updateAllMovableCellsAndMarks();
    }
    
    /**
     * 将棋盤を初期化する
     */
    initializeBoard() {
        // 将棋盤の要素をクリア
        this.boardElement.innerHTML = '';
        
        // 9x9のマスを作成
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // マスの要素を作成
                const cell = document.createElement('div');
                cell.classList.add('board-cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // マスをクリックしたときの処理
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                // 将棋盤に追加
                this.boardElement.appendChild(cell);
                
                // マスに駒があれば表示
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = createPieceElement(piece);
                    cell.appendChild(pieceElement);
                }
            }
        }
        
        // 持ち駒エリアを初期化
        this.playerCapturedElement.innerHTML = '';
        this.opponentCapturedElement.innerHTML = '';
    }
    
    /**
     * 持ち駒エリアのイベントリスナーを設定する
     */
    setupCapturedPiecesListeners() {
        // プレイヤーの持ち駒エリアのクリックイベント
        this.playerCapturedElement.addEventListener('click', (event) => {
            // 手番が先手でない場合は何もしない
            if (this.currentTurn !== PIECE_OWNER.PLAYER) return;
            
            // クリックされた要素が駒かどうか確認
            const pieceElement = event.target.closest('.piece');
            if (!pieceElement) return;
            
            // 駒の種類を取得
            const pieceType = Array.from(pieceElement.classList)
                .find(cls => Object.values(PIECE_TYPES).includes(cls));
            
            // 持ち駒がない場合は何もしない
            if (!this.capturedPieces[PIECE_OWNER.PLAYER][pieceType]) return;
            
            // 既に選択されている駒があれば選択を解除
            this.clearSelection();
            
            // 持ち駒を選択状態にする
            this.selectedCapturedPiece = { type: pieceType, owner: PIECE_OWNER.PLAYER };
            
            // 選択された持ち駒にクラスを追加
            pieceElement.classList.add('selected');
            
            // 打てるマスを表示
            this.showDroppableCells(pieceType, PIECE_OWNER.PLAYER);
        });
        
        // 相手の持ち駒エリアのクリックイベント
        this.opponentCapturedElement.addEventListener('click', (event) => {
            // 手番が後手でない場合は何もしない
            if (this.currentTurn !== PIECE_OWNER.OPPONENT) return;
            
            // クリックされた要素が駒かどうか確認
            const pieceElement = event.target.closest('.piece');
            if (!pieceElement) return;
            
            // 駒の種類を取得
            const pieceType = Array.from(pieceElement.classList)
                .find(cls => Object.values(PIECE_TYPES).includes(cls));
            
            // 持ち駒がない場合は何もしない
            if (!this.capturedPieces[PIECE_OWNER.OPPONENT][pieceType]) return;
            
            // 既に選択されている駒があれば選択を解除
            this.clearSelection();
            
            // 持ち駒を選択状態にする
            this.selectedCapturedPiece = { type: pieceType, owner: PIECE_OWNER.OPPONENT };
            
            // 選択された持ち駒にクラスを追加
            pieceElement.classList.add('selected');
            
            // 打てるマスを表示
            this.showDroppableCells(pieceType, PIECE_OWNER.OPPONENT);
        });
    }
    
    /**
     * マスがクリックされたときの処理
     * @param {number} row クリックされたマスの行
     * @param {number} col クリックされたマスの列
     */
    handleCellClick(row, col) {
        // ゲームが終了している場合は何もしない
        if (this.gameOver) return;
        
        // クリックされたマスの駒
        const piece = this.board[row][col];
        
        // 持ち駒が選択されている場合
        if (this.selectedCapturedPiece) {
            // 移動可能なマスでなければ何もしない
            if (!this.isMovableCell(row, col)) {
                return;
            }
            
            // 持ち駒を打つ
            this.dropPiece(this.selectedCapturedPiece.type, this.selectedCapturedPiece.owner, row, col);
            
            // 選択を解除
            this.clearSelection();
            
            // 手番を切り替える
            this.switchTurn();
            return;
        }
        
        // 駒が選択されていない場合
        if (!this.selectedPiece) {
            // クリックされたマスに駒がなければ何もしない
            if (!piece) return;
            
            // 自分の手番でない駒はクリックできない
            if (piece.owner !== this.currentTurn) return;
            
            // 駒を選択状態にする
            this.selectedPiece = { row, col, piece };
            
            // 選択されたマスにクラスを追加
            this.highlightCell(row, col, 'selected');
            
            // 移動可能なマスを表示
            this.showMovableCells(row, col, piece);
        } else {
            // 既に駒が選択されている場合
            
            // 同じマスをクリックした場合は選択を解除
            if (this.selectedPiece.row === row && this.selectedPiece.col === col) {
                this.clearSelection();
                return;
            }
            
            // 移動可能なマスでなければ何もしない
            if (!this.isMovableCell(row, col)) {
                // 自分の別の駒をクリックした場合は選択を切り替える
                if (piece && piece.owner === this.currentTurn) {
                    this.clearSelection();
                    this.handleCellClick(row, col);
                }
                return;
            }
            
            // 駒を移動する
            this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
            
            // 選択を解除
            this.clearSelection();
            
            // ゲームが終了していなければ手番を切り替える
            if (!this.gameOver) {
                this.switchTurn();
            }
        }
    }
    
    /**
     * 駒を移動する
     * @param {number} fromRow 移動元の行
     * @param {number} fromCol 移動元の列
     * @param {number} toRow 移動先の行
     * @param {number} toCol 移動先の列
     */
    movePiece(fromRow, fromCol, toRow, toCol) {
        // 移動元の駒
        const piece = this.board[fromRow][fromCol];
        
        // 移動先に駒があれば捕獲する
        const capturedPiece = this.board[toRow][toCol];
        if (capturedPiece) {
            // 王または玉を取った場合はゲーム終了
            if (capturedPiece.type === PIECE_TYPES.KING) {
                this.endGame(piece.owner);
            } else {
                this.capturePiece(capturedPiece);
            }
        }
        
        // 駒を移動
        this.board[toRow][toCol] = piece;
        this.board[fromRow][fromCol] = null;
        
        // 成り判定
        if (this.canPromote(piece, fromRow, toRow)) {
            // 成ることができる場合、ダイアログを表示
            this.showPromotionDialog(piece, toRow, toCol);
        } else {
            // 最後に動かした駒の位置を記録
            this.lastMovedPiece = { row: toRow, col: toCol };
            
            // 将棋盤を再描画
            this.redrawBoard();
        }
    }
    
    /**
     * 駒が成ることができるかを判定する
     * @param {Object} piece 駒オブジェクト
     * @param {number} fromRow 移動元の行
     * @param {number} toRow 移動先の行
     * @returns {boolean} 成ることができる場合はtrue
     */
    canPromote(piece, fromRow, toRow) {
        // 既に成り駒の場合は成れない
        if (piece.promoted) return false;
        
        // 成ることができない駒（王将、金将）は成れない
        if (piece.type === PIECE_TYPES.KING || piece.type === PIECE_TYPES.GOLD) return false;
        
        // 先手の場合
        if (piece.owner === PIECE_OWNER.PLAYER) {
            // 移動元か移動先が敵陣（1-3段目）にある場合に成ることができる
            return fromRow <= 2 || toRow <= 2;
        }
        // 後手の場合
        else {
            // 移動元か移動先が敵陣（7-9段目）にある場合に成ることができる
            return fromRow >= 6 || toRow >= 6;
        }
    }
    
    /**
     * 成り駒選択ダイアログを表示する
     * @param {Object} piece 成るかどうかを選択する駒
     * @param {number} row 駒の行
     * @param {number} col 駒の列
     */
    showPromotionDialog(piece, row, col) {
        const promotionDialog = document.getElementById('promotion-dialog');
        const promotedChar = document.getElementById('promoted-char');
        const normalChar = document.getElementById('normal-char');
        const promoteYes = document.getElementById('promote-yes');
        const promoteNo = document.getElementById('promote-no');
        
        // 駒の種類に応じて表示する文字を設定
        promotedChar.textContent = PROMOTED_PIECE_CHARS[piece.type];
        normalChar.textContent = PIECE_CHARS[piece.type];
        
        // 駒の種類に応じてクラスを設定
        promoteYes.className = 'piece promoted ' + piece.type;
        promoteNo.className = 'piece ' + piece.type;
        
        // 所有者に応じてクラスを追加
        if (piece.owner === PIECE_OWNER.OPPONENT) {
            promoteYes.classList.add('opponent');
            promoteNo.classList.add('opponent');
        } else {
            promoteYes.classList.add('player');
            promoteNo.classList.add('player');
        }
        
        // ダイアログを表示
        promotionDialog.style.display = 'flex';
        
        // 「成る」ボタンのイベントリスナー
        const handlePromoteYes = () => {
            // 駒を成る
            piece.promoted = true;
            
            // 最後に動かした駒の位置を記録
            this.lastMovedPiece = { row, col };
            
            // 将棋盤を再描画
            this.redrawBoard();
            
            // ダイアログを閉じる
            promotionDialog.style.display = 'none';
            
            // イベントリスナーを削除
            promoteYes.removeEventListener('click', handlePromoteYes);
            promoteNo.removeEventListener('click', handlePromoteNo);
            
            // 手番を切り替える
            if (!this.gameOver) {
                this.switchTurn();
            }
        };
        
        // 「成らない」ボタンのイベントリスナー
        const handlePromoteNo = () => {
            // 最後に動かした駒の位置を記録
            this.lastMovedPiece = { row, col };
            
            // 将棋盤を再描画
            this.redrawBoard();
            
            // ダイアログを閉じる
            promotionDialog.style.display = 'none';
            
            // イベントリスナーを削除
            promoteYes.removeEventListener('click', handlePromoteYes);
            promoteNo.removeEventListener('click', handlePromoteNo);
            
            // 手番を切り替える
            if (!this.gameOver) {
                this.switchTurn();
            }
        };
        
        // イベントリスナーを設定
        promoteYes.addEventListener('click', handlePromoteYes);
        promoteNo.addEventListener('click', handlePromoteNo);
    }
    
    /**
     * 持ち駒を打つ
     * @param {string} pieceType 駒の種類
     * @param {string} owner 所有者
     * @param {number} row 行
     * @param {number} col 列
     */
    dropPiece(pieceType, owner, row, col) {
        // 持ち駒の数を減らす
        this.capturedPieces[owner][pieceType]--;
        
        // 持ち駒が0になったら削除
        if (this.capturedPieces[owner][pieceType] === 0) {
            delete this.capturedPieces[owner][pieceType];
        }
        
        // 盤上に駒を配置
        this.board[row][col] = { type: pieceType, owner: owner };
        
        // 最後に動かした駒の位置を記録
        this.lastMovedPiece = { row, col };
        
        // 持ち駒エリアを更新
        this.updateCapturedPieces();
        
        // 将棋盤を再描画
        this.redrawBoard();
    }
    
    /**
     * 駒を捕獲する
     * @param {Object} piece 捕獲する駒
     */
    capturePiece(piece) {
        // 成り駒は元に戻す
        if (piece.promoted) {
            piece.promoted = false;
        }
        
        // 所有者を変更
        const newOwner = piece.owner === PIECE_OWNER.PLAYER ? PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
        
        // 持ち駒に追加
        if (!this.capturedPieces[newOwner][piece.type]) {
            this.capturedPieces[newOwner][piece.type] = 1;
        } else {
            this.capturedPieces[newOwner][piece.type]++;
        }
        
        // 持ち駒エリアを更新
        this.updateCapturedPieces();
    }
    
    /**
     * 持ち駒エリアを更新する
     */
    updateCapturedPieces() {
        // プレイヤーの持ち駒エリアをクリア
        this.playerCapturedElement.innerHTML = '';
        
        // プレイヤーの持ち駒を表示
        for (const type in this.capturedPieces[PIECE_OWNER.PLAYER]) {
            const count = this.capturedPieces[PIECE_OWNER.PLAYER][type];
            const piece = { type, owner: PIECE_OWNER.PLAYER };
            
            const pieceElement = createPieceElement(piece);
            pieceElement.classList.add('captured-piece');
            
            // 持ち駒も四角形のままで、特別な処理は不要
            
            // 2個以上ある場合は数を表示
            if (count > 1) {
                const countElement = document.createElement('div');
                countElement.classList.add('piece-count');
                countElement.textContent = count;
                pieceElement.appendChild(countElement);
            }
            
            this.playerCapturedElement.appendChild(pieceElement);
        }
        
        // 相手の持ち駒エリアをクリア
        this.opponentCapturedElement.innerHTML = '';
        
        // 相手の持ち駒を表示
        for (const type in this.capturedPieces[PIECE_OWNER.OPPONENT]) {
            const count = this.capturedPieces[PIECE_OWNER.OPPONENT][type];
            const piece = { type, owner: PIECE_OWNER.OPPONENT };
            
            const pieceElement = createPieceElement(piece);
            pieceElement.classList.add('captured-piece');
            
            // 持ち駒も四角形のままで、特別な処理は不要
            
            // 2個以上ある場合は数を表示
            if (count > 1) {
                const countElement = document.createElement('div');
                countElement.classList.add('piece-count');
                countElement.textContent = count;
                pieceElement.appendChild(countElement);
            }
            
            this.opponentCapturedElement.appendChild(pieceElement);
        }
    }
    
    /**
     * 将棋盤を再描画する
     */
    redrawBoard() {
        // 全てのマスをクリア
        const cells = this.boardElement.querySelectorAll('.board-cell');
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('selected', 'movable', 'last-move', 'all-movable-player', 'all-movable-opponent', 'multiple-movable');
            
            // 複数の駒が移動可能なマスの表示要素を削除
            const indicators = cell.querySelectorAll('.multiple-movable-indicator');
            indicators.forEach(indicator => indicator.remove());
        });
        
        // 駒を配置
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.board[row][col];
                if (piece) {
                    const cell = this.getCellElement(row, col);
                    const pieceElement = createPieceElement(piece);
                    cell.appendChild(pieceElement);
                }
            }
        }
        
        // 最後に動かした駒のマスをハイライト
        if (this.lastMovedPiece) {
            this.highlightCell(this.lastMovedPiece.row, this.lastMovedPiece.col, 'last-move');
        }
        
        // 全駒の移動可能マスと駒を取る・取られる表示を更新
        this.updateAllMovableCellsAndMarks();
    }
    
    /**
     * マスの要素を取得する
     * @param {number} row 行
     * @param {number} col 列
     * @returns {HTMLElement} マスの要素
     */
    getCellElement(row, col) {
        return this.boardElement.querySelector(`.board-cell[data-row="${row}"][data-col="${col}"]`);
    }
    
    /**
     * マスをハイライトする
     * @param {number} row 行
     * @param {number} col 列
     * @param {string} className 追加するクラス名
     */
    highlightCell(row, col, className) {
        const cell = this.getCellElement(row, col);
        if (cell) {
            cell.classList.add(className);
        }
    }
    
    /**
     * 移動可能なマスを表示する
     * @param {number} row 駒の行
     * @param {number} col 駒の列
     * @param {Object} piece 駒オブジェクト
     */
    showMovableCells(row, col, piece) {
        // 移動可能なマスのリストをクリア
        this.movableCells = [];
        
        // 駒の移動可能なマスを取得
        this.movableCells = this.getMovableCells(row, col, piece);
        
        // 移動可能なマスをハイライト
        this.movableCells.forEach(cell => {
            this.highlightCell(cell.row, cell.col, 'movable');
        });
    }
    
    /**
     * 指定した駒の移動可能なマスのリストを取得する
     * @param {number} row 駒の行
     * @param {number} col 駒の列
     * @param {Object} piece 駒オブジェクト
     * @returns {Array} 移動可能なマスのリスト
     */
    getMovableCells(row, col, piece) {
        const movableCells = [];
        
        // 駒の種類と成り駒かどうかに応じて移動パターンを取得
        let movePatterns;
        if (piece.promoted) {
            movePatterns = PROMOTED_MOVE_PATTERNS[piece.type];
        } else {
            movePatterns = MOVE_PATTERNS[piece.type];
        }
        
        // 移動パターンがない場合は空のリストを返す
        if (!movePatterns) return movableCells;
        
        // 各移動パターンについて処理
        movePatterns.forEach(pattern => {
            // 無制限範囲の移動（飛車、角行、香車など）
            if (pattern.direction && pattern.range === 'unlimited') {
                this.addUnlimitedMovableCells(row, col, pattern.direction, piece, movableCells);
            } 
            // 1マスの移動（王将、金将など）
            else {
                let direction = pattern;
                
                // 後手の駒は方向を反転
                if (piece.owner === PIECE_OWNER.OPPONENT) {
                    direction = reverseDirection(direction);
                }
                
                const newRow = row + direction.row;
                const newCol = col + direction.col;
                
                // 盤外はスキップ
                if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
                    return;
                }
                
                // 自分の駒があるマスには移動できない
                const targetPiece = this.board[newRow][newCol];
                if (targetPiece && targetPiece.owner === piece.owner) {
                    return;
                }
                
                // 移動可能なマスとして追加
                movableCells.push({ row: newRow, col: newCol });
            }
        });
        
        return movableCells;
    }
    
    /**
     * 無制限範囲の移動可能なマスを追加する
     * @param {number} row 駒の行
     * @param {number} col 駒の列
     * @param {Object} direction 方向オブジェクト
     * @param {Object} piece 駒オブジェクト
     * @param {Array} movableCells 移動可能なマスのリスト
     */
    addUnlimitedMovableCells(row, col, direction, piece, movableCells) {
        // 後手の駒は方向を反転
        if (piece.owner === PIECE_OWNER.OPPONENT) {
            direction = reverseDirection(direction);
        }
        
        let currentRow = row + direction.row;
        let currentCol = col + direction.col;
        
        // 盤内にある限り繰り返す
        while (currentRow >= 0 && currentRow < BOARD_SIZE && currentCol >= 0 && currentCol < BOARD_SIZE) {
            const targetPiece = this.board[currentRow][currentCol];
            
            // 自分の駒があるマスには移動できない
            if (targetPiece && targetPiece.owner === piece.owner) {
                break;
            }
            
            // 移動可能なマスとして追加
            movableCells.push({ row: currentRow, col: currentCol });
            
            // 相手の駒があるマスまでは移動できるが、その先には進めない
            if (targetPiece && targetPiece.owner !== piece.owner) {
                break;
            }
            
            // 次のマスへ
            currentRow += direction.row;
            currentCol += direction.col;
        }
    }
    
    /**
     * 持ち駒を打てるマスを表示する
     * @param {string} pieceType 駒の種類
     * @param {string} owner 所有者
     */
    showDroppableCells(pieceType, owner) {
        // 移動可能なマスのリストをクリア
        this.movableCells = [];
        
        // 全てのマスをチェック
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // 既に駒があるマスには打てない
                if (this.board[row][col]) continue;
                
                // 駒の種類に応じた特別なルールをチェック
                if (!this.canDropPiece(pieceType, owner, row, col)) continue;
                
                // 打てるマスとして追加
                this.movableCells.push({ row, col });
                
                // 打てるマスをハイライト
                this.highlightCell(row, col, 'movable');
            }
        }
    }
    
    /**
     * 指定したマスに持ち駒を打てるかどうかを判定する
     * @param {string} pieceType 駒の種類
     * @param {string} owner 所有者
     * @param {number} row 行
     * @param {number} col 列
     * @returns {boolean} 打てる場合はtrue
     */
    canDropPiece(pieceType, owner, row, col) {
        // 歩兵の場合の特別ルール
        if (pieceType === PIECE_TYPES.PAWN) {
            // 二歩禁止：同じ列に自分の歩兵がある場合は打てない
            for (let r = 0; r < BOARD_SIZE; r++) {
                const piece = this.board[r][col];
                if (piece && piece.type === PIECE_TYPES.PAWN && piece.owner === owner && !piece.promoted) {
                    return false;
                }
            }
            
            // 先手の場合、1段目（相手の陣地の最奥）には打てない
            if (owner === PIECE_OWNER.PLAYER && row === 0) {
                return false;
            }
            
            // 後手の場合、9段目（相手の陣地の最奥）には打てない
            if (owner === PIECE_OWNER.OPPONENT && row === BOARD_SIZE - 1) {
                return false;
            }
        }
        
        // 桂馬の場合の特別ルール
        if (pieceType === PIECE_TYPES.KNIGHT) {
            // 先手の場合、1段目と2段目には打てない
            if (owner === PIECE_OWNER.PLAYER && row <= 1) {
                return false;
            }
            
            // 後手の場合、8段目と9段目には打てない
            if (owner === PIECE_OWNER.OPPONENT && row >= BOARD_SIZE - 2) {
                return false;
            }
        }
        
        // 香車の場合の特別ルール
        if (pieceType === PIECE_TYPES.LANCE) {
            // 先手の場合、1段目には打てない
            if (owner === PIECE_OWNER.PLAYER && row === 0) {
                return false;
            }
            
            // 後手の場合、9段目には打てない
            if (owner === PIECE_OWNER.OPPONENT && row === BOARD_SIZE - 1) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 指定したマスが移動可能かどうかを判定する
     * @param {number} row 行
     * @param {number} col 列
     * @returns {boolean} 移動可能な場合はtrue
     */
    isMovableCell(row, col) {
        return this.movableCells.some(cell => cell.row === row && cell.col === col);
    }
    
    /**
     * 選択状態をクリアする
     */
    clearSelection() {
        // 選択中の駒をクリア
        this.selectedPiece = null;
        this.selectedCapturedPiece = null;
        
        // 移動可能なマスのリストをクリア
        this.movableCells = [];
        
        // ハイライトを解除
        const cells = this.boardElement.querySelectorAll('.board-cell');
        cells.forEach(cell => {
            cell.classList.remove('selected', 'movable');
        });
        
        // 持ち駒の選択状態を解除
        const capturedPieces = document.querySelectorAll('.captured-piece');
        capturedPieces.forEach(piece => {
            piece.classList.remove('selected');
        });
    }
    
    /**
     * 手番を切り替える
     */
    switchTurn() {
        this.currentTurn = this.currentTurn === PIECE_OWNER.PLAYER ? PIECE_OWNER.OPPONENT : PIECE_OWNER.PLAYER;
        this.updateTurnDisplay();
        
        // 全駒の移動可能マスと駒を取る・取られる表示を更新
        this.updateAllMovableCellsAndMarks();
    }
    
    /**
     * ゲームを終了する
     * @param {string} winner 勝者（PIECE_OWNER.PLAYERまたはPIECE_OWNER.OPPONENT）
     */
    endGame(winner) {
        this.gameOver = true;
        
        // 勝者を表示
        if (winner === PIECE_OWNER.PLAYER) {
            this.turnDisplayElement.textContent = '先手の勝ちです！';
            this.turnDisplayElement.style.backgroundColor = '#4285f4'; // 青色
        } else {
            this.turnDisplayElement.textContent = '後手の勝ちです！';
            this.turnDisplayElement.style.backgroundColor = '#ea4335'; // 赤色
        }
        
        // 勝利メッセージを表示
        setTimeout(() => {
            alert(winner === PIECE_OWNER.PLAYER ? '先手の勝ちです！' : '後手の勝ちです！');
        }, 100);
    }
    
    /**
     * 手番表示を更新する
     */
    updateTurnDisplay() {
        if (this.currentTurn === PIECE_OWNER.PLAYER) {
            this.turnDisplayElement.textContent = '先手（あなた）の番です';
            this.turnDisplayElement.style.backgroundColor = '#4285f4'; // 青色
        } else {
            this.turnDisplayElement.textContent = '後手（相手）の番です';
            this.turnDisplayElement.style.backgroundColor = '#ea4335'; // 赤色
        }
    }
    
    /**
     * 全駒の移動可能マスと駒を取る・取られる表示を更新する
     */
    updateAllMovableCellsAndMarks() {
        // ゲームが終了している場合は何もしない
        if (this.gameOver) return;
        
        // 全てのマスの移動可能マス表示をクリア
        const cells = this.boardElement.querySelectorAll('.board-cell');
        cells.forEach(cell => {
            cell.classList.remove('all-movable-player', 'all-movable-opponent', 'multiple-movable');
            
            // 複数の駒が移動可能なマスの表示要素を削除
            const indicators = cell.querySelectorAll('.multiple-movable-indicator');
            indicators.forEach(indicator => indicator.remove());
        });
        
        // 全ての駒の剣マークをクリア
        const pieces = this.boardElement.querySelectorAll('.piece');
        pieces.forEach(piece => {
            piece.classList.remove('capturable-piece', 'danger-piece');
        });
        
        // 全駒の移動可能マス表示が無効の場合は終了
        if (!this.showAllMovableCells) return;
        
        // 各マスごとの移動可能な駒のリスト
        const movablePieces = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill().map(() => ({
            player: [],
            opponent: []
        })));
        
        // 盤上の全ての駒について移動可能マスを計算
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const piece = this.board[row][col];
                if (!piece) continue;
                
                // 駒の移動可能マスを取得
                const movableCells = this.getMovableCells(row, col, piece);
                
                // 移動可能マスを記録
                movableCells.forEach(cell => {
                    if (piece.owner === PIECE_OWNER.PLAYER) {
                        movablePieces[cell.row][cell.col].player.push({ row, col, piece });
                    } else {
                        movablePieces[cell.row][cell.col].opponent.push({ row, col, piece });
                    }
                });
            }
        }
        
        // 移動可能マスの表示を更新
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const cell = this.getCellElement(row, col);
                const playerPieces = movablePieces[row][col].player;
                const opponentPieces = movablePieces[row][col].opponent;
                
                // 移動可能な駒がある場合
                if (playerPieces.length > 0 || opponentPieces.length > 0) {
                    // 複数の駒が移動可能なマスとして設定
                    cell.classList.add('multiple-movable');
                    
                    // プレイヤーの駒の移動可能マスを表示
                    this.addMovableIndicators(cell, playerPieces, 'player');
                    
                    // 相手の駒の移動可能マスを表示
                    this.addMovableIndicators(cell, opponentPieces, 'opponent');
                }
                
                // 駒を取る・取られる表示が有効の場合
                if (this.showCapturableMarks) {
                    // マスに駒がある場合
                    const targetPiece = this.board[row][col];
                    if (targetPiece) {
                        const pieceElement = cell.querySelector('.piece');
                        
                        // 相手の駒を取れる場合
                        if (targetPiece.owner === PIECE_OWNER.OPPONENT && playerPieces.length > 0) {
                            pieceElement.classList.add('capturable-piece');
                        }
                        
                        // 自分の駒が取られる可能性がある場合
                        if (targetPiece.owner === PIECE_OWNER.PLAYER && opponentPieces.length > 0) {
                            pieceElement.classList.add('danger-piece');
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 移動可能マスのインジケーターを追加する
     * @param {HTMLElement} cell マスの要素
     * @param {Array} pieces 移動可能な駒のリスト
     * @param {string} owner 所有者（'player'または'opponent'）
     */
    addMovableIndicators(cell, pieces, owner) {
        if (pieces.length === 0) return;
        
        // 各駒の種類ごとにカウント
        const pieceTypeCount = {};
        pieces.forEach(p => {
            const type = p.piece.type;
            pieceTypeCount[type] = (pieceTypeCount[type] || 0) + 1;
        });
        
        // 駒の種類の数
        const typeCount = Object.keys(pieceTypeCount).length;
        
        // 各駒の種類ごとにインジケーターを追加
        let index = 0;
        for (const type in pieceTypeCount) {
            const indicator = document.createElement('div');
            indicator.classList.add('multiple-movable-indicator', `movable-${type}`, `movable-${owner}`);
            
            // 幅を計算（駒の種類の数で均等に分割）
            const width = 100 / typeCount;
            indicator.style.width = `${width}%`;
            
            // 位置を設定
            if (owner === 'player') {
                indicator.style.left = `${index * width}%`;
            } else {
                indicator.style.right = `${index * width}%`;
            }
            
            cell.appendChild(indicator);
            index++;
        }
    }
}