# DADM Release v0.13.1 Summary

**Release Date:** 2025-06-27  
**Version:** 0.13.1  
**Theme:** BPMN Modeler Polishing, Extension Property Reliability, Fullscreen, and Release Automation

## 🎯 Key Achievements
- Extension property extraction, caching, and injection logic made robust for all BPMN service tasks
- Properties panel now reliably displays and edits all extension properties after model load
- File System Access API integration for Save/Save As with persistent file name in toolbar
- Fullscreen mode for BPMN modeler workspace (toolbar button, menu, F11)
- Release process automation and documentation improvements

## 📊 Impact Metrics
| Component         | Before                | After                  | Improvement         |
|------------------|----------------------|------------------------|---------------------|
| Extension Props  | Often lost/hidden    | Always visible/editable| ✅ Reliability      |
| Save/Save As     | Prompted every time  | Overwrites after first | ✅ Desktop-like UX  |
| Fullscreen       | Not available        | One-click/F11 support  | ✅ Usability        |
| File Name        | Lost on reload       | Persistent in toolbar  | ✅ User Experience  |

## 🚀 User Experience Improvements
### For Modelers & Analysts
- No more lost extension properties after loading or editing BPMN models
- Save/Save As works like a desktop app, with persistent file name and overwrite
- Fullscreen mode maximizes modeling area for complex diagrams
- Docker UI builds now work correctly without TypeScript errors
- Release documentation and workflow now fully automated and transparent
