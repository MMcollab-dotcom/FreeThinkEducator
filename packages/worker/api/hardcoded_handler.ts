// Predefined texts to stream
const predefinedTexts = [
    ["User Profile:",
    "\n-Profession: Biologist",
    "\n-Skills: Biology, Statistics",
    "\n-Focus: Deep learning for time-series medical data",
    "\nDo you wanna know more about time series deep learning models?"],
    [ "- LSTM\n- RNN\n- Transformer" ],
    [ "LSTM is a blablabla" ],
    [ "- Hello" ],
    [ "RNN is a blablabla"],
    [""],
    [ "LSTM is a mathematica"],
    [""]
];

export const hardcoded_handler = async (req: Request): Promise<Response> => {
    const { prompt } = (await req.json()) as { prompt?: string };
  
    if (!prompt) {
      return new Response("No prompt in the request", { status: 400 });
    }
    const encoder = new TextEncoder();
    let index = 0;
    const global_index = parseInt(prompt.split(' ')[0], 10);

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