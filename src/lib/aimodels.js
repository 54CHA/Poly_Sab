const API_URL = "/api/proxy";

const MODELS = {
  // Latest and most capable models
  "llama-3.3-70b": "llama-3.3-70b-versatile", // Fast and capable
  "deepseek-r1": "deepseek-r1-distill-llama-70b", // Good reasoning
  "gemma2-9b": "gemma2-9b-it", // Lightweight but capable
  "qwen-qwq-32b": "qwen-qwq-32b-preview", // Advanced reasoning model
};

const removeThinkTags = (text) => {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "");
};

export const getGeminiResponse = async (
  prompt,
  modelName = "llama-3.3-70b"
) => {
  try {
    if (!MODELS[modelName]) {
      throw new Error(
        `Invalid model name. Available models: ${Object.keys(MODELS).join(
          ", "
        )}`
      );
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODELS[modelName],
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to get AI response");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return modelName === "deepseek-r1" ? removeThinkTags(content) : content;
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};
