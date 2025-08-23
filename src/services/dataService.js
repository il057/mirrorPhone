// src/services/dataService.js
import db from './database.js';

// 定义需要备份的表的列表
const tablesToBackup = [
        'globalSettings',
        'apiProfiles',
        'ttsProfiles',
        'chatHistory',
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
                },
                data: {},
        };

        // 使用事务一次性读取所有表的数据
        await db.transaction('r', tablesToBackup, async () => {
                for (const tableName of tablesToBackup) {
                        exportData.data[tableName] = await db[tableName].toArray();
                }
        });

        return JSON.stringify(exportData, null, 2); // 格式化JSON以便阅读
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

        // 使用事务来保证数据导入的原子性
        // 'rw' 表示读写模式
        await db.transaction('rw', tablesToBackup, async () => {
                console.log('开始清空旧数据...');
                for (const tableName of tablesToBackup) {
                        await db[tableName].clear();
                }

                console.log('开始导入新数据...');
                for (const tableName of tablesToBackup) {
                        const tableData = importData.data[tableName];
                        if (tableData && tableData.length > 0) {
                                await db[tableName].bulkAdd(tableData);
                        }
                }
        });

        console.log('数据导入成功！');
}
