/**
 * ElevenLabs API 服务
 */

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * 获取 ElevenLabs 的可用声音列表
 * @param {string} apiKey - ElevenLabs API 密钥
 * @returns {Promise<Array>} 声音对象数组
 */
export async function fetchElevenLabsVoices(apiKey) {
        if (!apiKey) {
                throw new Error('ElevenLabs API 密钥不能为空');
        }

        const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
                method: 'GET',
                headers: {
                        'xi-api-key': apiKey,
                        'Accept': 'application/json'
                }
        });

        if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.detail?.message || `API 请求失败，状态码: ${response.status}`;
                throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.voices || [];
}

/**
 * 使用 ElevenLabs API 生成语音
 * @param {string} apiKey - ElevenLabs API 密钥
 * @param {string} voiceId - 声音ID
 * @param {string} text - 要转换的文本
 * @param {Object} options - 可选配置
 * @returns {Promise<ArrayBuffer>} 音频数据
 */
export async function generateSpeech(apiKey, voiceId, text, options = {}) {
        if (!apiKey) {
                throw new Error('ElevenLabs API 密钥不能为空');
        }
        
        if (!voiceId) {
                throw new Error('声音ID不能为空');
        }
        
        if (!text || text.trim() === '') {
                throw new Error('文本内容不能为空');
        }

        const requestBody = {
                text: text,
                model_id: 'eleven_v3', // 使用支持中文的多语言模型
                voice_settings: {
                        stability: options.stability || 0.6, // 自然模式
                        similarity_boost: options.similarityBoost || 0.8,
                        style: options.style || 0.0,
                        use_speaker_boost: options.useSpeakerBoost || true
                }
        };

        const response = await fetch(`${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                        'xi-api-key': apiKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                },
                body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
                const errorText = await response.text().catch(() => '');
                let errorMessage = `语音生成失败，状态码: ${response.status}`;
                
                try {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.detail?.message || errorMessage;
                } catch {
                        // 如果不是JSON，使用原始错误文本
                        if (errorText) {
                                errorMessage = errorText;
                        }
                }
                
                throw new Error(errorMessage);
        }

        return await response.arrayBuffer();
}

/**
 * 将音频数据转换为 Blob URL
 * @param {ArrayBuffer} audioData - 音频数据
 * @returns {string} Blob URL
 */
export function createAudioBlobUrl(audioData) {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        return URL.createObjectURL(blob);
}