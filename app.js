/**
 * 网页贪吃蛇 - 霓虹街机
 * 应用逻辑文件
 */

// ===================================
// 数据存储模块
// ===================================
const DataStore = {
    // 存储键名
    STORAGE_KEY: 'snake_game_data',

    /**
     * 获取所有数据
     * @returns {Object} 存储的数据对象
     */
    getData() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : { users: {}, currentUser: null };
        } catch (e) {
            console.error('读取数据失败:', e);
            return { users: {}, currentUser: null };
        }
    },

    /**
     * 保存所有数据
     * @param {Object} data - 要保存的数据对象
     */
    saveData(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },

    /**
     * 获取当前登录用户
     * @returns {string|null} 当前用户名
     */
    getCurrentUser() {
        return this.getData().currentUser;
    },

    /**
     * 设置当前用户
     * @param {string|null} username - 用户名
     */
    setCurrentUser(username) {
        const data = this.getData();
        data.currentUser = username;
        this.saveData(data);
    },

    /**
     * 获取用户数据
     * @param {string} username - 用户名
     * @returns {Object|null} 用户数据
     */
    getUser(username) {
        const data = this.getData();
        return data.users[username] || null;
    },

    /**
     * 检查用户是否存在
     * @param {string} username - 用户名
     * @returns {boolean} 是否存在
     */
    userExists(username) {
        const data = this.getData();
        return data.users.hasOwnProperty(username);
    },

    /**
     * 注册新用户
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {boolean} 是否成功
     */
    registerUser(username, password) {
        if (this.userExists(username)) {
            return false;
        }

        const data = this.getData();
        data.users[username] = {
            password: password, // 注意：实际项目应该使用加密存储
            loginHistory: [],
            scores: [],
            createdAt: new Date().toISOString()
        };
        this.saveData(data);
        return true;
    },

    /**
     * 验证用户密码
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {boolean} 是否验证通过
     */
    verifyPassword(username, password) {
        const user = this.getUser(username);
        if (!user || !user.password) {
            return false;
        }
        return user.password === password;
    },

    /**
     * 创建或更新用户
     * @param {string} username - 用户名
     * @param {Object} userData - 用户数据
     */
    saveUser(username, userData) {
        const data = this.getData();
        data.users[username] = userData;
        this.saveData(data);
    },

    /**
     * 添加登录记录
     * @param {string} username - 用户名
     */
    addLoginRecord(username) {
        let user = this.getUser(username);
        const now = new Date().toISOString();

        if (!user) {
            user = {
                loginHistory: [],
                scores: []
            };
        }

        // 确保loginHistory数组存在
        if (!user.loginHistory) {
            user.loginHistory = [];
        }

        // 添加登录记录（最多保留20条）
        user.loginHistory.unshift(now);
        if (user.loginHistory.length > 20) {
            user.loginHistory = user.loginHistory.slice(0, 20);
        }

        this.saveUser(username, user);
    },

    /**
     * 添加分数记录
     * @param {string} username - 用户名
     * @param {number} score - 分数
     */
    addScore(username, score) {
        const user = this.getUser(username);
        if (!user) return;

        const record = {
            score: score,
            date: new Date().toISOString()
        };

        // 添加分数记录（最多保留20条）
        user.scores.unshift(record);
        if (user.scores.length > 20) {
            user.scores = user.scores.slice(0, 20);
        }

        this.saveUser(username, user);
    },

    /**
     * 获取用户最高分
     * @param {string} username - 用户名
     * @returns {number} 最高分
     */
    getHighScore(username) {
        const user = this.getUser(username);
        if (!user || !user.scores || user.scores.length === 0) {
            return 0;
        }
        return Math.max(...user.scores.map(s => s.score));
    }
};

