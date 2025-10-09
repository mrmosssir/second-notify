class CountdownTimer {
    constructor() {
        this.totalTime = 60; // 總倒數時間（秒）
        this.notifyTime = 10; // 提醒時間（秒）
        this.currentTime = this.totalTime; // 當前時間
        this.isRunning = false; // 是否正在運行
        this.isPaused = false; // 是否暫停
        this.timer = null; // 計時器
        this.hasNotified = false; // 是否已經通知過
        
        this.initElements();
        this.bindEvents();
        this.updateDisplay();
    }
    
    initElements() {
        // 獲取DOM元素
        this.totalTimeInput = document.getElementById('totalTime');
        this.notifyTimeInput = document.getElementById('notifyTime');
        this.timeDisplay = document.getElementById('timeDisplay');
        this.progressBar = document.getElementById('progress');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.status = document.getElementById('status');
        this.audio = document.getElementById('notificationSound');
        
        // 設置初始值
        this.totalTimeInput.value = this.totalTime;
        this.notifyTimeInput.value = this.notifyTime;
    }
    
    bindEvents() {
        // 綁定按鈕事件
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        // 綁定輸入變更事件
        this.totalTimeInput.addEventListener('change', () => this.updateSettings());
        this.notifyTimeInput.addEventListener('change', () => this.updateSettings());
        
        // 防止輸入負數
        this.totalTimeInput.addEventListener('input', (e) => {
            if (e.target.value < 1) e.target.value = 1;
        });
        this.notifyTimeInput.addEventListener('input', (e) => {
            if (e.target.value < 1) e.target.value = 1;
        });
    }
    
    updateSettings() {
        if (!this.isRunning) {
            this.totalTime = parseInt(this.totalTimeInput.value) || 60;
            this.notifyTime = parseInt(this.notifyTimeInput.value) || 10;
            
            // 確保提醒時間不超過總時間
            if (this.notifyTime >= this.totalTime) {
                this.notifyTime = Math.max(1, this.totalTime - 1);
                this.notifyTimeInput.value = this.notifyTime;
            }
            
            this.currentTime = this.totalTime;
            this.updateDisplay();
        }
    }
    
    start() {
        if (!this.isRunning || this.isPaused) {
            this.isRunning = true;
            this.isPaused = false;
            this.hasNotified = false;
            
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            this.totalTimeInput.disabled = true;
            this.notifyTimeInput.disabled = true;
            
            this.updateStatus('running', '倒數進行中...');
            
            this.timer = setInterval(() => {
                this.tick();
            }, 1000);
        }
    }
    
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.isRunning = false;
            
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
            
            this.updateStatus('paused', '已暫停');
            
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.hasNotified = false;
        this.currentTime = this.totalTime;
        
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.totalTimeInput.disabled = false;
        this.notifyTimeInput.disabled = false;
        
        this.updateStatus('', '準備就緒');
        this.timeDisplay.classList.remove('warning');
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.updateDisplay();
    }
    
    tick() {
        this.currentTime--;
        
        // 檢查是否到達提醒時間
        if (this.currentTime === this.notifyTime && !this.hasNotified) {
            this.playNotificationSound();
            this.hasNotified = true;
            this.timeDisplay.classList.add('warning');
            this.updateStatus('notification', `⚠️ 還剩 ${this.notifyTime} 秒！`);
        }
        
        // 檢查是否倒數結束
        if (this.currentTime <= 0) {
            this.currentTime = this.totalTime; // 直接重置時間
            this.hasNotified = false;
            this.timeDisplay.classList.remove('warning');
            this.updateStatus('completed', '時間到！重新開始...');
            this.updateDisplay();
            
            // 短暫顯示完成狀態後繼續
            setTimeout(() => {
                this.updateStatus('running', '倒數進行中...');
            }, 500);
            
            return;
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        // 更新時間顯示
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 更新進度條
        const progress = ((this.totalTime - this.currentTime) / this.totalTime) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
    
    updateStatus(className, text) {
        this.status.className = 'status' + (className ? ` ${className}` : '');
        this.status.textContent = text;
    }
    
    async playNotificationSound() {
        try {
            // 播放3次鈴聲，每次間隔0.8秒
            for (let i = 0; i < 3; i++) {
                // 重置音效到開始位置
                this.audio.currentTime = 0;
                
                // 播放音效
                await this.audio.play();
                
                // 等待0.8秒播放完一次鈴聲後再播放下一次
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // 暫停音效準備下次播放
                this.audio.pause();
                
                // 如果不是最後一次，等待0.2秒間隔
                if (i < 2) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            
        } catch (error) {
            console.log('無法播放音效:', error);
            // 如果無法播放音效，使用瀏覽器原生通知
            if ('Notification' in window) {
                this.showBrowserNotification();
            }
        }
    }
    
    async showBrowserNotification() {
        // 請求通知權限
        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }
        
        if (Notification.permission === 'granted') {
            new Notification('倒數計時器提醒', {
                body: `還剩 ${this.notifyTime} 秒！`,
                icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%23ff6b6b"/><text x="50" y="60" text-anchor="middle" fill="white" font-size="30">⏰</text></svg>'
            });
        }
    }
}

// 初始化計時器
document.addEventListener('DOMContentLoaded', () => {
    new CountdownTimer();
});

// 防止頁面離開時丟失狀態的警告
window.addEventListener('beforeunload', (e) => {
    const timer = document.querySelector('.status.running');
    if (timer) {
        e.preventDefault();
        e.returnValue = '計時器正在運行中，確定要離開嗎？';
    }
});
