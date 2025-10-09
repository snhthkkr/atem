"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var jsx_runtime_1 = require("react/jsx-runtime");
function AppSimple() {
    return ((0, jsx_runtime_1.jsxs)("div", __assign({ style: { padding: '20px', fontFamily: 'Arial, sans-serif' } }, { children: [(0, jsx_runtime_1.jsx)("h1", { children: "Atem Test" }, void 0), (0, jsx_runtime_1.jsx)("p", { children: "If you can see this, React is working!" }, void 0), (0, jsx_runtime_1.jsxs)("p", { children: ["Current time: ", new Date().toLocaleTimeString()] }, void 0)] }), void 0));
}
exports["default"] = AppSimple;
