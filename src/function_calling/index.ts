import OpenAI from "openai";
import * as dotenv from "dotenv";
// import type { ChatCompletionMessageToolCall } from "openai/resources/chat/completions";
// import type { Chat } from "openai/resources";

// type ToolCall = Chat.Completions.ChatCompletionMessageToolCall;


dotenv.config()

const openAI = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})

//Function to call
const getCurrentTimeAndDate = () => {
    const date = new Date();
    // console.log("Log : ",date.toLocaleString("en-GB"));
    
    return date.toString();
}


//get the task staus(not using db here)
const getTaskStatus = (taskId : string) =>{
    console.log("Getting task status for taskId :", taskId);
    if(parseInt(taskId)%2 === 0){
        return "Task Completed!!"
    }else{
        return "Task Pending!!"
    }
};

const callOpenAIWithFunctionCalling = async () => {

    const context: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
        role: "system",
        content: "You are a assistant. And you can also give current date and time and task information."
    },
    {
        role: "user",
        content: "Date and time today?"
    },
    // {
    //     role: "user",
    //     content: "Status of task 3"
    // },

    // {
    //     role: "user",
    //     content: "Status of task 4"
    // },
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
            },
            {
                type: "function",
                function: {
                    name: "getTaskStatus",
                    description: "To get status of tasks",
                    parameters : {
                        type : "object",
                        properties :{
                            taskId : {
                                type : "string",
                            description : "The task ID"
                            }
                            
                        },
                        required : ["taskId"]
                    },
                    
                }
            }
        ],
        tool_choice: "auto"
    });

    console.log(response.choices[0]?.message.content);


    const shouldInvokeFunction = response.choices[0]?.finish_reason === "tool_calls"
    const message = response.choices[0]?.message;


    const toolCall = message?.tool_calls?.[0];
    // console.log(toolCall);
    

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

         if (functionName === "getTaskStatus") {
            //extract args from tool call
            const argRaw = toolCall.function.arguments;
            const parseAgrs = JSON.parse(argRaw)

            const functionResponse = getTaskStatus(parseAgrs.taskId);
            // push assistant's tool call if exists
            if (response.choices[0]?.message) {
                context.push(response.choices[0]!.message);
            }

            context.push({
                role: "tool",
                content: JSON.stringify({ result: functionResponse }),
                tool_call_id: toolCall.id
            })

        }
    }


    const finalResponse = await openAI.chat.completions.create({
        model: "gpt-4.1",
        messages: context,
    })

    console.log("Final Response", finalResponse.choices[0]);

};

callOpenAIWithFunctionCalling();