// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game variables
const gridSize = 20;
const tileCount = canvas.width / gridSize;
let gameWidth = canvas.width;
let gameHeight = canvas.height;
let snake = [{ x: 10, y: 10 }];
let food = { x: 15, y: 15 };
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let score = 0;
let foodEaten = 0;
let speedLevel = 0;
let updateInterval = 100; // milliseconds between updates
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameRunning = false;
let gameOver = false;

// UI elements
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const foodCountDisplay = document.getElementById('foodCount');
const gameOverDisplay = document.getElementById('gameOver');
const startBtn = document.getElementById('startBtn');

// Initialize
highScoreDisplay.textContent = highScore;

// Generate stars
function generateStars() {
    const starsContainer = document.getElementById('stars');
    starsContainer.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        const size = Math.random() * 2;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const duration = 2 + Math.random() * 2;
        
        star.style.width = size + 'px';
        star.style.height = size + 'px';
        star.style.left = x + 'px';
        star.style.top = y + 'px';
        star.style.animationDuration = duration + 's';
        star.style.animationDelay = Math.random() * 3 + 's';
        
        starsContainer.appendChild(star);
    }
}

// Spawn food in random location
function spawnFood() {
    let newFood;
    let collision = false;
    const tileCountY = gameHeight / gridSize;
    
    do {
        collision = false;
        newFood = {
            x: Math.floor(Math.random() * tileCount),
            y: Math.floor(Math.random() * tileCountY)
        };
        
        // Check if food spawns on snake
        for (let segment of snake) {
            if (segment.x === newFood.x && segment.y === newFood.y) {
                collision = true;
                break;
            }
        }
    } while (collision);
    
    food = newFood;
}

// Draw game
function draw() {
    // Clear canvas with gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0a0a2a');
    gradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid (visible)
    const tileCountY = gameHeight / gridSize;
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
    }
    for (let i = 0; i <= tileCountY; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }
    
    // Draw snake
    for (let i = 0; i < snake.length; i++) {
        const segment = snake[i];
        
        if (i === 0) {
            // Head - bright glow
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
            ctx.fillRect(
                segment.x * gridSize + 2,
                segment.y * gridSize + 2,
                gridSize - 4,
                gridSize - 4
            );
            
            // Eye
            ctx.fillStyle = '#0a0a1a';
            const eyeSize = 3;
            ctx.fillRect(
                segment.x * gridSize + 6,
                segment.y * gridSize + 6,
                eyeSize,
                eyeSize
            );
        } else {
            // Body - gradient from head
            const opacity = 1 - (i / snake.length) * 0.5;
            ctx.fillStyle = `rgba(0, 255, 136, ${opacity})`;
            ctx.shadowColor = `rgba(0, 255, 136, ${opacity})`;
            ctx.shadowBlur = 5;
            ctx.fillRect(
                segment.x * gridSize + 1,
                segment.y * gridSize + 1,
                gridSize - 2,
                gridSize - 2
            );
        }
    }
    
    ctx.shadowBlur = 0;
    
    // Draw food (rotating star)
    const time = Date.now() / 1000;
    const rotation = time * 3;
    const foodX = food.x * gridSize + gridSize / 2;
    const foodY = food.y * gridSize + gridSize / 2;
    
    ctx.save();
    ctx.translate(foodX, foodY);
    ctx.rotate(rotation);
    
    ctx.fillStyle = '#ff0088';
    ctx.shadowColor = '#ff0088';
    ctx.shadowBlur = 10;
    
    // Draw star
    drawStar(ctx, 0, 0, 5, gridSize / 3, gridSize / 6);
    
    ctx.restore();
    ctx.shadowBlur = 0;
}

// Draw star function
function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
}

