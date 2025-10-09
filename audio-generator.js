// 音效生成器 - 創建鈴聲音效
class AudioGenerator {
    static generateBellSound() {
        // 創建音頻上下文
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const duration = 0.8; // 單次鈴聲0.8秒
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成鈴聲（多個頻率的正弦波組合）
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            
            // 基礎頻率和泛音
            const freq1 = 880; // 主頻率 (A5)
            const freq2 = 1320; // 第二泛音
            const freq3 = 1760; // 第三泛音
            
            // 包絡線（漸弱效果）
            const envelope = Math.exp(-t * 3) * (1 - Math.exp(-t * 20));
            
            // 組合多個頻率創造鈴聲效果
            data[i] = envelope * (
                0.6 * Math.sin(2 * Math.PI * freq1 * t) +
                0.3 * Math.sin(2 * Math.PI * freq2 * t) +
                0.1 * Math.sin(2 * Math.PI * freq3 * t)
            ) * 0.4; // 調整音量
        }
        
        return buffer;
    }
    
    static createBellAudioElement() {
        // 創建音頻元素
        const audio = document.createElement('audio');
        audio.id = 'generatedBellSound';
        
        // 生成鈴聲緩衝區
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const buffer = this.generateBellSound();
        
        // 將緩衝區轉換為可播放的音頻
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 創建音頻數據 URL
        this.bufferToWave(buffer, audioContext.sampleRate).then(blob => {
            const url = URL.createObjectURL(blob);
            audio.src = url;
            audio.preload = 'auto';
        });
        
        return audio;
    }
    
    static async bufferToWave(buffer, sampleRate) {
        const length = buffer.length;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV 檔案標頭
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // 音頻數據
        const channelData = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            const sample = Math.max(-1, Math.min(1, channelData[i]));
            view.setInt16(offset, sample * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
}

// 如果瀏覽器支援 Web Audio API，替換原來的音頻元素
if ('AudioContext' in window || 'webkitAudioContext' in window) {
    document.addEventListener('DOMContentLoaded', () => {
        // 替換原本的音頻元素
        const originalAudio = document.getElementById('notificationSound');
        if (originalAudio) {
            const newAudio = AudioGenerator.createBellAudioElement();
            newAudio.id = 'notificationSound';
            originalAudio.parentNode.replaceChild(newAudio, originalAudio);
        }
    });
}
