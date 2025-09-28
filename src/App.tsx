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
      const now = event.at ?? Date.now();
      const text = event.text ?? "";
      const newThought: Thought = {
        id: event.id,
        text: text,
        x: event.x,
        y: event.y,
        lastTouched: now,
        createdAt: now,
        updatedAt: now,
        version: 1,
        wordCount: text.trim().split(/\s+/).filter(word => word.length > 0).length,
        characterCount: text.length,
      };
      return [...prev, newThought];
    }
    case "updateText": {
      const now = event.at ?? Date.now();
      return prev.map((t) => {
        if (t.id === event.id) {
          return {
            ...t,
            text: event.text,
            lastTouched: now,
            updatedAt: now,
            version: t.version + 1,
            wordCount: event.text.trim().split(/\s+/).filter(word => word.length > 0).length,
            characterCount: event.text.length,
          };
        }
        return t;
      });
    }
    case "moveThought": {
      const now = event.at ?? Date.now();
      return prev.map((t) => (t.id === event.id ? { ...t, x: event.x, y: event.y, lastTouched: now } : t));
    }
    case "deleteThought": {
      return prev.filter((t) => t.id !== event.id);
    }
    default:
      return prev;
  }
}

function reduceLinks(prev: Link[], event: DomainEvent): Link[] {
  switch (event.type) {
    case "createLink": {
      // Check if link already exists (same source and target)
      if (prev.some(l => l.sourceId === event.sourceId && l.targetId === event.targetId)) {
        console.warn('Duplicate link creation prevented:', event.sourceId, '->', event.targetId);
        return prev;
      }
      const now = event.at ?? Date.now();
      const newLink: Link = {
        id: event.id,
        sourceId: event.sourceId,
        targetId: event.targetId,
        createdAt: now,
      };
      return [...prev, newLink];
    }
    case "deleteLink": {
      return prev.filter((l) => l.id !== event.id);
    }
    case "deleteThought": {
      // Remove links connected to deleted thought
      return prev.filter((l) => l.sourceId !== event.id && l.targetId !== event.id);
    }
    default:
      return prev;
  }
}

