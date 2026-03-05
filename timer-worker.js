// timer-worker.js
// 這是一個 Web Worker，運行在獨立執行緒，不受分頁進入背景後的嚴重節流限制

let timerId = null;

self.onmessage = function(e) {
    if (e.data.action === 'start') {
        const interval = e.data.interval || 200;
        
        // 如果已有計時器，先清除
        if (timerId) clearInterval(timerId);
        
        timerId = setInterval(() => {
            self.postMessage('tick');
        }, interval);
    } 
    else if (e.data.action === 'stop') {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }
};
