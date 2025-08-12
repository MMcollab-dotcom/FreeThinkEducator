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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.OpenAIStream = OpenAIStream;
var eventsource_parser_1 = require("eventsource-parser");
var hardcoded_handler_1 = require("./hardcoded_handler");
// @ts-ignore
var api_key = (_a = process.env.OPEN_AI_API_KEY) !== null && _a !== void 0 ? _a : "";
function OpenAIStream(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var encoder, decoder, counter, res, stream;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    encoder = new TextEncoder();
                    decoder = new TextDecoder();
                    counter = 0;
                    return [4 /*yield*/, fetch("https://api.openai.com/v1/chat/completions", {
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: "Bearer ".concat(api_key),
                            },
                            method: "POST",
                            body: JSON.stringify(payload),
                        })];
                case 1:
                    res = _a.sent();
                    stream = new ReadableStream({
                        start: function (controller) {
                            return __awaiter(this, void 0, void 0, function () {
                                // callback
                                function onParse(event) {
                                    var _a;
                                    if (event.type === "event") {
                                        var data = event.data;
                                        // https://beta.openai.com/docs/api-reference/completions/create#completions/create-stream
                                        if (data === "[DONE]") {
                                            controller.close();
                                            return;
                                        }
                                        try {
                                            var json = JSON.parse(data);
                                            var text = ((_a = json.choices[0].delta) === null || _a === void 0 ? void 0 : _a.content) || "";
                                            if (counter < 2 && (text.match(/\n/) || []).length) {
                                                // this is a prefix character (i.e., "\n\n"), do nothing
                                                return;
                                            }
                                            var queue = encoder.encode(text);
                                            controller.enqueue(queue);
                                            counter++;
                                        }
                                        catch (e) {
                                            // maybe parse error
                                            controller.error(e);
                                        }
                                    }
                                }
                                var parser, _a, _b, _c, chunk, e_1_1;
                                var _d, e_1, _e, _f;
                                return __generator(this, function (_g) {
                                    switch (_g.label) {
                                        case 0:
                                            parser = (0, eventsource_parser_1.createParser)(onParse);
                                            _g.label = 1;
                                        case 1:
                                            _g.trys.push([1, 6, 7, 12]);
                                            _a = true, _b = __asyncValues(res.body);
                                            _g.label = 2;
                                        case 2: return [4 /*yield*/, _b.next()];
                                        case 3:
                                            if (!(_c = _g.sent(), _d = _c.done, !_d)) return [3 /*break*/, 5];
                                            _f = _c.value;
                                            _a = false;
                                            chunk = _f;
                                            parser.feed(decoder.decode(chunk));
                                            _g.label = 4;
                                        case 4:
                                            _a = true;
                                            return [3 /*break*/, 2];
                                        case 5: return [3 /*break*/, 12];
                                        case 6:
                                            e_1_1 = _g.sent();
                                            e_1 = { error: e_1_1 };
                                            return [3 /*break*/, 12];
                                        case 7:
                                            _g.trys.push([7, , 10, 11]);
                                            if (!(!_a && !_d && (_e = _b.return))) return [3 /*break*/, 9];
                                            return [4 /*yield*/, _e.call(_b)];
                                        case 8:
                                            _g.sent();
                                            _g.label = 9;
                                        case 9: return [3 /*break*/, 11];
                                        case 10:
                                            if (e_1) throw e_1.error;
                                            return [7 /*endfinally*/];
                                        case 11: return [7 /*endfinally*/];
                                        case 12: return [2 /*return*/];
                                    }
                                });
                            });
                        },
                    });
                    return [2 /*return*/, stream];
            }
        });
    });
}
if (api_key === "") {
    throw new Error("Missing env var from OpenAI");
}
exports.config = {
    runtime: "edge",
};
// CORS helper for Edge Runtime (not Node.js style)
var allowCors = function (fn) { return function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var response, newHeaders;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                // Handle CORS preflight requests
                if (req.method === 'OPTIONS') {
                    return [2 /*return*/, new Response(null, {
                            status: 200,
                            headers: {
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                            },
                        })];
                }
                return [4 /*yield*/, fn(req)];
            case 1:
                response = _a.sent();
                newHeaders = new Headers(response.headers);
                newHeaders.set('Access-Control-Allow-Origin', '*');
                newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
                return [2 /*return*/, new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    })];
        }
    });
}); }; };
var handler = function (req) { return __awaiter(void 0, void 0, void 0, function () {
    var prompt, payload, stream, res;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, req.json()];
            case 1:
                prompt = (_a.sent()).prompt;
                if (!prompt) {
                    return [2 /*return*/, new Response("No prompt in the request", { status: 400 })];
                }
                payload = {
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.9,
                    top_p: 1,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    max_tokens: 256,
                    stream: true,
                    n: 1,
                };
                return [4 /*yield*/, OpenAIStream(payload)];
            case 2:
                stream = _a.sent();
                res = new Response(stream, {
                    headers: {
                        "Content-Type": "text/html; charset=utf-8",
                    },
                });
                res.headers.set("Access-Control-Allow-Credentials", "true");
                res.headers.set("Access-Control-Allow-Origin", "*");
                // another common pattern
                // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
                res.headers.set("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
                res.headers.set("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");
                return [2 /*return*/, res];
        }
    });
}); };
exports.default = (hardcoded_handler_1.hardcoded_handler);
