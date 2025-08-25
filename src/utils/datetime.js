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
 * Formats a timestamp into a user-friendly string based on how old it is.
 * @param {Date | string | number} timestamp - The timestamp of the message.
 * @returns {string} - The formatted time string (e.g., "15:30", "昨天", "星期三", "2025/7/15").
 */
export function formatTimestamp(timestamp) {
        if (!timestamp) return '';

        const messageDate = new Date(timestamp);
        const now = new Date();

        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        // Find the start of the current week (assuming Monday is the first day)
        const startOfWeek = new Date(startOfToday);
        const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ...
        const diff = (dayOfWeek === 0) ? 6 : dayOfWeek - 1; // Adjust for Sunday
        startOfWeek.setDate(startOfWeek.getDate() - diff);

        if (messageDate >= startOfToday) {
                // Today: Show time
                return messageDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
        } else if (messageDate >= startOfYesterday) {
                // Yesterday
                return '昨天';
        } else if (messageDate >= startOfWeek) {
                // This week: Show day of the week
                return messageDate.toLocaleDateString('zh-CN', { weekday: 'long' });
        } else {
                // Older than a week: Show full date
                return messageDate.toLocaleDateString('zh-CN');
        }
}