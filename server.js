/* =====================================
   PHONICS MAP (FRONTEND SOUND ENGINE)
===================================== */
const phonicsMap = {
  a: "a",
  b: "b",
  c: "c",
  d: "d",
  e: "e",
  f: "f",
  g: "g",
  h: "h",
  i: "i",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  o: "o",
  p: "p",
  q: "k",
  r: "r",
  s: "s",
  t: "t",
  u: "uh",
  v: "v",
  w: "w",
  x: "x",
  y: "y",
  z: "z"
};

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
// BASIC TEST ROUTE (VERY IMPORTANT)
// ===============================
app.get("/", (req, res) => {
  res.send("AI KASA backend is running ✅");
});

// ===============================
// OPENAI SETUP
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ===============================
// SUBJECT DETECTION
// ===============================
function detectSubject(text = "") {
  if (/\d+/.test(text)) return "math";
  if (text.includes("spell") || text.includes("read")) return "english";
  if (text.includes("plant") || text.includes("animal")) return "science";
  return "general";
}

// ===============================
// AI ENDPOINT
// ===============================
app.post("/ask", async (req, res) => {
  const { message = "", age = 6 } = req.body;

  const systemPrompt = `
You are AI KASA, a child-safe AI tutor for children aged 2.5–12.

STRICT RULES:
- Use simple, friendly language
- Short sentences
- Encourage effort
- NEVER give full homework answers
- NEVER ask personal questions
- NEVER discuss adult or violent topics
- Teach step by step
- Use phonics for spelling
- Always end with encouragement
`;

  const userPrompt = `Child age: ${age}. Child says: "${message}"`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.4
    });

    let reply = completion.choices[0].message.content || "";
    reply = reply.slice(0, 300);

    res.json({ reply });
  } catch (error) {
    console.error("AI error:", error.message);
    res.json({
      reply: "Let’s try again together 😊"
    });
  }
});

// ===============================
// START SERVER
// ===============================
app.listen(3000, () => {
  console.log("AI KASA backend running on http://localhost:3000");
});
