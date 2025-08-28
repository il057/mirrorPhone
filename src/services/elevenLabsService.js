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