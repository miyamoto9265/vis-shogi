/**
 * 将棋の駒の定義と基本的な機能を提供するモジュール
 */

// 駒の種類の定義
const PIECE_TYPES = {
    KING: 'king',      // 王将/玉将
    ROOK: 'rook',      // 飛車
    BISHOP: 'bishop',  // 角行
    GOLD: 'gold',      // 金将
    SILVER: 'silver',  // 銀将
    KNIGHT: 'knight',  // 桂馬
    LANCE: 'lance',    // 香車
    PAWN: 'pawn'       // 歩兵
};

// 駒の所有者の定義
const PIECE_OWNER = {
    PLAYER: 'player',    // プレイヤー（先手）
    OPPONENT: 'opponent' // 相手（後手）
};

// 駒の表示用の漢字
const PIECE_SYMBOLS = {
    [PIECE_TYPES.KING]: { [PIECE_OWNER.PLAYER]: '玉', [PIECE_OWNER.OPPONENT]: '王' },
    [PIECE_TYPES.ROOK]: { [PIECE_OWNER.PLAYER]: '飛', [PIECE_OWNER.OPPONENT]: '飛' },
    [PIECE_TYPES.BISHOP]: { [PIECE_OWNER.PLAYER]: '角', [PIECE_OWNER.OPPONENT]: '角' },
    [PIECE_TYPES.GOLD]: { [PIECE_OWNER.PLAYER]: '金', [PIECE_OWNER.OPPONENT]: '金' },
    [PIECE_TYPES.SILVER]: { [PIECE_OWNER.PLAYER]: '銀', [PIECE_OWNER.OPPONENT]: '銀' },
    [PIECE_TYPES.KNIGHT]: { [PIECE_OWNER.PLAYER]: '桂', [PIECE_OWNER.OPPONENT]: '桂' },
    [PIECE_TYPES.LANCE]: { [PIECE_OWNER.PLAYER]: '香', [PIECE_OWNER.OPPONENT]: '香' },
    [PIECE_TYPES.PAWN]: { [PIECE_OWNER.PLAYER]: '歩', [PIECE_OWNER.OPPONENT]: '歩' }
};

// 成り駒の表示用の漢字
const PROMOTED_PIECE_SYMBOLS = {
    [PIECE_TYPES.ROOK]: '龍',    // 龍王
    [PIECE_TYPES.BISHOP]: '馬',  // 龍馬
    [PIECE_TYPES.SILVER]: '全',  // 成銀
    [PIECE_TYPES.KNIGHT]: '圭',  // 成桂
    [PIECE_TYPES.LANCE]: '杏',   // 成香
    [PIECE_TYPES.PAWN]: 'と'     // と金
};

// 駒の初期配置
const INITIAL_BOARD = [
    // 後手（相手）の駒の初期配置（上側）
    [
        { type: PIECE_TYPES.LANCE, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.KNIGHT, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.SILVER, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.GOLD, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.KING, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.GOLD, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.SILVER, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.KNIGHT, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.LANCE, owner: PIECE_OWNER.OPPONENT }
    ],
    [
        null,
        { type: PIECE_TYPES.ROOK, owner: PIECE_OWNER.OPPONENT },
        null, null, null, null, null,
        { type: PIECE_TYPES.BISHOP, owner: PIECE_OWNER.OPPONENT },
        null
    ],
    [
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.OPPONENT }
    ],
    // 空のマス（3行）
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    // 先手（プレイヤー）の駒の初期配置（下側）
    [
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.PAWN, owner: PIECE_OWNER.PLAYER }
    ],
    [
        null,
        { type: PIECE_TYPES.BISHOP, owner: PIECE_OWNER.PLAYER },
        null, null, null, null, null,
        { type: PIECE_TYPES.ROOK, owner: PIECE_OWNER.PLAYER },
        null
    ],
    [
        { type: PIECE_TYPES.LANCE, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.KNIGHT, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.SILVER, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.GOLD, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.KING, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.GOLD, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.SILVER, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.KNIGHT, owner: PIECE_OWNER.PLAYER },
        { type: PIECE_TYPES.LANCE, owner: PIECE_OWNER.PLAYER }
    ]
];

/**
 * 駒の移動方向の定義
 * 将棋盤の座標系は左上が(0,0)、右下が(8,8)
 * 先手（下側）から見た方向
 */
const DIRECTIONS = {
    UP: { row: -1, col: 0 },
    DOWN: { row: 1, col: 0 },
    LEFT: { row: 0, col: -1 },
    RIGHT: { row: 0, col: 1 },
    UP_LEFT: { row: -1, col: -1 },
    UP_RIGHT: { row: -1, col: 1 },
    DOWN_LEFT: { row: 1, col: -1 },
    DOWN_RIGHT: { row: 1, col: 1 },
    // 桂馬の動き
    KNIGHT_LEFT: { row: -2, col: -1 },
    KNIGHT_RIGHT: { row: -2, col: 1 }
};

/**
 * 駒の移動パターンの定義
 * 各駒の移動可能な方向を定義
 * 先手（下側）から見た方向で定義
 */
