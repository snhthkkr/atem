# Changelog

All notable changes to Atem will be documented in this file.

## [0.1.0] - 2025-01-28

### Added
- **Button-based mode system** - Edit Mode and Connect Mode with clear separation
- **Fundamental connection system** - Solid, stable lines with real-time updates
- **Comprehensive debugger** - Real-time state tracking and conflict detection
- **Local-first storage** - Event-sourced state with undo/redo
- **Export/Import functionality** - Full data portability
- **Metadata display** - Development and testing insights
- **Clean HUD design** - Essential controls with dev tools
- **Stable rendering** - No visual glitches or transparency issues

### Fixed
- **Drag-edit conflicts** - Prevented edit mode activation during drag operations
- **Connection line rendering** - Removed transparency and transitions causing glitches
- **Mode restrictions** - Connect mode properly prevents editing and creating
- **Click detection** - Improved separation between drag and click interactions

### Changed
- **Interaction model** - Simplified to button-based modes like old CAD programs
- **Visual feedback** - Clear indicators for each mode and state
- **State management** - Event-sourced approach for reliability
- **Code organization** - Cleaner separation of concerns

### Technical Details
- **React + TypeScript** - Type-safe development
- **Vite** - Fast development and building
- **Event Sourcing** - Reliable state management
- **Local Storage** - Offline-first approach
- **Git Workflow** - Main/experimental branch strategy

## [0.0.1] - 2025-01-27

### Added
- Initial project setup
- Basic thought creation and editing
- Simple connection system
- Basic UI components

---

## Version Numbering

We use [Semantic Versioning](https://semver.org/):
- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Release Notes

### v0.1.0 - "Stable Foundation"
This is our first stable release, establishing the fundamental architecture and core features. The button-based mode system provides a solid foundation for future enhancements while maintaining simplicity and reliability.

**Key Achievements:**
- ✅ Stable, predictable interaction model
- ✅ Clean separation between edit and connect modes
- ✅ Comprehensive debugging tools
- ✅ Solid connection rendering
- ✅ Local-first data persistence

**Next Steps:**
- 🎨 Visual polish and animations
- 📱 Mobile responsiveness
- ☁️ Cloud sync capabilities
- 🤝 Collaboration features
