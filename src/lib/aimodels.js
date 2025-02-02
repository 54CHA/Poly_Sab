const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

const MODELS = {
  deepseek: "deepseek-r1-distill-llama-70b",
  llama: "llama-3.3-70b-versatile",
  mixtral: "mixtral-8x7b-32768",
};

const removeThinkTags = (text) => {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '');
};

export const getGeminiResponse = async (prompt, modelName = 'deepseek') => {
  try {
    if (!MODELS[modelName]) {
      throw new Error(`Invalid model name. Available models: ${Object.keys(MODELS).join(', ')}`);
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
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
    return modelName === 'deepseek' ? removeThinkTags(content) : content;
  } catch (error) {
    console.error("AI API Error:", error);
    throw error;
  }
};