const MOVE_PATTERNS = {
    // 王将/玉将：8方向に1マス
    [PIECE_TYPES.KING]: [
        DIRECTIONS.UP, DIRECTIONS.DOWN, 
        DIRECTIONS.LEFT, DIRECTIONS.RIGHT,
        DIRECTIONS.UP_LEFT, DIRECTIONS.UP_RIGHT,
        DIRECTIONS.DOWN_LEFT, DIRECTIONS.DOWN_RIGHT
    ],
    
    // 飛車：上下左右に何マスでも
    [PIECE_TYPES.ROOK]: [
        { direction: DIRECTIONS.UP, range: 'unlimited' },
        { direction: DIRECTIONS.DOWN, range: 'unlimited' },
        { direction: DIRECTIONS.LEFT, range: 'unlimited' },
        { direction: DIRECTIONS.RIGHT, range: 'unlimited' }
    ],
    
    // 角行：斜め方向に何マスでも
    [PIECE_TYPES.BISHOP]: [
        { direction: DIRECTIONS.UP_LEFT, range: 'unlimited' },
        { direction: DIRECTIONS.UP_RIGHT, range: 'unlimited' },
        { direction: DIRECTIONS.DOWN_LEFT, range: 'unlimited' },
        { direction: DIRECTIONS.DOWN_RIGHT, range: 'unlimited' }
    ],
    
    // 金将：上下左右と斜め前に1マス
    [PIECE_TYPES.GOLD]: [
        DIRECTIONS.UP, DIRECTIONS.DOWN,
        DIRECTIONS.LEFT, DIRECTIONS.RIGHT,
        DIRECTIONS.UP_LEFT, DIRECTIONS.UP_RIGHT
    ],
    
    // 銀将：斜め4方向と前に1マス
    [PIECE_TYPES.SILVER]: [
        DIRECTIONS.UP,
        DIRECTIONS.UP_LEFT, DIRECTIONS.UP_RIGHT,
        DIRECTIONS.DOWN_LEFT, DIRECTIONS.DOWN_RIGHT
    ],
    
    // 桂馬：前方の斜め2マス先（L字）
    [PIECE_TYPES.KNIGHT]: [
        DIRECTIONS.KNIGHT_LEFT, DIRECTIONS.KNIGHT_RIGHT
    ],
    
    // 香車：前方向に何マスでも
    [PIECE_TYPES.LANCE]: [
        { direction: DIRECTIONS.UP, range: 'unlimited' }
    ],
    
    // 歩兵：前に1マス
    [PIECE_TYPES.PAWN]: [
        DIRECTIONS.UP
    ]
};

/**
 * 成り駒の移動パターン
 * 成り駒は金将と同じ動きになるものが多い
 */
const PROMOTED_MOVE_PATTERNS = {
    [PIECE_TYPES.PAWN]: MOVE_PATTERNS[PIECE_TYPES.GOLD],   // と金：金将と同じ動き
    [PIECE_TYPES.LANCE]: MOVE_PATTERNS[PIECE_TYPES.GOLD],  // 成香：金将と同じ動き
    [PIECE_TYPES.KNIGHT]: MOVE_PATTERNS[PIECE_TYPES.GOLD], // 成桂：金将と同じ動き
    [PIECE_TYPES.SILVER]: MOVE_PATTERNS[PIECE_TYPES.GOLD], // 成銀：金将と同じ動き
    [PIECE_TYPES.BISHOP]: [                                // 竜馬：角行の動き + 上下左右1マス
        ...MOVE_PATTERNS[PIECE_TYPES.BISHOP],
        { row: -1, col: 0 },  // 上
        { row: 1, col: 0 },   // 下
        { row: 0, col: -1 },  // 左
        { row: 0, col: 1 }    // 右
    ],
    [PIECE_TYPES.ROOK]: [                                  // 竜王：飛車の動き + 斜め1マス
        ...MOVE_PATTERNS[PIECE_TYPES.ROOK],
        { row: -1, col: -1 }, // 左上
        { row: -1, col: 1 },  // 右上
        { row: 1, col: -1 },  // 左下
        { row: 1, col: 1 }    // 右下
    ]
};

/**
 * 駒の移動方向を反転する関数
 * 後手（上側）の駒の場合、移動方向を反転する
 * @param {Object} direction 方向オブジェクト
 * @returns {Object} 反転した方向オブジェクト
 */
function reverseDirection(direction) {
    return {
        row: -direction.row,
        col: -direction.col
    };
}

/**
 * 駒のHTMLエレメントを作成する関数
 * @param {Object} piece 駒オブジェクト
 * @returns {HTMLElement} 駒のHTMLエレメント
 */
function createPieceElement(piece) {
    if (!piece) return null;
    
    const pieceElement = document.createElement('div');
    pieceElement.classList.add('piece', piece.type, piece.owner);
    
    // 成り駒の場合
    if (piece.promoted) {
        pieceElement.classList.add('promoted');
        pieceElement.textContent = PROMOTED_PIECE_SYMBOLS[piece.type];
    } else {
        pieceElement.textContent = PIECE_SYMBOLS[piece.type][piece.owner];
    }
    
    // 持ち駒の場合も四角形のままで、特別な処理は不要
    // 必要に応じてスタイルの微調整のみ行う
    if (pieceElement.classList.contains('captured-piece')) {
        pieceElement.style.borderRadius = '4px';
    }
    
    return pieceElement;
}

// 駒の漢字
const PIECE_CHARS = {
    [PIECE_TYPES.KING]: '王',
    [PIECE_TYPES.GOLD]: '金',
    [PIECE_TYPES.SILVER]: '銀',
    [PIECE_TYPES.BISHOP]: '角',
    [PIECE_TYPES.ROOK]: '飛',
    [PIECE_TYPES.KNIGHT]: '桂',
    [PIECE_TYPES.LANCE]: '香',
    [PIECE_TYPES.PAWN]: '歩'
};

// 成り駒の漢字
const PROMOTED_PIECE_CHARS = {
    [PIECE_TYPES.SILVER]: '全',  // 成銀
    [PIECE_TYPES.BISHOP]: '馬',  // 竜馬
    [PIECE_TYPES.ROOK]: '竜',    // 竜王
    [PIECE_TYPES.KNIGHT]: '圭',  // 成桂
    [PIECE_TYPES.LANCE]: '杏',   // 成香
    [PIECE_TYPES.PAWN]: 'と'     // と金
}; 