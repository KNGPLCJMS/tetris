const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const blockSize = 15;
const columns = 10;
const rows = 18;

canvas.width = columns * blockSize;
canvas.height = rows * blockSize;

const colors = [
    null,
    "#00f0f0", // I
    "#0000f0", // J
    "#f0a000", // L
    "#f0f000", // O
    "#00f000", // S
    "#a000f0", // T
    "#f00000"  // Z
];

const pieces = [
    [[1, 1, 1, 1]],

    [
        [2, 0, 0],
        [2, 2, 2]
    ],

    [
        [0, 0, 3],
        [3, 3, 3]
    ],

    [
        [4, 4],
        [4, 4]
    ],

    [
        [0, 5, 5],
        [5, 5, 0]
    ],

    [
        [0, 6, 0],
        [6, 6, 6]
    ],

    [
        [7, 7, 0],
        [0, 7, 7]
    ]
];

let board;
let player;
let score = 0;
let lines = 0;
let gameOver = false;
let paused = false;

function createBoard() {
    return Array.from(
        { length: rows },
        () => Array(columns).fill(0)
    );
}

function randomPiece() {
    const piece = pieces[Math.floor(Math.random() * pieces.length)];

    return {
        matrix: piece.map(row => [...row]),
        x: Math.floor(columns / 2) - Math.ceil(piece[0].length / 2),
        y: 0
    };
}

function drawBlock(x, y, value) {
    ctx.fillStyle = colors[value];
    ctx.fillRect(
        x * blockSize,
        y * blockSize,
        blockSize,
        blockSize
    );

    ctx.strokeStyle = "#222";
    ctx.strokeRect(
        x * blockSize,
        y * blockSize,
        blockSize,
        blockSize
    );
}

function drawBlocks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw board blocks
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
            if (board[y][x] !== 0) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }

    // Draw current falling piece
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                drawBlock(
                    player.x + x,
                    player.y + y,
                    value
                );
            }
        });
    });
}

function collide(board, player) {
    const matrix = player.matrix;
    const position = player;

    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (
                matrix[y][x] !== 0 &&
                (
                    board[y + position.y] === undefined ||
                    board[y + position.y][x + position.x] === undefined ||
                    board[y + position.y][x + position.x] !== 0
                )
            ) {
                return true;
            }
        }
    }

    return false;
}

function merge(board, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                board[y + player.y][x + player.x] = value;
            }
        });
    });
}

function rotateMatrix(matrix, direction) {
    const rows = matrix.length;
    const cols = matrix[0].length;

    const rotated = Array.from(
        { length: cols },
        () => Array(rows).fill(0)
    );

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            if (direction > 0) {
                rotated[x][rows - 1 - y] = matrix[y][x];
            } else {
                rotated[cols - 1 - x][y] = matrix[y][x];
            }
        }
    }

    return rotated;
}

function playerRotate(direction) {
    const oldMatrix = player.matrix;
    const oldX = player.x;
    const oldY = player.y;

    const rotated = rotateMatrix(player.matrix, direction);

    player.matrix = rotated;

    if (!collide(board, player)) {
        return;
    }

    const kicks = [
        -1,
        1,
        -2,
        2,
        -3,
        3
    ];

    for (const offset of kicks) {
        player.x = oldX + offset;

        if (!collide(board, player)) {
            return;
        }
    }

    player.matrix = oldMatrix;
    player.x = oldX;
    player.y = oldY;
}


function playerMove(direction) {
    player.x += direction;

    if (collide(board, player)) {
        player.x -= direction;
    }
}

function playerDrop() {
    player.y++;

    if (collide(board, player)) {
        player.y--;
        merge(board, player);
        clearLines();
        resetPlayer();

        if (collide(board, player)) {
            gameOver = true;
        }
    }

    dropCounter = 0;
}

function clearLines() {
    let cleared = 0;

    outer:
    for (let y = board.length - 1; y >= 0; y--) {
        for (let x = 0; x < board[y].length; x++) {
            if (board[y][x] === 0) {
                continue outer;
            }
        }

        board.splice(y, 1);
        board.unshift(Array(columns).fill(0));
        y++;
        cleared++;
    }

    if (cleared > 0) {
        lines += cleared;

        if (cleared === 1) score += 100;
        if (cleared === 2) score += 300;
        if (cleared === 3) score += 500;
        if (cleared === 4) score += 800;

        updateScore();
    }
}

function resetPlayer() {
    player = randomPiece();
}

function updateScore() {
    const scoreElement = document.getElementById("score");

    if (scoreElement) {
        scoreElement.textContent =
            `Score: ${score} | Lines: ${lines}`;
    }
}

function drawGameOver() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "GAME OVER",
        canvas.width / 2,
        canvas.height / 2
    );

    ctx.font = "12px Arial";
    ctx.fillText(
        "Press Esc to restart",
        canvas.width / 2,
        canvas.height / 2 + 25
    );
}

function drawPaused() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        "PAUSED",
        canvas.width / 2,
        canvas.height / 2
    );
}

document.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") {
        playerMove(-1);
    } else if (event.key === "ArrowRight") {
        playerMove(1);
    } else if (event.key === "ArrowDown") {
        playerDrop();
    } else if (event.key === "Escape") {
        startGame();
        
    } else if (event.key === " ") {
        while (!collide(board, player)) {
            player.y++;
        }

        player.y--;
        playerDrop();
    } else if (event.key.toLowerCase() === "p") {
        paused = !paused;
    } else if (event.key.toLowerCase() === "r") {
        playerRotate(1);
    }

    drawBlocks();
});

let dropCounter = 0;
let lastTime = 0;
let dropInterval = 700;

function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!paused && !gameOver) {
        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {
            playerDrop();
        }

        drawBlocks();
    }

    if (paused) {
        drawBlocks();
        drawPaused();
    }

    if (gameOver) {
        drawBlocks();
        drawGameOver();
    }

    requestAnimationFrame(update);
}

function startGame() {
    board = createBoard();
    player = randomPiece();
    score = 0;
    lines = 0;
    gameOver = false;
    paused = false;
    dropCounter = 0;

    updateScore();
    drawBlocks();
}

startGame();
update();
