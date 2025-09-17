const { askOpenAI } = require('../utils/openai');
const { extractTextFromPDF } = require('../utils/pdf');

exports.summarizeText = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const prompt = `Summarize the following legal document or case in plain English:\n${text}`;
    const summary = await askOpenAI({ prompt, model: 'gpt-3.5-turbo', max_tokens: 512 });
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ message: 'OpenAI error', error: err.message });
  }
};

exports.legalQuery = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Question is required' });
    const prompt = `You are a helpful legal assistant. Answer the following question concisely:\n${question}`;
    const answer = await askOpenAI({ prompt, model: 'gpt-3.5-turbo', max_tokens: 512 });
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ message: 'OpenAI error', error: err.message });
  }
};

exports.extractClausesFromPDF = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No PDF uploaded' });
    const text = await extractTextFromPDF(req.file.buffer);
    const prompt = `Extract and list the most important legal clauses or key terms from the following legal document. For each, provide a short explanation.\n${text}`;
    const clauses = await askOpenAI({ prompt, model: 'gpt-3.5-turbo', max_tokens: 700 });
    res.json({ clauses });
  } catch (err) {
    res.status(500).json({ message: 'Error extracting clauses', error: err.message });
  }
}; 