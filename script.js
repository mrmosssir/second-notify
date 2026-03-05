// 基礎計時器類別
class Timer {
    constructor(config) {
        this.name = config.name;
        this.totalTime = config.totalTime || 60;
        this.notifyTime = config.notifyTime || 10;
        this.notifyText = config.notifyText || "";
        this.currentTime = this.totalTime;
        this.isRunning = false;
        this.isPaused = false;
        this.hasNotified = false;
        this.startTime = null;
        
        // DOM 元素
        this.elements = config.elements;
        this.onNotify = config.onNotify; // 提醒時的回調函數
        
        this.bindEvents();
        this.updateDisplay();
    }
    
    bindEvents() {
        if (this.elements.startBtn) this.elements.startBtn.addEventListener('click', () => this.start());
        if (this.elements.pauseBtn) this.elements.pauseBtn.addEventListener('click', () => this.pause());
        if (this.elements.resetBtn) this.elements.resetBtn.addEventListener('click', () => this.reset());
        
        if (this.elements.totalInput) {
            this.elements.totalInput.addEventListener('change', () => {
                if (!this.isRunning) {
                    this.totalTime = parseInt(this.elements.totalInput.value) || 60;
                    this.currentTime = this.totalTime;
                    this.updateDisplay();
                }
            });
        }
        
        if (this.elements.notifyInput) {
            this.elements.notifyInput.addEventListener('change', () => {
                this.notifyTime = parseInt(this.elements.notifyInput.value) || 0;
            });
        }
        
        if (this.elements.textInput) {
            this.elements.textInput.addEventListener('change', () => {
                this.notifyText = this.elements.textInput.value;
            });
        }
    }
    
    start() {
        if (!this.isRunning || this.isPaused) {
            this.isRunning = true;
            this.isPaused = false;
            this.startTime = Date.now() - ((this.totalTime - this.currentTime) * 1000);
            
            this.updateControls();
            this.updateStatus('running', '執行中');
        }
    }
    
    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.isRunning = false;
            this.updateControls();
            this.updateStatus('paused', '已暫停');
        }
    }
    
    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.hasNotified = false;
        this.currentTime = this.totalTime;
        this.startTime = null;
        
        this.updateControls();
        this.updateStatus('', '準備就緒');
        if (this.elements.display) this.elements.display.classList.remove('warning');
        this.updateDisplay();
    }
    
    tick() {
        if (!this.isRunning || !this.startTime) return;

        const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        const newCurrentTime = this.totalTime - elapsedSeconds;

        if (newCurrentTime === this.currentTime && newCurrentTime > 0) return;
        
        this.currentTime = newCurrentTime;
        
        // 提醒邏輯
        if (this.currentTime <= this.notifyTime && !this.hasNotified && this.currentTime >= 0) {
            if (this.onNotify) this.onNotify(this.notifyText);
            this.hasNotified = true;
            if (this.elements.display) this.elements.display.classList.add('warning');
            this.updateStatus('notification', '提醒中');
        }
        
        // 循環邏輯
        if (this.currentTime <= 0) {
            this.startTime = Date.now();
            this.currentTime = this.totalTime;
            this.hasNotified = false;
            if (this.elements.display) this.elements.display.classList.remove('warning');
            this.updateDisplay();
            return;
        }
        
        this.updateDisplay();
    }
    
    updateDisplay() {
        const mins = Math.floor(Math.max(0, this.currentTime) / 60);
        const secs = Math.max(0, this.currentTime) % 60;
        const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (this.elements.display) this.elements.display.textContent = timeStr;
        
        if (this.elements.progress) {
            const percent = ((this.totalTime - this.currentTime) / this.totalTime) * 100;
            this.elements.progress.style.width = `${percent}%`;
        }
    }
    
    updateControls() {
        if (this.elements.startBtn) this.elements.startBtn.disabled = this.isRunning;
        if (this.elements.pauseBtn) this.elements.pauseBtn.disabled = !this.isRunning;
        if (this.elements.totalInput) this.elements.totalInput.disabled = this.isRunning;
    }
    
    updateStatus(className, text) {
        if (this.elements.status) {
            this.elements.status.className = 'status' + (className ? ` ${className}` : '');
            this.statusText = text; // 僅內部紀錄，如果 UI 沒用到就算了
        }
    }
}

// 應用程式管理類別
class App {
    constructor() {
        this.timers = [];
        this.worker = null;
        
        this.initWorker();
        this.initNavigation();
        this.initFishTimer();
        this.initKunlaTimers();
    }
    
