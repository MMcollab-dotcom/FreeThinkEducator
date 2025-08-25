// Predefined texts to stream
// Use prefixes to control formatting:
// - Normal text: no prefix
// - Grey buttons: "BUTTON:button_text"  
// - Yellow special buttons: "SPECIAL:button_text"
const predefinedTexts = [
    [
        "Here are your options:",
        "BUTTON:Specialised in-depth understanding", 
        "BUTTON:High-level wide breadth understanding"
    ],
    [
        "The following models could be suitable for time series data:",
        "BUTTON:RNN",
        "BUTTON:Transformer", 
        "BUTTON:LSTM",
        "SPECIAL:USER PROFILE"
    ],
    [
        "RNN: recurrent neural networks, Processes sequences step-by-step, passing hidden state from one timestep to the next. Lower compute cost than LSTM or Transformers but struggles with very long range dependencies"
    ],
    [
        "LSTM: An RNN variant with gates to control what information is kept, forgotten, or output at each step. Handles longer sequences than default RNNs, but becomes very slow with long sequences."
    ],
    [
        "Transformers: State of the art in time series modelling, efficiently trains long term dependencies in parallel with self attention. Best at modelling long range dependences and fast to train, but needs more data and high memory usage"
    ],
];

// Mapping from button text to predefined response indices
const buttonToIndexMap: { [key: string]: number } = {
  // From index 0 options - both lead to the models page
  "Specialised in-depth understanding": 1,
  "High-level wide breadth understanding": 1,
  
  // From index 1 model options - each leads to their specific description
  "RNN": 2,
  "LSTM": 3,
  "Transformer": 4,
};

// Special content for SPECIAL: prefixed buttons
const specialContentMap: { [key: string]: string[] } = {
  "USER PROFILE": [
    "User Profile:",
    "Skills: Biology, Statistics",
    "Weakness: Deep Learning", 
    "Target: Deep learning for sequential medical data",
    "",
    "Learning Path:",
    "BUTTON:Start with basic neural networks",
    "BUTTON:Progress to RNNs and LSTMs",
    "BUTTON:Apply to medical time series data"
  ]
};

// Helper function to clean text for display (removes prefixes but keeps original for parsing)
function cleanTextForDisplay(text: string): string {
  // Keep the original text for parsing, but clean for display
  return text; // We'll clean this in the frontend during parsing instead
}

export const hardcoded_handler = async (req: Request): Promise<Response> => {
    const { prompt } = (await req.json()) as { prompt?: string };
  
    if (!prompt) {
      return new Response("No prompt in the request", { status: 400 });
    }
    const encoder = new TextEncoder();
    let index = 0;
    
    console.log('=== BACKEND DEBUG ===');
    console.log('Received prompt:', prompt);
    
    // Check if this is a request for special content (yellow buttons)
    if (prompt.includes('SPECIAL_CONTENT_REQUEST:')) {
      const specialKey = prompt.split('SPECIAL_CONTENT_REQUEST:')[1];
      console.log('Special content requested:', specialKey);
      
      const stream = new ReadableStream({
        async start(controller) {
          let answer = specialContentMap[specialKey] || ["❌ Content not found for: " + specialKey];

          while (index < answer.length) {
            const text = answer[index];
            const queue = encoder.encode(`${text}`);
            controller.enqueue(queue);
            index++;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          controller.close();
        },
      });
      
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Access-Control-Allow-Credentials": "true",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
          "Access-Control-Allow-Headers":
            "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
        },
      });
    }
    
    // Check if this is a button navigation request (grey buttons)
    if (prompt.includes('BUTTON_NAVIGATION:')) {
      const buttonText = prompt.split('BUTTON_NAVIGATION:')[1];
      const targetIndex = buttonToIndexMap[buttonText];
      
      console.log('Button navigation - text:', buttonText, 'target index:', targetIndex);
      
      if (targetIndex !== undefined) {
        const stream = new ReadableStream({
          async start(controller) {
            let answer = predefinedTexts[targetIndex];

            while (index < answer.length) {
              const text = answer[index];
              const queue = encoder.encode(`${text}`);
              controller.enqueue(queue);
              index++;
              await new Promise((resolve) => setTimeout(resolve, 100));
            }
            controller.close();
          },
        });
        
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
            "Access-Control-Allow-Headers":
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        });
      }
    }
    
    // Regular handling - get predefined text by index
    const global_index = parseInt(prompt.split(' ')[0], 10);
    console.log('Regular request - index:', global_index);
    
    const stream = new ReadableStream({
      async start(controller) {
        let answer = predefinedTexts[global_index] || ["❌ Content not found for index: " + global_index];

        while (index < answer.length) {
          const text = answer[index];
          const queue = encoder.encode(`${text}`);
          controller.enqueue(queue);
          index++;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        controller.close();
      },
    });
  
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
        "Access-Control-Allow-Headers":
          "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
      },
    });
};