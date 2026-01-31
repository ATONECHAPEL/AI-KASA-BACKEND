// ===============================
// IMPORTS (MUST BE AT TOP)
// ===============================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

// ===============================
// APP SETUP
// ===============================
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// BASIC ROUTES
// ===============================
app.get("/", (req, res) => {
  res.status(200).send("AI KASA backend is running");
});

// 🔴 VERY IMPORTANT FOR RENDER
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ===============================
// OPENAI SETUP
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// AI ENDPOINT
// ===============================
app.post("/ask", async (req, res) => {
  console.log("Incoming request:", req.body);

  const { message = "", age = 6, subject = "general" } = req.body;

  // ===============================
  // SYSTEM PROMPT
  // ===============================
  const systemPrompt = `
You are AI KASA, a safe and intelligent educational assistant.

Audience:
Ages 2.5 to 24.

GENERAL BEHAVIOR RULES:
- Be encouraging and respectful
- Never shame or judge
- Never ask for personal data
- Never provide unsafe, adult, or violent content
- Always end responses with encouragement

SUBJECTS SUPPORTED:
English Language,
Mathematics,
Science,
Social Studies,
Geography,
Robotics,
Marketing,
Accounting,
Global Knowledge.

AGE-BASED TEACHING RULES:

MATHEMATICS:
- If learner age is under 9:
  * Use guided step-by-step solving
  * Explain one step at a time
  * Encourage thinking
  * Do not immediately give the final answer
- If learner age is 9 or above:
  * Show the full equation
  * Explain each step clearly
  * Provide the final answer

OTHER SUBJECTS:
- Ages under 12: simple language and examples
- Ages 13–18: structured, step-by-step explanations
- Ages 19–24: practical, real-world explanations

IMPORTANT:
- Guide learning, do not dump answers for young children
- Keep explanations clear and age-appropriate
`;

  // ===============================
  // USER PROMPT
  // ===============================
  const userPrompt = `
Learner Age: ${age}
Subject: ${subject}

Question or Assignment:
${message}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3
    });

    const reply =
      completion.choices[0]?.message?.content?.slice(0, 400) ||
      "I am still learning. Please try again.";

    res.status(200).json({ reply });

  } catch (error) {
    console.error("OpenAI error:", error.message);

    res.status(500).json({
      reply: "I am having trouble responding right now. Please try again."
    });
  }
});

// ===============================
// START SERVER (RENDER SAFE)
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`AI KASA backend running on port ${PORT}`);
});
