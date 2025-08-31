import OpenAI from "openai";
import * as dotenv from "dotenv";
import { encoding_for_model, Tiktoken } from "tiktoken";

dotenv.config();
const encoder = encoding_for_model("chatgpt-4o-latest");

const MAX_TOKENS = 1000;
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

    if(response.usage && response.usage.total_tokens > MAX_TOKENS){
        removeOlderTokens();
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
});

const getContextLength = () =>{
    let length = 0;
    context.forEach((message : OpenAI.Chat.Completions.ChatCompletionMessageParam)=>{
        if(typeof message.content === 'string'){
            length += encoder.encode(message.content).length;
        }else if(Array.isArray(message.content)){
            message.content.forEach((content)=>{
                if(content.type === "text"){
                    length += encoder.encode(content.text).length;
                }
            })
        }
    })
    return length;
}

const removeOlderTokens = () =>{
    let contextLength = getContextLength();

    while(contextLength > MAX_TOKENS){
        for(let i=0; i<context.length; i++){
            const message= context[i];

            if (!message) continue;
            
            if(message.role != "system"){
                context.splice(i,1);
                contextLength = getContextLength();
                console.log("Updated context length : ", contextLength);
                break;
            }
        }
    }
}

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