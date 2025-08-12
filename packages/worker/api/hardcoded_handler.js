"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hardcoded_handler = void 0;
// Predefined texts to stream
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
    [""],
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
var hardcoded_handler = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var prompt, encoder, index, global_index, stream, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, req.json()];
            case 1:
                prompt = (_a.sent()).prompt;
                if (!prompt) {
                    return [2 /*return*/, new Response("No prompt in the request", { status: 400 })];
                }
                encoder = new TextEncoder();
                index = 0;
                global_index = parseInt(prompt.split(' ')[0], 10);
                console.log(prompt);
                stream = new ReadableStream({
                    start: function (controller) {
                        return __awaiter(this, void 0, void 0, function () {
                            var answer, text, queue;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        answer = predefinedTexts[global_index];
                                        _a.label = 1;
                                    case 1:
                                        if (!(index < answer.length)) return [3 /*break*/, 3];
                                        text = answer[index];
                                        queue = encoder.encode("".concat(text));
                                        controller.enqueue(queue);
                                        index++;
                                        // Simulate delay for streaming effect
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 100); })];
                                    case 2:
                                        // Simulate delay for streaming effect
                                        _a.sent();
                                        return [3 /*break*/, 1];
                                    case 3:
                                        controller.close();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                });
                res = new Response(stream, {
                    headers: {
                        "Content-Type": "text/event-stream; charset=utf-8",
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET,OPTIONS,PATCH,DELETE,POST,PUT",
                        "Access-Control-Allow-Headers": "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
                    },
                });
                return [2 /*return*/, res];
        }
    });
}); };
exports.hardcoded_handler = hardcoded_handler;
