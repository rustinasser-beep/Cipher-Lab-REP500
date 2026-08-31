import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API Health
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: Date.now() });
  });

  // Generate Tutorial Script / Prompt using Gemini 3.7 Flash
  app.post("/api/generate-prompt", async (req, res) => {
    try {
      const { topic, lang = "ar" } = req.body;
      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: `You are an expert video director creating cinematic, visually stunning 3D tutorial & UI motion graphics explainer video prompts for Veo 3.
Target Topic: "${topic || "How to use Cipher Lab REP500 for AES-256-GCM and file encryption"}"
Target Language Audience: ${lang === "ar" ? "Arabic and Global" : "English and Global"}

Write a detailed, high-impact prompt for Veo 3 (in English, as required for optimal visual synthesis) describing a sleek 3D holographic and futuristic high-tech screen walkthrough. Describe visual elements like glowing cryptographic keycards, matrix stream of REP500 11-digit codes, secure vault lock clicking into place, and elegant cybernetic typography showing "ENCRYPTED" and "DECRYPTED" seamlessly in a pristine dark-mode workstation. Keep the prompt under 120 words.`,
      });

      res.json({ prompt: response.text?.trim() || "" });
    } catch (error: any) {
      console.error("Error generating prompt:", error);
      res.status(500).json({ error: error.message || "Failed to generate prompt" });
    }
  });

  // Start Video Generation with Veo 3
  app.post("/api/generate-video", async (req, res) => {
    try {
      const { prompt, aspectRatio = "16:9", resolution = "720p" } = req.body;

      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGenAI();
      const validAspect = aspectRatio === "9:16" ? "9:16" : "16:9";

      console.log(`[Veo 3] Starting video generation. Model: veo-3.1-fast-generate-preview, Aspect: ${validAspect}`);
      
      const operation = await ai.models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution === "1080p" ? "1080p" : "720p",
          aspectRatio: validAspect,
        },
      });

      console.log(`[Veo 3] Operation created: ${operation.name}`);
      res.json({ operationName: operation.name });
    } catch (error: any) {
      console.error("Error starting video generation:", error);
      const isQuota =
        error?.status === "RESOURCE_EXHAUSTED" ||
        error?.message?.includes("429") ||
        error?.message?.includes("quota") ||
        error?.message?.includes("RESOURCE_EXHAUSTED");

      const userFriendlyMessage = isQuota
        ? "تم استنفاد حصة التوليد السحابي لنموذج Veo 3 مؤقتاً (API Quota Limit). يمكنك متابعة الشرح التفاعلي الحي المدمج بالكامل."
        : error.message || "Failed to start video generation";

      res.status(isQuota ? 429 : 500).json({
        error: userFriendlyMessage,
        isQuota,
        rawMessage: error.message,
      });
    }
  });

  // Check Video Generation Status
  app.post("/api/video-status", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const ai = getGenAI();
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });
      
      const isDone = !!updated.done;
      const hasError = !!updated.error;
      const errorMsg = updated.error ? (updated.error as any).message || "Video generation failed" : null;

      res.json({
        done: isDone,
        error: errorMsg,
        hasVideo: !!(updated.response?.generatedVideos && updated.response.generatedVideos.length > 0),
      });
    } catch (error: any) {
      console.error("Error checking video status:", error);
      res.status(500).json({ error: error.message || "Failed to check status" });
    }
  });

  // Download Video and stream back
  app.post("/api/video-download", async (req, res) => {
    try {
      const { operationName } = req.body;
      if (!operationName) {
        return res.status(400).json({ error: "operationName is required" });
      }

      const ai = getGenAI();
      const op = new GenerateVideosOperation();
      op.name = operationName;

      const updated = await ai.operations.getVideosOperation({ operation: op });

      if (!updated.done) {
        return res.status(400).json({ error: "Video generation is not complete yet" });
      }

      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;
      if (!uri) {
        return res.status(404).json({ error: "No video URI found in response" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      const videoRes = await fetch(uri, {
        headers: {
          "x-goog-api-key": apiKey || "",
        },
      });

      if (!videoRes.ok) {
        throw new Error(`Failed to fetch video stream from Google Cloud: ${videoRes.statusText}`);
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Cache-Control", "public, max-age=3600");

      if (videoRes.body) {
        // @ts-ignore
        const nodeReadable = (videoRes.body as any);
        if (typeof nodeReadable.pipe === "function") {
          nodeReadable.pipe(res);
        } else {
          // Web stream
          const reader = videoRes.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
          }
          res.end();
        }
      } else {
        const buffer = await videoRes.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (error: any) {
      console.error("Error downloading video:", error);
      res.status(500).json({ error: error.message || "Failed to download video" });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
