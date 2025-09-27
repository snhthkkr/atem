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
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [hasDragged, setHasDragged] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
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

  // Track mouse position for connection line
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (linkingFrom) {
        const wrapper = wrapperRef.current;
        if (wrapper) {
          const rect = wrapper.getBoundingClientRect();
          const offset = { x: wrapper.scrollLeft, y: wrapper.scrollTop };
          setMousePos({
            x: (e.clientX - rect.left + offset.x) / zoom,
            y: (e.clientY - rect.top + offset.y) / zoom
          });
        }
      }
    };

    if (linkingFrom) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [linkingFrom, zoom]);

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

  const handleLinkClick = (thoughtId: string) => {
    console.log('LINK CLICK:', thoughtId, 'LINKING FROM:', linkingFrom);
    
    if (linkingFrom) {
      // We're in linking mode - complete the connection
      if (linkingFrom !== thoughtId) {
        dispatch({ type: "createLink", id: (crypto as any).randomUUID(), sourceId: linkingFrom, targetId: thoughtId });
      }
      setLinkingFrom(null); // Exit linking mode
    } else {
      // Start linking mode
      setLinkingFrom(thoughtId);
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

    // If linking, exit linking mode
    if (linkingFrom) {
      setLinkingFrom(null);
      return;
    }

    // Clear active thought
    if (activeThoughtId) {
      setActiveThoughtId(null);
      return;
    }

    // Create new thought at click location
    const offset = getWrapperOffset();
    const x = (e.clientX + offset.x) / zoom;
    const y = (e.clientY + offset.y) / zoom;
    addThoughtAt(x, y);
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
        if (linkingFrom) {
          setLinkingFrom(null);
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
      <div className="control-bar">
        {/* Version Display */}
        <div className="version-display">
          <span className="version-name">{getVersionName()}</span>
          <span className="version-stats">{state.thoughts.length} thoughts • {state.links.length} connections</span>
        </div>

        {/* Core Controls */}
        <div className="core-controls">
        <button onClick={() => setZoom((z) => Math.max(0.4, parseFloat((z - 0.1).toFixed(2))))}>−</button>
        <span className="zoom-label">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(2))))}>+</button>
        <button onClick={() => setZoom(1)}>Reset</button>
        </div>

        {/* Thought Actions */}
        <div className="thought-actions">
          <button onClick={() => activeThought && deleteThought(activeThought.id)} disabled={!activeThought}>
            🗑️ Delete
          </button>
          <button onClick={() => activeThought && deleteAllConnections(activeThought.id)} disabled={!activeThought || getConnectionCount(activeThought.id) === 0}>
            🔗 Delete Links
          </button>
        </div>

        {/* History Controls */}
        <div className="history-controls">
          <button onClick={undo} disabled={state.cursor === 0}>↶ Undo</button>
          <button onClick={redo} disabled={state.cursor >= state.events.length}>↷ Redo</button>
        </div>

        {/* Search & Data */}
        <div className="data-controls">
          <button onClick={() => setShowSearch(!showSearch)}>🔍 Search</button>
          <button onClick={() => setShowMetadata(!showMetadata)} className={showMetadata ? "active" : ""}>
            📊 {showMetadata ? "Hide" : "Show"} Metadata
          </button>
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
      </div>

        {/* Linking Status */}
        <div className="linking-status">
          {linkingFrom ? (
            <span className="linking-active">🔗 LINKING MODE - Click another thought or empty space</span>
          ) : (
            <span className="linking-ready">Double-click thought to start linking</span>
          )}
        </div>

        {/* Developer Tools (collapsible) */}
        <details className="dev-tools">
          <summary>🛠️ Dev Tools</summary>
          <div className="dev-buttons">
            <button onClick={() => {
              console.log('=== STATE DEBUG ===');
              console.log('Thoughts count:', state.thoughts.length);
              console.log('Thought IDs:', state.thoughts.map(t => t.id));
              console.log('Duplicate IDs:', state.thoughts.map(t => t.id).filter((id, index, arr) => arr.indexOf(id) !== index));
              console.log('Events count:', state.events.length);
              console.log('Links count:', state.links.length);
              console.log('==================');
            }}>Debug State</button>
            <button onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}>Reset Everything</button>
            <button onClick={() => {
              const uniqueThoughts = state.thoughts.filter((thought, index, arr) => 
                arr.findIndex(t => t.id === thought.id) === index
              );
              const uniqueLinks = state.links.filter((link, index, arr) => 
                arr.findIndex(l => l.id === link.id) === index
              );
              console.log('Cleaned thoughts:', uniqueThoughts.length, 'from', state.thoughts.length);
              console.log('Cleaned links:', uniqueLinks.length, 'from', state.links.length);
              dispatch({ type: "__reset__", payload: uniqueThoughts });
            }}>Clean State</button>
            <button onClick={() => {
              const id = (crypto as any).randomUUID();
              dispatch({ type: "createThought", id, x: 200, y: 200, text: "Test" });
            }}>Quick Test</button>
          </div>
        </details>
      </div>
      
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
        className="board"
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
          
          return (
            <div
              key={link.id}
              style={{
                position: 'absolute',
                left: startX,
                top: startY,
                width: length,
                height: 2,
                background: 'rgba(255, 255, 255, 0.8)',
                transformOrigin: '0 0',
                transform: `rotate(${angle}rad)`,
                zIndex: 1,
                pointerEvents: 'none',
                boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)',
                transition: 'all 0.2s ease-out', // Smooth movement
              }}
            />
          );
        })}
        
        {/* Cursor line during connection mode */}
        {linkingFrom && (() => {
          const sourceThought = state.thoughts.find(t => t.id === linkingFrom);
          if (!sourceThought) return null;
          
          const startX = sourceThought.x + 125;
          const startY = sourceThought.y + 25;
          const endX = mousePos.x;
          const endY = mousePos.y;
          const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
          const angle = Math.atan2(endY - startY, endX - startX);
          
          return (
            <div
              style={{
                position: 'absolute',
                left: startX,
                top: startY,
                width: length,
                height: 2,
                background: 'rgba(255, 255, 255, 0.6)',
                transformOrigin: '0 0',
                transform: `rotate(${angle}rad)`,
                zIndex: 2,
                pointerEvents: 'none',
                boxShadow: '0 0 6px rgba(0, 0, 0, 0.4)',
                border: '1px dashed rgba(255, 255, 255, 0.8)',
              }}
            />
          );
        })()}

        {state.thoughts.map((thought) => (
            <DraggableThought
              key={thought.id}
              thought={thought}
              onTextChange={(text) => updateText(thought.id, text)}
              onDragEnd={(x, y) => updatePosition(thought.id, x, y)}
              onFocus={() => setActiveThoughtId(thought.id)}
              onLinkClick={() => handleLinkClick(thought.id)}
              isActive={thought.id === activeThoughtId}
              isLinking={linkingFrom === thought.id}
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
  isLinking: boolean;
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
  isLinking,
  connectionCount,
  zoom,
  showMetadata,
  onDragStart,
}: DraggableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: thought.x, y: thought.y });
  const dragging = useRef(false);
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

    const handlePointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Only start dragging if we've moved more than 5 pixels
      if (distance > 5 && !dragging.current) {
        dragging.current = true;
        onDragStart(); // Notify parent that we're dragging
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
      className={`thought ${isActive ? "focused" : ""} ${isLinking ? "linking" : ""}`}
      ref={ref}
      onPointerDown={handlePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        
        // If we just finished dragging, don't do anything
        if (dragging.current) {
          return;
        }
        
        // If clicking on textarea, just focus it
        if (e.target === textareaRef.current) {
          onFocus();
          return;
        }
        
        // Single click: focus the thought (enter edit mode)
        onFocus();
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        
        // If we just finished dragging, don't do anything
        if (dragging.current) {
          return;
        }
        
        // Double click: start connection mode
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
        onFocus={onFocus}
        onInput={autoGrow}
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
