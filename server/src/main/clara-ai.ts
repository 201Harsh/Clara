import Groq from "groq-sdk";

const groq = new Groq();

export async function clara({ prompt }: { prompt: string }) {
  const completion = await getGroqChatCompletion({ prompt });
  const response = completion.choices[0]?.message?.content || "";
  console.log(response);
  return response;
}

export const getGroqChatCompletion = async ({ prompt } : { prompt: string }) => {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    model: "llama-3.1-8b-instant",
  });
};

export default clara;