    initWorker() {
        try {
            this.worker = new Worker('timer-worker.js');
            this.worker.onmessage = (e) => {
                if (e.data === 'tick') {
                    this.timers.forEach(t => t.tick());
                }
            };
            this.worker.postMessage({ action: 'start', interval: 200 });
        } catch (error) {
            console.error('Worker failed, using fallback');
            setInterval(() => this.timers.forEach(t => t.tick()), 200);
        }
    }
    
    initNavigation() {
        const fishLink = document.getElementById('fishTimerLink');
        const kunlaLink = document.getElementById('kunlaTimerLink');
        const fishPage = document.getElementById('fish-page');
        const kunlaPage = document.getElementById('kunla-page');
        
        const switchPage = (pageId) => {
            document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.sidebar-nav li').forEach(l => l.classList.remove('active'));
            
            if (pageId === 'fish') {
                fishPage.classList.add('active');
                fishLink.parentElement.classList.add('active');
            } else {
                kunlaPage.classList.add('active');
                kunlaLink.parentElement.classList.add('active');
            }
        };
        
        fishLink.addEventListener('click', (e) => { e.preventDefault(); switchPage('fish'); });
        kunlaLink.addEventListener('click', (e) => { e.preventDefault(); switchPage('kunla'); });
        
        // 啟用連結
        kunlaLink.parentElement.classList.remove('disabled');
    }
    
    initFishTimer() {
        const fishTimer = new Timer({
            name: "魚屋計時器",
            totalTime: 60,
            notifyTime: 10,
            notifyText: "小怪",
            elements: {
                display: document.getElementById('timeDisplay'),
                progress: document.getElementById('progress'),
                totalInput: document.getElementById('totalTime'),
                notifyInput: document.getElementById('notifyTime'),
                textInput: document.getElementById('notifyText'),
                startBtn: document.getElementById('startBtn'),
                pauseBtn: document.getElementById('pauseBtn'),
                resetBtn: document.getElementById('resetBtn'),
                status: document.getElementById('status')
            },
            onNotify: (text) => this.playNotify(text)
        });
        this.timers.push(fishTimer);
    }
    
    initKunlaTimers() {
        const grid = document.getElementById('timers-grid');
        const template = document.getElementById('timer-card-template');
        
        const config = [
            { name: "時鐘倒數", total: 10, notify: 0, text: "" },
            { name: "炸彈", total: 30, notify: 0, text: "炸彈注意" },
            { name: "二樓小怪", total: 50, notify: 0, text: "二樓小怪生成" },
            { name: "黑水", total: 70, notify: 10, text: "黑水剩餘10秒" },
        ];
        
        config.forEach(item => {
            const clone = template.content.cloneNode(true);
            const card = clone.querySelector('.timer-card');
            
            // 填充內容
            clone.querySelector('.timer-name').textContent = item.name;
            const display = clone.querySelector('.timer-card-time');
            const progress = clone.querySelector('.progress');
            const totalInput = clone.querySelector('.input-total');
            const notifyInput = clone.querySelector('.input-notify');
            const textInput = clone.querySelector('.input-text');
            const startBtn = clone.querySelector('.start');
            const pauseBtn = clone.querySelector('.pause');
            const resetBtn = clone.querySelector('.reset');
            
            totalInput.value = item.total;
            notifyInput.value = item.notify;
            textInput.value = item.text;
            
            grid.appendChild(clone);
            
            // 建立計時器實例 (注意：clone 之後要重新從 grid 抓取元素，因為原本的是 fragment)
            const newCard = grid.lastElementChild;
            const timer = new Timer({
                name: item.name,
                totalTime: item.total,
                notifyTime: item.notify,
                notifyText: item.text,
                elements: {
                    display: newCard.querySelector('.timer-card-time'),
                    progress: newCard.querySelector('.progress'),
                    totalInput: newCard.querySelector('.input-total'),
                    notifyInput: newCard.querySelector('.input-notify'),
                    textInput: newCard.querySelector('.input-text'),
                    startBtn: newCard.querySelector('.start'),
                    pauseBtn: newCard.querySelector('.pause'),
                    resetBtn: newCard.querySelector('.reset'),
                    status: null // 卡片暫不顯示詳細狀態文字
                },
                onNotify: (text) => this.playNotify(text)
            });
            this.timers.push(timer);
        });
    }
    
    async playNotify(text) {
        if (text && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-TW';
            window.speechSynthesis.speak(utterance);
        }
    }
}

// 啟動應用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
