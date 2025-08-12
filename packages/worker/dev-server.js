import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

// Predefined texts to stream (copied from hardcoded_handler.ts)
const predefinedTexts = [
    ["User profile:",
    "\n-Skills: Biology, Statistics",
    "\n-Weakness: Deep Learning",
    "\n-Target: Deep learning for sequential medical data"],
    [ "The following models could be suitable for time series data:",
        "\n- RNN\n- Transformer\n- LSTM" ],
    [ "LSTM: An RNN variant with gates to control what information is kept, forgotten, or output at each step. Handles longer sequences than default RNNs, but becomes very slow with long sequences."],
    [ "⁠RNN: recurrent neural networks, Processes sequences step-by-step, passing hidden state from one timestep to the next. Lower compute cost than LSTM or Transformers but struggles with very long range dependencies" ],
    [""],
    [ "Transformers: State of the art in time series modelling, efficiently trains long term dependencies in parallel with self attention. Best at modelling long range dependences and fast to train, but needs more data and high memory usage" ],
    [""],
    [ "- How much data is there?\n- How much compute is available?\n- What coding skills does user have" ],
    ["User profile:",
    "\n-Updated Skills: Python",
    "\n-Skills: Biology, Statistics, Python",
    "\n-Weakness: Deep Learning",
    "\n-Target: Deep Learning for medical time series",
    "\n\nSounds like LSTMs are a good tradeoff between modelling capabilties and compute availability.",
    "\n\nSince you have python skills, here is Pytorch LSTM docs and tutorials:",
    "\nhttps://docs.pytorch.org/docs/stable/",
    "generated/torch.nn.LSTM.html",
    "Based on similarities in your profile and queries with other users, these topics might be of interest to your learning journey:",
        "\n- Data privacy laws: what are regional regulations on anonymisation of patient data?",
        "\n- Model accountability: What are laws on liability of model output?",
        "\n- Data security: How to encrypt the data securely?"
    ],
    ["User profile:",
    "\n-Updated location: Germany",
    "\n-Skills: Biology, Statistics, Python",
    "\n-Weakness: Deep Learning",
    "\n-Target: Deep Learning for medical time series",
    "\n-Location: Germany",
    "\n\nEU-wide law (effective May 25, 2018), applies even if you are outside the EU but process EU residents’ data.",
    "Special category” data (Art. 9) includes health data, genetic data, biometric data. Processing it is prohibited by default unless specific conditions apply, e.g.:",
    "Explicit informed consent",
    "Necessary for public interest in public health",
    "Necessary for scientific research (with safeguards like pseudonymization)"
    ],
];

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175'], // Allow requests from both possible frontend ports
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
    
    const global_index = parseInt(prompt.split(' ')[0], 10);
    let index = 0;
    const answer = predefinedTexts[global_index] || predefinedTexts[0];
    
    console.log('Using predefined text index:', global_index, 'Answer:', answer);
    
    // Set streaming headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    
    // Stream the response
    const streamText = async () => {
      for (const text of answer) {
        res.write(text);
        console.log('Streaming:', text);
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