// Update game state
function update() {
    if (!gameRunning) return;
    
    // Update direction based on currently pressed keys
    updateDirectionFromInput();
    
    direction = nextDirection;
    const tileCountY = gameHeight / gridSize;
    
    // Create new head
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    
    // Check wall collision (wrap around)
    head.x = (head.x + tileCount) % tileCount;
    head.y = (head.y + tileCountY) % tileCountY;
    
    // Check self collision
    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            endGame();
            return;
        }
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        foodEaten++;
        scoreDisplay.textContent = score;
        scoreDisplay.classList.add('pop');
        setTimeout(() => scoreDisplay.classList.remove('pop'), 500);
        
        // Update speed every 20 eats
        const newSpeedLevel = Math.floor(foodEaten / 5);
        if (newSpeedLevel > speedLevel) {
            speedLevel = newSpeedLevel;
            updateInterval = Math.max(40, 100 - (speedLevel * 15)); // Min 40ms, decreases by 15ms per level
            foodCountDisplay.textContent = `LEVEL ${speedLevel + 1} - Speed +${speedLevel * 10}%`;
        } else {
            foodCountDisplay.textContent = `${foodEaten % 20} / 20 to next speed`;
        }
        
        spawnFood();
    } else {
        snake.pop();
    }
}

// End game
function endGame() {
    gameRunning = false;
    gameOverDisplay.classList.remove('hidden');
    
    if (score > highScore) {
        highScore = score;
        highScoreDisplay.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
    }
    
    startBtn.textContent = 'RESTART GAME';
}

// Start game
function startGame() {
    snake = [{ x: 10, y: 10 }];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    foodEaten = 0;
    speedLevel = 0;
    updateInterval = 100;
    scoreDisplay.textContent = score;
    foodCountDisplay.textContent = '0 / 20 to next speed';
    spawnFood();
    gameRunning = true;
    gameOverDisplay.classList.add('hidden');
    startBtn.textContent = 'PAUSE';
    gameLoop();
}

// Pause/Resume
function togglePause() {
    if (!gameRunning && startBtn.textContent === 'PAUSE') return;
    gameRunning = !gameRunning;
    startBtn.textContent = gameRunning ? 'PAUSE' : 'RESUME';
    if (gameRunning) gameLoop();
}

// Game loop
let lastFrameTime = 0;
function gameLoop() {
    const now = Date.now();
    const deltaTime = now - lastFrameTime;
    
    if (deltaTime > updateInterval) { // Use dynamic update interval based on speed level
        update();
        lastFrameTime = now;
    }
    
    draw();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// Input handling with key tracking
const keysPressed = {};

document.addEventListener('keydown', (e) => {
    keysPressed[e.key.toLowerCase()] = true;
    
    // Handle pause/start with space
    if (e.key === ' ') {
        if (startBtn.textContent === 'START GAME' || startBtn.textContent === 'RESTART GAME') {
            startGame();
        } else if (gameRunning || startBtn.textContent === 'RESUME') {
            togglePause();
        }
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    keysPressed[e.key.toLowerCase()] = false;
});

// Update direction based on currently pressed keys
function updateDirectionFromInput() {
    const arrowUp = keysPressed['arrowup'] || keysPressed['w'];
    const arrowDown = keysPressed['arrowdown'] || keysPressed['s'];
    const arrowLeft = keysPressed['arrowleft'] || keysPressed['a'];
    const arrowRight = keysPressed['arrowright'] || keysPressed['d'];
    
    if (arrowUp && direction.y === 0) nextDirection = { x: 0, y: -1 };
    if (arrowDown && direction.y === 0) nextDirection = { x: 0, y: 1 };
    if (arrowLeft && direction.x === 0) nextDirection = { x: -1, y: 0 };
    if (arrowRight && direction.x === 0) nextDirection = { x: 1, y: 0 };
}

// Button event listener
startBtn.addEventListener('click', () => {
    if (startBtn.textContent === 'START GAME' || startBtn.textContent === 'RESTART GAME') {
        startGame();
    } else if (startBtn.textContent === 'PAUSE' || startBtn.textContent === 'RESUME') {
        togglePause();
    }
});

// Initialize stars and draw
generateStars();
draw();
