"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var jsx_runtime_1 = require("react/jsx-runtime");
var react_1 = __importDefault(require("react"));
var client_1 = __importDefault(require("react-dom/client"));
var AppBulletproof_1 = __importDefault(require("./AppBulletproof"));
require("./styles.css");
var root = client_1["default"].createRoot(document.getElementById("root"));
root.render((0, jsx_runtime_1.jsx)(react_1["default"].StrictMode, { children: (0, jsx_runtime_1.jsx)(AppBulletproof_1["default"], {}, void 0) }, void 0));
