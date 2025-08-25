// src/services/gistService.js
import { packDataForExport, unpackAndImportData } from './dataService.js';

/**
 * GitHub Gist API 服务
 * 用于与GitHub Gist进行数据同步
 */

const GITHUB_API_BASE = 'https://api.github.com';

/**
 * 创建新的 Gist
 * @param {string} token - GitHub Personal Access Token
 * @param {string} content - 要上传的内容
 * @param {string} description - Gist 描述
 * @returns {Promise<string>} 创建的 Gist ID
 */
export async function createGist(token, content, description = 'mirrorPhone 数据备份') {
  const response = await fetch(`${GITHUB_API_BASE}/gists`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description,
      public: false, // 私有 Gist
      files: {
        'mirrorphone-backup.json': {
          content: content
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`创建 Gist 失败: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.id;
}

/**
 * 更新现有的 Gist
 * @param {string} token - GitHub Personal Access Token
 * @param {string} gistId - Gist ID
 * @param {string} content - 新的内容
 * @param {string} description - 新的描述
 * @returns {Promise<void>}
 */
export async function updateGist(token, gistId, content, description = 'mirrorPhone 数据备份') {
  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description,
      files: {
        'mirrorphone-backup.json': {
          content: content
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`更新 Gist 失败: ${error.message || response.statusText}`);
  }
}

/**
 * 获取 Gist 内容
 * @param {string} token - GitHub Personal Access Token
 * @param {string} gistId - Gist ID
 * @returns {Promise<string>} Gist 文件内容
 */
export async function getGist(token, gistId) {
  const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取 Gist 失败: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  const filename = 'mirrorphone-backup.json';
  
  if (!data.files[filename]) {
    throw new Error('Gist 中未找到备份文件');
  }

  return data.files[filename].content;
}

/**
 * 检查 Gist 是否存在且可访问
 * @param {string} token - GitHub Personal Access Token
 * @param {string} gistId - Gist ID
 * @returns {Promise<boolean>} 是否存在且可访问
 */
export async function checkGistExists(token, gistId) {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/gists/${gistId}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * 将当前数据同步到 Gist
 * @param {string} token - GitHub Personal Access Token
 * @param {string} gistId - Gist ID (可选，如果不提供则创建新的)
 * @returns {Promise<string>} Gist ID
 */
export async function syncToGist(token, gistId = null) {
  if (!token) {
    throw new Error('请提供 GitHub Personal Access Token');
  }

  const content = await packDataForExport();
  const timestamp = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  const description = `mirrorPhone 数据备份 - ${timestamp}`;

  if (gistId) {
    // 检查 Gist 是否存在
    const exists = await checkGistExists(token, gistId);
    if (!exists) {
      throw new Error('指定的 Gist ID 不存在或无法访问');
    }
    
    await updateGist(token, gistId, content, description);
    return gistId;
  } else {
    // 创建新的 Gist
    return await createGist(token, content, description);
  }
}

/**
 * 从 Gist 恢复数据
 * @param {string} token - GitHub Personal Access Token
 * @param {string} gistId - Gist ID
 * @returns {Promise<void>}
 */
export async function restoreFromGist(token, gistId) {
  if (!token) {
    throw new Error('请提供 GitHub Personal Access Token');
  }

  if (!gistId) {
    throw new Error('请提供 Gist ID');
  }

  const content = await getGist(token, gistId);
  await unpackAndImportData(content);
}
