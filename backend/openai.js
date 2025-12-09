import Groq from "groq-sdk";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ------------------------------------------
// 1️⃣ Normalize ingredient name
// ------------------------------------------
export async function interpretName(text) {
  const prompt = `
Return ONLY the corrected ingredient name. No extra words.

Input: "${text}"
Corrected:
`;

  const resp = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  return resp.choices[0].message.content.trim();
}

// ------------------------------------------
// 2️⃣ Always return stable, working image
// ------------------------------------------
async function getWikipediaImage(query) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
      query
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data?.thumbnail?.source) return data.thumbnail.source;
  } catch {}

  // 🔥 Ultra-stable HD placeholder image
  return "https://upload.wikimedia.org/wikipedia/commons/6/65/No-Image-Placeholder.svg";
}

// ------------------------------------------
// 3️⃣ Generate SHORT point-wise description
// ------------------------------------------
export async function generateIngredientInfo(name) {
  const prompt = `
Write a short 2–3 line description about "${name}".
Return in bullet points (•).
Do NOT mention health/medical claims.
Just culinary usage.
`;

  const resp = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  const description = resp.choices[0].message.content.trim();
  const image = await getWikipediaImage(name);

  return {
    name,
    description,
    image,
  };
}
