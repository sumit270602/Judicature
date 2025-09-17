require('dotenv').config({ path: '.env' });
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function askOpenAI({ prompt, model = 'gpt-3.5-turbo', max_tokens = 512, temperature = 0.7 }) {
  const response = await openai.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens,
    temperature,
  });
  return response.choices[0].message.content;
}

module.exports = { askOpenAI }; 