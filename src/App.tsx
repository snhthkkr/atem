// ATEM 0.00.015 — Event-Controlled Board Logic
import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import "./styles.css";

interface Thought {
  id: string;
  text: string;
  x: number;
  y: number;
  lastTouched: number;
  createdAt: number;
  updatedAt: number;
  version: number; // Track how many times it's been edited
  wordCount?: number; // Auto-calculated
  characterCount?: number; // Auto-calculated
}

interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: number;
}

// Domain events — single source of truth for all state transitions
type DomainEvent =
  | { type: "createThought"; id: string; x: number; y: number; text?: string; at?: number }
  | { type: "updateText"; id: string; text: string; at?: number }
  | { type: "moveThought"; id: string; x: number; y: number; at?: number }
  | { type: "deleteThought"; id: string; at?: number }
  | { type: "createLink"; id: string; sourceId: string; targetId: string; at?: number }
  | { type: "deleteLink"; id: string; at?: number };

type AnyEvent = DomainEvent | { type: "__reset__"; payload: Thought[] };

interface AppState {
  thoughts: Thought[];
  events: DomainEvent[]; // append-only for now; persisted
  cursor: number; // number of events applied
  links: Link[];
}

function reduceThoughts(prev: Thought[], event: DomainEvent): Thought[] {
  switch (event.type) {
    case "createThought": {
      // Check if thought already exists
      if (prev.some(t => t.id === event.id)) {
        console.warn('Duplicate thought creation prevented:', event.id);
        return prev;
      }
      
      const now = event.at || Date.now();
      const text = event.text || '';
      const wordCount = text.trim().split(/\s+/).length;
      const characterCount = text.length;
      
      return [
        ...prev,
        {
          id: event.id,
          text,
          x: event.x,
          y: event.y,
          lastTouched: now,
          createdAt: now,
          updatedAt: now,
          version: 1,
          wordCount,
          characterCount,
        },
      ];
    }
    case "updateText": {
      return prev.map((thought) =>
        thought.id === event.id
          ? {
              ...thought,
              text: event.text,
              lastTouched: event.at || Date.now(),
              updatedAt: event.at || Date.now(),
              version: thought.version + 1,
              wordCount: event.text.trim().split(/\s+/).length,
              characterCount: event.text.length,
            }
          : thought
      );
    }
    case "moveThought": {
      return prev.map((thought) =>
        thought.id === event.id
          ? {
              ...thought,
              x: event.x,
              y: event.y,
              lastTouched: event.at || Date.now(),
            }
          : thought
      );
    }
    case "deleteThought": {
      return prev.filter((thought) => thought.id !== event.id);
    }
    default:
      return prev;
  }
}

function reduceLinks(prev: Link[], event: DomainEvent): Link[] {
  switch (event.type) {
    case "createLink": {
      // Check if link already exists
      if (prev.some(l => l.id === event.id)) {
        console.warn('Duplicate link creation prevented:', event.id);
        return prev;
      }
      return [
        ...prev,
        {
          id: event.id,
          sourceId: event.sourceId,
          targetId: event.targetId,
          createdAt: event.at || Date.now(),
        },
      ];
    }
    case "deleteLink": {
      return prev.filter((link) => link.id !== event.id);
    }
    default:
      return prev;
  }
}

function appReducer(prev: AppState, event: AnyEvent): AppState {
  if (event.type === "__reset__") {
    return { thoughts: event.payload, events: [], cursor: 0, links: [] };
  }

  const stampedEvent = { ...event, at: event.at || Date.now() };
  const nextEvents = [...prev.events, stampedEvent];
  const nextCursor = prev.cursor + 1;
  const nextThoughts = reduceThoughts(prev.thoughts, stampedEvent);
  const nextLinks = reduceLinks(prev.links, stampedEvent);
  return { thoughts: nextThoughts, events: nextEvents, cursor: nextCursor, links: nextLinks };
}

