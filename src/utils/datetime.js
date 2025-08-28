/**
 * Calculates age based on a birthdate string (YYYY-MM-DD).
 * @param {string} birthdateString
 * @returns {number | null}
 *//**
 * 格式化时长为时分显示
 * @param {number} duration - 时长（毫秒）
 * @returns {string} 格式化的时长字符串 (HH:MM)
 */
export function formatDuration(duration) {
        const totalMinutes = Math.floor(duration / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Calculates age based on a birthdate string (YYYY-MM-DD).
 * @param {string} birthdateString
 * @returns {number | null}
 */
export function calculateAge(birthdateString) {
        if (!birthdateString) return null;
        const birthDate = new Date(birthdateString);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
        }
        return age;
}

/**
 * Determines the zodiac sign from a birthdate string (YYYY-MM-DD).
 * @param {string} birthdateString
 * @returns {string}
 */
export function getZodiacSign(birthdateString) {
        if (!birthdateString) return '未知';
        const d = new Date(birthdateString);
        const day = d.getDate();
        const month = d.getMonth() + 1;

        if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "水瓶座";
        if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "双鱼座";
        if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "白羊座";
        if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "金牛座";
        if ((month == 5 && day >= 21) || (month == 6 && day <= 21)) return "双子座";
        if ((month == 6 && day >= 22) || (month == 7 && day <= 22)) return "巨蟹座";
        if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "狮子座";
        if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "处女座";
        if ((month == 9 && day >= 23) || (month == 10 && day <= 23)) return "天秤座";
        if ((month == 10 && day >= 24) || (month == 11 && day <= 22)) return "天蝎座";
        if ((month == 11 && day >= 23) || (month == 12 && day <= 21)) return "射手座";
        if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "摩羯座";
        return "未知";
}

/**
 * Formats a timestamp into a user-friendly, detailed string based on how old it is.
 * @param {Date | string | number} timestamp - The timestamp of the message.
 * @param {boolean} isChatroom - Whether this is for chatroom display (more detailed format)
 * @returns {string} - The formatted time string.
 */
export function formatTimestamp(timestamp, isChatroom = false) {
        if (!timestamp) return '';

        const messageDate = new Date(timestamp);
        const now = new Date();

        // Time difference in seconds
        const diffInSeconds = Math.round((now.getTime() - messageDate.getTime()) / 1000);

        // Helper to format HH:mm
        const formatTime = (date) => {
                return date.toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                });
        };

        // 1. Within a minute
        if (diffInSeconds < 60) {
                return '刚刚';
        }

        // 2. Within an hour
        if (diffInSeconds < 3600) {
                const minutes = Math.floor(diffInSeconds / 60);
                return `${minutes}分钟前`;
        }

        // Define start of today, yesterday, and the current week (Monday)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const startOfWeek = new Date(startOfToday);
        const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ...
        const diffToMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

        // 3. Today: Show specific time for chatroom, hours ago for others
        if (messageDate >= startOfToday) {
                if (isChatroom) {
                        return formatTime(messageDate);
                } else {
                        const hours = Math.floor(diffInSeconds / 3600);
                        return `${hours}小时前`;
                }
        }

        // 4. Yesterday
        if (messageDate >= startOfYesterday) {
                return `昨天 ${formatTime(messageDate)}`;
        }

        // 5. This week
        if (messageDate >= startOfWeek) {
                const weekday = messageDate.toLocaleDateString('zh-CN', { weekday: 'long' });
                return `${weekday} ${formatTime(messageDate)}`;
        }

        // 6. This year - different format for chatroom
        if (messageDate.getFullYear() === now.getFullYear()) {
                if (isChatroom) {
                        const month = messageDate.getMonth() + 1;
                        const day = messageDate.getDate();
                        return `${month}/${day} ${formatTime(messageDate)}`;
                } else {
                        const monthAndDay = messageDate.toLocaleDateString('zh-CN', {
                                month: 'numeric',
                                day: 'numeric'
                        });
                        return `${monthAndDay}`;
                }
        }

        // 7. Older than this year - different format for chatroom
        if (isChatroom) {
                const year = messageDate.getFullYear();
                const month = messageDate.getMonth() + 1;
                const day = messageDate.getDate();
                return `${year}/${month}/${day}`;
        } else {
                return messageDate.toLocaleDateString('zh-CN');
        }
}