import React, { useState, useEffect } from 'react';
import './styles.css';

// Types for better structure
interface Note {
  id: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

function AppWorking() {
  console.log('🚀 AppWorking component loaded!');
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Load notes from localStorage on app start
  useEffect(() => {
    const savedNotes = localStorage.getItem('atem-notes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (error) {
        console.error('Failed to load notes:', error);
      }
    }
  }, []);

  // Auto-save notes to localStorage whenever notes change
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('atem-notes', JSON.stringify(notes));
    }
  }, [notes]);

  const addNote = () => {
    console.log('💾 addNote called:', { currentNote, editingNoteId, notesLength: notes.length });
    
    if (currentNote.trim()) {
      const newNote: Note = {
        id: Date.now().toString(),
        text: currentNote.trim(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      console.log('📝 Creating note:', newNote);
      
      if (editingNoteId) {
        // Update existing note
        console.log('✏️ Updating existing note:', editingNoteId);
        setNotes(notes.map(note => 
          note.id === editingNoteId 
            ? { ...note, text: currentNote.trim(), updatedAt: Date.now() }
            : note
        ));
      } else {
        // Add new note
        console.log('➕ Adding new note');
        setNotes(prevNotes => {
          const newNotes = [...prevNotes, newNote];
          console.log('📊 Notes after add:', newNotes.length);
          return newNotes;
        });
      }
      
      setCurrentNote('');
      setEditingNoteId(null);
      setShowModal(false);
      console.log('✅ Note saved successfully');
    } else {
      console.log('❌ No text to save');
      alert('Please enter some text before saving');
    }
  };

  const editNote = (note: Note) => {
    console.log('✏️ Edit note:', note);
    setCurrentNote(note.text);
    setEditingNoteId(note.id);
    setShowModal(true);
  };

  const deleteNote = (noteId: string) => {
    console.log('🗑️ Delete note:', noteId);
    if (confirm('Delete this note?')) {
      setNotes(notes.filter(note => note.id !== noteId));
      console.log('✅ Note deleted');
    }
  };

  const exportNotes = () => {
    console.log('📤 Export notes:', notes.length, 'notes');
    const dataStr = JSON.stringify(notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atem-notes-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    console.log('✅ Export completed');
  };

  const clearAllNotes = () => {
    console.log('🗑️ Clear all notes');
    if (confirm('Delete all notes? This cannot be undone.')) {
      setNotes([]);
      localStorage.removeItem('atem-notes');
      console.log('✅ All notes cleared');
    }
  };

  return (
    <div style={{ 
      padding: '16px', 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* DEBUG: This proves AppWorking.tsx is loading */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: '#28a745',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        zIndex: 9999
      }}>
        ✅ AppWorking v1.0
      </div>
      
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e9ecef'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: '600',
          color: '#212529'
        }}>
          Atem
        </h1>
        
        {/* Dev Tools */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={exportNotes}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Export Notes"
          >
            📤
          </button>
          <button 
            onClick={clearAllNotes}
            style={{ 
              padding: '8px 12px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
            title="Clear All"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* New Note Button */}
      <button 
        onClick={() => {
          setCurrentNote('');
          setEditingNoteId(null);
          setShowModal(true);
        }}
        style={{ 
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
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'scale(0.98)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ✏️ New Thought
      </button>

      {/* Notes List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 20px',
            color: '#6c757d',
            fontSize: '16px'
          }}>
            No thoughts yet. Tap "New Thought" to start!
          </div>
        ) : (
          notes.map((note) => (
            <div 
              key={note.id}
              style={{
                backgroundColor: 'white',
                padding: '16px',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e9ecef',
                position: 'relative'
              }}
            >
              <div style={{
                fontSize: '15px',
                lineHeight: '1.5',
                color: '#212529',
                marginBottom: '8px',
                wordBreak: 'break-word'
              }}>
                {note.text}
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '12px',
                color: '#6c757d'
              }}>
                <span>
                  {new Date(note.updatedAt).toLocaleDateString()} {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => editNote(note)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#e9ecef',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteNote(note.id)}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#f8d7da',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: '#721c24'
                    }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          style={{
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
          }}
          onClick={() => {
            setCurrentNote('');
            setEditingNoteId(null);
            setShowModal(false);
          }}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px 16px 0 0',
              width: '100%',
              maxWidth: '500px',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px 20px 0',
              borderBottom: '1px solid #e9ecef',
              marginBottom: '16px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: '600',
                color: '#212529'
              }}>
                {editingNoteId ? 'Edit Thought' : 'New Thought'}
              </h3>
              <button
                onClick={() => {
                  setCurrentNote('');
                  setEditingNoteId(null);
                  setShowModal(false);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#6c757d',
                  padding: '4px',
                  borderRadius: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, padding: '0 20px', overflow: 'hidden' }}>
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder={editingNoteId ? "Edit your thought..." : "Start writing your thoughts..."}
                style={{
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
                }}
                autoFocus
                onFocus={(e) => {
                  e.target.style.borderColor = '#007bff';
                  e.target.style.backgroundColor = 'white';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e9ecef';
                  e.target.style.backgroundColor = '#fafafa';
                }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e9ecef',
              marginTop: '16px'
            }}>
              <button 
                onClick={() => {
                  setCurrentNote('');
                  setEditingNoteId(null);
                  setShowModal(false);
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f8f9fa',
                  color: '#6c757d',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button 
                onClick={addNote}
                disabled={!currentNote.trim()}
                style={{
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
                }}
              >
                💾 {editingNoteId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppWorking;
