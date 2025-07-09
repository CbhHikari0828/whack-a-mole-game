document.addEventListener('DOMContentLoaded', () => {
    const holes = document.querySelectorAll('.hole');
    const moles = document.querySelectorAll('.mole');
    const scoreDisplay = document.getElementById('score');
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('start-btn');
    
    let score = 0;
    let timeLeft = 60;
    let timer;
    let gameActive = false;
    let lastHole;
    
    // 随机选择一个地洞
    function randomHole() {
        const idx = Math.floor(Math.random() * holes.length);
        const hole = holes[idx];
        
        // 避免连续选择同一个地洞
        if (hole === lastHole) {
            return randomHole();
        }
        
        lastHole = hole;
        return idx;
    }
    
    // 让地鼠出现
    function popUp() {
        if (!gameActive) return;
        
        const time = Math.random() * 1000 + 500; // 0.5-1.5秒
        const idx = randomHole();
        const mole = moles[idx];
        
        mole.classList.add('active');
        
        setTimeout(() => {
            mole.classList.remove('active');
            if (gameActive) popUp();
        }, time);
    }
    
    // 开始游戏
    function startGame() {
        score = 0;
        timeLeft = 60;
        gameActive = true;
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        startBtn.disabled = true;
        
        // 启动倒计时
        timer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                gameActive = false;
                startBtn.disabled = false;
                alert(`游戏结束！您的得分是：${score}分`);
            }
        }, 1000);
        
        // 开始让地鼠出现
        popUp();
    }
    
    // 点击地鼠
    function whack() {
        if (!gameActive) return;
        
        if (this.classList.contains('active')) {
            score++;
            scoreDisplay.textContent = score;
            this.classList.remove('active');
            
            // 添加击打效果
            this.parentNode.classList.add('hit');
            setTimeout(() => {
                this.parentNode.classList.remove('hit');
            }, 300);
        }
    }
    
    // 事件监听
    moles.forEach(mole => mole.addEventListener('click', whack));
    startBtn.addEventListener('click', startGame);
}); 