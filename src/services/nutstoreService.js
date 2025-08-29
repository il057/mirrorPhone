// src/services/nutstoreService.js
import { packDataForExport, unpackAndImportData } from './dataService.js';

/**
 * 坚果云服务
 * 注意：由于CORS限制，此功能在开发        const response = await fetch(testUrl, {
            method: 'PROPFIND',
            headers: {
                'Authorization': `Basic ${btoa(token + ':')}`, // 使用Basic认证
                'Depth': '0'
            }
        });正常工作
 * 建议在生产环境中使用后端代理，或使用GitHub Gist作为替代方案
 */

const NUTSTORE_API_BASE = 'https://dav.jianguoyun.com/dav';

/**
 * 创建父目录（递归）
 * @param {string} email - 坚果云邮箱地址
 * @param {string} token - 坚果云 Access Token
 * @param {string} fullPath - 完整文件路径
 */
async function createParentDirectories(email, token, fullPath) {
    // 获取文件路径的目录部分
    const pathParts = fullPath.split('/').filter(part => part.length > 0);
    if (pathParts.length <= 1) return; // 如果没有父目录，直接返回

    // 移除文件名，只保留目录路径
    const dirPath = '/' + pathParts.slice(0, -1).join('/');

    console.log('创建父目录:', dirPath);

    try {
        const response = await fetch(`${NUTSTORE_API_BASE}${dirPath}`, {
            method: 'MKCOL', // WebDAV创建目录的方法
            headers: {
                'Authorization': `Basic ${btoa(email + ':' + token)}`,
            }
        });

        if (response.status === 201) {
            console.log('父目录创建成功:', dirPath);
        } else if (response.status === 405) {
            console.log('父目录已存在:', dirPath);
        } else {
            const errorText = await response.text();
            console.warn('创建父目录失败:', response.status, errorText);
            // 不抛出错误，继续尝试上传文件
        }
    } catch (error) {
        console.warn('创建父目录时出错:', error);
        // 不抛出错误，继续尝试上传文件
    }
}

/**
 * 上传数据到坚果云
 * @param {string} email - 坚果云邮箱地址
 * @param {string} token - 坚果云 Access Token
 * @param {string} path - 坚果云中的文件路径
 * @returns {Promise<void>}
 */
