import React, { useState, useEffect } from 'react';

interface Note {
  id: string;
  text: string;
  createdAt: number;
  x: number;
  y: number;
}

function AppBulletproof() {
  console.log('🚀 Apple Notes Style Atem loaded!');
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [isWritingMode, setIsWritingMode] = useState(true);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<number | null>(null);
  
  // Simple board state
  const [zoom, setZoom] = useState(1);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [mostRecentNoteId, setMostRecentNoteId] = useState<string | null>(null);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [devLogCollapsed, setDevLogCollapsed] = useState(false);
  const [nightMode, setNightMode] = useState(() => {
    const saved = localStorage.getItem('atem-night-mode');
    return saved === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);

  // Load notes on start and auto-open writing mode
  useEffect(() => {
    try {
      const saved = localStorage.getItem('atem-notes');
      console.log('🔍 localStorage content:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('📂 Parsed notes:', parsed);
        setNotes(parsed);
        console.log('📝 Loaded notes:', parsed.length);
      } else {
        console.log('📂 No saved notes found in localStorage');
      }
    } catch (error) {
      console.error('❌ Failed to load notes:', error);
    }
    
    // Auto-open writing mode on start (like Apple Notes)
    console.log('📖 Auto-opening writing mode');
    
    // Premium loading sequence
    setTimeout(() => {
      setIsLoading(false);
      setShowModal(true);
    }, 800);

    // Prevent pull-to-refresh and scroll on mobile
    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent any scrolling during drag
    const preventScroll = (e: TouchEvent) => {
      e.preventDefault();
    };

    document.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventPullToRefresh, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('touchstart', preventPullToRefresh);
      document.removeEventListener('touchmove', preventPullToRefresh);
      document.removeEventListener('touchmove', preventScroll);
    };
  }, []);

  // Close dev menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showDevMenu && !(e.target as Element).closest('[data-dev-menu]')) {
        setShowDevMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDevMenu]);

  // Save notes when they change
  useEffect(() => {
    console.log('🔄 Notes changed:', notes.length, notes);
    if (notes.length > 0) {
      try {
        localStorage.setItem('atem-notes', JSON.stringify(notes));
        console.log('💾 Saved notes to localStorage:', notes.length);
      } catch (error) {
        console.error('❌ Failed to save notes:', error);
      }
    }
  }, [notes]);

  // Auto-save for writing mode (like Apple Notes)
  const handleAutoSave = () => {
    if (isWritingMode && currentNote.trim()) {
      console.log('🔄 Auto-saving entry...');
      // Don't auto-save to notes array, just keep it in currentNote
      // The user will manually save when they want to
    }
  };

  // Debounced auto-save
  const debouncedAutoSave = () => {
    if (autoSaveTimeout) {
      window.clearTimeout(autoSaveTimeout);
    }
    const timeout = window.setTimeout(handleAutoSave, 2000); // Auto-save after 2 seconds of no typing
    setAutoSaveTimeout(timeout);
  };

  const handleSave = () => {
    console.log('💾 SAVE BUTTON CLICKED!', { currentNote, editingNoteId, isWritingMode, notesLength: notes.length });
    setSavingNote(true);
    
    if (!currentNote.trim()) {
      alert('Please enter some text first!');
      setSavingNote(false);
      return;
    }

    if (editingNoteId) {
      // Update existing note
      console.log('✏️ Updating existing note:', editingNoteId);
      setNotes(prev => {
        const updated = prev.map(note => 
          note.id === editingNoteId 
            ? { ...note, text: currentNote.trim() }
            : note
        );
        console.log('✅ Note updated:', editingNoteId);
        return updated;
      });
    } else if (isWritingMode) {
      // Writing mode - save as new note
      const newNote: Note = {
        id: Date.now().toString(),
        text: currentNote.trim(),
        createdAt: Date.now(),
        x: 200 + (Math.random() - 0.5) * 100, // Visible area
        y: 200 + (Math.random() - 0.5) * 100
      };
      
      console.log('📖 Creating new note:', newNote);
      setNotes(prev => {
        const updated = [...prev, newNote];
        setMostRecentNoteId(newNote.id);
        console.log('✅ Note saved');
        return updated;
      });
    } else {
      // Create new regular note
      const newNote: Note = {
        id: Date.now().toString(),
        text: currentNote.trim(),
        createdAt: Date.now(),
        x: 200 + (Math.random() - 0.5) * 100, // Visible area
        y: 200 + (Math.random() - 0.5) * 100
      };

      console.log('📝 Creating new note:', newNote);
      setNotes(prev => {
        const updated = [...prev, newNote];
        setMostRecentNoteId(newNote.id);
        console.log('✅ Notes updated:', updated.length);
        return updated;
      });
    }

    // Premium save animation
    setTimeout(() => {
      setCurrentNote('');
      setEditingNoteId(null);
      setIsWritingMode(false);
      setShowModal(false);
      setSavingNote(false);
      console.log('🎉 SAVE COMPLETE!');
    }, 400);
  };

  const startWritingMode = () => {
    console.log('📖 Starting writing mode');
    setIsWritingMode(true);
    setCurrentNote('');
    setEditingNoteId(null);
    setShowModal(true);
  };

  const goToBoard = () => {
    console.log('📋 Going to board');
    
      // Auto-save current note when going back (like Apple Notes)
      if (currentNote.trim()) {
        console.log('💾 Auto-saving before going to board...');
        const newNote: Note = {
          id: Date.now().toString(),
          text: currentNote.trim(),
          createdAt: Date.now(),
          x: 200 + (Math.random() - 0.5) * 100, // Visible area
          y: 200 + (Math.random() - 0.5) * 100
        };
        
        setNotes(prev => [...prev, newNote]);
        setMostRecentNoteId(newNote.id);
        console.log('✅ Note auto-saved');
      }
    
    setIsWritingMode(false);
    setCurrentNote('');
    setEditingNoteId(null);
    setShowModal(false);
  };

  const editNote = (note: Note) => {
    console.log('✏️ Opening modal to edit note:', note.id);
    setCurrentNote(note.text);
    setEditingNoteId(note.id);
    setShowModal(true);
  };

  const deleteNote = (noteId: string) => {
    console.log('🗑️ Deleting note:', noteId);
    if (confirm('Delete this note?')) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      console.log('✅ Note deleted:', noteId);
    }
  };

  const closeModal = () => {
    console.log('❌ Closing modal');
    setCurrentNote('');
    setEditingNoteId(null);
    setShowModal(false);
  };

  // Simple drag handlers with threshold
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, noteId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDragStartPos({ x: clientX, y: clientY });
    setDraggedNote(noteId);
    setHasDragged(false);
    setDragOffset({
      x: clientX - (note.x * zoom),
      y: clientY - (note.y * zoom)
    });
    
    // Page is already non-scrollable, no need to prevent overflow
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!draggedNote) return;
    
    e.preventDefault(); // Prevent page scrolling and other default behaviors
    e.stopPropagation(); // Stop event bubbling
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    // Check if we've moved enough to start dragging
    const deltaX = Math.abs(clientX - dragStartPos.x);
    const deltaY = Math.abs(clientY - dragStartPos.y);
    const threshold = 5; // 5px threshold
    
    if (deltaX > threshold || deltaY > threshold) {
      setHasDragged(true);
    }
    
    if (hasDragged || deltaX > threshold || deltaY > threshold) {
      const newX = (clientX - dragOffset.x) / zoom;
      const newY = (clientY - dragOffset.y) / zoom;
      
      setNotes(prev => prev.map(note => 
        note.id === draggedNote 
          ? { ...note, x: newX, y: newY }
          : note
      ));
    }
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
    setHasDragged(false);
    
    // Page is non-scrollable, no need to restore
  };

  // Zoom controls
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const resetZoom = () => setZoom(1);

  // Dev tools
  const exportNotes = () => {
    try {
      const dataStr = JSON.stringify(notes, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `atem-notes-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      console.log('📤 Notes exported');
    } catch (error) {
      console.error('❌ Export failed:', error);
    }
  };

  const importNotes = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target?.result as string);
            if (Array.isArray(imported)) {
              setNotes(imported);
              console.log('📥 Notes imported:', imported.length);
            }
          } catch (error) {
            console.error('❌ Import failed:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const clearBoard = () => {
    if (confirm('Clear all notes? This cannot be undone.')) {
      setNotes([]);
      setMostRecentNoteId(null);
      console.log('🗑️ Board cleared');
    }
  };

  const makeAllNotesVisible = () => {
    console.log('👁️ Making all notes visible...');
    setNotes(prev => prev.map((note, index) => ({
      ...note,
      x: 200 + (index % 3) * 250, // 3 columns
      y: 200 + Math.floor(index / 3) * 200 // rows
    })));
  };

  const toggleNightMode = () => {
    const newMode = !nightMode;
    setNightMode(newMode);
    localStorage.setItem('atem-night-mode', newMode.toString());
  };

  return (
    <div style={{ 
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
    }}>
      {/* Premium Loading Screen */}
      {isLoading && (
        <div style={{
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
        }}>
          <div style={{
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
          }}>
            ✨ Atem
          </div>
          <div style={{
            width: '60px',
            height: '4px',
            background: nightMode 
              ? 'rgba(255, 255, 255, 0.2)' 
              : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: nightMode 
                ? 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)' 
                : 'linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.8), transparent)',
              borderRadius: '2px',
              animation: 'loading 1.5s ease-in-out infinite'
            }} />
          </div>
        </div>
      )}
      {/* Dev Log */}
      <div style={{
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
      }}
      onClick={() => setDevLogCollapsed(!devLogCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📊</span>
          <span>{devLogCollapsed ? 'DEV' : 'DEV LOG'}</span>
        </div>
        {!devLogCollapsed && (
          <>
            <div>Notes: {notes.length}</div>
            <div>Writing: {isWritingMode ? 'YES' : 'NO'}</div>
            <div>Editing: {editingNoteId || 'NONE'}</div>
            <div>Modal: {showModal ? 'OPEN' : 'CLOSED'}</div>
            <div>Zoom: {zoom.toFixed(1)}x</div>
            <div>Dragging: {draggedNote || 'NONE'}</div>
            <div>Current Note: {currentNote.length} chars</div>
            <div>Recent ID: {mostRecentNoteId || 'NONE'}</div>
          </>
        )}
      </div>

      {/* Full Screen Writing Mode */}
      {showModal && isWritingMode ? (
        <div style={{
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
        }}>
          {/* Top Bar - Icon Only */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={goToBoard}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Back to Board"
            >
              ⬅️
            </button>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#007AFF',
              letterSpacing: '0.5px'
            }}>
              ✨ Atem
            </div>
            <button
              onClick={handleSave}
              disabled={!currentNote.trim() || savingNote}
              style={{
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
              }}
              title="Save"
            >
              💾
            </button>
          </div>

          {/* Full Screen Text Area */}
          <textarea
            value={currentNote}
            onChange={(e) => {
              console.log('📝 Text changed:', e.target.value);
              setCurrentNote(e.target.value);
              debouncedAutoSave();
            }}
            placeholder="✨ What's on your mind?"
            style={{
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
            }}
            autoFocus
          />
        </div>
      ) : (
        /* Board View */
        <div style={{ 
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header - Beautiful & Clean */}
          <div style={{ 
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
          }}>
            <h1 style={{ 
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
            }}>
              ✨ Atem
            </h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Zoom Controls */}
              <button
                onClick={zoomOut}
                style={{
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
                }}
                title="Zoom Out"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.background = nightMode 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = nightMode 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)';
                }}
              >
                🔍−
              </button>
              <button
                onClick={resetZoom}
                style={{
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Reset Zoom"
              >
                🏠
              </button>
              <button
                onClick={zoomIn}
                style={{
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Zoom In"
              >
                🔍+
              </button>
              
              {/* Dev Menu Button */}
              <button
                data-dev-menu
                onClick={() => setShowDevMenu(!showDevMenu)}
                style={{
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title="Dev Tools"
              >
                ⚙️
              </button>
              
              {/* Night Mode Button */}
              <button
                onClick={toggleNightMode}
                style={{
                  background: nightMode ? '#444' : '#f0f0f0',
                  color: nightMode ? '#fff' : '#333',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                title={nightMode ? "Light Mode" : "Night Mode"}
              >
                {nightMode ? '☀️' : '🌙'}
              </button>
              
              {/* New Note Button */}
              <button
                onClick={startWritingMode}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="New Note"
              >
                ✏️
              </button>
            </div>
          </div>

          {/* Dev Menu Dropdown */}
          {showDevMenu && (
            <div 
              data-dev-menu
              style={{
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
              }}>
              <button
                onClick={exportNotes}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📤 Export Notes
              </button>
              <button
                onClick={importNotes}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  margin: '4px 0',
                  background: '#f0f0f0',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📥 Import Notes
              </button>
              <button
                onClick={makeAllNotesVisible}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  margin: '4px 0',
                  background: '#e3f2fd',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#1976d2'
                }}
              >
                👁️ Show All Notes
              </button>
              <button
                onClick={clearBoard}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  margin: '4px 0',
                  background: '#ffebee',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#d32f2f'
                }}
              >
                🗑️ Clear Board
              </button>
            </div>
          )}

          {/* Simple Board Canvas */}
          <div 
            style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              cursor: draggedNote ? 'grabbing' : 'default'
            }}
            onMouseMove={handleDragMove}
            onTouchMove={(e) => {
              e.preventDefault(); // Prevent scrolling
              handleDragMove(e);
            }}
            onMouseUp={handleDragEnd}
            onTouchEnd={handleDragEnd}
          >
            {notes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '80px 20px',
                color: '#007AFF',
                fontSize: '20px',
                fontWeight: '500'
              }}>
                ✨ Your thoughts await<br/>
                <span style={{ fontSize: '16px', color: '#666', marginTop: '10px', display: 'block' }}>
                  Tap ✏️ to start writing
                </span>
              </div>
            ) : (
              <div style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                position: 'relative',
                minWidth: '3000px',
                minHeight: '3000px',
                transition: 'transform 0.2s ease'
              }}>
                {notes.map((note) => {
                  console.log('🎨 Rendering note:', note.id);
                  return (
                  <div
                    key={note.id}
                    style={{
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
                    }}
                    onMouseDown={(e) => handleDragStart(e, note.id)}
                    onTouchStart={(e) => handleDragStart(e, note.id)}
                    onClick={(e) => {
                      // Only edit if we didn't just drag
                      if (!hasDragged && !draggedNote) {
                        editNote(note);
                      }
                    }}
                  >
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      fontSize: '14px', 
                      lineHeight: '1.4',
                      color: nightMode ? '#ffffff' : '#333',
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 4,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {note.text}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: 'auto'
                    }}>
                      <div style={{
                        fontSize: '11px',
                        color: '#888'
                      }}>
                        {new Date(note.createdAt).toLocaleDateString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNote(note.id);
                        }}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (for editing existing notes) */}
      {showModal && !isWritingMode && editingNoteId && (
        <div
          style={{
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
          }}
        >
          {/* Top Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f8f9fa'
          }}>
            <button
              onClick={goToBoard}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Back to Board"
            >
              ⬅️
            </button>
            <div style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#007AFF',
              letterSpacing: '0.5px'
            }}>
              ✏️ Edit Note
            </div>
            <button
              onClick={handleSave}
              style={{
                background: '#007AFF',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Save"
            >
              💾
            </button>
          </div>

          {/* Text Area */}
          <textarea
            value={currentNote}
            onChange={(e) => {
              setCurrentNote(e.target.value);
            }}
            placeholder="✨ Edit your thoughts..."
            style={{
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
            }}
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

export default AppBulletproof;