function appReducer(state: AppState, event: AnyEvent | { type: "__undo__" } | { type: "__redo__" }): AppState {
  if (event.type === "__reset__") {
    // Reset thoughts; keep events and cursor as-is
    return { thoughts: event.payload, events: state.events, cursor: state.cursor, links: state.links };
  }
  if (event.type === "__undo__") {
    const nextCursor = Math.max(0, state.cursor - 1);
    const nextThoughts = state.events.slice(0, nextCursor).reduce(reduceThoughts, [] as Thought[]);
    const nextLinks = state.events.slice(0, nextCursor).reduce(reduceLinks, [] as Link[]);
    return { thoughts: nextThoughts, events: state.events, cursor: nextCursor, links: nextLinks };
  }
  if (event.type === "__redo__") {
    const nextCursor = Math.min(state.events.length, state.cursor + 1);
    const nextThoughts = state.events.slice(0, nextCursor).reduce(reduceThoughts, [] as Thought[]);
    const nextLinks = state.events.slice(0, nextCursor).reduce(reduceLinks, [] as Link[]);
    return { thoughts: nextThoughts, events: state.events, cursor: nextCursor, links: nextLinks };
  }
  // Applying a domain event: drop any future events, append, apply
  const stampedEvent: DomainEvent = { ...event, at: (event as any).at ?? Date.now() };
  const nextEvents = state.cursor < state.events.length ? [...state.events.slice(0, state.cursor), stampedEvent] : [...state.events, stampedEvent];
  const nextCursor = state.cursor + 1;
  const nextThoughts = reduceThoughts(state.thoughts, stampedEvent);
  const nextLinks = reduceLinks(state.links, stampedEvent);
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

  const [activeThoughtId, setActiveThoughtId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'edit' | 'connect'>('edit');
  const [selectedThought, setSelectedThought] = useState<string | null>(null);
  
  // Mode debugging states
  const [debugStates, setDebugStates] = useState({
    isDragging: false,
    wasDragging: false,
    clickProcessed: false,
    lastClickTime: 0,
    lastAction: 'none',
    thoughtStates: {} as Record<string, {
      isActive: boolean,
      isSelected: boolean,
      isDragging: boolean,
      wasDragging: boolean
    }>
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [hasDragged, setHasDragged] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showDevMenu, setShowDevMenu] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const boardSize = { width: 3000, height: 3000 };
  const [zoom, setZoom] = useState<number>(1);

  useEffect(() => {
    // Persist snapshot on every change for now (optimize later)
    localStorage.setItem("atem.snapshot", JSON.stringify(state.thoughts));
  }, [state.thoughts]);


  useEffect(() => {
    localStorage.setItem("atem.events", JSON.stringify(state.events));
    localStorage.setItem("atem.cursor", String(state.cursor));
  }, [state.events]);

  useEffect(() => {
    if (!activeThoughtId) return;
    const thought = state.thoughts.find((t) => t.id === activeThoughtId);
    if (!thought) return;
    const wrapper = wrapperRef.current;
    if (wrapper) {
      const centerX = thought.x - wrapper.clientWidth / 2 + 125;
      const centerY = thought.y - wrapper.clientHeight / 2 + 50;
      wrapper.scrollTo({ left: centerX, top: centerY, behavior: "smooth" });
    }
  }, [activeThoughtId]);


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
    if (activeThoughtId === id) setActiveThoughtId(null);
  };

  const deleteAllConnections = (thoughtId: string) => {
    const connectionsToDelete = state.links.filter(link => 
      link.sourceId === thoughtId || link.targetId === thoughtId
    );
    connectionsToDelete.forEach(link => {
      dispatch({ type: "deleteLink", id: link.id });
    });
  };

  const getConnectionCount = (thoughtId: string) => {
    return state.links.filter(link => 
      link.sourceId === thoughtId || link.targetId === thoughtId
    ).length;
  };

  const filteredThoughts = searchQuery 
    ? state.thoughts.filter(thought => 
        thought.text.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : state.thoughts;

  const jumpToThought = (thoughtId: string) => {
    const thought = state.thoughts.find(t => t.id === thoughtId);
    if (thought && wrapperRef.current) {
      const centerX = thought.x - wrapperRef.current.clientWidth / 2 + 125;
      const centerY = thought.y - wrapperRef.current.clientHeight / 2 + 50;
      wrapperRef.current.scrollTo({ left: centerX, top: centerY, behavior: "smooth" });
      setActiveThoughtId(thoughtId);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const undo = () => {
    (dispatch as any)({ type: "__undo__" });
  };

  const redo = () => {
    (dispatch as any)({ type: "__redo__" });
  };

  const updateDebugState = (updates: Partial<typeof debugStates>) => {
    setDebugStates(prev => ({ ...prev, ...updates }));
  };

  const handleThoughtClick = (thoughtId: string) => {
    const now = Date.now();
    console.log('🖱️ Thought click:', thoughtId, 'Mode:', currentMode, 'Selected:', selectedThought);
    
    updateDebugState({
      lastClickTime: now,
      clickProcessed: true,
      lastAction: 'thought_click'
    });
    
    if (currentMode === 'edit') {
      // Edit mode - just edit the thought
      console.log('📝 Edit mode - focusing thought');
      setActiveThoughtId(thoughtId);
      updateDebugState({ lastAction: 'edit_mode_focus' });
    } else if (currentMode === 'connect') {
      // Connect mode - handle connection logic only (no editing)
      if (selectedThought === null) {
        // No thought selected - select this one
        console.log('🔗 Connect mode - selecting thought');
        setSelectedThought(thoughtId);
        updateDebugState({ lastAction: 'connect_mode_select' });
        // Don't focus for editing in connect mode
      } else if (selectedThought === thoughtId) {
        // Same thought - deselect
        console.log('❌ Connect mode - deselecting thought');
        setSelectedThought(null);
        updateDebugState({ lastAction: 'connect_mode_deselect' });
      } else {
        // Different thought - create connection
        console.log('✅ Connect mode - creating connection');
        dispatch({ type: "createLink", id: (crypto as any).randomUUID(), sourceId: selectedThought, targetId: thoughtId });
        setSelectedThought(null);
        updateDebugState({ lastAction: 'connect_mode_connect' });
      }
    }
  };

  const getWrapperOffset = () => {
    const wrapper = wrapperRef.current;
    return wrapper
      ? { x: wrapper.scrollLeft, y: wrapper.scrollTop }
      : { x: 0, y: 0 };
  };

  const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle clicks directly on the board (not on thoughts)
    if (e.target !== e.currentTarget) return;

    // If we just finished dragging, don't do anything
    if (hasDragged) {
      setHasDragged(false);
      return;
    }

    // Clear active thought
    if (activeThoughtId) {
      setActiveThoughtId(null);
      return;
    }

    // Only create new thoughts in edit mode
    if (currentMode === 'edit') {
      const offset = getWrapperOffset();
      const x = (e.clientX + offset.x) / zoom;
      const y = (e.clientY + offset.y) / zoom;
      addThoughtAt(x, y);
    }
  };

  // Keyboard shortcuts: Delete active (outside inputs), Cmd/Ctrl+Z undo, Shift+Cmd/Ctrl+Z redo
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
        undo();
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const ae = document.activeElement as HTMLElement | null;
        const tag = ae?.tagName?.toLowerCase();
        const isTyping = tag === "textarea" || tag === "input" || ae?.isContentEditable;
        if (!isTyping && activeThoughtId) {
          e.preventDefault();
          deleteThought(activeThoughtId);
        }
      }
      if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(2))));
      }
      if (e.key === "-" || e.key === "_") {
        setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))));
      }
      if (e.key === "0") {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setZoom(1);
        }
      }
      if (e.key === "Escape") {
        if (currentMode === 'connect') {
          setCurrentMode('edit');
          setSelectedThought(null);
        }
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery("");
        }
      }
      if (e.key === "f" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowSearch(!showSearch);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeThoughtId]);

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

  const activeThought = useMemo(
    () => state.thoughts.find((t) => t.id === activeThoughtId) || null,
    [state.thoughts, activeThoughtId]
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

  return (
    <div ref={wrapperRef} className="board-wrapper">
      {/* Minimal Control Bar */}
      <div className="minimal-control-bar">
        {/* Mode Controls */}
        <div className="mode-controls">
          <button 
            className={currentMode === 'edit' ? 'active' : ''}
            onClick={() => {
              setCurrentMode('edit');
              setSelectedThought(null);
              console.log('📝 Switched to Edit Mode');
            }}
          >
            📝 Edit
          </button>
          <button 
            className={currentMode === 'connect' ? 'active' : ''}
            onClick={() => {
              setCurrentMode('connect');
              setSelectedThought(null);
              console.log('🔗 Switched to Connect Mode');
            }}
          >
            🔗 Connect
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="zoom-controls">
          <button onClick={() => setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))))}>−</button>
          <span className="zoom-label">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(2))))}>+</button>
        </div>

        {/* Burger Menu */}
        <button 
          className="burger-menu"
          onClick={() => setShowDevMenu(!showDevMenu)}
        >
          ☰
        </button>
      </div>

      {/* Dev Menu (Collapsible) */}
      {showDevMenu && (
        <div className="dev-menu">
          <div className="dev-menu-header">
            <h3>🛠️ Dev Tools</h3>
            <button onClick={() => setShowDevMenu(false)}>✕</button>
          </div>
          
          <div className="dev-menu-content">
            {/* Essential Actions */}
            <div className="dev-section">
              <h4>Essential</h4>
              <div className="dev-buttons">
                <button onClick={() => activeThought && deleteThought(activeThought.id)} disabled={!activeThought || currentMode === 'connect'}>
                  🗑️ Delete
                </button>
                <button onClick={undo} disabled={state.cursor === 0}>↶ Undo</button>
                <button onClick={redo} disabled={state.cursor >= state.events.length}>↷ Redo</button>
                <button onClick={() => setShowSearch(!showSearch)}>🔍 Search</button>
              </div>
            </div>

            {/* Data Tools */}
            <div className="dev-section">
              <h4>Data</h4>
              <div className="dev-buttons">
                <button onClick={exportThoughts}>📤 Export</button>
                <label className="import-label">
                  📥 Import
                  <input
                    type="file"
                    accept="application/json"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) importThoughts(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <button onClick={() => setShowMetadata(!showMetadata)} className={showMetadata ? "active" : ""}>
                  📊 {showMetadata ? "Hide" : "Show"} Metadata
                </button>
              </div>
            </div>

            {/* Testing Tools */}
            <div className="dev-section">
              <h4>Testing</h4>
              <div className="dev-buttons">
                <button onClick={() => {
                  const id = (crypto as any).randomUUID();
                  dispatch({ type: "createThought", id, x: Math.random() * 800 + 100, y: Math.random() * 600 + 100, text: "Test Thought" });
                }}>
                  🧪 Add Test Thought
                </button>
                <button onClick={() => {
                  const thoughts = state.thoughts;
                  if (thoughts.length >= 2) {
                    const source = thoughts[0];
                    const target = thoughts[1];
                    dispatch({ type: "createLink", id: (crypto as any).randomUUID(), sourceId: source.id, targetId: target.id });
                  }
                }}>
                  🔗 Connect First Two
                </button>
                <button onClick={() => {
                  console.log('=== STATE DEBUG ===');
                  console.log('Thoughts:', state.thoughts.length);
                  console.log('Links:', state.links.length);
                  console.log('Mode:', currentMode);
                  console.log('Active:', activeThoughtId);
                  console.log('Selected:', selectedThought);
                  console.log('==================');
                }}>
                  📊 Debug State
                </button>
                <button onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}>
                  🔄 Reset Everything
                </button>
              </div>
            </div>

            {/* Debug Info */}
            <div className="dev-section">
              <h4>Debug</h4>
              <div className="debug-info">
                <div className="debug-stats">
                  <span>Mode: {currentMode.toUpperCase()}</span>
                  <span>Active: {activeThoughtId ? 'Yes' : 'No'}</span>
                  <span>Selected: {selectedThought ? 'Yes' : 'No'}</span>
                  <span>Dragging: {debugStates.isDragging ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-action">
                  Last: {debugStates.lastAction}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}




      
      {/* Search Interface */}
      {showSearch && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          border: '2px solid black',
          borderRadius: '8px',
          padding: '10px',
          zIndex: 1001,
          minWidth: '300px',
        }}>
          <input
            type="text"
            placeholder="Search thoughts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px',
            }}
            autoFocus
          />
          {searchQuery && (
            <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredThoughts.map(thought => (
                <div
                  key={thought.id}
                  onClick={() => jumpToThought(thought.id)}
                  style={{
                    padding: '8px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee',
                    backgroundColor: thought.id === activeThoughtId ? '#f0f0f0' : 'white',
                  }}
                >
                  {thought.text || '(empty)'}
                </div>
              ))}
              {filteredThoughts.length === 0 && (
                <div style={{ padding: '8px', color: '#666' }}>No thoughts found</div>
              )}
            </div>
          )}
        </div>
      )}
      
      <div
        className={`board ${currentMode === 'connect' ? 'connect-mode' : ''}`}
        style={{ width: boardSize.width, height: boardSize.height, transform: `scale(${zoom})`, transformOrigin: "0 0" }}
        onClick={handleBoardClick}
      >
        {/* Render links as simple lines */}
        {state.links.map((link) => {
          const source = state.thoughts.find(t => t.id === link.sourceId);
          const target = state.thoughts.find(t => t.id === link.targetId);
          if (!source || !target) return null;
          
          // Calculate line properties - use current thought positions
          const startX = source.x + 125; // Center of source thought
          const startY = source.y + 25;
          const endX = target.x + 125;   // Center of target thought
          const endY = target.y + 25;
          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          const angle = Math.atan2(endY - startY, endX - startX);
          
          // Monochrome lines in connect mode
          const lineColor = currentMode === 'connect' ? '#000000' : '#ffffff';
          const shadowColor = currentMode === 'connect' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
          
          return (
            <div
              key={link.id}
              style={{
                position: 'absolute',
                left: startX,
                top: startY,
                width: length,
                height: 2,
                background: lineColor,
                transformOrigin: '0 0',
                transform: `rotate(${angle}rad)`,
                zIndex: 1,
                pointerEvents: 'none',
                boxShadow: `0 0 2px ${shadowColor}`,
                // Remove transition to prevent visual glitches during movement
              }}
            />
          );
        })}
        

        {state.thoughts.map((thought) => (
            <DraggableThought
              key={thought.id}
              thought={thought}
              onTextChange={(text) => updateText(thought.id, text)}
              onDragEnd={(x, y) => updatePosition(thought.id, x, y)}
              onFocus={() => setActiveThoughtId(thought.id)}
              onLinkClick={() => handleThoughtClick(thought.id)}
              isActive={thought.id === activeThoughtId}
              isSelected={selectedThought === thought.id}
              currentMode={currentMode}
              onDebugUpdate={(updates) => updateDebugState({
                thoughtStates: {
                  ...debugStates.thoughtStates,
                  [thought.id]: {
                    ...debugStates.thoughtStates[thought.id],
                    ...updates
                  }
                }
              })}
              connectionCount={getConnectionCount(thought.id)}
              zoom={zoom}
              showMetadata={showMetadata}
              onDragStart={() => setHasDragged(true)}
            />
          ))}
      </div>
    </div>
  );
}

