const axios = require('axios');

const conversationHistory = new Map();

module.exports.config = {
  name: 'فانغ',
  version: '2.0.1',
  hasPermssion: 0,
  credits: 'FANG',
  description: 'ذكاء اصطناعي مجاني — تحدث مع فانغ',
  commandCategory: 'ذكاء اصطناعي',
  usages: 'فانغ [رسالتك] | فانغ مسح',
  cooldowns: 3
};

const SYSTEM_PROMPT = 'أنت فانغ، مساعد ذكي وودود يتحدث العربية بطلاقة. تجيب بإجابات مختصرة وواضحة ومفيدة. لديك شخصية خفيفة الظل وتساعد الجميع بأسلوب محترم.';

module.exports.run = async function({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  const userMsg = args.join(' ').trim();

  // BUG FIX: was using single-quoted multi-line string (SyntaxError in strict JS)
  if (!userMsg)
    return api.sendMessage(
      '🤖 أنا فانغ، مساعدك الذكي!\nكتب رسالتك بعد الأمر\n\nمثال: فانغ من أنت؟\n\nلمسح المحادثة: فانغ مسح',
      threadID, messageID
    );

  const key = senderID + '_' + threadID;

  if (userMsg === 'مسح') {
    conversationHistory.delete(key);
    return api.sendMessage('🗑 تم مسح المحادثة السابقة ✅', threadID, messageID);
  }

  const waitMsg = await new Promise(r => api.sendMessage('💭 فانغ يفكر...', threadID, (e, i) => r(i)));

  try {
    if (!conversationHistory.has(key)) conversationHistory.set(key, []);
    const history = conversationHistory.get(key);

    history.push({ role: 'user', content: userMsg });
    if (history.length > 20) history.splice(0, 2);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
    ];

    const res = await axios.post(
      'https://text.pollinations.ai/openai',
      {
        model: 'openai',
        messages,
        max_tokens: 800,
        temperature: 0.8
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 25000
      }
    );

    const reply = res.data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('لم أحصل على رد من الذكاء الاصطناعي');

    history.push({ role: 'assistant', content: reply });

    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    return api.sendMessage(`🤖 فانغ:\n\n${reply}`, threadID, messageID);

  } catch(err) {
    if (waitMsg) api.unsendMessage(waitMsg.messageID);
    const msg = err.response?.data?.error?.message || err.message;
    return api.sendMessage(`❌ تعذر الاتصال بالذكاء الاصطناعي\n${msg}`, threadID, messageID);
  }
};
