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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
var jsx_runtime_1 = require("react/jsx-runtime");
// ATEM 0.00.015 — Event-Controlled Board Logic
var react_1 = require("react");
require("./styles.css");
function reduceThoughts(prev, event) {
    switch (event.type) {
        case "createThought": {
            // Check if thought already exists
            if (prev.some(function (t) { return t.id === event.id; })) {
                console.warn('Duplicate thought creation prevented:', event.id);
                return prev;
            }
            var now = event.at || Date.now();
            var text = event.text || '';
            var wordCount = text.trim().split(/\s+/).length;
            var characterCount = text.length;
            return __spreadArray(__spreadArray([], prev, true), [
                {
                    id: event.id,
                    text: text,
                    x: event.x,
                    y: event.y,
                    lastTouched: now,
                    createdAt: now,
                    updatedAt: now,
                    version: 1,
                    wordCount: wordCount,
                    characterCount: characterCount
                },
            ], false);
        }
        case "updateText": {
            return prev.map(function (thought) {
                return thought.id === event.id
                    ? __assign(__assign({}, thought), { text: event.text, lastTouched: event.at || Date.now(), updatedAt: event.at || Date.now(), version: thought.version + 1, wordCount: event.text.trim().split(/\s+/).length, characterCount: event.text.length }) : thought;
            });
        }
        case "moveThought": {
            return prev.map(function (thought) {
                return thought.id === event.id
                    ? __assign(__assign({}, thought), { x: event.x, y: event.y, lastTouched: event.at || Date.now() }) : thought;
            });
        }
        case "deleteThought": {
            return prev.filter(function (thought) { return thought.id !== event.id; });
        }
        default:
            return prev;
    }
}
function reduceLinks(prev, event) {
    switch (event.type) {
        case "createLink": {
            // Check if link already exists
            if (prev.some(function (l) { return l.id === event.id; })) {
                console.warn('Duplicate link creation prevented:', event.id);
                return prev;
            }
            return __spreadArray(__spreadArray([], prev, true), [
                {
                    id: event.id,
                    sourceId: event.sourceId,
                    targetId: event.targetId,
                    createdAt: event.at || Date.now()
                },
            ], false);
        }
        case "deleteLink": {
            return prev.filter(function (link) { return link.id !== event.id; });
        }
        default:
            return prev;
    }
}
function appReducer(prev, event) {
    if (event.type === "__reset__") {
        return { thoughts: event.payload, events: [], cursor: 0, links: [] };
    }
    var stampedEvent = __assign(__assign({}, event), { at: event.at || Date.now() });
    var nextEvents = __spreadArray(__spreadArray([], prev.events, true), [stampedEvent], false);
    var nextCursor = prev.cursor + 1;
    var nextThoughts = reduceThoughts(prev.thoughts, stampedEvent);
    var nextLinks = reduceLinks(prev.links, stampedEvent);
    return { thoughts: nextThoughts, events: nextEvents, cursor: nextCursor, links: nextLinks };
}
function App() {
    var _this = this;
    var _a = (0, react_1.useReducer)(appReducer, undefined, function () {
        // Rehydrate from snapshot and event log
        var snapshotStr = localStorage.getItem("atem.snapshot");
        var eventsStr = localStorage.getItem("atem.events");
        var cursorStr = localStorage.getItem("atem.cursor");
        var baseThoughts = snapshotStr ? JSON.parse(snapshotStr) : [];
        var events = eventsStr ? JSON.parse(eventsStr) : [];
        var cursor = Math.min(events.length, Math.max(0, cursorStr ? parseInt(cursorStr, 10) : events.length));
        var rebuilt = events.slice(0, cursor).reduce(reduceThoughts, baseThoughts);
        var links = events.slice(0, cursor).reduce(reduceLinks, []);
        return { thoughts: rebuilt, events: events, cursor: cursor, links: links };
    }), state = _a[0], dispatch = _a[1];
    // Clean Two-Mode System
    var _b = (0, react_1.useState)('board'), mode = _b[0], setMode = _b[1];
    var _c = (0, react_1.useState)(''), currentNote = _c[0], setCurrentNote = _c[1];
    var _d = (0, react_1.useState)(null), editingThoughtId = _d[0], setEditingThoughtId = _d[1];
    var _e = (0, react_1.useState)(null), selectedThought = _e[0], setSelectedThought = _e[1];
    var _f = (0, react_1.useState)(false), showModal = _f[0], setShowModal = _f[1];
    // Mode debugging states
    var _g = (0, react_1.useState)({
        isDragging: false,
        wasDragging: false,
        clickProcessed: false,
        lastClickTime: 0,
        lastAction: '',
        thoughtStates: {}
    }), debugStates = _g[0], setDebugStates = _g[1];
    var wrapperRef = (0, react_1.useRef)(null);
    var _h = (0, react_1.useState)(1), zoom = _h[0], setZoom = _h[1];
    var _j = (0, react_1.useState)(false), hasDragged = _j[0], setHasDragged = _j[1];
    var updateDebugState = function (updates) {
        setDebugStates(function (prev) { return (__assign(__assign({}, prev), updates)); });
    };
    // Persist thoughts to localStorage
    (0, react_1.useEffect)(function () {
        localStorage.setItem("atem.snapshot", JSON.stringify(state.thoughts));
    }, [state.thoughts]);
    // Register service worker for PWA
    (0, react_1.useEffect)(function () {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(function (registration) {
                console.log('SW registered: ', registration);
            })["catch"](function (registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
        }
    }, []);
    (0, react_1.useEffect)(function () {
        localStorage.setItem("atem.events", JSON.stringify(state.events));
        localStorage.setItem("atem.cursor", String(state.cursor));
    }, [state.events]);
    (0, react_1.useEffect)(function () {
        if (!editingThoughtId)
            return;
        var thought = state.thoughts.find(function (t) { return t.id === editingThoughtId; });
        if (!thought)
            return;
        var wrapper = wrapperRef.current;
        if (wrapper) {
            var centerX = thought.x - wrapper.clientWidth / 2 + 125;
            var centerY = thought.y - wrapper.clientHeight / 2 + 50;
            wrapper.scrollTo({ left: centerX, top: centerY, behavior: "smooth" });
        }
    }, [editingThoughtId]);
    var addThoughtAt = function (x, y) {
        var id = crypto.randomUUID();
        console.log('Creating thought with ID:', id, 'at position:', x, y);
        dispatch({ type: "createThought", id: id, x: x, y: y });
    };
    var updateText = function (id, newText) {
        dispatch({ type: "updateText", id: id, text: newText });
    };
    var updatePosition = function (id, x, y) {
        dispatch({ type: "moveThought", id: id, x: x, y: y });
    };
    var deleteThought = function (id) {
        dispatch({ type: "deleteThought", id: id });
    };
    var undo = function () {
        if (state.cursor > 0) {
            dispatch({ type: "__reset__", payload: state.thoughts });
        }
    };
    var redo = function () {
        // This would need more complex logic for true redo
        console.log("Redo not implemented yet");
    };
    var getWrapperOffset = function () {
        if (!wrapperRef.current)
            return { x: 0, y: 0 };
        var rect = wrapperRef.current.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    };
    var handleThoughtClick = function (thoughtId) {
        var now = Date.now();
        console.log('🖱️ Thought click:', thoughtId, 'Selected:', selectedThought);
        updateDebugState({
            lastClickTime: now,
            clickProcessed: true,
            lastAction: 'thought_click'
        });
        // Simple one-tap connection system
        if (selectedThought === null) {
            // No thought selected - select this one
            console.log('🔗 Selecting thought for connection');
            setSelectedThought(thoughtId);
            updateDebugState({ lastAction: 'thought_selected' });
        }
        else if (selectedThought === thoughtId) {
            // Same thought - deselect
            console.log('❌ Deselecting thought');
            setSelectedThought(null);
            updateDebugState({ lastAction: 'thought_deselected' });
        }
        else {
            // Different thought - create connection
            console.log('🔗 Creating connection');
            var linkId = crypto.randomUUID();
            dispatch({ type: "createLink", id: linkId, sourceId: selectedThought, targetId: thoughtId });
            setSelectedThought(null);
            updateDebugState({ lastAction: 'connection_created' });
        }
    };
    var handleBoardClick = function (e) {
        // Only handle clicks directly on the board (not on thoughts)
        if (e.target !== e.currentTarget)
            return;
        // If we just finished dragging, don't do anything
        if (hasDragged) {
            setHasDragged(false);
            return;
        }
        // Clear selection when clicking empty space
        if (selectedThought) {
            setSelectedThought(null);
            console.log('❌ Cleared selection - clicked empty space');
            updateDebugState({ lastAction: 'selection_cleared' });
            return;
        }
    };
    var getConnectionCount = function (thoughtId) {
        return state.links.filter(function (link) { return link.sourceId === thoughtId || link.targetId === thoughtId; }).length;
    };
    var exportThoughts = function () {
        var exportPayload = {
            snapshot: state.thoughts,
            events: state.events,
            version: "0.0.1"
        };
        var blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
            type: "application/json"
        });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "thoughts.json";
        a.click();
        URL.revokeObjectURL(url);
    };
    var importThoughts = function (file) { return __awaiter(_this, void 0, void 0, function () {
        var text, parsed;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, file.text()];
                case 1:
                    text = _b.sent();
                    try {
                        parsed = JSON.parse(text);
                        if (Array.isArray(parsed)) {
                            // Back-compat: older exports were raw Thought[]
                            localStorage.setItem("atem.snapshot", JSON.stringify(parsed));
                            localStorage.removeItem("atem.events");
                            dispatch({ type: "__reset__", payload: parsed });
                        }
                        else if (parsed && Array.isArray(parsed.snapshot)) {
                            localStorage.setItem("atem.snapshot", JSON.stringify(parsed.snapshot));
                            localStorage.setItem("atem.events", JSON.stringify((_a = parsed.events) !== null && _a !== void 0 ? _a : []));
                            dispatch({ type: "__reset__", payload: parsed.snapshot });
                        }
                    }
                    catch (_c) { }
                    return [2 /*return*/];
            }
        });
    }); };
    // Core Two-Mode Functions
    var findEmptySpace = function () {
        var thoughtWidth = 250;
        var thoughtHeight = 100;
        var padding = 20;
        var maxAttempts = 50;
        var _loop_1 = function (attempt) {
            var x = 50 + Math.random() * (window.innerWidth - thoughtWidth - 100);
            var y = 50 + Math.random() * (window.innerHeight - thoughtHeight - 100);
            // Check if this position overlaps with existing thoughts
            var overlaps = state.thoughts.some(function (thought) {
                var dx = Math.abs(thought.x - x);
                var dy = Math.abs(thought.y - y);
                return dx < thoughtWidth + padding && dy < thoughtHeight + padding;
            });
            if (!overlaps) {
                return { value: { x: x, y: y } };
            }
        };
        for (var attempt = 0; attempt < maxAttempts; attempt++) {
            var state_1 = _loop_1(attempt);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        // Fallback to a grid position if no empty space found
        var gridX = 50 + (state.thoughts.length % 5) * (thoughtWidth + padding);
        var gridY = 50 + Math.floor(state.thoughts.length / 5) * (thoughtHeight + padding);
        return { x: gridX, y: gridY };
    };
    var saveCurrentNote = function () {
        if (currentNote.trim()) {
            var id = crypto.randomUUID();
            var now = Date.now();
            var position = findEmptySpace();
            dispatch({
                type: "createThought",
                id: id,
                x: position.x,
                y: position.y,
                text: currentNote,
                at: now
            });
            setCurrentNote('');
            setEditingThoughtId(null);
        }
    };
    var startNewNote = function () {
        saveCurrentNote();
        setCurrentNote('');
        setEditingThoughtId(null);
    };
    var editThought = function (thoughtId) {
        var thought = state.thoughts.find(function (t) { return t.id === thoughtId; });
        if (thought) {
            setCurrentNote(thought.text);
            setEditingThoughtId(thoughtId);
            setShowModal(true);
        }
    };
    var saveEditedThought = function (shouldCloseModal) {
        if (shouldCloseModal === void 0) { shouldCloseModal = true; }
        if (editingThoughtId && currentNote.trim()) {
            console.log('💾 Updating existing thought:', editingThoughtId, 'with text:', currentNote);
            // Update existing thought instead of creating new one
            dispatch({
                type: "updateText",
                id: editingThoughtId,
                text: currentNote,
                at: Date.now()
            });
            setCurrentNote('');
            setEditingThoughtId(null);
            if (shouldCloseModal) {
                setShowModal(false);
            }
        }
    };
    var activeThought = (0, react_1.useMemo)(function () { return state.thoughts.find(function (t) { return t.id === editingThoughtId; }) || null; }, [state.thoughts, editingThoughtId]);
    // Get current branch name for version display
    var getVersionName = function () {
        // Check if we're on experimental branch (this is a simple check)
        var isExperimental = window.location.href.includes('experimental') ||
            document.title.includes('experimental') ||
            localStorage.getItem('atem.branch') === 'experimental';
        if (isExperimental) {
            return "🧪 Experimental Visual";
        }
        return "🛡️ MasterDoc";
    };
    // Clean Two-Mode System
    // All editing now happens in modals - no full screen mode needed
    // Board Mode - Full Screen with Windowed Thoughts
    return ((0, jsx_runtime_1.jsxs)("div", __assign({ ref: wrapperRef, className: "board-mode" }, { children: [(0, jsx_runtime_1.jsx)("div", __assign({ className: "board-header" }, { children: (0, jsx_runtime_1.jsx)("button", __assign({ className: "new-note-button", onClick: function () {
                        setCurrentNote('');
                        setEditingThoughtId(null);
                        setShowModal(true);
                    }, title: "New Note" }, { children: "\u270F\uFE0F New Note" }), void 0) }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ className: "dev-hud" }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ className: "dev-stats" }, { children: [(0, jsx_runtime_1.jsxs)("span", { children: ["Thoughts: ", state.thoughts.length] }, void 0), (0, jsx_runtime_1.jsxs)("span", { children: ["Links: ", state.links.length] }, void 0), (0, jsx_runtime_1.jsxs)("span", { children: ["Mode: ", mode] }, void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ className: "dev-tools" }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                                    var data = {
                                        thoughts: state.thoughts,
                                        links: state.links,
                                        timestamp: Date.now()
                                    };
                                    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                                    var url = URL.createObjectURL(blob);
                                    var a = document.createElement('a');
                                    a.href = url;
                                    a.download = "atem-export-" + new Date().toISOString().split('T')[0] + ".json";
                                    a.click();
                                    URL.revokeObjectURL(url);
                                }, title: "Export Data" }, { children: "\uD83D\uDCE4 Export" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                                    var input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.json';
                                    input.onchange = function (e) {
                                        var _a;
                                        var file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
                                        if (file) {
                                            var reader = new FileReader();
                                            reader.onload = function (e) {
                                                var _a;
                                                try {
                                                    var data = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                                                    if (data.thoughts && data.links) {
                                                        // Clear current state
                                                        dispatch({ type: "__reset__", payload: [] });
                                                        // Add imported thoughts
                                                        data.thoughts.forEach(function (thought) {
                                                            dispatch({
                                                                type: "createThought",
                                                                id: thought.id,
                                                                x: thought.x,
                                                                y: thought.y,
                                                                text: thought.text,
                                                                at: thought.createdAt
                                                            });
                                                        });
                                                        // Add imported links
                                                        data.links.forEach(function (link) {
                                                            dispatch({
                                                                type: "createLink",
                                                                id: link.id,
                                                                sourceId: link.sourceId,
                                                                targetId: link.targetId,
                                                                at: link.createdAt
                                                            });
                                                        });
                                                    }
                                                }
                                                catch (error) {
                                                    console.error('Failed to import data:', error);
                                                }
                                            };
                                            reader.readAsText(file);
                                        }
                                    };
                                    input.click();
                                }, title: "Import Data" }, { children: "\uD83D\uDCE5 Import" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                                    if (confirm('Clear all thoughts and connections?')) {
                                        dispatch({ type: "__reset__", payload: [] });
                                        setSelectedThought(null);
                                        setShowModal(false);
                                    }
                                }, title: "Clear All" }, { children: "\uD83D\uDDD1\uFE0F Clear" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                                    console.log('=== ATEM DEBUG INFO ===');
                                    console.log('State:', state);
                                    console.log('Mode:', mode);
                                    console.log('Current Note:', currentNote);
                                    console.log('Editing Thought ID:', editingThoughtId);
                                    console.log('Selected Thought:', selectedThought);
                                    console.log('Show Modal:', showModal);
                                    console.log('========================');
                                    alert('Debug info logged to console');
                                }, title: "Debug Info" }, { children: "\uD83D\uDC1B Debug" }), void 0)] }), void 0)] }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ className: "board-canvas" }, { children: [state.links.map(function (link) {
                        var source = state.thoughts.find(function (t) { return t.id === link.sourceId; });
                        var target = state.thoughts.find(function (t) { return t.id === link.targetId; });
                        if (!source || !target)
                            return null;
                        return ((0, jsx_runtime_1.jsx)("svg", __assign({ style: {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 1
                            } }, { children: (0, jsx_runtime_1.jsx)("line", { x1: source.x + 125, y1: source.y + 50, x2: target.x + 125, y2: target.y + 50, stroke: "#333", strokeWidth: "2" }, void 0) }), link.id));
                    }), state.thoughts.map(function (thought) { return ((0, jsx_runtime_1.jsx)(DraggableThoughtCard, { thought: thought, isSelected: selectedThought === thought.id, onEdit: function () { return editThought(thought.id); }, onSelect: function () {
                            if (selectedThought === thought.id) {
                                setSelectedThought(null);
                            }
                            else if (selectedThought) {
                                // Create connection
                                var linkId = crypto.randomUUID();
                                dispatch({
                                    type: "createLink",
                                    id: linkId,
                                    sourceId: selectedThought,
                                    targetId: thought.id,
                                    at: Date.now()
                                });
                                setSelectedThought(null);
                            }
                            else {
                                setSelectedThought(thought.id);
                            }
                        }, onMove: function (x, y) { return updatePosition(thought.id, x, y); } }, thought.id)); })] }), void 0), showModal && ((0, jsx_runtime_1.jsx)("div", __assign({ className: "modal-overlay", onClick: function () { return setShowModal(false); } }, { children: (0, jsx_runtime_1.jsxs)("div", __assign({ className: "modal-content", onClick: function (e) { return e.stopPropagation(); } }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ className: "modal-header" }, { children: [(0, jsx_runtime_1.jsx)("h3", { children: editingThoughtId ? 'Edit Thought' : 'New Thought' }, void 0), (0, jsx_runtime_1.jsx)("button", __assign({ className: "modal-close", onClick: function () { return setShowModal(false); }, title: "Close" }, { children: "\u2715" }), void 0)] }), void 0), (0, jsx_runtime_1.jsx)("div", __assign({ className: "modal-body" }, { children: (0, jsx_runtime_1.jsx)("textarea", { value: currentNote, onChange: function (e) { return setCurrentNote(e.target.value); }, placeholder: editingThoughtId ? "Edit your thought..." : "Start writing your thoughts...", className: "modal-textarea", autoFocus: true }, void 0) }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ className: "modal-footer" }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ className: "modal-save", onClick: function () {
                                        if (editingThoughtId) {
                                            saveEditedThought(true);
                                        }
                                        else {
                                            saveCurrentNote();
                                            setShowModal(false);
                                        }
                                    }, title: "Save Changes" }, { children: "\uD83D\uDCBE Save" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ className: "modal-cancel", onClick: function () { return setShowModal(false); }, title: "Cancel" }, { children: "Cancel" }), void 0)] }), void 0)] }), void 0) }), void 0))] }), void 0));
}
function DraggableThoughtCard(_a) {
    var thought = _a.thought, isSelected = _a.isSelected, onEdit = _a.onEdit, onSelect = _a.onSelect, onMove = _a.onMove;
    var _b = (0, react_1.useState)(false), isDragging = _b[0], setIsDragging = _b[1];
    var _c = (0, react_1.useState)({ x: 0, y: 0, offsetX: 0, offsetY: 0 }), dragStart = _c[0], setDragStart = _c[1];
    var _d = (0, react_1.useState)(false), hasMoved = _d[0], setHasMoved = _d[1];
    var cardRef = (0, react_1.useRef)(null);
    var handleMouseDown = function (e) {
        e.preventDefault();
        e.stopPropagation();
        setHasMoved(false);
        if (cardRef.current) {
            var rect = cardRef.current.getBoundingClientRect();
            setDragStart({
                x: e.clientX,
                y: e.clientY,
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top
            });
        }
    };
    var handleMouseMove = function (e) {
        if (!dragStart.x && !dragStart.y)
            return;
        var deltaX = Math.abs(e.clientX - dragStart.x);
        var deltaY = Math.abs(e.clientY - dragStart.y);
        // Only start dragging if moved more than 3 pixels
        if (deltaX > 3 || deltaY > 3) {
            if (!isDragging) {
                setIsDragging(true);
                setHasMoved(true);
            }
            var newX = e.clientX - dragStart.offsetX;
            var newY = e.clientY - dragStart.offsetY;
            onMove(newX, newY);
        }
    };
    var handleMouseUp = function () {
        setIsDragging(false);
        setDragStart({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
    };
    (0, react_1.useEffect)(function () {
        if (dragStart.x || dragStart.y) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return function () {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [dragStart.x, dragStart.y]);
    return ((0, jsx_runtime_1.jsx)("div", __assign({ ref: cardRef, className: "thought-card", style: {
            position: 'absolute',
            left: thought.x,
            top: thought.y,
            width: '250px',
            minHeight: '100px',
            background: 'white',
            border: isSelected ? '2px solid #007bff' : '1px solid #ddd',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: isDragging ? '0 8px 24px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
            cursor: isDragging ? 'grabbing' : 'grab',
            zIndex: isDragging ? 10 : 2,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
            transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease'
        }, onMouseDown: handleMouseDown, onDoubleClick: function (e) {
            e.stopPropagation();
            if (!hasMoved) {
                onEdit();
            }
        }, onClick: function (e) {
            e.stopPropagation();
            if (!hasMoved) {
                onSelect();
            }
        } }, { children: (0, jsx_runtime_1.jsx)("div", __assign({ style: {
                fontSize: '14px',
                lineHeight: '1.4',
                color: isSelected ? '#007bff' : '#333',
                fontWeight: isSelected ? 'bold' : 'normal',
                userSelect: 'none',
                pointerEvents: 'none'
            } }, { children: thought.text }), void 0) }), void 0));
}
exports["default"] = App;
