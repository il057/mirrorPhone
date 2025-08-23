/**
 * 根据不同的连接方式拉取模型列表
 * @param {object} profile - 当前的API方案对象
 * @param {string} profile.connectionType - 连接方式 ('direct' 或 'proxy')
 * @param {string} profile.apiKey - API密钥
 * @param {string} [profile.apiUrl] - 反代地址 (仅proxy需要)
 * @returns {Promise<string[]>} 解析为模型名称数组的Promise
 */
export async function fetchModels(profile) {
        let fetchUrl;
        const fetchOptions = {
                method: 'GET',
                headers: {
                        'Content-Type': 'application/json',
                },
        };

        // 1. 根据连接方式，配置URL和请求头
        if (profile.connectionType === 'direct') {
                // Gemini 直连方式
                fetchUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${profile.apiKey}`;
        } else {
                // 反代方式 (兼容OpenAI)
                if (!profile.apiUrl || !profile.apiUrl.trim()) {
                        throw new Error('反向代理地址不能为空。');
                }
                // 清理URL，确保末尾没有多余的斜杠
                const cleanBaseUrl = profile.apiUrl.trim().endsWith('/')
                        ? profile.apiUrl.trim().slice(0, -1)
                        : profile.apiUrl.trim();

                fetchUrl = `${cleanBaseUrl}/v1/models`;
                fetchOptions.headers['Authorization'] = `Bearer ${profile.apiKey}`;
        }

        try {
                const response = await fetch(fetchUrl, fetchOptions);

                if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        const errorMessage = errorData.error?.message || `HTTP 错误, 状态码: ${response.status}`;
                        throw new Error(errorMessage);
                }

                const data = await response.json();

                // 2. 根据连接方式，解析不同结构的返回数据
                let models;
                if (profile.connectionType === 'direct') {
                        // 解析 Gemini 的 `data.models` 数组
                        models = data.models
                                .filter(model => model.supportedGenerationMethods.includes('generateContent'))
                                .map(model => model.name.replace('models/', ''));
                } else {
                        // 解析兼容OpenAI的 `data.data` 数组
                        models = data.data.map(model => model.id);
                }

                return models.sort(); // 返回排序后的模型名称列表

        } catch (error) {
                console.error('拉取模型列表失败:', error);
                throw error; // 将错误向上抛出，给UI层处理
        }
}