const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = "/api/proxy";

const MODELS = {
  // Latest and most capable models
  "llama-3.3-405b": "llama-3.3-405b-instruct", // Most capable Llama model
  "llama-3.3-70b": "llama-3.3-70b-versatile", // Fast and capable
  "llama-3.1-70b": "llama-3.1-70b-versatile", // Reliable alternative
  "deepseek-r1": "deepseek-r1-distill-llama-70b", // Good reasoning
  "mixtral-8x7b": "mixtral-8x7b-32768", // Fast and efficient
  "gemma2-9b": "gemma2-9b-it", // Lightweight but capable
  "qwen-2.5-72b": "qwen-2.5-72b-instruct", // Strong multilingual
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
