import OpenAI from "openai";
import * as dotenv from "dotenv";

dotenv.config();

// console.log(process.env.OPENAI_KEY);

const openAI = new OpenAI({ apiKey: process.env.OPENAI_KEY });

const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
        role: "system",
        content: `You are a good and humble assistant. You always start the conversation with "Hi!!" and end the conversation with "Please let me know if I can assit you further" `
    },
];

const createChat = async () => {
    const response = await openAI.chat.completions.create({
        model: "chatgpt-4o-latest",
        messages: context
    });

    const responseMessage = response.choices[0]?.message;
    if (responseMessage) {
        context.push(responseMessage);
    }


    console.log(response.choices[0]?.message.content);

};

//to read user input 
process.stdin.addListener("data", async (input) => {
    const userInput = input.toString().trim();
    context.push({
        role: "user",
        content: userInput

    })

    await createChat();
})

//to create a chat without context
/*
process.stdin.addListener("data", async (input: Buffer) => {
    const userInput: string = input.toString().trim();
    const response = await openAI.chat.completions.create(
        {
            model: "chatgpt-4o-latest",
            messages: [
                {
                    role: "system",
                    content: `You are a good and humble assistant. You always start the conversation with "Hi!!" and end the conversation with "Please let me know if I can assit you further" `
                },
                {
                    role: "user",
                    content: userInput
                },
            ],
            max_tokens: 100,
            n: 2,
            frequency_penalty: 1.5
            // seed: 88888

        });

  const output = response.choices?.[0]?.message?.content ?? "No response";

  console.log(output);
  
});

*/