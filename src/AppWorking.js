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
require("./styles.css");
function AppWorking() {
    console.log('🚀 AppWorking component loaded!');
    var _a = (0, react_1.useState)([]), notes = _a[0], setNotes = _a[1];
    var _b = (0, react_1.useState)(''), currentNote = _b[0], setCurrentNote = _b[1];
    var _c = (0, react_1.useState)(false), showModal = _c[0], setShowModal = _c[1];
    var _d = (0, react_1.useState)(null), editingNoteId = _d[0], setEditingNoteId = _d[1];
    // Load notes from localStorage on app start
    (0, react_1.useEffect)(function () {
        var savedNotes = localStorage.getItem('atem-notes');
        if (savedNotes) {
            try {
                setNotes(JSON.parse(savedNotes));
            }
            catch (error) {
                console.error('Failed to load notes:', error);
            }
        }
    }, []);
    // Auto-save notes to localStorage whenever notes change
    (0, react_1.useEffect)(function () {
        if (notes.length > 0) {
            localStorage.setItem('atem-notes', JSON.stringify(notes));
        }
    }, [notes]);
    var addNote = function () {
        console.log('💾 addNote called:', { currentNote: currentNote, editingNoteId: editingNoteId, notesLength: notes.length });
        if (currentNote.trim()) {
            var newNote_1 = {
                id: Date.now().toString(),
                text: currentNote.trim(),
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            console.log('📝 Creating note:', newNote_1);
            if (editingNoteId) {
                // Update existing note
                console.log('✏️ Updating existing note:', editingNoteId);
                setNotes(notes.map(function (note) {
                    return note.id === editingNoteId
                        ? __assign(__assign({}, note), { text: currentNote.trim(), updatedAt: Date.now() }) : note;
                }));
            }
            else {
                // Add new note
                console.log('➕ Adding new note');
                setNotes(function (prevNotes) {
                    var newNotes = __spreadArray(__spreadArray([], prevNotes, true), [newNote_1], false);
                    console.log('📊 Notes after add:', newNotes.length);
                    return newNotes;
                });
            }
            setCurrentNote('');
            setEditingNoteId(null);
            setShowModal(false);
            console.log('✅ Note saved successfully');
        }
        else {
            console.log('❌ No text to save');
            alert('Please enter some text before saving');
        }
    };
    var editNote = function (note) {
        console.log('✏️ Edit note:', note);
        setCurrentNote(note.text);
        setEditingNoteId(note.id);
        setShowModal(true);
    };
    var deleteNote = function (noteId) {
        console.log('🗑️ Delete note:', noteId);
        if (confirm('Delete this note?')) {
            setNotes(notes.filter(function (note) { return note.id !== noteId; }));
            console.log('✅ Note deleted');
        }
    };
    var exportNotes = function () {
        console.log('📤 Export notes:', notes.length, 'notes');
        var dataStr = JSON.stringify(notes, null, 2);
        var dataBlob = new Blob([dataStr], { type: 'application/json' });
        var url = URL.createObjectURL(dataBlob);
        var link = document.createElement('a');
        link.href = url;
        link.download = "atem-notes-" + new Date().toISOString().split('T')[0] + ".json";
        link.click();
        URL.revokeObjectURL(url);
        console.log('✅ Export completed');
    };
    var clearAllNotes = function () {
        console.log('🗑️ Clear all notes');
        if (confirm('Delete all notes? This cannot be undone.')) {
            setNotes([]);
            localStorage.removeItem('atem-notes');
            console.log('✅ All notes cleared');
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
            padding: '16px',
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        } }, { children: [(0, jsx_runtime_1.jsx)("div", __assign({ style: {
                    position: 'fixed',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    zIndex: 9999
                } }, { children: "\u2705 AppWorking v1.0" }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #e9ecef'
                } }, { children: [(0, jsx_runtime_1.jsx)("h1", __assign({ style: {
                            margin: 0,
                            fontSize: '24px',
                            fontWeight: '600',
                            color: '#212529'
                        } }, { children: "Atem" }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: { display: 'flex', gap: '8px' } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: exportNotes, style: {
                                    padding: '8px 12px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }, title: "Export Notes" }, { children: "\uD83D\uDCE4" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: clearAllNotes, style: {
                                    padding: '8px 12px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                }, title: "Clear All" }, { children: "\uD83D\uDDD1\uFE0F" }), void 0)] }), void 0)] }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                    setCurrentNote('');
                    setEditingNoteId(null);
                    setShowModal(true);
                }, style: {
                    width: '100%',
                    padding: '16px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0,123,255,0.3)',
                    transition: 'all 0.2s ease'
                }, onMouseDown: function (e) {
                    e.currentTarget.style.transform = 'scale(0.98)';
                }, onMouseUp: function (e) {
                    e.currentTarget.style.transform = 'scale(1)';
                }, onMouseLeave: function (e) {
                    e.currentTarget.style.transform = 'scale(1)';
                } }, { children: "\u270F\uFE0F New Thought" }), void 0), (0, jsx_runtime_1.jsx)("div", __assign({ style: { display: 'flex', flexDirection: 'column', gap: '12px' } }, { children: notes.length === 0 ? ((0, jsx_runtime_1.jsx)("div", __assign({ style: {
                        textAlign: 'center',
                        padding: '48px 20px',
                        color: '#6c757d',
                        fontSize: '16px'
                    } }, { children: "No thoughts yet. Tap \"New Thought\" to start!" }), void 0)) : (notes.map(function (note) { return ((0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                        backgroundColor: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e9ecef',
                        position: 'relative'
                    } }, { children: [(0, jsx_runtime_1.jsx)("div", __assign({ style: {
                                fontSize: '15px',
                                lineHeight: '1.5',
                                color: '#212529',
                                marginBottom: '8px',
                                wordBreak: 'break-word'
                            } }, { children: note.text }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: '#6c757d'
                            } }, { children: [(0, jsx_runtime_1.jsxs)("span", { children: [new Date(note.updatedAt).toLocaleDateString(), " ", new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] }, void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: { display: 'flex', gap: '8px' } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () { return editNote(note); }, style: {
                                                padding: '4px 8px',
                                                backgroundColor: '#e9ecef',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            } }, { children: "\u270F\uFE0F" }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () { return deleteNote(note.id); }, style: {
                                                padding: '4px 8px',
                                                backgroundColor: '#f8d7da',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                color: '#721c24'
                                            } }, { children: "\uD83D\uDDD1\uFE0F" }), void 0)] }), void 0)] }), void 0)] }), note.id)); })) }), void 0), showModal && ((0, jsx_runtime_1.jsx)("div", __assign({ style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px'
                }, onClick: function () {
                    setCurrentNote('');
                    setEditingNoteId(null);
                    setShowModal(false);
                } }, { children: (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                        backgroundColor: 'white',
                        borderRadius: '16px 16px 0 0',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
                    }, onClick: function (e) { return e.stopPropagation(); } }, { children: [(0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '20px 20px 0',
                                borderBottom: '1px solid #e9ecef',
                                marginBottom: '16px'
                            } }, { children: [(0, jsx_runtime_1.jsx)("h3", __assign({ style: {
                                        margin: 0,
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        color: '#212529'
                                    } }, { children: editingNoteId ? 'Edit Thought' : 'New Thought' }), void 0), (0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                                        setCurrentNote('');
                                        setEditingNoteId(null);
                                        setShowModal(false);
                                    }, style: {
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '20px',
                                        cursor: 'pointer',
                                        color: '#6c757d',
                                        padding: '4px',
                                        borderRadius: '4px'
                                    } }, { children: "\u2715" }), void 0)] }), void 0), (0, jsx_runtime_1.jsx)("div", __assign({ style: { flex: 1, padding: '0 20px', overflow: 'hidden' } }, { children: (0, jsx_runtime_1.jsx)("textarea", { value: currentNote, onChange: function (e) { return setCurrentNote(e.target.value); }, placeholder: editingNoteId ? "Edit your thought..." : "Start writing your thoughts...", style: {
                                    width: '100%',
                                    height: '300px',
                                    padding: '16px',
                                    border: '2px solid #e9ecef',
                                    borderRadius: '12px',
                                    fontSize: '16px',
                                    fontFamily: 'inherit',
                                    resize: 'none',
                                    outline: 'none',
                                    backgroundColor: '#fafafa',
                                    boxSizing: 'border-box',
                                    lineHeight: '1.5'
                                }, autoFocus: true, onFocus: function (e) {
                                    e.target.style.borderColor = '#007bff';
                                    e.target.style.backgroundColor = 'white';
                                }, onBlur: function (e) {
                                    e.target.style.borderColor = '#e9ecef';
                                    e.target.style.backgroundColor = '#fafafa';
                                } }, void 0) }), void 0), (0, jsx_runtime_1.jsxs)("div", __assign({ style: {
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                padding: '20px',
                                borderTop: '1px solid #e9ecef',
                                marginTop: '16px'
                            } }, { children: [(0, jsx_runtime_1.jsx)("button", __assign({ onClick: function () {
                                        setCurrentNote('');
                                        setEditingNoteId(null);
                                        setShowModal(false);
                                    }, style: {
                                        padding: '12px 24px',
                                        backgroundColor: '#f8f9fa',
                                        color: '#6c757d',
                                        border: '1px solid #dee2e6',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    } }, { children: "Cancel" }), void 0), (0, jsx_runtime_1.jsxs)("button", __assign({ onClick: addNote, disabled: !currentNote.trim(), style: {
                                        padding: '12px 24px',
                                        backgroundColor: currentNote.trim() ? '#007bff' : '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: currentNote.trim() ? 'pointer' : 'not-allowed',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        boxShadow: currentNote.trim() ? '0 2px 4px rgba(0,123,255,0.3)' : 'none',
                                        opacity: currentNote.trim() ? 1 : 0.6
                                    } }, { children: ["\uD83D\uDCBE ", editingNoteId ? 'Update' : 'Save'] }), void 0)] }), void 0)] }), void 0) }), void 0))] }), void 0));
}
exports["default"] = AppWorking;