// ===================================
// 用户管理模块
// ===================================
const UserManager = {
    // 游客模式标记
    isGuest: false,

    /**
     * 用户登录（带密码验证）
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @returns {Object} 登录结果 { success: boolean, message: string }
     */
    login(username, password) {
        if (!username || username.trim() === '') {
            return { success: false, message: '请输入用户名' };
        }
        if (!password || password.trim() === '') {
            return { success: false, message: '请输入密码' };
        }

        const trimmedName = username.trim();

        // 检查用户是否存在
        if (!DataStore.userExists(trimmedName)) {
            return { success: false, message: '用户不存在，请先注册' };
        }

        // 验证密码
        if (!DataStore.verifyPassword(trimmedName, password)) {
            return { success: false, message: '密码错误' };
        }

        this.isGuest = false;
        DataStore.setCurrentUser(trimmedName);
        DataStore.addLoginRecord(trimmedName);
        return { success: true, message: '登录成功' };
    },

    /**
     * 用户注册
     * @param {string} username - 用户名
     * @param {string} password - 密码
     * @param {string} confirmPassword - 确认密码
     * @returns {Object} 注册结果 { success: boolean, message: string }
     */
    register(username, password, confirmPassword) {
        if (!username || username.trim() === '') {
            return { success: false, message: '请输入用户名' };
        }
        if (!password || password.trim() === '') {
            return { success: false, message: '请输入密码' };
        }
        if (password.length < 4) {
            return { success: false, message: '密码至少4个字符' };
        }
        if (password !== confirmPassword) {
            return { success: false, message: '两次密码输入不一致' };
        }

        const trimmedName = username.trim();

        // 检查用户名是否已存在
        if (DataStore.userExists(trimmedName)) {
            return { success: false, message: '用户名已被注册' };
        }

        // 注册用户
        if (DataStore.registerUser(trimmedName, password)) {
            return { success: true, message: '注册成功，请登录' };
        } else {
            return { success: false, message: '注册失败，请重试' };
        }
    },

    /**
     * 游客模式登录
     */
    loginAsGuest() {
        this.isGuest = true;
        DataStore.setCurrentUser('游客');
        // 游客模式不记录登录历史
    },

    /**
     * 用户登出
     */
    logout() {
        this.isGuest = false;
        DataStore.setCurrentUser(null);
    },

    /**
     * 检查是否已登录
     * @returns {boolean} 是否已登录
     */
    isLoggedIn() {
        return DataStore.getCurrentUser() !== null;
    },

    /**
     * 获取当前用户名
     * @returns {string|null} 当前用户名
     */
    getCurrentUsername() {
        return DataStore.getCurrentUser();
    }
};