function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, () => {
    // Rehydrate from snapshot and event log
    const snapshotStr = localStorage.getItem("atem.snapshot");
    const eventsStr = localStorage.getItem("atem.events");
    const cursorStr = localStorage.getItem("atem.cursor");
    const baseThoughts: Thought[] = snapshotStr ? JSON.parse(snapshotStr) : [];
    const events: DomainEvent[] = eventsStr ? JSON.parse(eventsStr) : [];
    const cursor = Math.min(events.length, Math.max(0, cursorStr ? parseInt(cursorStr, 10) : events.length));
    const rebuilt = events.slice(0, cursor).reduce(reduceThoughts, baseThoughts);
    const links = events.slice(0, cursor).reduce(reduceLinks, [] as Link[]);
    return { thoughts: rebuilt, events, cursor, links } as AppState;
  });

  // Clean Two-Mode System
  const [mode, setMode] = useState<'edit' | 'board'>('board');
  const [currentNote, setCurrentNote] = useState<string>('');
  const [editingThoughtId, setEditingThoughtId] = useState<string | null>(null);
  const [selectedThought, setSelectedThought] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  
  // Mode debugging states
  const [debugStates, setDebugStates] = useState({
    isDragging: false,
    wasDragging: false,
    clickProcessed: false,
    lastClickTime: 0,
    lastAction: '',
    thoughtStates: {} as Record<string, { isDragging?: boolean; wasDragging?: boolean }>
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [hasDragged, setHasDragged] = useState(false);

  const updateDebugState = (updates: Partial<typeof debugStates>) => {
    setDebugStates(prev => ({ ...prev, ...updates }));
  };

  // Persist thoughts to localStorage
  useEffect(() => {
    localStorage.setItem("atem.snapshot", JSON.stringify(state.thoughts));
  }, [state.thoughts]);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("atem.events", JSON.stringify(state.events));
    localStorage.setItem("atem.cursor", String(state.cursor));
  }, [state.events]);

  useEffect(() => {
    if (!editingThoughtId) return;
    const thought = state.thoughts.find((t) => t.id === editingThoughtId);
    if (!thought) return;
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const centerX = thought.x - wrapper.clientWidth / 2 + 125;
      const centerY = thought.y - wrapper.clientHeight / 2 + 50;
      wrapper.scrollTo({ left: centerX, top: centerY, behavior: "smooth" });
    }
  }, [editingThoughtId]);

  const addThoughtAt = (x: number, y: number) => {
    const id = (crypto as any).randomUUID();
    console.log('Creating thought with ID:', id, 'at position:', x, y);
    dispatch({ type: "createThought", id, x, y });
  };

  const updateText = (id: string, newText: string) => {
    dispatch({ type: "updateText", id, text: newText });
  };

  const updatePosition = (id: string, x: number, y: number) => {
    dispatch({ type: "moveThought", id, x, y });
  };

  const deleteThought = (id: string) => {
    dispatch({ type: "deleteThought", id });
  };

  const undo = () => {
    if (state.cursor > 0) {
      dispatch({ type: "__reset__", payload: state.thoughts });
    }
  };

  const redo = () => {
    // This would need more complex logic for true redo
    console.log("Redo not implemented yet");
  };

  const getWrapperOffset = () => {
    if (!wrapperRef.current) return { x: 0, y: 0 };
    const rect = wrapperRef.current.getBoundingClientRect();
    return { x: rect.left, y: rect.top };
  };

  const handleThoughtClick = (thoughtId: string) => {
    const now = Date.now();
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
    } else if (selectedThought === thoughtId) {
      // Same thought - deselect
      console.log('❌ Deselecting thought');
      setSelectedThought(null);
      updateDebugState({ lastAction: 'thought_deselected' });
    } else {
      // Different thought - create connection
      console.log('🔗 Creating connection');
      const linkId = (crypto as any).randomUUID();
      dispatch({ type: "createLink", id: linkId, sourceId: selectedThought, targetId: thoughtId });
      setSelectedThought(null);
      updateDebugState({ lastAction: 'connection_created' });
    }
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks directly on the board (not on thoughts)
    if (e.target !== e.currentTarget) return;

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

  const getConnectionCount = (thoughtId: string) => {
    return state.links.filter(link => link.sourceId === thoughtId || link.targetId === thoughtId).length;
  };

  const exportThoughts = () => {
    const exportPayload = {
      snapshot: state.thoughts,
      events: state.events,
      version: "0.0.1",
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "thoughts.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importThoughts = async (file: File) => {
    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        // Back-compat: older exports were raw Thought[]
        localStorage.setItem("atem.snapshot", JSON.stringify(parsed));
        localStorage.removeItem("atem.events");
        (dispatch as any)({ type: "__reset__", payload: parsed });
      } else if (parsed && Array.isArray(parsed.snapshot)) {
        localStorage.setItem("atem.snapshot", JSON.stringify(parsed.snapshot));
        localStorage.setItem("atem.events", JSON.stringify(parsed.events ?? []));
        (dispatch as any)({ type: "__reset__", payload: parsed.snapshot });
      }
    } catch {}
  };

  // Core Two-Mode Functions
  const findEmptySpace = (): { x: number; y: number } => {
    const thoughtWidth = 250;
    const thoughtHeight = 100;
    const padding = 20;
    const maxAttempts = 50;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const x = 50 + Math.random() * (window.innerWidth - thoughtWidth - 100);
      const y = 50 + Math.random() * (window.innerHeight - thoughtHeight - 100);
      
      // Check if this position overlaps with existing thoughts
      const overlaps = state.thoughts.some(thought => {
        const dx = Math.abs(thought.x - x);
        const dy = Math.abs(thought.y - y);
        return dx < thoughtWidth + padding && dy < thoughtHeight + padding;
      });
      
      if (!overlaps) {
        return { x, y };
      }
    }
    
    // Fallback to a grid position if no empty space found
    const gridX = 50 + (state.thoughts.length % 5) * (thoughtWidth + padding);
    const gridY = 50 + Math.floor(state.thoughts.length / 5) * (thoughtHeight + padding);
    return { x: gridX, y: gridY };
  };

  const saveCurrentNote = () => {
    if (currentNote.trim()) {
      const id = (crypto as any).randomUUID();
      const now = Date.now();
      const position = findEmptySpace();
      
      dispatch({
        type: "createThought",
        id,
        x: position.x,
        y: position.y,
        text: currentNote,
        at: now
      });
      setCurrentNote('');
      setEditingThoughtId(null);
    }
  };

  const startNewNote = () => {
    saveCurrentNote();
    setCurrentNote('');
    setEditingThoughtId(null);
  };

  const editThought = (thoughtId: string) => {
    const thought = state.thoughts.find(t => t.id === thoughtId);
    if (thought) {
      setCurrentNote(thought.text);
      setEditingThoughtId(thoughtId);
      setShowModal(true);
    }
  };

  const saveEditedThought = (shouldCloseModal = true) => {
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

  const activeThought = useMemo(
    () => state.thoughts.find((t) => t.id === editingThoughtId) || null,
    [state.thoughts, editingThoughtId]
  );

  // Get current branch name for version display
  const getVersionName = () => {
    // Check if we're on experimental branch (this is a simple check)
    const isExperimental = window.location.href.includes('experimental') || 
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
  return (
    <div ref={wrapperRef} className="board-mode">
      {/* Clean Board Header */}
      <div className="board-header">
        <button 
          className="new-note-button"
          onClick={() => {
            setCurrentNote('');
            setEditingThoughtId(null);
            setShowModal(true);
          }}
          title="New Note"
        >
          ✏️ New Note
        </button>
      </div>

      {/* Dev HUD - Clean & Essential */}
      <div className="dev-hud">
        <div className="dev-stats">
          <span>Thoughts: {state.thoughts.length}</span>
          <span>Links: {state.links.length}</span>
          <span>Mode: {mode}</span>
        </div>
        <div className="dev-tools">
          <button onClick={() => {
            const data = {
              thoughts: state.thoughts,
              links: state.links,
              timestamp: Date.now()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `atem-export-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }} title="Export Data">
            📤 Export
          </button>
          <button onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  try {
                    const data = JSON.parse(e.target?.result as string);
                    if (data.thoughts && data.links) {
                      // Clear current state
                      dispatch({ type: "__reset__", payload: [] });
                      // Add imported thoughts
                      data.thoughts.forEach((thought: any) => {
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
                      data.links.forEach((link: any) => {
                        dispatch({
                          type: "createLink",
                          id: link.id,
                          sourceId: link.sourceId,
                          targetId: link.targetId,
                          at: link.createdAt
                        });
                      });
                    }
                  } catch (error) {
                    console.error('Failed to import data:', error);
                  }
                };
                reader.readAsText(file);
              }
            };
            input.click();
          }} title="Import Data">
            📥 Import
          </button>
          <button onClick={() => {
            if (confirm('Clear all thoughts and connections?')) {
              dispatch({ type: "__reset__", payload: [] });
              setSelectedThought(null);
              setShowModal(false);
            }
          }} title="Clear All">
            🗑️ Clear
          </button>
          <button onClick={() => {
            console.log('=== ATEM DEBUG INFO ===');
            console.log('State:', state);
            console.log('Mode:', mode);
            console.log('Current Note:', currentNote);
            console.log('Editing Thought ID:', editingThoughtId);
            console.log('Selected Thought:', selectedThought);
            console.log('Show Modal:', showModal);
            console.log('========================');
            alert('Debug info logged to console');
          }} title="Debug Info">
            🐛 Debug
          </button>
        </div>
      </div>

      {/* Board Canvas */}
      <div className="board-canvas">
        {/* Connection Lines */}
        {state.links.map((link) => {
          const source = state.thoughts.find(t => t.id === link.sourceId);
          const target = state.thoughts.find(t => t.id === link.targetId);
          if (!source || !target) return null;
          
          return (
            <svg
              key={link.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <line
                x1={source.x + 125}
                y1={source.y + 50}
                x2={target.x + 125}
                y2={target.y + 50}
                stroke="#333"
                strokeWidth="2"
              />
            </svg>
          );
        })}

        {/* Thoughts as Windowed Cards */}
        {state.thoughts.map((thought) => (
          <DraggableThoughtCard
              key={thought.id}
              thought={thought}
            isSelected={selectedThought === thought.id}
            onEdit={() => editThought(thought.id)}
            onSelect={() => {
              if (selectedThought === thought.id) {
                setSelectedThought(null);
              } else if (selectedThought) {
                // Create connection
                const linkId = (crypto as any).randomUUID();
                dispatch({
                  type: "createLink",
                  id: linkId,
                  sourceId: selectedThought,
                  targetId: thought.id,
                  at: Date.now()
                });
                setSelectedThought(null);
              } else {
                setSelectedThought(thought.id);
              }
            }}
            onMove={(x, y) => updatePosition(thought.id, x, y)}
            />
          ))}
      </div>

      {/* Modal for Editing Thoughts */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingThoughtId ? 'Edit Thought' : 'New Thought'}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={currentNote}
                onChange={(e) => setCurrentNote(e.target.value)}
                placeholder={editingThoughtId ? "Edit your thought..." : "Start writing your thoughts..."}
                className="modal-textarea"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button 
                className="modal-save"
                onClick={() => {
                  if (editingThoughtId) {
                    saveEditedThought(true);
                  } else {
                    saveCurrentNote();
                    setShowModal(false);
                  }
                }}
                title="Save Changes"
              >
                💾 Save
              </button>
              <button 
                className="modal-cancel"
                onClick={() => setShowModal(false)}
                title="Cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Draggable Thought Card Component
interface DraggableThoughtCardProps {
  thought: Thought;
  isSelected: boolean;
  onEdit: () => void;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
}

function DraggableThoughtCard({ thought, isSelected, onEdit, onSelect, onMove }: DraggableThoughtCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setHasMoved(false);
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!dragStart.x && !dragStart.y) return;
    
    const deltaX = Math.abs(e.clientX - dragStart.x);
    const deltaY = Math.abs(e.clientY - dragStart.y);
    
    // Only start dragging if moved more than 3 pixels
    if (deltaX > 3 || deltaY > 3) {
      if (!isDragging) {
        setIsDragging(true);
        setHasMoved(true);
      }
      
      const newX = e.clientX - dragStart.offsetX;
      const newY = e.clientY - dragStart.offsetY;
      onMove(newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  };

  useEffect(() => {
    if (dragStart.x || dragStart.y) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragStart.x, dragStart.y]);

  return (
    <div
      ref={cardRef}
      className="thought-card"
      style={{
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
        transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!hasMoved) {
          onEdit();
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!hasMoved) {
          onSelect();
        }
      }}
    >
      <div style={{ 
        fontSize: '14px', 
        lineHeight: '1.4',
        color: isSelected ? '#007bff' : '#333',
        fontWeight: isSelected ? 'bold' : 'normal',
        userSelect: 'none',
        pointerEvents: 'none'
      }}>
        {thought.text}
      </div>
    </div>
  );
}

export default App;