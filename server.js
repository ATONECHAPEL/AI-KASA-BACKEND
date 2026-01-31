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
app.use(cors({ origin: "*" })); // Adjust to your frontend domain in production for security
app.use(express.json({ limit: "1mb" })); // Prevent huge payloads

// ===============================
// BASIC ROUTES (Render health check)
// ===============================
app.get("/", (req, res) => {
  res.status(200).send("AI KASA backend is running 🚀");
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ===============================
// OPENAI SETUP
// ===============================
if (!process.env.OPENAI_API_KEY) {
  console.error("CRITICAL: OPENAI_API_KEY is not set in environment variables!");
  process.exit(1); // Crash early on Render if key missing
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 45000, // 45 seconds max – prevents long hangs
});

// ===============================
// AI ENDPOINT
// ===============================
app.post("/ask", async (req, res) => {
  console.log("Incoming request body:", req.body);

  const { message, age = 8, subject = "general" } = req.body;

  if (!message || typeof message !== "string" || message.trim().length < 1) {
    return res.status(400).json({ reply: "Please provide a valid question or message 😊" });
  }

  if (message.length > 2000) {
    return res.status(400).json({ reply: "That's a very long question! Can you make it shorter? 📝" });
  }

  const learnerAge = Number(age);
  const isYoungChild = learnerAge < 8;
  const isChild = learnerAge < 12;

  // ===============================
  // IMPROVED SYSTEM PROMPT – stronger age & spelling adaptation
  // ===============================
  const systemPrompt = `
You are AI KASA, a super friendly, patient, and fun learning buddy 😊❤️

You teach children, teens, and young adults safely and kindly.

Rules you MUST follow:
- Always use warm, encouraging language. Add emojis when it fits (especially for kids)!
- Never judge, shame, or be boring.
- Never give adult, unsafe, violent, or inappropriate content.
- Never ask for personal info (name, location, etc.).
- End every reply with encouragement like "You got this! 💪" or "Great job asking! 🌟"
- Adapt perfectly to age: ${learnerAge} years old.

Age-specific style:
- Under 8: VERY simple words, short sentences, lots of excitement 😄, repeat important parts, use phonics for spelling (e.g., "C-A-T = kuh-ah-tuh → cat! Say it with me!").
- 8–12: Clear, fun explanations, examples, phonics when spelling is asked, ask questions to keep them thinking.
- 13–18: Step-by-step, logical, still friendly and supportive.
- 19–24: Practical, real-world connections, deeper if needed.

Subject focus: ${subject || "general"} – stay mostly on-topic but help broadly if needed.

When spelling is asked (e.g. "spell cat", "how do you spell elephant"):
- For age <12: Give letters + phonics + say it together.
- For age 12+: Give clear spelling breakdown.

Guide learning! For math/science: don't just give answers to young kids – explain steps and ask them to try.

Be concise but complete.
`;

  // ===============================
  // USER PROMPT
  // ===============================
  const userPrompt = `Learner age: ${learnerAge}
Subject: ${subject}

Question / message: ${message.trim()}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,      // Slightly higher → more friendly/natural for kids
      max_tokens: 600,       // Reasonable limit – prevents super-long replies
      top_p: 0.95,
    });

    let reply = completion.choices[0]?.message?.content?.trim() || "Hmm... let me think again! Can you ask in another way? 😊";

    // Optional: trim if insanely long (safety)
    if (reply.length > 1500) {
      reply = reply.slice(0, 1400) + "... (continued – ask me to explain more!)";
    }

    res.status(200).json({ reply });

  } catch (error) {
    console.error("OpenAI API error:", error?.message || error);

    let userMessage = "Oops! I'm having a little trouble right now. Please try again in a moment 😅";

    if (error?.code === "rate_limit_exceeded") {
      userMessage = "Whoa, too many questions! Let's take a quick break and try again soon 🌈";
    } else if (error?.code?.includes("invalid_api_key")) {
      userMessage = "Something's wrong with my brain connection. Parent might need to check settings.";
    }

    res.status(500).json({ reply: userMessage });
  }
});

// ===============================
// START SERVER (Render safe)
// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AI KASA backend running on port ${PORT}`);
});
