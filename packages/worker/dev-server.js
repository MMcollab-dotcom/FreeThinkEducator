import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// Predefined texts to stream with prefix-based formatting
// Use prefixes to control formatting:
// - Normal text: no prefix
// - Grey buttons: "BUTTON:button_text"  
// - Yellow special buttons: "SPECIAL:button_text"
const predefinedTexts = [
    // [
    //     "Here are your options:",
    //     "BUTTON:Specialised in-depth understanding", 
    //     "BUTTON:High-level wide breadth understanding"
    // ],
    [
        "Based on your input, the following models could be suitable for time series data:",
        "BUTTON:RNN: recurrent neural networks       ",
        "BUTTON:LSTM: long short-term memory networks      ", 
        "BUTTON:Transformers: attention-based models     ",
        "BUTTON:Continue conversation",
        "SPECIAL:USER PROFILE"
    ],
    [
        "RNN: recurrent neural networks\n\nProcesses sequences step-by-step, passing hidden state from one timestep to the next.\n\nPros:\n• Lower compute cost than LSTM or Transformers\n• Simple architecture\n\nCons:\n• Struggles with very long range dependencies\n• Vanishing gradient problem",
        "BUTTON:More details"
    ],
    [
        "LSTM: An RNN variant with gates to control what information is kept, forgotten, or output at each step.\n\nPros:\n• Handles longer sequences than default RNNs\n• Solves vanishing gradient problem\n\nCons:\n• Becomes very slow with long sequences\n• Higher computational cost",
        "BUTTON:More details"
    ],
    [
        "Transformers: State of the art in time series modelling\n\nProcesses sequences using self-attention mechanism in parallel.\n\nPros:\n• Best at modelling long range dependencies\n• Fast to train (parallel processing)\n• State-of-the-art performance\n\nCons:\n• Needs more data\n• High memory usage\n• Complex architecture",
        "BUTTON:More details"
    ],
    [
        "Details on RNNs:\n\nRecurrent Neural Networks are the foundation of sequence modeling.\n\nKey concepts:\n• Hidden state carries information\n• Sequential processing\n• Memory of previous inputs\n\nBest for:\n• Short sequences\n• Real-time applications\n• Limited computational resources"
    ],
    [
        "Details on LSTMs:\n\nLong Short-Term Memory networks solve the vanishing gradient problem.\n\nKey components:\n• Forget gate: decides what to discard\n• Input gate: controls new information\n• Output gate: determines output\n\nBest for:\n• Medium-length sequences\n• Time series with long-term patterns\n• Text processing tasks"
    ],
    [
        "To better answer your question, please provide more context:\n\n• What amount of data are you working with?\n• How much compute is available?\n• What coding skills do you have?",
        "BUTTON:Send reply"
    ],
    [
      "Based on your input, the most suitable model for your time series data is likely the LSTM, as it handles medium-length sequences and long-term dependencies well. Here is a link to a Python library for its implementation: https://pytorch.org/docs/stable",
      "\n/generated/torch.nn.LSTM.html",
      "SPECIAL:USER PROFILE ",
      "BUTTON:Send reply "
    ],
    [
      "Based on your request, here are the German privacy laws for medical data processing:\n\n1. Bundesdatenschutzgesetz (BDSG): The Federal Data Protection Act regulates the processing of personal data in Germany.\n2. Datenschutz-Grundverordnung (DSGVO): The General Data Protection Regulation applies to all EU member states, including Germany, and sets strict rules for data protection.\n3. Sozialgesetzbuch (SGB): The Social Code contains specific provisions for health data and medical records.\n4. Telemediengesetz (TMG): Governs electronic information and communication services, including health-related websites.\n\nFor more detailed information, consult a legal expert specializing in German data protection law.",
      "SPECIAL:USER PROFILE  "
    ]
  ];

// Mapping from button text to predefined response indices
const buttonToIndexMap = {
  // From index 0 model options - each leads to their specific description
  "RNN: recurrent neural networks       ": 1,
  "LSTM: long short-term memory networks      ": 2,
  "Transformers: attention-based models     ": 3,
  "Continue conversation": 6, // Goes to context questions
  
  // From detail pages - for now, just cycle through details
  "More details": 4, // Goes to RNN details by default
  
  // From context questions
  "Send reply": 7, // Goes to LSTM recommendation
  "Send reply ": 8 // Goes to new answer on german laws (with 1 trailing space)
};

