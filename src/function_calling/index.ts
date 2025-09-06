import OpenAI from "openai";
import * as dotenv from "dotenv";
import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
import type { Chat } from "openai/resources";

type ToolCall = Chat.Completions.ChatCompletionMessageToolCall;


dotenv.config()

const openAI = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})

const getCurrentTimeAndDate = () => {
    const date = new Date();
    return date.toLocaleString();
}

const callOpenAIWithFunctionCalling = async () => {

    const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
        role: "system",
        content: "You are a cool assistant!!"
    },
    {
        role: "user",
        content: "Date and time today?"
    },
    ]

    const response = await openAI.chat.completions.create({
        model: "gpt-4.1",
        messages: context,
        // configure function calling
        tools: [
            {
                type: "function",
                function: {
                    name: "getCurrentTimeAndDate",
                    description: "To get current date and Time"
                }
            }
        ],
        tool_choice: "auto"
    });

    console.log(response.choices[0]?.message.content);


    const shouldInvokeFunction = response.choices[0]?.finish_reason === "tool_calls"
    const message = response.choices[0]?.message;

    const toolCall = message?.tool_calls?.[0] as ToolCall;

    if(!toolCall){
        return;
    }

    if (shouldInvokeFunction && toolCall.type === "function") {

        const functionName = toolCall.function.name;

        if (functionName === "getCurrentTimeAndDate") {

            // console.log(getCurrentTimeAndDate());

            const functionResponse = getCurrentTimeAndDate();
            // push assistant's tool call if exists
            if (response.choices[0]?.message) {
                context.push(response.choices[0]!.message);
            }

            context.push({
                role: "tool",
                content: functionResponse,
                tool_call_id: toolCall.id
            })

        }
    }


    const finalResponse = await openAI.chat.completions.create({
        model: "gpt-4.1",
        messages: context,
    })

    console.log("Final Response", finalResponse.choices[0]?.message.content);

};

callOpenAIWithFunctionCalling();