interface DraggableProps {
  thought: Thought;
  onTextChange: (text: string) => void;
  onDragEnd: (x: number, y: number) => void;
  onFocus: () => void;
  onLinkClick: () => void;
  isActive: boolean;
  isSelected: boolean;
  currentMode: 'edit' | 'connect';
  onDebugUpdate: (updates: { isDragging?: boolean; wasDragging?: boolean }) => void;
  connectionCount: number;
  zoom: number;
  showMetadata: boolean;
  onDragStart: () => void;
}

function DraggableThought({
  thought,
  onTextChange,
  onDragEnd,
  onFocus,
  onLinkClick,
  isActive,
  isSelected,
  currentMode,
  onDebugUpdate,
  connectionCount,
  zoom,
  showMetadata,
  onDragStart,
}: DraggableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: thought.x, y: thought.y });
  const dragging = useRef(false);
  const wasDragging = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = `translate(${thought.x}px, ${thought.y}px)`;
    textareaRef.current?.focus();
    autoGrow();
  }, []);

  const autoGrow = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  };

  const bringToFront = () => {
    onDragEnd(posRef.current.x, posRef.current.y);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only left button or touch/pen
    if (e.button !== 0 && e.pointerType === "mouse") return;
    
    dragging.current = false; // Start as false, only set true if we actually drag
    bringToFront();
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...posRef.current };
    const el = ref.current;
    el?.setPointerCapture(e.pointerId);
    
    // Prevent click events during potential drag
    e.preventDefault();

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only start dragging if we've moved more than 5 pixels
      if (distance > 5 && !dragging.current) {
        dragging.current = true;
        wasDragging.current = true;
        onDragStart(); // Notify parent that we're dragging
        onDebugUpdate({ isDragging: true, wasDragging: true });
      }
      
      if (dragging.current) {
        ev.preventDefault();
        const newX = startPos.x + dx / zoom;
        const newY = startPos.y + dy / zoom;
        
        if (ref.current) {
          ref.current.style.transform = `translate(${newX}px, ${newY}px)`;
          // Update state during dragging so lines follow
          onDragEnd(newX, newY);
        }
      }
    };

    const handlePointerUp = (ev: PointerEvent) => {
      const wasDragging = dragging.current;
      dragging.current = false;
      
      if (wasDragging) {
        const dx = (ev.clientX - startX) / zoom;
        const dy = (ev.clientY - startY) / zoom;
        posRef.current.x = startPos.x + dx;
        posRef.current.y = startPos.y + dy;
        onDragEnd(posRef.current.x, posRef.current.y);
        onDebugUpdate({ isDragging: false });
      }
      
      el?.releasePointerCapture(e.pointerId);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  return (
    <div
      className={`thought ${isActive ? "focused" : ""} ${isSelected ? "selected" : ""} ${currentMode === 'connect' ? "connect-mode" : ""}`}
      ref={ref}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        
        // If we just finished dragging, don't do anything
        if (dragging.current || wasDragging.current) {
          console.log('🚫 Ignoring click - was dragging');
          wasDragging.current = false; // Reset for next interaction
          return;
        }
        
        // Handle click on thought (anywhere - text or border)
        console.log('✅ Processing click - not dragging');
        onLinkClick();
      }}
      data-thought-id={thought.id}
    >
            <textarea
              ref={textareaRef}
              value={thought.text}
              onChange={(e) => {
                onTextChange(e.target.value);
                autoGrow();
              }}
              onFocus={currentMode === 'edit' ? onFocus : undefined}
              onInput={autoGrow}
              readOnly={currentMode === 'connect'}
              style={{ 
                cursor: currentMode === 'connect' ? 'crosshair' : 'text',
                opacity: currentMode === 'connect' ? 0.8 : 1
              }}
            />
      {/* Connection count badge */}
      {connectionCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            background: 'black',
            color: 'white',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            zIndex: 10,
          }}
        >
          {connectionCount}
        </div>
      )}
      
      {/* Metadata overlay - shows on hover, when active, or when toggle is on */}
      <div className="thought-metadata" style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '10px',
        whiteSpace: 'nowrap',
        zIndex: 15,
        opacity: (isActive || showMetadata) ? 1 : 0,
        transition: 'opacity 0.2s ease',
        pointerEvents: 'none',
      }}>
        <div>Created: {new Date(thought.createdAt).toLocaleDateString()}</div>
        {thought.updatedAt !== thought.createdAt && (
          <div>Updated: {new Date(thought.updatedAt).toLocaleDateString()}</div>
        )}
        <div>v{thought.version} • {thought.wordCount} words • {thought.characterCount} chars</div>
      </div>
    </div>
  );
}

export default App;
