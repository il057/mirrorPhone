// 模拟一个API调用函数
// 将来这里会使用 fetch 或 axios 来发送真实的 HTTP 请求
export async function sendMessageToAI(message) {
        console.log(`Sending message to AI: "${message}"`);

        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 模拟AI的回复
        const responses = [
                "这很有趣，能多告诉我一些吗？",
                "我正在处理您的请求...",
                "收到了！",
                `关于“${message}”，我想说...`
        ];
        const reply = responses[Math.floor(Math.random() * responses.length)];

        console.log(`Received reply from AI: "${reply}"`);
        return { success: true, text: reply };
}