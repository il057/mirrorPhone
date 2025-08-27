// 简单测试脚本，验证用户ID更新
import { USER_ACTOR_ID } from './src/services/database.js';

console.log('User Actor ID:', USER_ACTOR_ID);
console.log('Expected: __USER__');

if (USER_ACTOR_ID === '__USER__') {
    console.log('✅ User ID constant is correct');
} else {
    console.log('❌ User ID constant is incorrect');
}
