// src/services/dataService.js
import db from './database.js';

// 定义需要备份的表的列表 - 包含所有数据库表
const tablesToBackup = [
        'actors',
        'groups', 
        'conversations',
        'events',
        'relationships',
        'memories',
        'globalSettings',
        'apiProfiles',
        'ttsProfiles',
        'homeScreenLayout',
        'fonts',
        'globalAlbum',
        'listenTogetherSessions',
        'widgetSettings',
        'stickers',
        'worldbooks',
        'worldbookGroups',
        'favorites'
];

/**
 * 将数据库中的所有数据打包成一个 JSON 字符串。
 * @returns {Promise<string>} 包含所有数据的JSON字符串。
 */
export async function packDataForExport() {
        const exportData = {
                meta: {
                        appName: 'mirrorPhone',
                        version: 1, // 数据格式版本
                        exportDate: new Date().toISOString(),
                        tables: tablesToBackup, // 记录备份的表列表
                },
                data: {},
        };

        try {
                // 使用事务一次性读取所有表的数据
                await db.transaction('r', tablesToBackup, async () => {
                        for (const tableName of tablesToBackup) {
                                try {
                                        const tableData = await db[tableName].toArray();
                                        // 只导出有数据的表
                                        if (tableData && tableData.length > 0) {
                                                exportData.data[tableName] = tableData;
                                                console.log(`已备份 ${tableName} 表，包含 ${tableData.length} 条记录`);
                                        }
                                } catch (error) {
                                        console.warn(`跳过表 ${tableName}:`, error.message);
                                }
                        }
                });
        } catch (error) {
                console.error('导出过程中发生错误:', error);
                throw new Error(`导出失败: ${error.message}`);
        }

        // 使用压缩的JSON格式（去掉格式化空格）
        const jsonString = JSON.stringify(exportData);
        console.log(`备份数据大小: ${(jsonString.length / 1024).toFixed(2)} KB`);
        return jsonString;
}

/**
 * 解析JSON字符串并将数据导入数据库，会覆盖现有数据。
 * @param {string} jsonString - 从文件或API获取的JSON数据。
 * @returns {Promise<void>}
 */
export async function unpackAndImportData(jsonString) {
        let importData;
        try {
                importData = JSON.parse(jsonString);
        } catch (error) {
                throw new Error('文件格式无效，不是一个有效的JSON。');
        }

        // 简单验证文件格式
        if (importData.meta?.appName !== 'mirrorPhone') {
                throw new Error('这不是一个有效的 mirrorPhone 备份文件。');
        }

        // 检查版本兼容性
        const backupVersion = importData.meta?.version || 1;
        if (backupVersion > 1) {
                throw new Error(`备份文件版本 (${backupVersion}) 过高，当前应用只支持版本 1`);
        }

        // 确定要恢复的表列表 - 支持新旧格式
        const tablesToRestore = importData.meta?.tables || tablesToBackup;
        const availableTables = tablesToRestore.filter(tableName => 
                importData.data.hasOwnProperty(tableName)
        );

        if (availableTables.length === 0) {
                throw new Error('备份文件中没有找到可恢复的数据表');
        }

        try {
                // 使用事务来保证数据导入的原子性
                await db.transaction('rw', availableTables, async () => {
                        console.log('开始清空旧数据...');
                        for (const tableName of availableTables) {
                                try {
                                        await db[tableName].clear();
                                        console.log(`已清空 ${tableName} 表`);
                                } catch (error) {
                                        console.warn(`清空表 ${tableName} 时出错:`, error.message);
                                }
                        }

                        console.log('开始导入新数据...');
                        let importedCount = 0;
                        for (const tableName of availableTables) {
                                const tableData = importData.data[tableName];
                                if (tableData && Array.isArray(tableData) && tableData.length > 0) {
                                        try {
                                                await db[tableName].bulkAdd(tableData);
                                                console.log(`已导入 ${tableName} 表，包含 ${tableData.length} 条记录`);
                                                importedCount += tableData.length;
                                        } catch (error) {
                                                console.error(`导入表 ${tableName} 时出错:`, error.message);
                                                // 对于关键表的导入失败，我们重新抛出错误
                                                if (['globalSettings', 'actors'].includes(tableName)) {
                                                        throw error;
                                                }
                                        }
                                } else {
                                        console.log(`跳过空表 ${tableName}`);
                                }
                        }

                        if (importedCount === 0) {
                                throw new Error('没有成功导入任何数据');
                        }

                        console.log(`数据导入成功！总共导入 ${importedCount} 条记录`);
                });
        } catch (error) {
                console.error('导入过程中发生错误:', error);
                throw new Error(`导入失败: ${error.message}`);
        }
}
