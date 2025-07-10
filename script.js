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
    
    // 老鼠类型 - 调整概率使得更容易出现各种类型
    const moleTypes = [
        { type: 'normal', score: 1, time: { min: 800, max: 1200 }, chance: 0.5 },
        { type: 'fast', score: 2, time: { min: 400, max: 700 }, chance: 0.3 },
        { type: 'bomb', score: -10, time: { min: 900, max: 1400 }, chance: 0.05 },
        { type: 'golden', score: 5, time: { min: 500, max: 800 }, chance: 0.15 }
    ];
    
    // 用于调试的计数器
    const typeCounter = {
        normal: 0,
        fast: 0,
        bomb: 0,
        golden: 0
    };

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
    
    // 强制选择一个特定类型的老鼠 - 用于确保所有类型都出现
    function forceMoleType() {
        // 找出出现次数最少的类型
        const minType = Object.entries(typeCounter).sort((a, b) => a[1] - b[1])[0][0];
        return moleTypes.find(type => type.type === minType);
    }
    
    // 随机选择一个老鼠类型
    function getRandomMoleType() {
        // 每10次强制平衡一下各类型老鼠
        const totalMoles = Object.values(typeCounter).reduce((sum, count) => sum + count, 0);
        if (totalMoles > 0 && totalMoles % 10 === 0) {
            return forceMoleType();
        }
        
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
        popup.textContent = scoreValue > 0 ? `+${scoreValue}` : `${scoreValue}`;
        popup.className = 'score-popup';
        
        // 如果是负分，添加负分样式
        if (scoreValue < 0) {
            popup.classList.add('negative');
        }
        
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.remove();
        }, 1000);
    }
    
    // 显示爆炸效果
    function showExplosion(hole) {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        hole.appendChild(explosion);
        
        // 添加爆炸音效
        const explosionSound = new Audio('data:audio/mp3;base64,//OEZAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAeAAAgIAAICAgICBAQEBAQHh4eHh4eKSkpKSk3NTU1NTVCQkJCQkJQUFBQUFBdXV1dXV1qampqanZ2dnZ2doODg4ODg5GRkZGRnZ2dnZ2dqqqqqqq2tra2trLCwsLCwszMzMzMzNnZ2dnZ2eXl5eXl8vLy8vLy//////8AAAA5TEFNRTMuOThyAm4AAAAALkUAABRGJASMTQAARgAACCAjEtHZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//NkZAASJRVxYcyYAEkw9nBVPSAAmVTHVp9NCsJsFUJ/D/AiIpABBB/4gge8EKQgG8AAAAAAf+KUO/BA7/3w/JBjicD/Q7//cqBw/9vChBEHYKnGwhg6ywFJAVgiGIVAJUOGCArBAFihwgLYIF//WY/lTn+v8j0XB/BBqECtDtA9xEIOp/+a////8eRPD6uY5Zme6ywftvj9GJYytKh9ATkISPj6XB+KvmPUJO3vUIsmi/kFhO/qyckJnxjcCh0Y3lpeWMVkgX+HyPWQXyCZ/+UJCZjTuNu7/P/ny8TEShmp8/M//OUZAcV7d0u81mAADug9m6hmMAFly8K54Lzxn3b/GcsxgDADC4lKX4Rl8TAgHATAMKgoCcPAAAqAgjIfggEQTgbKCMOfDAZAXCIMA/IAZAYAotAPBQC0vCwEwhCYC4sWwE2hJjf/3vXer///////////1///dfpdfvQfe4GxYAY+QBw5jXE4ypfQ5cCIOFYQJhx2YbihNAxC+IrDBu5pDIMzDYPjDQNjLgxDrEDDwsjZMaDDYXjUA1zWjFQsB+ZQDYYKGBocSmBwMGCxIYEB5g2BGIQIZAPJgSAlcRhCEEWCXXe6crzX+3/////9///7////1vf/////6tsTEFNRTMuOTguMgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//MUZAgJbAUR7dBAAA04AjebkEAA');
        explosionSound.volume = 0.5;
        explosionSound.play();
        
        setTimeout(() => {
            explosion.remove();
        }, 500);
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
        
        // 记录老鼠类型出现次数
        typeCounter[moleType.type]++;
        console.log(`老鼠类型统计: 普通=${typeCounter.normal}, 快速=${typeCounter.fast}, 炸弹=${typeCounter.bomb}, 金色=${typeCounter.golden}`);
        
        // 重置老鼠样式
        mole.className = 'mole';
        
        // 设置老鼠类型并确保应用正确的CSS类
        mole.classList.add(moleType.type);
        
        // 设置数据属性用于计分
        mole.dataset.score = moleType.score;
        mole.dataset.type = moleType.type;
        
        // 老鼠出现时间
        const time = Math.random() * (moleType.time.max - moleType.time.min) + moleType.time.min;
        
        // 老鼠出现
        setTimeout(() => {
            mole.classList.add('active');
            animateEyes(mole, true);
        }, 10);
        
        // 老鼠消失
        setTimeout(() => {
            mole.classList.remove('active');
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
        
        // 重置类型计数器
        Object.keys(typeCounter).forEach(key => {
            typeCounter[key] = 0;
        });
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        startBtn.disabled = true;
        
        // 确保每种类型的老鼠都至少出现一次
        setTimeout(() => {
            const mole1 = document.querySelector('.mole');
            mole1.className = 'mole normal';
            mole1.classList.add('active');
            animateEyes(mole1, true);
            
            setTimeout(() => {
                mole1.classList.remove('active', 'normal');
                animateEyes(mole1, false);
            }, 1000);
        }, 500);
        
        setTimeout(() => {
            const mole2 = document.querySelectorAll('.mole')[1];
            mole2.className = 'mole fast';
            mole2.classList.add('active');
            animateEyes(mole2, true);
            
            setTimeout(() => {
                mole2.classList.remove('active', 'fast');
                animateEyes(mole2, false);
            }, 800);
        }, 1500);
        
        setTimeout(() => {
            const mole3 = document.querySelectorAll('.mole')[2];
            mole3.className = 'mole bomb';
            mole3.classList.add('active');
            animateEyes(mole3, true);
            
            setTimeout(() => {
                mole3.classList.remove('active', 'bomb');
                animateEyes(mole3, false);
            }, 1500);
        }, 2500);
        
        setTimeout(() => {
            const mole4 = document.querySelectorAll('.mole')[3];
            mole4.className = 'mole golden';
            mole4.classList.add('active');
            animateEyes(mole4, true);
            
            setTimeout(() => {
                mole4.classList.remove('active', 'golden');
                animateEyes(mole4, false);
                
                // 开始随机生成老鼠
                setTimeout(() => popUp(), 500);
                setTimeout(() => popUp(), 1200);
                setTimeout(() => popUp(), 1800);
            }, 1000);
        }, 4000);
        
        // 启动倒计时
        timer = setInterval(() => {
            timeLeft--;
            timeDisplay.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                gameActive = false;
                startBtn.disabled = false;
                alert(`游戏结束！您的得分是：${score}分\n\n老鼠出现统计:\n普通老鼠: ${typeCounter.normal}只\n快速老鼠: ${typeCounter.fast}只\n炸弹老鼠: ${typeCounter.bomb}只\n黄金老鼠: ${typeCounter.golden}只`);
                
                // 清除所有活跃的老鼠
                moles.forEach(mole => {
                    mole.classList.remove('active');
                    mole.classList.remove('golden', 'fast', 'bomb', 'normal');
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
            const moleType = this.dataset.type || 'normal';
            score += moleScore;
            scoreDisplay.textContent = score;
            
            // 显示分数弹出
            const x = e.clientX;
            const y = e.clientY - 20;
            showScorePopup(x, y, moleScore);
            
            // 如果是炸弹老鼠，显示爆炸效果
            if (moleType === 'bomb') {
                showExplosion(this.parentNode);
            }
            
            // 添加击打效果
            this.classList.add('hit');
            this.classList.remove('active');
            animateEyes(this, false);
            
            this.parentNode.classList.add('hit');
            setTimeout(() => {
                this.parentNode.classList.remove('hit');
                this.classList.remove('hit', 'golden', 'fast', 'bomb', 'normal');
            }, 300);
        }
    }
    
    // 事件监听
    moles.forEach(mole => mole.addEventListener('click', whack));
    startBtn.addEventListener('click', startGame);
}); 