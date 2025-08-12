// Predefined texts to stream
const predefinedTexts = [
    ["User profile:",
    "\n-Skills: Biology, Statistics",
    "\n-Weakness: DL models",
    "\n-Focus: Deep learning for time-series medical data",
    "\n\nBased on description, time series model could be suitable.",
    "\n\nDo you want to know more about them?"],
    [ "- LSTM\n- RNN\n- Transformer" ],
    [ " ⁠RNN: recurrent neural networks, Processes sequences step-by-step, passing hidden state from one timestep to the next. Lower compute cost than LSTM or Transformers but struggles with very long range dependencies" ],
    [""],
    [ "LSTM: An RNN variant with gates to control what information is kept, forgotten, or output at each step. Handles longer sequences than default RNNs, but becomes very slow with long sequences."],
    [""],
    [ "Transformers: State of the art in time series modelling, efficiently trains long term dependencies in parallel with self attention. Best at modelling long range dependences and fast to train, but needs more data and high memory usage" ],
    [ "- How much data is there?\n- How much compute is available?\n- What coding skills does user have" ],
    ["User profile:",
    "\n-Updated Skills: Python, Biology, Statistics",
    "\n-Target: DL for medical time series",
    "\n\nSounds like LSTMs are a good tradeoff between modelling capabilties and compute availability.    ",
    "\n\nSince you have python skills, here is Pytorch LSTM docs and tutorials:",
    "\nhttps://docs.pytorch.org/docs/stable/generated/torch.nn.LSTM.html"],
    [""],

];

export const hardcoded_handler = async (req: Request): Promise<Response> => {
    const { prompt } = (await req.json()) as { prompt?: string };
  
    if (!prompt) {
      return new Response("No prompt in the request", { status: 400 });
    }
    const encoder = new TextEncoder();
    let index = 0;
    const global_index = parseInt(prompt.split(' ')[0], 10);
    console.log( prompt )
    const stream = new ReadableStream({
      async start(controller) {
        let answer = predefinedTexts[global_index]

        while (index < answer.length) {
          const text = answer[index];
          const queue = encoder.encode(`${text}`);
          controller.enqueue(queue);
          index++;
          // Simulate delay for streaming effect
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        controller.close();
      },
    });
  
    const res = new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        "Access-Control-Allow-Headers":
          "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
      },
    });
  
    return res;
};