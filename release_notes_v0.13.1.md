# Release Notes - DADM v0.13.1

**Release Date:** 2025-06-27  
**Version:** 0.13.1

## 🌟 What's New
### BPMN Modeler Polishing
- Extension property extraction and caching logic made robust for all BPMN service tasks
- Properties panel reliably displays and edits all extension properties after model load
- File System Access API Save/Save As with persistent file name in toolbar
- Fullscreen mode for BPMN modeler workspace (toolbar button, menu, F11)
- File name persists in toolbar after browser refresh

### Release Automation
- Release documentation and workflow improvements
- Automated checklist and templates for every release

## 🐛 Bug Fixes
- Fixed: Extension properties lost or not shown after loading BPMN models
- Fixed: Save/Save As always prompted for new file, now overwrites after first save
- Fixed: File name lost on browser refresh
- Fixed: Fullscreen mode not available for modeler

## 📋 Migration Guide
### From v0.13.0 to v0.13.1
- No breaking changes
- All extension property and file handling improvements are backward compatible
- No database or configuration migrations required
