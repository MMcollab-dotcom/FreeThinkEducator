export const hardcoded_handler = async (req: Request): Promise<Response> => {
    const { prompt } = (await req.json()) as { prompt?: string };
  
    if (!prompt) {
      return new Response("No prompt in the request", { status: 400 });
    }
  
    // Predefined texts to stream
    const predefinedTexts = [
      "Hello, this is a predefined response.",
      "Streaming the next part now.",
      "This is the final chunk of text.",
    ];
  
    const encoder = new TextEncoder();
    let index = 0;
  
    const stream = new ReadableStream({
      async start(controller) {
        while (index < predefinedTexts.length) {
          const text = predefinedTexts[index];
          const queue = encoder.encode(`data: ${text}\n\n`);
          controller.enqueue(queue);
          index++;
          // Simulate delay for streaming effect
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
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