// Special content for SPECIAL: prefixed buttons
const specialContentMap = {
  "USER PROFILE": [
    "User Profile:\n\nPreferred Learning Style: In-depth understanding for target\n\nCurrent Skills:\n• Biology\n• Statistics\n\nWeaknesses:\n• Deep Learning\n• Neural Network Implementation\n\nLearning Target:\n• Deep learning for sequential medical data"    
  ],
  "USER PROFILE ": [
    "Updated User Profile:\n\nNew Skill Added: Python programming\n\nCurrent Skills:\n• Biology\n• Statistics\n• Python programming\n\nWeaknesses:\n• Deep Learning\n• Neural Network Implementation\n\nLearning Target:\n• Deep learning for sequential medical data"
  ],
  "USER PROFILE  ": [
      "Updated User Profile:\n\nNew Interest Added: German data privacy law for medical data.\n\nCurrent Skills:\n• Biology\n• Statistics\n• Python programming\n\nWeaknesses:\n• Deep Learning\n\nLearning Target:\n• Deep learning for sequential medical data with interest in German legal aspects for it."
  ]
};

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'], // Allow requests from frontend ports
  credentials: true
}));

app.use(express.json());

// Route for hardcoded handler
app.post('/api/hardcoded_handler', async (req, res) => {
  try {
    console.log('=== API Call Received ===');
    console.log('Request body:', req.body);
    console.log('Request origin:', req.headers.origin);
    
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).send("No prompt in the request");
    }
    
    console.log('Received prompt:', prompt);
    
    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    let answer;
    
    // Check if this is a request for special content (yellow buttons)
    if (prompt.includes('SPECIAL_CONTENT_REQUEST:')) {
      const specialKey = prompt.split('SPECIAL_CONTENT_REQUEST:')[1];
      console.log('Special content requested:', specialKey);
      answer = specialContentMap[specialKey] || ["❌ Content not found for: " + specialKey];
    }
    // Check if this is a button navigation request (grey buttons)
    else if (prompt.includes('BUTTON_NAVIGATION:')) {
      const buttonText = prompt.split('BUTTON_NAVIGATION:')[1];
      const targetIndex = buttonToIndexMap[buttonText];
      
      console.log('Button navigation - text:', buttonText, 'target index:', targetIndex);
      
      if (targetIndex !== undefined) {
        answer = predefinedTexts[targetIndex];
      } else {
        answer = ["❌ No mapping found for button: " + buttonText];
      }
    }
    // Check if this is a request for predefined content (start node)
    else if (prompt.includes('GET_PREDEFINED_CONTENT')) {
      const global_index = parseInt(prompt.split(' ')[0], 10);
      console.log('Predefined content request - index:', global_index);
      answer = predefinedTexts[global_index] || ["❌ Content not found for index: " + global_index];
    }
    // Regular handling - get predefined text by index
    else {
      const global_index = parseInt(prompt.split(' ')[0], 10);
      console.log('Regular request - index:', global_index);
      answer = predefinedTexts[global_index] || ["❌ Content not found for index: " + global_index];
    }
    
    console.log('Using answer:', answer);
    
    // Stream the response with proper line separators and realistic typing delay
    const streamText = async () => {
      for (let i = 0; i < answer.length; i++) {
        const text = answer[i];
        // Add newline before each element except the first one
        const fullChunk = i === 0 ? text : '\n' + text;
        
        // Stream word by word for more realistic typing effect
        const words = fullChunk.split(' ');
        
        for (let j = 0; j < words.length; j++) {
          const word = words[j];
          const isLastWord = j === words.length - 1;
          const wordToSend = isLastWord ? word : word + ' '; // Add space after word unless it's the last one
          
          res.write(wordToSend);
          console.log('Streaming word:', wordToSend);
          
          // Skip delays for button/special lines - stream them instantly
          const isButtonLine = fullChunk.includes('BUTTON:') || fullChunk.includes('SPECIAL:');
          if (isButtonLine) {
            continue; // No delay for button/special content
          }
          
          // Variable delay based on word characteristics for realistic typing
          let delay;
          if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
            delay = 400; // Longer pause after sentences
          } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
            delay = 200; // Medium pause after punctuation
          } else if (word.includes('\n')) {
            delay = 300; // Pause for line breaks
          } else if (word.length > 8) {
            delay = 150; // Slightly longer for longer words
          } else {
            delay = 80 + Math.random() * 40; // 80-120ms for regular words with randomness
          }
          
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
      res.end();
    };
    
    await streamText();
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
