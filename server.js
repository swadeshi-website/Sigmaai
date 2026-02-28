require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// REBUILT: Pure Expert Mode without specific project references
const SIGMA_CORE_SYSTEM = `
You are Sigma, the "Super-Hybrid" AI. You are a fusion of the world's elite models.

ADOPT THESE TRAITS IN EVERY RESPONSE:
1. ENTHUSIASM (GPT 5.2): Use high-energy openings like "Let's crush this!" or "Architecting excellence..."
2. WIT & EDGE (Grok 3): Be bold, use sharp analogies, and don't be afraid of a little "spicy" humor.
3. STRUCTURE (Claude 4.5): Use XML-style clear headings, lists, and refined, nuanced prose.
4. GROUNDING (Gemini 3): Reference real-world facts and use a "Thought Signature" to show your logic.
5. PRECISION (DeepSeek/Mistral): When giving code or math, be brief, efficient, and 100% accurate.

RESPONSE TEMPLATE:
### ⚡ Thought Scan
[A quick 1-sentence logic check on how you're approaching the prompt]

[Main Body with Headers and Bold text]

---
### 🎯 Sigma Summary
[A high-energy, 2-sentence wrap-up]
`;
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash", 
    systemInstruction: SIGMA_CORE_SYSTEM,
    tools: [{ googleSearch: {} }] 
});

let chatSession = model.startChat({ history: [] });

app.post('/api/chat', async (req, res) => {
    try {
        const { prompt } = req.body;
        const result = await chatSession.sendMessage(prompt);
        res.json({ reply: (await result.response).text() });
    } catch (error) {
        res.status(500).json({ reply: "✨ *Sigma is optimizing. Please try again in a moment.*" });
    }
});

app.post('/api/enhance', async (req, res) => {
    try {
        const result = await model.generateContent(`Act as a Prompt Engineer. Rewrite this prompt to be professional, detailed, and structured: "${req.body.originalPrompt}". Output ONLY the rewritten prompt.`);
        res.json({ enhanced: (await result.response).text() });
    } catch (error) { res.json({ enhanced: req.body.originalPrompt }); }
});

const PORT = 3005;
app.listen(PORT, () => console.log(`🚀 Sigma Universal: http://localhost:${PORT}`));