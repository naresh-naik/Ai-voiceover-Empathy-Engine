import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini for Server-Side Analysis (Flask/FastAPI Equivalent)
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY });

  // API Route: Emotional Analysis (Matching Challenge 1 Logic)
  app.post("/api/analyze", async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Analyze the emotional context of the following text for high-fidelity speech synthesis. 
        Text: "${text}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              primaryEmotion: { type: Type.STRING, description: "The dominant emotion (e.g., Excited, Anxious, Calm, Angry, Sad)" },
              intensity: { type: Type.NUMBER, description: "Emotional intensity from 0.0 to 1.0" },
              modulationStrategy: { type: Type.STRING, description: "A technical strategy for vocal synthesis (e.g., 'Increase pitch by 20%, slow down rate by 10%')" },
              color: { type: Type.STRING, description: "A hex color code representing this emotion for UI feedback" }
            },
            required: ["primaryEmotion", "intensity", "modulationStrategy", "color"]
          }
        }
      });

      const analysis = JSON.parse(response.text || "{}");
      res.json(analysis);
    } catch (error) {
      console.error("Analysis Error:", error);
      res.status(500).json({ error: "Neural analysis failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Neural Server] Empathy Engine running on http://localhost:${PORT}`);
  });
}

startServer();
