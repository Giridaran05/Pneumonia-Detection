import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies with higher limits for base64 image transmissions
app.use(express.json({ limit: "15mb" }));

// Initialize the Gemini client lazily to avoid crashes on startup if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

// 1. Config endpoint - verify API key status securely without leaking the key itself
app.get("/api/config", (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const hasKey = !!(apiKey && apiKey !== "MY_GEMINI_API_KEY");
  res.json({
    hasApiKey: hasKey,
    environmentBaseUrl: process.env.APP_URL || `http://localhost:${PORT}`
  });
});

// 2. Real-time Chest X-Ray Analysis Route using Gemini Multimodal Vision API
app.post("/api/analyze-xray", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing required 'imageBase64' field." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      // Return enhanced high-fidelity mock diagnostic data (Radiologist Simulation Mode) if key is missing
      // We still provide a gorgeous diagnostic simulation to make the app fully interactable
      console.log("No valid GEMINI_API_KEY found, running in High-Fidelity Simulation mode.");
      return res.json(getSimulatedDiagnosis());
    }

    // Extract raw base64 data (strip prefix if present)
    let rawBase64 = imageBase64;
    if (imageBase64.includes(";base64,")) {
      rawBase64 = imageBase64.split(";base64,")[1];
    }

    const resolvedMimeType = mimeType || "image/jpeg";

    const prompt = `Analyze this AP/PA view Chest X-Ray as an expert artificial intelligence computer-aided diagnostic (CAD) system and board-certified radiologist.
Assess the image for the existence, distribution, and patterns of pulmonic anomalies and classify into one of three strict medical classes:
- "NORMAL": Clean lung fields, no infiltrates, sharp costophrenic recesses, normal heart configuration.
- "BACTERIAL_PNEUMONIA": Lobar or focal consolidation, dense airspace opacity, sometimes visible air bronchograms. Usually concentrated.
- "VIRAL_PNEUMONIA": Diffuse interstitial patterns, patching opacities in both lungs, bilateral hyperinflation, bronchovascular thickening.

Examine the image structure and generate visual markup coordinates representing logical bounding zones of infiltration or consolidation (if any) and anatomical point markings on a relative grid of 0-100 where (0,0) is top-left and (100,100) is bottom-right.
Lungs are usually located at: Left lung center ~x:35 y:50, Right lung center ~x:65 y:50.
Provide a high-fidelity JSON analysis according to the schema. Make sure findings are clinically detailed and follow typical radiological vocabulary.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: resolvedMimeType,
            data: rawBase64,
          },
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            condition: {
              type: Type.STRING,
              description: "Must be exactly 'NORMAL', 'BACTERIAL_PNEUMONIA', or 'VIRAL_PNEUMONIA'",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence probability of classification between 0.0 and 1.0",
            },
            severity: {
              type: Type.STRING,
              description: "The approximate severity of consolidation or interstitial infiltrate ('None', 'Mild', 'Moderate', 'Severe')",
            },
            findings: {
              type: Type.STRING,
              description: "Detailed radiologist clinical findings dictation detailing the lung volumes, diaphragm, pleura, costophrenic angles, and cardiac shadow.",
            },
            detectedRegions: {
              type: Type.ARRAY,
              description: "Visual bounding boxes outlining segments in the image containing focal opacity, patchy infiltrate, consolidation, or pleural effusion, relative to a 0-100 coordinate system.",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Display tag, e.g. 'Focal Consolidation Area', 'Interstitial Opacity Recess'" },
                  x: { type: Type.NUMBER, description: "X coordinate of the bounding box's top-left corner (0-100)" },
                  y: { type: Type.NUMBER, description: "Y coordinate of the bounding box's top-left corner (0-100)" },
                  width: { type: Type.NUMBER, description: "Relative width of the box (0-100)" },
                  height: { type: Type.NUMBER, description: "Relative height of the box (0-100)" },
                },
                required: ["name", "x", "y", "width", "height"],
              },
            },
            markers: {
              type: Type.ARRAY,
              description: "Point coordinates signifying key visual indicators seen on the X-ray, such as air bronchograms, fluid line, hyperinflation, or clear zones.",
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING, description: "Radiological marker label, e.g. 'Air Bronchograms', 'Costophrenic Blunting', 'Peribronchial Cuffing'" },
                  x: { type: Type.NUMBER, description: "X position on a 100x100 grid" },
                  y: { type: Type.NUMBER, description: "Y position on a 100x100 grid" },
                },
                required: ["label", "x", "y"],
              },
            },
            anatomicalReport: {
              type: Type.OBJECT,
              description: "A categorical rating for major thoracic systems.",
              properties: {
                pleuralEffusion: { type: Type.STRING, description: "Status of fluid buildup in pleural cavities (e.g. 'Absent', 'Trace Right', 'Bilateral')" },
                diaphragmShape: { type: Type.STRING, description: "Visual description (e.g. 'Normal dome-shaped', 'Flattened due to hyperinflation')" },
                cardiacSize: { type: Type.STRING, description: "Cardiothoracic ratio state ('Normal', 'Mild Cardiomegaly', 'Within normal limits')" },
                mediastinum: { type: Type.STRING, description: "State of central structures ('Stable', 'No deviance', 'Trachea midline')" },
              },
              required: ["pleuralEffusion", "diaphragmShape", "cardiacSize", "mediastinum"],
            }
          },
          required: ["condition", "confidence", "findings", "severity", "detectedRegions", "markers", "anatomicalReport"],
        },
      },
    });

    const parsedResponseStr = response.text || "{}";
    const parsedData = JSON.parse(parsedResponseStr.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("X-Ray classification API error:", error);
    return res.status(500).json({
      error: "Diagnostics pipeline encountered an error.",
      details: error.message || String(error),
      fallbackData: getSimulatedDiagnosis()
    });
  }
});

// Helper function to return high-fidelity simulation in case API is down or Key is absent
function getSimulatedDiagnosis() {
  const states = [
    {
      condition: "BACTERIAL_PNEUMONIA",
      confidence: 0.94,
      severity: "Moderate",
      findings: "Chest examination reveals structured, highly concentrated lobar consolidation localized heavily in the right lower lung field. Noticeable density airspace shadowing is observed blotting the right hemidiaphragmatic margin. Air bronchograms (lucent air-filled bronchi branching within the opaque alveolar density) are clearly evident. Left lung volumes are stable. Placed mediastinal structures remain Central. Pleural spaces appear clear with sharp blunting absent.",
      detectedRegions: [
        { name: "Unilobar Consolidation", x: 60, y: 55, width: 26, height: 28 }
      ],
      markers: [
        { label: "Dense Alveolar Opacification", x: 72, y: 68 },
        { label: "Visible Air Bronchograms", x: 65, y: 60 }
      ],
      anatomicalReport: {
        pleuralEffusion: "Absent",
        diaphragmShape: "Right hemidiaphragm margin obscured by consolidation",
        cardiacSize: "Within normal limits (CTR ~0.48)",
        mediastinum: "Trachea midline, no deviation"
      }
    },
    {
      condition: "VIRAL_PNEUMONIA",
      confidence: 0.88,
      severity: "Moderate",
      findings: "AP view of the chest displays bilateral, diffuse peribronchial cuffing and patchy interstitial alveolar infiltration spreading symmetrically. Lung volumes are mildly hyperinflated with flattening of the diaphragmatic domes. No localized lobar consolidations are identifiable. Reticular interstitial markings are prominent throughout both paracardial zones. Cardio-mediastinal outlines are within physiological size limits. Pleural recesses remain normal.",
      detectedRegions: [
        { name: "Bilateral Patchy Infiltrate (L)", x: 20, y: 35, width: 22, height: 40 },
        { name: "Bilateral Patchy Infiltrate (R)", x: 58, y: 32, width: 24, height: 45 }
      ],
      markers: [
        { label: "Bilateral Peribronchial Cuffing", x: 30, y: 40 },
        { label: "Diffuse Interstitial Markings", x: 68, y: 48 },
        { label: "Low-lying Flat Diaphragm due to Hyperinflation", x: 50, y: 88 }
      ],
      anatomicalReport: {
        pleuralEffusion: "Absent / Insignificant",
        diaphragmShape: "Mild bilateral flattening, indicative of general hyperinflation",
        cardiacSize: "Normal cardiac contour",
        mediastinum: "Midline stable, normal vascular hila"
      }
    },
    {
      condition: "NORMAL",
      confidence: 0.97,
      severity: "None",
      findings: "Radiologic evaluation of the chest shows completely clear and well-inflated lungs bilateral. There is no evidence of focal consolidation, suspicious pleural effusions, interstitial thickening, or nodules. The pulmonary vasculature pattern is physiological. The heart is of normal shape and size (CTR < 0.50). Left and right hemidiaphragms are dome-shaped and well-demarcated with sharp costophrenic and cardiophrenic angles. Central trachea and mediastinum are stable.",
      detectedRegions: [],
      markers: [
        { label: "Clear Lung Outlines", x: 32, y: 45 },
        { label: "Sharp Costophrenic Angle (R)", x: 80, y: 82 },
        { label: "Sharp Costophrenic Angle (L)", x: 20, y: 82 }
      ],
      anatomicalReport: {
        pleuralEffusion: "Absent",
        diaphragmShape: "Perfectly physiological dome shape bilaterally",
        cardiacSize: "Normal size, cardiomegaly absent",
        mediastinum: "Trachea perfectly centered, normal aortic stripe"
      }
    }
  ];

  // Return a random diagnosis, or let the user choose (in UI client will request specific ones for samples)
  // We'll return bacterial as a sensible default here.
  return states[0];
}

// 3. Mount Vite standard middleware for dev, or static asset delivery for production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite server middleware in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving static production built assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pneumonia Detection Server running on http://localhost:${PORT}`);
  });
}

startServer();
