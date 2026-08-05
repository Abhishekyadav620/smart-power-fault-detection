const { GoogleGenAI } = require("@google/genai");

const getAiSuggestions = async (req, res) => {
  try {
    const { incidentData } = req.body;
    const apiKey = process.env.GEMINI_API || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: "GEMINI_API is not configured",
      });
    }

    const ai = new GoogleGenAI({ apiKey: apiKey });

    const prompt = `
You are an expert electrical grid engineer analyzing a power fault incident. 
Incident details: ${JSON.stringify(incidentData)}

Please provide a JSON response with the following exact keys:
- rootCause (string)
- reasoning (string)
- crewRecommendation (string)
- estimatedRestorationTime (string, e.g., "2 hours")
- safetyPrecautions (array of strings)
- preventiveMaintenance (array of strings)

Respond ONLY with valid JSON.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text;
    const parsedData = JSON.parse(resultText);

    res.status(200).json({
      success: true,
      data: parsedData,
    });
  } catch (error) {
    console.error("AI API Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI suggestions",
    });
  }
};

module.exports = {
  getAiSuggestions,
};