export async function syncToNutstore(email, token, path = '/mirrorPhone-backup.json') {
    try {
        // 打包数据
        const jsonData = await packDataForExport();
        
        // 检查数据大小
        const dataSizeKB = (jsonData.length / 1024).toFixed(2);
        const dataSizeMB = (jsonData.length / (1024 * 1024)).toFixed(2);
        console.log(`准备上传到坚果云，数据大小: ${dataSizeKB} KB (${dataSizeMB} MB)`);
        
        // 如果数据太大，尝试压缩
        let uploadData = jsonData;
        if (jsonData.length > 1024 * 1024) { // 大于1MB时尝试压缩
            console.log('数据较大，尝试压缩...');
            // 简单的压缩：移除不必要的空格
            uploadData = JSON.stringify(JSON.parse(jsonData));
            const compressedSizeKB = (uploadData.length / 1024).toFixed(2);
            console.log(`压缩后大小: ${compressedSizeKB} KB`);
        }

        // 确保路径以 / 开头
        const fullPath = path.startsWith('/') ? path : `/${path}`;

        // 创建必要的父目录
        await createParentDirectories(email, token, fullPath);

        // 使用坚果云的WebDAV API
        const uploadUrl = `${NUTSTORE_API_BASE}${fullPath}`;

        console.log('上传URL:', uploadUrl);
        console.log('请求头:', {
            'Authorization': `Basic ${btoa(email + ':' + token)}`, // 邮箱:token格式
            'Content-Type': 'application/json',
        });

        const response = await fetch(uploadUrl, {
            method: 'PUT', // WebDAV使用PUT方法上传文件
            headers: {
                'Authorization': `Basic ${btoa(email + ':' + token)}`, // 邮箱:token格式
                'Content-Type': 'application/octet-stream', // WebDAV文件上传的标准Content-Type
            },
            body: uploadData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('坚果云API响应:', response.status, response.statusText);
            console.error('响应内容:', errorText.substring(0, 500)); // 只显示前500个字符
            
            if (response.status === 0 || errorText.includes('CORS')) {
                throw new Error('坚果云同步失败：由于浏览器CORS策略限制，建议使用GitHub Gist作为替代方案，或在生产环境中配置后端代理。');
            }
            if (response.status === 413) {
                throw new Error(`坚果云同步失败：数据大小(${dataSizeKB}KB)超过服务器限制。建议清理不必要的数据，或使用GitHub Gist作为替代方案。`);
            }
            if (response.status === 401 || response.status === 403) {
                throw new Error('坚果云同步失败：认证失败，请检查Access Token是否正确。坚果云WebDAV需要有效的Access Token作为Basic认证的用户名。');
            }
            if (response.status === 404) {
                throw new Error('坚果云同步失败：API端点不存在，请检查API配置。');
            }
            if (errorText.includes('<html>')) {
                throw new Error(`坚果云同步失败：服务器返回了HTML页面（可能是登录页面或错误页面），请检查API配置和认证。响应内容：${errorText.substring(0, 200)}...`);
            }
            throw new Error(`上传到坚果云失败: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        console.log('坚果云上传成功:', result);
    } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            throw new Error('坚果云同步失败：由于浏览器CORS策略限制，建议使用GitHub Gist作为替代方案，或在生产环境中配置后端代理。');
        }
        console.error('坚果云同步失败:', error);
        throw error;
    }
}

/**
 * 从坚果云恢复数据
 * @param {string} email - 坚果云邮箱地址
 * @param {string} token - 坚果云 Access Token
 * @param {string} path - 坚果云中的文件路径
 * @returns {Promise<void>}
 */
export async function restoreFromNutstore(email, token, path = '/mirrorPhone-backup.json') {
    try {
        // 确保路径以 / 开头
        const fullPath = path.startsWith('/') ? path : `/${path}`;

        // 使用坚果云的WebDAV API
        const downloadUrl = `${NUTSTORE_API_BASE}${fullPath}`;

        console.log('下载URL:', downloadUrl);

        const response = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${btoa(email + ':' + token)}`, // 邮箱:token格式
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('坚果云中没有找到备份文件，请先进行一次同步');
            }
            if (response.status === 0) {
                throw new Error('坚果云恢复失败：由于浏览器CORS策略限制，建议使用GitHub Gist作为替代方案，或在生产环境中配置后端代理。');
            }
            const errorText = await response.text();
            throw new Error(`从坚果云下载失败: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const jsonData = await response.text();

        // 解析并导入数据
        await unpackAndImportData(jsonData);
    } catch (error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            throw new Error('坚果云恢复失败：由于浏览器CORS策略限制，建议使用GitHub Gist作为替代方案，或在生产环境中配置后端代理。');
        }
        console.error('坚果云恢复失败:', error);
        throw error;
    }
}

/**
 * 测试坚果云连接
 * @param {string} email - 坚果云邮箱地址
 * @param {string} token - 坚果云 Access Token
 * @returns {Promise<boolean>} 连接是否成功
 */
export async function testNutstoreConnection(email, token) {
    try {
        // 使用WebDAV PROPFIND方法测试连接
        const testUrl = `${NUTSTORE_API_BASE}/`;
        console.log('测试连接URL:', testUrl);

        const response = await fetch(testUrl, {
            method: 'PROPFIND',
            headers: {
                'Authorization': `Basic ${btoa(email + ':' + token)}`, // 邮箱:token格式
                'Depth': '0'
            }
        });

        console.log('连接测试响应:', response.status, response.statusText);
        
        if (response.ok) {
            return true;
        }
        
        // 如果PROPFIND不可用，尝试HEAD请求
        const headResponse = await fetch(testUrl, {
            method: 'HEAD',
            headers: {
                'Authorization': `Basic ${btoa(email + ':' + token)}`, // 邮箱:token格式
            }
        });
        
        return headResponse.ok;
    } catch (error) {
        console.error('测试坚果云连接失败:', error);
        return false;
    }
}