// ===================================
// 贪吃蛇游戏引擎
// ===================================
class SnakeGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // 游戏配置
        this.gridSize = 20; // 网格大小
        this.cols = Math.floor(canvas.width / this.gridSize);
        this.rows = Math.floor(canvas.height / this.gridSize);

        // 颜色配置
        this.colors = {
            background: '#0f162a',
            snake: '#22d3ee',
            snakeHead: '#67e8f9',
            snakeGlow: 'rgba(34, 211, 238, 0.3)',
            food: '#d946ef',
            foodGlow: 'rgba(217, 70, 239, 0.5)',
            grid: 'rgba(255, 255, 255, 0.03)'
        };

        // 游戏状态
        this.snake = [];
        this.food = null;
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.score = 0;
        this.gameLoop = null;
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 120; // 毫秒/帧

        // 回调函数
        this.onScoreChange = null;
        this.onGameOver = null;

        // SVG 资源素材
        this.assets = {
            snakeHead: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <!-- 吐信子 (Tongue) -->
                <path d="M 19 2 L 17 -3 M 21 2 L 23 -3" stroke="#ef4444" stroke-width="2" stroke-linecap="round" />
                <path d="M 20 15 Q 20 5 20 2" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
                
                <!-- 头部轮廓 (Head Shape) - 略呈三角形 -->
                <path d="M 20 5 
                         C 5 15, 5 30, 10 35 
                         Q 20 40, 30 35 
                         C 35 30, 35 15, 20 5 Z" 
                      fill="#4ade80" stroke="#166534" stroke-width="1.5"/>
                
                <!-- 鳞片纹理 (Scales) -->
                <path d="M 20 5 L 20 15 M 15 12 L 18 18 M 25 12 L 22 18 M 12 25 L 18 25 M 28 25 L 22 25 M 20 30 L 20 38" 
                      stroke="rgba(22, 101, 52, 0.3)" stroke-width="1" stroke-linecap="round"/>

                <!-- 眼睛 (Eyes) -->
                <ellipse cx="14" cy="18" rx="3.5" ry="5" fill="#facc15" stroke="#854d0e" stroke-width="1"/>
                <ellipse cx="26" cy="18" rx="3.5" ry="5" fill="#facc15" stroke="#854d0e" stroke-width="1"/>
                
                <!-- 瞳孔 (Pupils) - 细长竖瞳 -->
                <ellipse cx="14" cy="18" rx="1" ry="3.5" fill="black"/>
                <ellipse cx="26" cy="18" rx="1" ry="3.5" fill="black"/>

                <!-- 鼻孔 (Nostrils) -->
                <circle cx="17" cy="8" r="0.8" fill="#14532d"/>
                <circle cx="23" cy="8" r="0.8" fill="#14532d"/>
                
                <!-- 头部高光 (Highlight) -->
                <ellipse cx="20" cy="12" rx="6" ry="3" fill="rgba(255,255,255,0.3)"/>
            </svg>`,
            apple: `<svg width="40" height="40" viewBox="0 -5 40 45" xmlns="http://www.w3.org/2000/svg">
                <path d="M 20 10 Q 35 10 35 25 Q 35 40 20 40 Q 5 40 5 25 Q 5 10 20 10" fill="#ef4444" stroke="#991b1b" stroke-width="1.5"/>
                <path d="M 20 10 L 20 2" stroke="#78350f" stroke-width="2" stroke-linecap="round"/>
                <path d="M 20 5 Q 28 0 25 8" fill="#22c55e" stroke="#166534" stroke-width="1"/>
            </svg>`,
            hamster: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="22" r="16" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>
                <circle cx="10" cy="10" r="5" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>
                <circle cx="30" cy="10" r="5" fill="#fbbf24" stroke="#92400e" stroke-width="1.5"/>
                <circle cx="14" cy="20" r="2.5" fill="black"/>
                <circle cx="26" cy="20" r="2.5" fill="black"/>
                <circle cx="20" cy="25" r="1.5" fill="#f87171"/>
            </svg>`,
            rabbit: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="20" cy="25" r="14" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
                <ellipse cx="14" cy="10" rx="4" ry="10" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
                <ellipse cx="26" cy="10" rx="4" ry="10" fill="#e2e8f0" stroke="#64748b" stroke-width="1.5"/>
                <circle cx="15" cy="22" r="2" fill="black"/>
                <circle cx="25" cy="22" r="2" fill="black"/>
                <path d="M 18 28 Q 20 30 22 28" stroke="#f472b6" stroke-width="1.5" fill="none"/>
            </svg>`,
            bird: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <circle cx="22" cy="22" r="15" fill="#60a5fa" stroke="#1e40af" stroke-width="1.5"/>
                <path d="M 5 22 Q 10 15 15 22" fill="#60a5fa" stroke="#1e40af" stroke-width="1.5"/>
                <path d="M 32 20 L 38 22 L 32 24 Z" fill="#fbbf24" stroke="#92400e" stroke-width="1"/>
                <circle cx="28" cy="18" r="2.5" fill="black"/>
            </svg>`,
            chicken: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <!-- 身体 (Body) -->
                <circle cx="20" cy="22" r="15" fill="#fefce8" stroke="#ca8a04" stroke-width="1.5"/>
                <!-- 鸡冠 (Comb) -->
                <path d="M 15 10 Q 18 5 22 10 Q 25 5 25 10" fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
                <!-- 嘴巴 (Beak) -->
                <path d="M 16 22 L 12 24 L 16 26 Z" fill="#facc15" stroke="#a16207" stroke-width="1"/>
                <!-- 眼睛 (Eyes) -->
                <circle cx="24" cy="20" r="2.5" fill="black"/>
                <!-- 翅膀 (Wing) -->
                <path d="M 22 25 Q 30 28 28 20" stroke="#ca8a04" stroke-width="1.5" fill="none"/>
            </svg>`,
            duck: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                <!-- 身体 (Body) -->
                <circle cx="20" cy="22" r="15" fill="#fde047" stroke="#eab308" stroke-width="1.5"/>
                <!-- 嘴巴 (Bill) -->
                <path d="M 10 20 Q 5 22 10 24 L 15 22 Z" fill="#f97316" stroke="#c2410c" stroke-width="1"/>
                <!-- 眼睛 (Eyes) -->
                <circle cx="20" cy="18" r="2.5" fill="black"/>
                <circle cx="28" cy="18" r="2.5" fill="black"/>
                <!-- 翅膀 (Wing) -->
                <path d="M 25 25 Q 32 28 32 22" stroke="#eab308" stroke-width="1.5" fill="none"/>
            </svg>`
        };

        // 缓存图片对象
        this.images = {
            snakeHead: this.svgToImage(this.assets.snakeHead),
            apple: this.svgToImage(this.assets.apple),
            hamster: this.svgToImage(this.assets.hamster),
            rabbit: this.svgToImage(this.assets.rabbit),
            bird: this.svgToImage(this.assets.bird),
            chicken: this.svgToImage(this.assets.chicken),
            duck: this.svgToImage(this.assets.duck)
        };
    }

    /**
     * 将 SVG 字符串转换为图像对象
     * @param {string} svgString - SVG 源代码
     * @returns {HTMLImageElement} 图像对象
     */
    svgToImage(svgString) {
        const img = new Image();
        const svg64 = btoa(unescape(encodeURIComponent(svgString)));
        const b64Start = 'data:image/svg+xml;base64,';
        img.src = b64Start + svg64;
        return img;
    }

    /**
     * 初始化游戏
     */
    init() {
        // 初始化蛇（从中间开始，长度为3）
        const startX = Math.floor(this.cols / 2);
        const startY = Math.floor(this.rows / 2);
        this.snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY }
        ];

        // 重置方向
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };

        // 重置分数
        this.score = 0;
        if (this.onScoreChange) {
            this.onScoreChange(this.score);
        }

        // 生成食物
        this.generateFood();

        // 绘制初始状态
        this.draw();
    }

    /**
     * 开始游戏
     */
    start() {
        if (this.isRunning && !this.isPaused) return;

        if (this.isPaused) {
            this.isPaused = false;
        } else {
            this.init();
        }

        this.isRunning = true;
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    /**
     * 暂停游戏
     */
    pause() {
        if (!this.isRunning || this.isPaused) return;

        this.isPaused = true;
        clearInterval(this.gameLoop);
        this.gameLoop = null;
    }

    /**
     * 继续游戏
     */
    resume() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.gameLoop = setInterval(() => this.update(), this.speed);
    }

    /**
     * 停止游戏
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
    }

    /**
     * 设置移动方向
     * @param {string} dir - 方向 ('up', 'down', 'left', 'right')
     */
    setDirection(dir) {
        const directions = {
            'up': { x: 0, y: -1 },
            'down': { x: 0, y: 1 },
            'left': { x: -1, y: 0 },
            'right': { x: 1, y: 0 }
        };

        const newDir = directions[dir];
        if (!newDir) return;

        // 防止反向移动（蛇不能直接掉头）
        if (this.direction.x + newDir.x === 0 && this.direction.y + newDir.y === 0) {
            return;
        }

        this.nextDirection = newDir;
    }

    /**
     * 生成食物
     */
    generateFood() {
        let attempts = 0;
        const maxAttempts = 100;

        do {
            const types = ['apple', 'hamster', 'rabbit', 'bird', 'chicken', 'duck'];
            this.food = {
                x: Math.floor(Math.random() * this.cols),
                y: Math.floor(Math.random() * this.rows),
                type: types[Math.floor(Math.random() * types.length)],
                scale: 0 // 初始缩放为 0
            };
            attempts++;
        } while (this.isOnSnake(this.food.x, this.food.y) && attempts < maxAttempts);
    }

    /**
     * 检查坐标是否在蛇身上
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @returns {boolean} 是否在蛇身上
     */
    isOnSnake(x, y) {
        return this.snake.some(segment => segment.x === x && segment.y === y);
    }

    /**
     * 游戏更新（每帧调用）
     */
    update() {
        // 应用下一个方向
        this.direction = { ...this.nextDirection };

        // 计算新的头部位置
        const head = this.snake[0];
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // 边界碰撞检测
        if (newHead.x < 0 || newHead.x >= this.cols ||
            newHead.y < 0 || newHead.y >= this.rows) {
            this.gameOver();
            return;
        }

        // 自身碰撞检测
        if (this.isOnSnake(newHead.x, newHead.y)) {
            this.gameOver();
            return;
        }

        // 移动蛇
        this.snake.unshift(newHead);

        // 检查是否吃到食物
        if (newHead.x === this.food.x && newHead.y === this.food.y) {
            // 增加分数
            this.score += 10;
            if (this.onScoreChange) {
                this.onScoreChange(this.score);
            }

            // 生成新食物
            this.generateFood();

            // 稍微加速（最快60ms）
            if (this.speed > 60) {
                this.speed -= 2;
                clearInterval(this.gameLoop);
                this.gameLoop = setInterval(() => this.update(), this.speed);
            }
        } else {
            // 没吃到食物，移除尾部
            this.snake.pop();
        }

        // 重新绘制
        this.draw();

        // 更新动画状态
        if (this.food && this.food.scale < 1) {
            this.food.scale = Math.min(1, this.food.scale + 0.15); // 每帧增加缩放比例
        }
    }

    /**
     * 游戏结束
     */
    gameOver() {
        this.stop();

        if (this.onGameOver) {
            this.onGameOver(this.score, this.canvas);
        }
    }

    /**
     * 绘制游戏
     */
    draw() {
        const ctx = this.ctx;
        const size = this.gridSize;

        // 清空画布
        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格线
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        for (let i = 0; i <= this.cols; i++) {
            ctx.beginPath();
            ctx.moveTo(i * size, 0);
            ctx.lineTo(i * size, this.canvas.height);
            ctx.stroke();
        }
        for (let i = 0; i <= this.rows; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * size);
            ctx.lineTo(this.canvas.width, i * size);
            ctx.stroke();
        }

        // 绘制食物（使用 SVG 图像）
        if (this.food) {
            const fx = this.food.x * size;
            const fy = this.food.y * size;
            const foodImg = this.images[this.food.type] || this.images.apple;
            const scale = this.food.scale || 1;

            // 食物发光效果
            ctx.shadowColor = this.food.type === 'apple' ? this.colors.food : '#fbbf24';
            ctx.shadowBlur = 15 * scale;

            // 绘制食物图片（带缩放动画）
            ctx.save();
            ctx.translate(fx + size / 2, fy + size / 2);
            ctx.scale(scale, scale);
            ctx.drawImage(foodImg, -size / 2, -size / 2, size, size);
            ctx.restore();

            // 重置阴影
            ctx.shadowBlur = 0;
        }

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            const sx = segment.x * size;
            const sy = segment.y * size;
            const padding = index === 0 ? 0 : 2; // 蛇头不留 padding，身体留点空隙

            // 计算渐变比例（0 = 头部, 1 = 尾部）
            const ratio = index / Math.max(this.snake.length - 1, 1);

            // 头部特殊处理：绘制转向的 SVG 蛇头
            if (index === 0) {
                ctx.save();
                ctx.translate(sx + size / 2, sy + size / 2);

                // 根据当前方向旋转蛇头
                let angle = 0;
                if (this.direction.x === 1) angle = Math.PI / 2;      // 右
                else if (this.direction.x === -1) angle = -Math.PI / 2; // 左
                else if (this.direction.y === 1) angle = Math.PI;       // 下
                else if (this.direction.y === -1) angle = 0;           // 上 (SVG 默认向上朝向)

                ctx.rotate(angle);

                // 蛇头发光
                ctx.shadowColor = this.colors.snake;
                ctx.shadowBlur = 15;

                // 绘制蛇头图像
                ctx.drawImage(this.images.snakeHead, -size / 2, -size / 2, size, size);
                ctx.restore();
            } else {
                // 身体渐变：透明度从 0.95 渐变到 0.15
                const alpha = 0.95 - ratio * 0.8;
                // 发光效果也逐渐减弱
                ctx.shadowColor = `rgba(34, 211, 238, ${alpha * 0.5})`;
                ctx.shadowBlur = 8 - ratio * 6;
                // 颜色从青色渐变
                const r = Math.round(34 - ratio * 14);
                const g = Math.round(211 - ratio * 61);
                const b = Math.round(238 - ratio * 38);
                ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;

                // 绘制圆角身体
                this.roundRect(
                    ctx,
                    sx + padding,
                    sy + padding,
                    size - padding * 2,
                    size - padding * 2,
                    4
                );
                ctx.fill();

                // 为身体添加卡通斑点斑点（润色）
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
                ctx.beginPath();
                ctx.arc(sx + size * 0.3, sy + size * 0.3, size * 0.1, 0, Math.PI * 2);
                ctx.arc(sx + size * 0.7, sy + size * 0.6, size * 0.08, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // 重置阴影
        ctx.shadowBlur = 0;
    }

    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

// ===================================
// UI 控制器
// ===================================
const UIController = {
    // DOM 元素缓存
    elements: {},

    // 游戏实例
    game: null,

    /**
     * 初始化UI控制器
     */
    init() {
        // 缓存DOM元素
        this.cacheElements();

        // 绑定事件
        this.bindEvents();

        // 初始化游戏
        this.initGame();

        // 检查登录状态
        this.checkLoginStatus();
    },

    /**
     * 缓存DOM元素
     */
    cacheElements() {
        this.elements = {
            // 区域
            loginSection: document.getElementById('login-section'),
            gameSection: document.getElementById('game-section'),

            // 认证选项卡
            loginTab: document.getElementById('login-tab'),
            registerTab: document.getElementById('register-tab'),
            authMessage: document.getElementById('auth-message'),

            // 登录表单
            loginForm: document.getElementById('login-form'),
            loginUsername: document.getElementById('login-username'),
            loginPassword: document.getElementById('login-password'),
            loginBtn: document.getElementById('login-btn'),

            // 注册表单
            registerForm: document.getElementById('register-form'),
            registerUsername: document.getElementById('register-username'),
            registerPassword: document.getElementById('register-password'),
            registerConfirm: document.getElementById('register-confirm'),
            registerBtn: document.getElementById('register-btn'),

            // 游客按钮
            guestBtn: document.getElementById('guest-btn'),

            // 用户信息
            currentUsername: document.getElementById('current-username'),
            logoutBtn: document.getElementById('logout-btn'),
            historySection: document.querySelector('.history-section'),

            // 游戏相关
            gameCanvas: document.getElementById('game-canvas'),
            gameOverlay: document.getElementById('game-overlay'),
            overlayMessage: document.getElementById('overlay-message'),
            finalScore: document.getElementById('final-score'),
            currentScore: document.getElementById('current-score'),
            highScore: document.getElementById('high-score'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),

            // 移动端控制
            mobileControls: document.querySelectorAll('.control-btn'),

            // 选项卡
            tabBtns: document.querySelectorAll('.tab-btn'),
            scoresTab: document.getElementById('scores-tab'),
            loginsTab: document.getElementById('logins-tab'),
            scoresList: document.getElementById('scores-list'),
            loginsList: document.getElementById('logins-list')
        };
    },

    /**
     * 绑定事件
     */
    bindEvents() {
        // 认证选项卡切换
        this.elements.loginTab.addEventListener('click', () => this.switchAuthTab('login'));
        this.elements.registerTab.addEventListener('click', () => this.switchAuthTab('register'));

        // 登录按钮
        this.elements.loginBtn.addEventListener('click', () => this.handleLogin());

        // 登录表单回车提交
        this.elements.loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin();
            }
        });

        // 注册按钮
        this.elements.registerBtn.addEventListener('click', () => this.handleRegister());

        // 注册表单回车提交
        this.elements.registerConfirm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleRegister();
            }
        });

        // 游客模式按钮
        this.elements.guestBtn.addEventListener('click', () => this.handleGuestLogin());

        // 登出按钮
        this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());

        // 开始游戏按钮
        this.elements.startBtn.addEventListener('click', () => this.handleStartGame());

        // 暂停按钮
        this.elements.pauseBtn.addEventListener('click', () => this.handlePauseGame());

        // 键盘控制
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // 移动端控制按钮
        this.elements.mobileControls.forEach(btn => {
            btn.addEventListener('click', () => {
                const direction = btn.dataset.direction;
                if (this.game && this.game.isRunning && !this.game.isPaused) {
                    this.game.setDirection(direction);
                }
            });
        });

        // 选项卡切换
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.handleTabSwitch(btn));
        });
    },

    /**
     * 切换认证选项卡
     * @param {string} tab - 选项卡名称 ('login' 或 'register')
     */
    switchAuthTab(tab) {
        // 隐藏提示消息
        this.hideAuthMessage();

        if (tab === 'login') {
            this.elements.loginTab.classList.add('active');
            this.elements.registerTab.classList.remove('active');
            this.elements.loginForm.classList.remove('hidden');
            this.elements.registerForm.classList.add('hidden');
            this.elements.loginUsername.focus();
        } else {
            this.elements.loginTab.classList.remove('active');
            this.elements.registerTab.classList.add('active');
            this.elements.loginForm.classList.add('hidden');
            this.elements.registerForm.classList.remove('hidden');
            this.elements.registerUsername.focus();
        }
    },

    /**
     * 显示认证消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型 ('error' 或 'success')
     */
    showAuthMessage(message, type) {
        this.elements.authMessage.textContent = message;
        this.elements.authMessage.classList.remove('hidden', 'error', 'success');
        this.elements.authMessage.classList.add(type);
    },

    /**
     * 隐藏认证消息
     */
    hideAuthMessage() {
        this.elements.authMessage.classList.add('hidden');
        this.elements.authMessage.classList.remove('error', 'success');
    },

    /**
     * 初始化游戏
     */
    initGame() {
        this.game = new SnakeGame(this.elements.gameCanvas);

        // 缓存画布包装器元素（用于颤抖效果）
        this.canvasWrapper = document.querySelector('.canvas-wrapper');

        // 设置回调
        this.game.onScoreChange = (score) => {
            this.elements.currentScore.textContent = score;
        };

        this.game.onGameOver = (score, canvas) => {
            this.handleGameOver(score, canvas);
        };
    },

    /**
     * 检查登录状态
     */
    checkLoginStatus() {
        if (UserManager.isLoggedIn()) {
            this.showGameSection();
        } else {
            this.showLoginSection();
        }
    },

    /**
     * 显示登录区域
     */
    showLoginSection() {
        this.elements.loginSection.classList.remove('hidden');
        this.elements.gameSection.classList.add('hidden');

        // 重置表单
        this.elements.loginUsername.value = '';
        this.elements.loginPassword.value = '';
        this.elements.registerUsername.value = '';
        this.elements.registerPassword.value = '';
        this.elements.registerConfirm.value = '';

        // 隐藏消息提示
        this.hideAuthMessage();

        // 切换到登录选项卡
        this.switchAuthTab('login');
    },

    /**
     * 显示游戏区域
     */
    showGameSection() {
        this.elements.loginSection.classList.add('hidden');
        this.elements.gameSection.classList.remove('hidden');

        // 更新用户名显示
        const username = UserManager.getCurrentUsername();
        this.elements.currentUsername.textContent = username;

        // 游客模式处理：隐藏历史记录区域
        if (UserManager.isGuest) {
            this.elements.historySection.classList.add('hidden');
            this.elements.highScore.textContent = '0';
        } else {
            this.elements.historySection.classList.remove('hidden');
            // 更新最高分
            this.updateHighScore();
            // 更新历史记录
            this.updateHistoryLists();
        }

        // 初始化游戏画面
        if (this.game) {
            this.game.init();
        }

        // 重置游戏覆盖层
        this.showOverlay('按 开始游戏 按钮开始');
    },

    /**
     * 处理登录
     */
    handleLogin() {
        const username = this.elements.loginUsername.value;
        const password = this.elements.loginPassword.value;

        const result = UserManager.login(username, password);

        if (result.success) {
            this.showGameSection();
        } else {
            this.showAuthMessage(result.message, 'error');
            // 添加抖动效果
            this.elements.loginForm.classList.add('shake');
            setTimeout(() => {
                this.elements.loginForm.classList.remove('shake');
            }, 300);
        }
    },

    /**
     * 处理注册
     */
    handleRegister() {
        const username = this.elements.registerUsername.value;
        const password = this.elements.registerPassword.value;
        const confirmPassword = this.elements.registerConfirm.value;

        const result = UserManager.register(username, password, confirmPassword);

        if (result.success) {
            this.showAuthMessage(result.message, 'success');
            // 清空注册表单并切换到登录
            setTimeout(() => {
                this.elements.loginUsername.value = username;
                this.elements.loginPassword.value = '';
                this.switchAuthTab('login');
            }, 1500);
        } else {
            this.showAuthMessage(result.message, 'error');
            // 添加抖动效果
            this.elements.registerForm.classList.add('shake');
            setTimeout(() => {
                this.elements.registerForm.classList.remove('shake');
            }, 300);
        }
    },

    /**
     * 处理游客模式登录
     */
    handleGuestLogin() {
        UserManager.loginAsGuest();
        this.showGameSection();
    },

    /**
     * 处理登出
     */
    handleLogout() {
        // 停止游戏
        if (this.game) {
            this.game.stop();
        }

        UserManager.logout();
        this.showLoginSection();
    },

    /**
     * 处理开始游戏
     */
    handleStartGame() {
        if (!this.game) return;

        // 隐藏覆盖层
        this.hideOverlay();

        // 显示暂停按钮
        this.elements.pauseBtn.classList.remove('hidden');
        this.elements.pauseBtn.querySelector('span').textContent = '暂停';
        this.elements.startBtn.querySelector('span').textContent = '重新开始';

        // 重置速度
        this.game.speed = 120;

        // 开始游戏
        this.game.start();
    },

    /**
     * 处理暂停游戏
     */
    handlePauseGame() {
        if (!this.game || !this.game.isRunning) return;

        if (this.game.isPaused) {
            this.game.resume();
            this.elements.pauseBtn.querySelector('span').textContent = '暂停';
            this.hideOverlay();
        } else {
            this.game.pause();
            this.elements.pauseBtn.querySelector('span').textContent = '继续';
            this.showOverlay('游戏暂停');
        }
    },

    /**
     * 处理键盘事件
     */
    handleKeyDown(e) {
        if (!this.game || !this.game.isRunning || this.game.isPaused) return;

        const keyMap = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right',
            'w': 'up',
            'W': 'up',
            's': 'down',
            'S': 'down',
            'a': 'left',
            'A': 'left',
            'd': 'right',
            'D': 'right'
        };

        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.game.setDirection(direction);
        }
    },

    /**
     * 处理游戏结束
     */
    handleGameOver(score, canvas) {
        // 游客模式不保存分数
        if (!UserManager.isGuest) {
            // 保存分数
            const username = UserManager.getCurrentUsername();
            if (username) {
                DataStore.addScore(username, score);
            }

            // 更新最高分显示
            this.updateHighScore();

            // 更新历史记录
            this.updateHistoryLists();
        }

        // 添加画布颤抖效果
        if (this.canvasWrapper) {
            this.canvasWrapper.classList.add('game-over-shake');
            setTimeout(() => {
                this.canvasWrapper.classList.remove('game-over-shake');
            }, 500);
        }

        // 显示游戏结束覆盖层
        this.showOverlay('游戏结束', score);

        // 隐藏暂停按钮，重置开始按钮
        this.elements.pauseBtn.classList.add('hidden');
        this.elements.startBtn.querySelector('span').textContent = '再来一局';
    },

    /**
     * 显示覆盖层
     */
    showOverlay(message, score = null) {
        this.elements.overlayMessage.textContent = message;

        if (score !== null) {
            this.elements.finalScore.textContent = `得分: ${score}`;
            this.elements.finalScore.classList.remove('hidden');
        } else {
            this.elements.finalScore.classList.add('hidden');
        }

        this.elements.gameOverlay.classList.remove('hidden');
    },

    /**
     * 隐藏覆盖层
     */
    hideOverlay() {
        this.elements.gameOverlay.classList.add('hidden');
    },

    /**
     * 更新最高分显示
     */
    updateHighScore() {
        const username = UserManager.getCurrentUsername();
        if (username) {
            const highScore = DataStore.getHighScore(username);
            this.elements.highScore.textContent = highScore;
        }
    },

    /**
     * 处理选项卡切换
     */
    handleTabSwitch(clickedBtn) {
        const tab = clickedBtn.dataset.tab;

        // 更新按钮状态
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn === clickedBtn);
        });

        // 更新内容显示
        this.elements.scoresTab.classList.toggle('active', tab === 'scores');
        this.elements.loginsTab.classList.toggle('active', tab === 'logins');
    },

    /**
     * 更新历史记录列表
     */
    updateHistoryLists() {
        const username = UserManager.getCurrentUsername();
        if (!username) return;

        const user = DataStore.getUser(username);
        if (!user) return;

        // 更新分数历史
        this.renderScoresList(user.scores || []);

        // 更新登录历史
        this.renderLoginsList(user.loginHistory || []);
    },

    /**
     * 渲染分数列表
     */
    renderScoresList(scores) {
        const list = this.elements.scoresList;

        if (scores.length === 0) {
            list.innerHTML = '<li class="empty-message">暂无游戏记录</li>';
            return;
        }

        list.innerHTML = scores.map(record => {
            const date = this.formatDate(record.date);
            return `
                <li>
                    <span class="score-record">${record.score} 分</span>
                    <span class="date-record">${date}</span>
                </li>
            `;
        }).join('');
    },

    /**
     * 渲染登录列表
     */
    renderLoginsList(logins) {
        const list = this.elements.loginsList;

        if (logins.length === 0) {
            list.innerHTML = '<li class="empty-message">暂无登录记录</li>';
            return;
        }

        list.innerHTML = logins.map(dateStr => {
            const date = this.formatDate(dateStr);
            return `<li><span class="date-record">${date}</span></li>`;
        }).join('');
    },

    /**
     * 格式化日期
     */
    formatDate(isoString) {
        try {
            const date = new Date(isoString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        } catch (e) {
            return isoString;
        }
    }
};

// ===================================
// 应用入口
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    UIController.init();
});
