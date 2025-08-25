// src/services/cloudinaryService.js
import db from './database.js';

/**
 * 上传文件到 Cloudinary
 * @param {File} file - 要上传的文件
 * @returns {Promise<string>} - 返回上传后的图片 URL
 */
export async function uploadToCloudinary(file) {
        const settings = await db.globalSettings.get('global');
        const cloudName = settings?.cloudinaryCloudName;
        const uploadPreset = settings?.cloudinaryUploadPreset;

        if (!cloudName || !uploadPreset) {
                throw new Error('请先在设置中配置 Cloudinary 的 Cloud Name 和 Upload Preset。');
        }

        const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);

        const response = await fetch(url, {
                method: 'POST',
                body: formData,
        });

        if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`上传失败: ${errorData.error.message}`);
        }

        const data = await response.json();
        return data.secure_url;
}