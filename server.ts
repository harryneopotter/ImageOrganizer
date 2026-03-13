import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit to handle base64 images
  app.use(express.json({ limit: '50mb' }));

  // API Route for image analysis
  app.post('/api/analyze', async (req, res) => {
    try {
      const { base64, mimeType, categories } = req.body;
      
      let systemInstruction = "You are a highly efficient image categorization AI. Analyze the image and provide a category, a brief description, and relevant tags.";
      if (categories && categories.length > 0) {
        systemInstruction += ` You MUST choose exactly one category from this list: ${categories.join(', ')}.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          },
          "Analyze this image and return JSON with category, description, tags, and confidence (0-1)."
        ],
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, description: "The category of the image." },
              description: { type: Type.STRING, description: "A brief description of the image." },
              tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Relevant tags." },
              confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1." }
            },
            required: ["category", "description", "tags", "confidence"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("No response text from Gemini");
      
      const result = JSON.parse(resultText);
      res.json(result);

    } catch (error) {
      console.error("Error analyzing image:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
