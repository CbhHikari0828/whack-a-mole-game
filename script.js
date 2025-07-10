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
    
    // 老鼠类型
    const moleTypes = [
        { type: 'normal', score: 1, time: { min: 800, max: 1200 }, chance: 0.7 },
        { type: 'fast', score: 2, time: { min: 400, max: 700 }, chance: 0.2 },
        { type: 'slow', score: 1, time: { min: 1300, max: 1800 }, chance: 0.05 },
        { type: 'golden', score: 5, time: { min: 500, max: 800 }, chance: 0.05 }
    ];

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
    
    // 随机选择一个老鼠类型
    function getRandomMoleType() {
        const rand = Math.random();
        let cumulativeChance = 0;
        
        for (const moleType of moleTypes) {
            cumulativeChance += moleType.chance;
            if (rand <= cumulativeChance) {
                return moleType;
            }
        }
        
        return moleTypes[0]; // 默认返回普通老鼠
    }
    
    // 显示分数弹出
    function showScorePopup(x, y, scoreValue) {
        const popup = document.createElement('div');
        popup.textContent = `+${scoreValue}`;
        popup.className = 'score-popup';
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }

    // 老鼠眼睛动画
    function animateEyes(mole, isActive) {
        const pupils = mole.querySelectorAll('.pupil-left, .pupil-right');
        
        if (isActive) {
            // 随机眼球位置
            pupils.forEach(pupil => {
                const randomX = Math.random() * 30;
                const randomY = Math.random() * 30;
                pupil.style.left = `${randomX}%`;
                pupil.style.top = `${randomY}%`;
            });
            
            // 持续眼球运动
            const eyeInterval = setInterval(() => {
                if (!mole.classList.contains('active')) {
                    clearInterval(eyeInterval);
                    return;
                }
                
                pupils.forEach(pupil => {
                    const randomX = Math.random() * 30;
                    const randomY = Math.random() * 30;
                    pupil.style.left = `${randomX}%`;
                    pupil.style.top = `${randomY}%`;
                });
            }, 800);
        } else {
            // 重置眼球位置
            pupils.forEach(pupil => {
                pupil.style.left = '30%';
                pupil.style.top = '30%';
            });
        }
    }
    
    // 让地鼠出现
    function popUp() {
        if (!gameActive) return;
        
        const idx = randomHole();
        const mole = moles[idx];
        const moleType = getRandomMoleType();
        
        // 重置老鼠样式
        mole.className = 'mole';
        
        // 设置老鼠类型
        if (moleType.type !== 'normal') {
            mole.classList.add(moleType.type);
        }
        
        // 设置数据属性用于计分
        mole.dataset.score = moleType.score;
        
        // 老鼠出现时间
        const time = Math.random() * (moleType.time.max - moleType.time.min) + moleType.time.min;
        
        // 老鼠出现
        mole.classList.add('active');
        animateEyes(mole, true);
        
        // 老鼠消失
        setTimeout(() => {
            mole.classList.remove('active');
            mole.classList.remove(moleType.type);
            animateEyes(mole, false);
            
            if (gameActive) {
                // 随机间隔后再出现下一只
                setTimeout(() => {
                    popUp();
                }, Math.random() * 300 + 200);
            }
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
        
        // 同时出现多只老鼠
        setTimeout(() => popUp(), 500);
        setTimeout(() => popUp(), 1000);
        setTimeout(() => popUp(), 1500);
        
        // 启动倒计时
        timer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                gameActive = false;
                startBtn.disabled = false;
                alert(`游戏结束！您的得分是：${score}分`);
                
                // 清除所有活跃的老鼠
                moles.forEach(mole => {
                    mole.classList.remove('active');
                    mole.classList.remove('golden', 'fast', 'slow');
                    animateEyes(mole, false);
                });
            }
        }, 1000);
    }
    
    // 点击地鼠
    function whack(e) {
        if (!gameActive) return;
        
        if (this.classList.contains('active')) {
            // 获取老鼠分值
            const moleScore = parseInt(this.dataset.score || 1);
            score += moleScore;
            scoreDisplay.textContent = score;
            
            // 显示分数弹出
            const rect = this.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY - 20;
            showScorePopup(x, y, moleScore);
            
            // 添加击打效果
            this.classList.add('hit');
            this.classList.remove('active', 'golden', 'fast', 'slow');
            animateEyes(this, false);
            
            this.parentNode.classList.add('hit');
            setTimeout(() => {
                this.parentNode.classList.remove('hit');
                this.classList.remove('hit');
            }, 300);
        }
    }
    
    // 事件监听
    moles.forEach(mole => mole.addEventListener('click', whack));
    startBtn.addEventListener('click', startGame);
}); 