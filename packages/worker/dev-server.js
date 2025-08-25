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
        "BUTTON:RNN: recurrent neural networks",
        "BUTTON:LSTM: long short-term memory networks", 
        "BUTTON:Transformers: attention-based models",
        "BUTTON:Need help choosing?",
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
        "To better answer your question, please provide more context:\n\n• What type of data are you working with?\n• What is your target variable?\n• How long are your sequences?\n• What computational resources do you have?",
        "BUTTON:Send reply"
    ],
    [
      "Based on your input, the most suitable model for your time series data is likely the LSTM, as it handles medium-length sequences and long-term dependencies well. Here is a link to a Python library for its implementation: https://pytorch.org/docs/stable/generated/torch.nn.LSTM.html",
      "SPECIAL:USER PROFILE1"
    ]
];

// Mapping from button text to predefined response indices
const buttonToIndexMap = {
  // From index 0 model options - each leads to their specific description
  "RNN: recurrent neural networks": 1,
  "LSTM: long short-term memory networks": 2,
  "Transformers: attention-based models": 3,
  "Need help choosing?": 6, // Goes to context questions
  
  // From detail pages - for now, just cycle through details
  "More details": 4, // Goes to RNN details by default
  
  // From context questions
  "Send reply": 7, // Goes to LSTM recommendation
};

// Special content for SPECIAL: prefixed buttons
const specialContentMap = {
  "USER PROFILE": [
    "User Profile:\n\nPreferred Learning Style: In-depth understanding for target\n\nCurrent Skills:\n• Biology\n• Statistics\n\nWeaknesses:\n• Deep Learning\n• Neural Network Implementation\n\nLearning Target:\n• Deep learning for sequential medical data\n• Time series analysis in healthcare\n\nRecommended Path:\n• Start with basic neural networks\n• Progress to RNNs and LSTMs\n• Apply to medical time series data"    
  ],
  "USER PROFILE1": [
    "Updated User Profile:\n\nNew Skill Added: Python programming\n\nCurrent Skills:\n• Biology\n• Statistics\n• Python programming\n\nWeaknesses:\n• Deep Learning\n• Neural Network Implementation\n\nLearning Target:\n• Deep learning for sequential medical data\n• Time series analysis in healthcare\n\nNext Steps:\n• Implement basic neural networks in Python\n• Learn PyTorch or TensorFlow\n• Practice with medical datasets"
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
    
    // Stream the response with proper line separators
    const streamText = async () => {
      for (let i = 0; i < answer.length; i++) {
        const text = answer[i];
        // Add newline before each element except the first one
        const chunk = i === 0 ? text : '\n' + text;
        res.write(chunk);
        console.log('Streaming:', chunk);
        // Simulate delay for streaming effect
        await new Promise((resolve) => setTimeout(resolve, 100));
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
