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
var react_1 = require("react");
function AppBulletproof() {
    console.log('🚀 Apple Notes Style Atem loaded!');
    var _a = (0, react_1.useState)([]), notes = _a[0], setNotes = _a[1];
    var _b = (0, react_1.useState)(''), currentNote = _b[0], setCurrentNote = _b[1];
    var _c = (0, react_1.useState)(false), showModal = _c[0], setShowModal = _c[1];
    var _d = (0, react_1.useState)(null), editingNoteId = _d[0], setEditingNoteId = _d[1];
    var _e = (0, react_1.useState)(true), isWritingMode = _e[0], setIsWritingMode = _e[1];
    var _f = (0, react_1.useState)(null), autoSaveTimeout = _f[0], setAutoSaveTimeout = _f[1];
    // Simple board state
    var _g = (0, react_1.useState)(1), zoom = _g[0], setZoom = _g[1];
    var _h = (0, react_1.useState)(null), draggedNote = _h[0], setDraggedNote = _h[1];
    var _j = (0, react_1.useState)({ x: 0, y: 0 }), dragOffset = _j[0], setDragOffset = _j[1];
    var _k = (0, react_1.useState)({ x: 0, y: 0 }), dragStartPos = _k[0], setDragStartPos = _k[1];
    var _l = (0, react_1.useState)(false), hasDragged = _l[0], setHasDragged = _l[1];
    var _m = (0, react_1.useState)(null), mostRecentNoteId = _m[0], setMostRecentNoteId = _m[1];
    var _o = (0, react_1.useState)(false), showDevMenu = _o[0], setShowDevMenu = _o[1];
    var _p = (0, react_1.useState)(false), devLogCollapsed = _p[0], setDevLogCollapsed = _p[1];
    var _q = (0, react_1.useState)(function () {
        var saved = localStorage.getItem('atem-night-mode');
        return saved === 'true';
    }), nightMode = _q[0], setNightMode = _q[1];
    var _r = (0, react_1.useState)(true), isLoading = _r[0], setIsLoading = _r[1];
    var _s = (0, react_1.useState)(false), savingNote = _s[0], setSavingNote = _s[1];
    // Load notes on start and auto-open writing mode
    (0, react_1.useEffect)(function () {
        try {
            var saved = localStorage.getItem('atem-notes');
            console.log('🔍 localStorage content:', saved);
            if (saved) {
                var parsed = JSON.parse(saved);
                console.log('📂 Parsed notes:', parsed);
                setNotes(parsed);
                console.log('📝 Loaded notes:', parsed.length);
            }
            else {
                console.log('📂 No saved notes found in localStorage');
            }
        }
        catch (error) {
            console.error('❌ Failed to load notes:', error);
        }
        // Auto-open writing mode on start (like Apple Notes)
        console.log('📖 Auto-opening writing mode');
        // Premium loading sequence
        setTimeout(function () {
            setIsLoading(false);
            setShowModal(true);
        }, 800);
        // Prevent pull-to-refresh and scroll on mobile
        var preventPullToRefresh = function (e) {
            if (e.touches.length > 1) {
                e.preventDefault();
            }
        };
        // Prevent any scrolling during drag
        var preventScroll = function (e) {
            e.preventDefault();
        };
        document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
        document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
        document.addEventListener('touchmove', preventScroll, { passive: false });
        return function () {
            document.removeEventListener('touchstart', preventPullToRefresh);
            document.removeEventListener('touchmove', preventPullToRefresh);
            document.removeEventListener('touchmove', preventScroll);
        };
    }, []);
    // Close dev menu when clicking outside
    (0, react_1.useEffect)(function () {
        var handleClickOutside = function (e) {
            if (showDevMenu && !e.target.closest('[data-dev-menu]')) {
                setShowDevMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return function () { return document.removeEventListener('click', handleClickOutside); };
    }, [showDevMenu]);
    // Save notes when they change
    (0, react_1.useEffect)(function () {
        console.log('🔄 Notes changed:', notes.length, notes);
        if (notes.length > 0) {
            try {
                localStorage.setItem('atem-notes', JSON.stringify(notes));
                console.log('💾 Saved notes to localStorage:', notes.length);
            }
            catch (error) {
                console.error('❌ Failed to save notes:', error);
            }
        }
    }, [notes]);
    // Auto-save for writing mode (like Apple Notes)
    var handleAutoSave = function () {
        if (isWritingMode && currentNote.trim()) {
            console.log('🔄 Auto-saving entry...');
            // Don't auto-save to notes array, just keep it in currentNote
            // The user will manually save when they want to
        }
    };
    // Debounced auto-save
    var debouncedAutoSave = function () {
        if (autoSaveTimeout) {
            window.clearTimeout(autoSaveTimeout);
        }
        var timeout = window.setTimeout(handleAutoSave, 2000); // Auto-save after 2 seconds of no typing
        setAutoSaveTimeout(timeout);
    };
    var handleSave = function () {
        console.log('💾 SAVE BUTTON CLICKED!', { currentNote: currentNote, editingNoteId: editingNoteId, isWritingMode: isWritingMode, notesLength: notes.length });
        setSavingNote(true);
        if (!currentNote.trim()) {
            alert('Please enter some text first!');
            setSavingNote(false);
            return;
        }
        if (editingNoteId) {
            // Update existing note
            console.log('✏️ Updating existing note:', editingNoteId);
            setNotes(function (prev) {
                var updated = prev.map(function (note) {
                    return note.id === editingNoteId
                        ? __assign(__assign({}, note), { text: currentNote.trim() }) : note;
                });
                console.log('✅ Note updated:', editingNoteId);
                return updated;
            });
        }
        else if (isWritingMode) {
            // Writing mode - save as new note
            var newNote_1 = {
                id: Date.now().toString(),
                text: currentNote.trim(),
                createdAt: Date.now(),
                x: 200 + (Math.random() - 0.5) * 100,
                y: 200 + (Math.random() - 0.5) * 100
            };
            console.log('📖 Creating new note:', newNote_1);
            setNotes(function (prev) {
                var updated = __spreadArray(__spreadArray([], prev, true), [newNote_1], false);
                setMostRecentNoteId(newNote_1.id);
                console.log('✅ Note saved');
                return updated;
            });
        }
        else {
            // Create new regular note
            var newNote_2 = {
                id: Date.now().toString(),
                text: currentNote.trim(),
                createdAt: Date.now(),
                x: 200 + (Math.random() - 0.5) * 100,
                y: 200 + (Math.random() - 0.5) * 100
            };
            console.log('📝 Creating new note:', newNote_2);
            setNotes(function (prev) {
                var updated = __spreadArray(__spreadArray([], prev, true), [newNote_2], false);
                setMostRecentNoteId(newNote_2.id);
                console.log('✅ Notes updated:', updated.length);
                return updated;
            });
        }
        // Premium save animation
        setTimeout(function () {
            setCurrentNote('');
            setEditingNoteId(null);
            setIsWritingMode(false);
            setShowModal(false);
            setSavingNote(false);
            console.log('🎉 SAVE COMPLETE!');
        }, 400);
    };
    var startWritingMode = function () {
        console.log('📖 Starting writing mode');
        setIsWritingMode(true);
        setCurrentNote('');
        setEditingNoteId(null);
        setShowModal(true);
    };
    var goToBoard = function () {
        console.log('📋 Going to board');
        // Auto-save current note when going back (like Apple Notes)
        if (currentNote.trim()) {
            console.log('💾 Auto-saving before going to board...');
            var newNote_3 = {
                id: Date.now().toString(),
                text: currentNote.trim(),
                createdAt: Date.now(),
                x: 200 + (Math.random() - 0.5) * 100,
                y: 200 + (Math.random() - 0.5) * 100
            };
            setNotes(function (prev) { return __spreadArray(__spreadArray([], prev, true), [newNote_3], false); });
            setMostRecentNoteId(newNote_3.id);
            console.log('✅ Note auto-saved');
        }
        setIsWritingMode(false);
        setCurrentNote('');
        setEditingNoteId(null);
        setShowModal(false);
    };
    var editNote = function (note) {
        console.log('✏️ Opening modal to edit note:', note.id);
        setCurrentNote(note.text);
        setEditingNoteId(note.id);
        setShowModal(true);
    };
    var deleteNote = function (noteId) {
        console.log('🗑️ Deleting note:', noteId);
        if (confirm('Delete this note?')) {
            setNotes(function (prev) { return prev.filter(function (note) { return note.id !== noteId; }); });
            console.log('✅ Note deleted:', noteId);
        }
    };
    var closeModal = function () {
        console.log('❌ Closing modal');
        setCurrentNote('');
        setEditingNoteId(null);
        setShowModal(false);
    };
    // Simple drag handlers with threshold
    var handleDragStart = function (e, noteId) {
        e.preventDefault();
        e.stopPropagation();
        var note = notes.find(function (n) { return n.id === noteId; });
        if (!note)
            return;
        var clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        var clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragStartPos({ x: clientX, y: clientY });
        setDraggedNote(noteId);
        setHasDragged(false);
        setDragOffset({
            x: clientX - (note.x * zoom),
            y: clientY - (note.y * zoom)
        });
        // Page is already non-scrollable, no need to prevent overflow
    };
    var handleDragMove = function (e) {
        if (!draggedNote)
            return;
        e.preventDefault(); // Prevent page scrolling and other default behaviors
        e.stopPropagation(); // Stop event bubbling
        var clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        var clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        // Check if we've moved enough to start dragging
        var deltaX = Math.abs(clientX - dragStartPos.x);
        var deltaY = Math.abs(clientY - dragStartPos.y);
        var threshold = 5; // 5px threshold
        if (deltaX > threshold || deltaY > threshold) {
            setHasDragged(true);
        }
        if (hasDragged || deltaX > threshold || deltaY > threshold) {
            var newX_1 = (clientX - dragOffset.x) / zoom;
            var newY_1 = (clientY - dragOffset.y) / zoom;
            setNotes(function (prev) { return prev.map(function (note) {
                return note.id === draggedNote
                    ? __assign(__assign({}, note), { x: newX_1, y: newY_1 }) : note;
            }); });
        }
    };
    var handleDragEnd = function () {
        setDraggedNote(null);
        setHasDragged(false);
        // Page is non-scrollable, no need to restore
    };
    // Zoom controls
    var zoomIn = function () { return setZoom(function (prev) { return Math.min(prev + 0.2, 3); }); };
    var zoomOut = function () { return setZoom(function (prev) { return Math.max(prev - 0.2, 0.5); }); };
    var resetZoom = function () { return setZoom(1); };
    // Dev tools
    var exportNotes = function () {
        try {
            var dataStr = JSON.stringify(notes, null, 2);
            var dataBlob = new Blob([dataStr], { type: 'application/json' });
            var url = URL.createObjectURL(dataBlob);
            var link = document.createElement('a');
            link.href = url;
            link.download = "atem-notes-" + new Date().toISOString().split('T')[0] + ".json";
            link.click();
            URL.revokeObjectURL(url);
            console.log('📤 Notes exported');
        }
        catch (error) {
            console.error('❌ Export failed:', error);
        }
    };
    var importNotes = function () {
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
                        var imported = JSON.parse((_a = e.target) === null || _a === void 0 ? void 0 : _a.result);
                        if (Array.isArray(imported)) {
                            setNotes(imported);
                            console.log('📥 Notes imported:', imported.length);
                        }
                    }
                    catch (error) {
                        console.error('❌ Import failed:', error);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };
    var clearBoard = function () {
        if (confirm('Clear all notes? This cannot be undone.')) {
            setNotes([]);
            setMostRecentNoteId(null);
            console.log('🗑️ Board cleared');
        }
    };
    var makeAllNotesVisible = function () {
        console.log('👁️ Making all notes visible...');
        setNotes(function (prev) { return prev.map(function (note, index) { return (__assign(__assign({}, note), { x: 200 + (index % 3) * 250, y: 200 + Math.floor(index / 3) * 200 // rows
         })); }); });
    };
    var toggleNightMode = function () {
        var newMode = !nightMode;
        setNightMode(newMode);
        localStorage.setItem('atem-night-mode', newMode.toString());
    };
    return ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
            height: '100vh',
            backgroundColor: nightMode ? '#0a0a0a' : '#fafafa',
            color: nightMode ? '#e8e8e8' : '#2c2c2c',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            overflow: 'hidden',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            fontWeight: '400',
            lineHeight: '1.6'
        } }, { children: [isLoading && ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: nightMode
                        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
                        : 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    opacity: isLoading ? 1 : 0,
                    transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                } }, { children: [(0, jsx_runtime_1.jsx)("div", __assign({ style: {
                            fontSize: '48px',
                            fontWeight: '600',
                            background: nightMode
                                ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            marginBottom: '24px',
                            animation: 'pulse 2s ease-in-out infinite'
                        } }, { children: "\u2728 Atem" }), void 0), (0, jsx_runtime_1.jsx)("div", __assign({ style: {
                            width: '60px',
                            height: '4px',
                            background: nightMode
                                ? 'rgba(255, 255, 255, 0.2)'
                                : 'rgba(0, 0, 0, 0.1)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            position: 'relative'
                        } }, { children: (0, jsx_runtime_1.jsx)("div", { style: {
                                width: '100%',
                                height: '100%',
                                background: nightMode
                                    ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)'
                                    : 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent)',
                                borderRadius: '2px',
                                animation: 'loading 1.5s ease-in-out infinite'
                            } }, void 0) }), void 0)] }), void 0)), (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                    position: 'fixed',
                    bottom: '24px',
                    left: '24px',
                    background: nightMode
                        ? 'rgba(20, 20, 20, 0.9)'
                        : 'rgba(255, 255, 255, 0.9)',
                    color: nightMode ? '#e8e8e8' : '#2c2c2c',
                    padding: devLogCollapsed ? '12px 16px' : '16px 20px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
                    zIndex: 9999,
                    cursor: 'pointer',
                    minWidth: devLogCollapsed ? 'auto' : '220px',
                    backdropFilter: 'blur(20px)',
                    border: nightMode
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                    boxShadow: nightMode
                        ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                        : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontWeight: '500'
                }, onClick: function () { return setDevLogCollapsed(!devLogCollapsed); } }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ style: { display: 'flex', alignItems: 'center', gap: '8px' } }, { children: [(0, jsx_runtime_1.jsx)("span", { children: "\uD83D\uDCCA" }, void 0), (0, jsx_runtime_1.jsx)("span", { children: devLogCollapsed ? 'DEV' : 'DEV LOG' }, void 0)] }), void 0), !devLogCollapsed && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { children: ["Notes: ", notes.length] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Writing: ", isWritingMode ? 'YES' : 'NO'] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Editing: ", editingNoteId || 'NONE'] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Modal: ", showModal ? 'OPEN' : 'CLOSED'] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Zoom: ", zoom.toFixed(1), "x"] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Dragging: ", draggedNote || 'NONE'] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Current Note: ", currentNote.length, " chars"] }, void 0), (0, jsx_runtime_1.jsxs)("div", { children: ["Recent ID: ", mostRecentNoteId || 'NONE'] }, void 0)] }, void 0))] }), void 0), showModal && isWritingMode ? ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: nightMode ? '#1a1a1a' : '#ffffff',
                    color: nightMode ? '#e8e8e8' : '#2c2c2c',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000,
                    borderRadius: '24px',
                    boxShadow: nightMode
                        ? '0 20px 60px rgba(0, 0, 0, 0.8)'
                        : '0 20px 60px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(20px)',
                    border: nightMode
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.05)',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                } }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: '#f8f9fa'
                        } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: goToBoard, style: {
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }, title: "Back to Board" }, { children: "\u2B05\uFE0F" }), void 0), (0, jsx_runtime_1.jsx)("div", __assign({ style: {
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#007AFF',
                                    letterSpacing: '0.5px'
                                } }, { children: "\u2728 Atem" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: handleSave, disabled: !currentNote.trim() || savingNote, style: {
                                    background: savingNote
                                        ? '#4A90E2'
                                        : (currentNote.trim() ? '#007AFF' : '#ccc'),
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: (!currentNote.trim() || savingNote) ? 'not-allowed' : 'pointer',
                                    padding: '12px 20px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    transform: savingNote ? 'scale(0.98)' : 'scale(1)',
                                    boxShadow: savingNote
                                        ? '0 4px 12px rgba(0, 122, 255, 0.3)'
                                        : '0 2px 8px rgba(0, 122, 255, 0.2)',
                                    justifyContent: 'center'
                                }, title: "Save" }, { children: "\uD83D\uDCBE" }), void 0)] }), void 0), (0, jsx_runtime_1.jsx)("textarea", { value: currentNote, onChange: function (e) {
                            console.log('📝 Text changed:', e.target.value);
                            setCurrentNote(e.target.value);
                            debouncedAutoSave();
                        }, placeholder: "\u2728 What's on your mind?", style: {
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            padding: '24px',
                            fontSize: '20px',
                            lineHeight: '1.7',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            resize: 'none',
                            backgroundColor: 'transparent',
                            color: nightMode ? '#e8e8e8' : '#2c2c2c',
                            fontWeight: '400',
                            letterSpacing: '-0.01em'
                        }, autoFocus: true }, void 0)] }), void 0)) : (
            /* Board View */
            (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column'
                } }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '24px 28px',
                            background: nightMode
                                ? 'rgba(15, 15, 15, 0.95)'
                                : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(20px)',
                            borderBottom: nightMode
                                ? '1px solid rgba(255, 255, 255, 0.1)'
                                : '1px solid rgba(0, 0, 0, 0.08)',
                            flexShrink: 0,
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                        } }, { children: [(0, jsx_runtime_1.jsx)("h1", __assign({ style: {
                                    margin: 0,
                                    fontSize: '28px',
                                    color: nightMode ? '#ffffff' : '#1a1a1a',
                                    fontWeight: '600',
                                    letterSpacing: '-0.02em',
                                    background: nightMode
                                        ? 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text'
                                } }, { children: "\u2728 Atem" }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: { display: 'flex', gap: '8px', alignItems: 'center' } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: zoomOut, style: {
                                            background: nightMode
                                                ? 'rgba(255, 255, 255, 0.1)'
                                                : 'rgba(0, 0, 0, 0.05)',
                                            color: nightMode ? '#ffffff' : '#333333',
                                            border: nightMode
                                                ? '1px solid rgba(255, 255, 255, 0.2)'
                                                : '1px solid rgba(0, 0, 0, 0.1)',
                                            borderRadius: '12px',
                                            padding: '12px 16px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            fontWeight: '500',
                                            backdropFilter: 'blur(10px)'
                                        }, title: "Zoom Out", onMouseEnter: function (e) {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.background = nightMode
                                                ? 'rgba(255, 255, 255, 0.2)'
                                                : 'rgba(0, 0, 0, 0.1)';
                                        }, onMouseLeave: function (e) {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.background = nightMode
                                                ? 'rgba(255, 255, 255, 0.1)'
                                                : 'rgba(0, 0, 0, 0.05)';
                                        } }, { children: "\uD83D\uDD0D\u2212" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: resetZoom, style: {
                                            background: '#f0f0f0',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }, title: "Reset Zoom" }, { children: "\uD83C\uDFE0" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: zoomIn, style: {
                                            background: '#f0f0f0',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }, title: "Zoom In" }, { children: "\uD83D\uDD0D+" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ "data-dev-menu": true, onClick: function () { return setShowDevMenu(!showDevMenu); }, style: {
                                            background: '#f0f0f0',
                                            color: '#333',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }, title: "Dev Tools" }, { children: "\u2699\uFE0F" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: toggleNightMode, style: {
                                            background: nightMode ? '#444' : '#f0f0f0',
                                            color: nightMode ? '#fff' : '#333',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 12px',
                                            fontSize: '16px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease'
                                        }, title: nightMode ? "Light Mode" : "Night Mode" }, { children: nightMode ? '☀️' : '🌙' }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: startWritingMode, style: {
                                            background: 'none',
                                            border: 'none',
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            padding: '8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }, title: "New Note" }, { children: "\u270F\uFE0F" }), void 0)] }), void 0)] }), void 0), showDevMenu && ((0, jsx_runtime_1.jsxs)("div", __assign({ "data-dev-menu": true, style: {
                            position: 'absolute',
                            top: '80px',
                            right: '20px',
                            background: nightMode ? '#2a2a2a' : 'white',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            padding: '12px',
                            zIndex: 1000,
                            minWidth: '200px'
                        } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: exportNotes, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    background: '#f0f0f0',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                } }, { children: "\uD83D\uDCE4 Export Notes" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: importNotes, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    background: '#f0f0f0',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                } }, { children: "\uD83D\uDCE5 Import Notes" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: makeAllNotesVisible, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    background: '#e3f2fd',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#1976d2'
                                } }, { children: "\uD83D\uDC41\uFE0F Show All Notes" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: clearBoard, style: {
                                    width: '100%',
                                    padding: '8px 12px',
                                    margin: '4px 0',
                                    background: '#ffebee',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#d32f2f'
                                } }, { children: "\uD83D\uDDD1\uFE0F Clear Board" }), void 0)] }), void 0)), (0, jsx_runtime_1.jsx)("div", __assign({ style: {
                            flex: 1,
                            overflow: 'hidden',
                            position: 'relative',
                            cursor: draggedNote ? 'grabbing' : 'default'
                        }, onMouseMove: handleDragMove, onTouchMove: function (e) {
                            e.preventDefault(); // Prevent scrolling
                            handleDragMove(e);
                        }, onMouseUp: handleDragEnd, onTouchEnd: handleDragEnd }, { children: notes.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                                textAlign: 'center',
                                padding: '80px 20px',
                                color: '#007AFF',
                                fontSize: '20px',
                                fontWeight: '500'
                            } }, { children: ["\u2728 Your thoughts await", (0, jsx_runtime_1.jsx)("br", {}, void 0), (0, jsx_runtime_1.jsx)("span", __assign({ style: { fontSize: '16px', color: '#666', marginTop: '10px', display: 'block' } }, { children: "Tap \u270F\uFE0F to start writing" }), void 0)] }), void 0)) : ((0, jsx_runtime_1.jsx)("div", __assign({ style: {
                                transform: "scale(" + zoom + ")",
                                transformOrigin: 'top left',
                                position: 'relative',
                                minWidth: '3000px',
                                minHeight: '3000px',
                                transition: 'transform 0.2s ease'
                            } }, { children: notes.map(function (note) {
                                console.log('🎨 Rendering note:', note.id);
                                return ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                                        position: 'absolute',
                                        left: note.x,
                                        top: note.y,
                                        backgroundColor: nightMode ? '#1a1a1a' : '#ffffff',
                                        color: nightMode ? '#e8e8e8' : '#2c2c2c',
                                        padding: '24px',
                                        borderRadius: '20px',
                                        boxShadow: mostRecentNoteId === note.id
                                            ? nightMode
                                                ? '0 8px 32px rgba(255,193,7,0.4), 0 0 0 1px rgba(255,193,7,0.2)'
                                                : '0 8px 32px rgba(255,193,7,0.3), 0 0 0 1px rgba(255,193,7,0.2)'
                                            : nightMode
                                                ? '0 4px 20px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                                                : '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                                        border: mostRecentNoteId === note.id
                                            ? '2px solid #ffc107'
                                            : '1px solid transparent',
                                        backdropFilter: 'blur(10px)',
                                        cursor: draggedNote === note.id ? 'grabbing' : 'grab',
                                        transition: draggedNote === note.id ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        minHeight: '120px',
                                        width: '280px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        transform: draggedNote === note.id ? 'scale(1.02) rotate(1deg)' : 'scale(1)',
                                        filter: draggedNote === note.id ? 'brightness(1.05)' : 'brightness(1)',
                                        userSelect: 'none',
                                        zIndex: draggedNote === note.id ? 1000 : 1
                                    }, onMouseDown: function (e) { return handleDragStart(e, note.id); }, onTouchStart: function (e) { return handleDragStart(e, note.id); }, onClick: function (e) {
                                        // Only edit if we didn't just drag
                                        if (!hasDragged && !draggedNote) {
                                            editNote(note);
                                        }
                                    } }, { children: [(0, jsx_runtime_1.jsx)("p", __assign({ style: {
                                                margin: '0 0 12px 0',
                                                fontSize: '14px',
                                                lineHeight: '1.4',
                                                color: nightMode ? '#ffffff' : '#333',
                                                overflow: 'hidden',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 4,
                                                WebkitBoxOrient: 'vertical'
                                            } }, { children: note.text }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginTop: 'auto'
                                            } }, { children: [(0, jsx_runtime_1.jsx)("div", __assign({ style: {
                                                        fontSize: '11px',
                                                        color: '#888'
                                                    } }, { children: new Date(note.createdAt).toLocaleDateString() }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function (e) {
                                                        e.stopPropagation();
                                                        deleteNote(note.id);
                                                    }, style: {
                                                        background: 'none',
                                                        border: 'none',
                                                        fontSize: '14px',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        borderRadius: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }, title: "Delete" }, { children: "\uD83D\uDDD1\uFE0F" }), void 0)] }), void 0)] }), note.id));
                            }) }), void 0)) }), void 0)] }), void 0)), showModal && !isWritingMode && editingNoteId && ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: nightMode ? '#2a2a2a' : 'white',
                    color: nightMode ? '#ffffff' : '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1000
                } }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: '1px solid #e0e0e0',
                            backgroundColor: '#f8f9fa'
                        } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: goToBoard, style: {
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }, title: "Back to Board" }, { children: "\u2B05\uFE0F" }), void 0), (0, jsx_runtime_1.jsx)("div", __assign({ style: {
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#007AFF',
                                    letterSpacing: '0.5px'
                                } }, { children: "\u270F\uFE0F Edit Note" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: handleSave, style: {
                                    background: '#007AFF',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }, title: "Save" }, { children: "\uD83D\uDCBE" }), void 0)] }), void 0), (0, jsx_runtime_1.jsx)("textarea", { value: currentNote, onChange: function (e) {
                            setCurrentNote(e.target.value);
                        }, placeholder: "\u2728 Edit your thoughts...", style: {
                            flex: 1,
                            border: 'none',
                            outline: 'none',
                            padding: '24px',
                            fontSize: '20px',
                            lineHeight: '1.7',
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            resize: 'none',
                            backgroundColor: 'transparent',
                            color: nightMode ? '#e8e8e8' : '#2c2c2c',
                            fontWeight: '400',
                            letterSpacing: '-0.01em'
                        }, autoFocus: true }, void 0)] }), void 0))] }), void 0));
}
exports["default"] = AppBulletproof;
