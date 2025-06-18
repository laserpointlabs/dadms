# Release Notes - DADM v0.11.1

**Release Date:** June 18, 2025  
**Version:** 0.11.1

## 🌟 What's New

### Enhanced Process Management UI
This release introduces a completely overhauled process management interface with real-time monitoring capabilities and comprehensive troubleshooting tools.

#### 🔄 Real-time Auto-refresh
- **Process Instances Table**: Auto-refresh every 5 seconds with toggle control
- **Details Dialog**: Live updates while viewing process details
- **Visual Indicators**: Clear indication of auto-refresh status
- **Manual Controls**: Refresh button for on-demand updates

#### 🔍 Advanced Process Troubleshooting
- **Rich Details Dialog**: Comprehensive view of process execution state
- **Activity Timeline**: See exactly what activities have executed and when
- **External Task Logs**: Monitor external task execution with worker details
- **Variable History**: Track variable changes throughout process execution
- **Incident Tracking**: View errors and incidents with detailed context
- **Analysis Integration**: See DADM analysis data alongside process execution

#### 📊 Smart Process Organization
- **Process Grouping**: Group process definitions by key for better organization
- **Version Selection**: Dropdown to select specific process definition versions
- **Process Documentation**: Extract and display documentation from BPMN files
- **Info Button**: Quick access to process documentation without opening files

#### 🗑️ Process Lifecycle Management
- **Delete Process Definitions**: Remove process definitions from Camunda
- **Delete Process Instances**: Terminate and remove process instances
- **Confirmation Dialogs**: Safe deletion with user confirmation
- **Proper Cleanup**: Backend handles all necessary cleanup operations

### Backend API Enhancements

#### 🛠️ New API Endpoints
```
GET /api/process/instances/:id/troubleshoot    # Comprehensive troubleshooting data
GET /api/process/definitions/all-versions      # Grouped process definitions
GET /api/process/definitions/:id/documentation # Extract BPMN documentation
DELETE /api/process/definitions/:id            # Delete process definitions
DELETE /api/process/instances/:id              # Delete process instances
```

#### 📡 Data Aggregation
- **Multi-source Integration**: Combines data from Camunda APIs and analysis database
- **Smart Caching**: Efficient data retrieval and background updates
- **Error Handling**: Robust error handling with meaningful error messages

## 🐛 Bug Fixes

### Database Integration
- **Fixed Analysis Database Path**: Ensured consistent database location across all components
- **Cleaned Duplicate Databases**: Removed duplicate analysis_data.db files
- **Verified Data Persistence**: Process execution now properly writes to analysis database

### UI Stability
- **Resolved UI Hanging**: Fixed blocking behavior when starting processes from UI
- **Background Task Spawning**: Proper external task worker management
- **Non-blocking Operations**: All process operations now run in background

### Configuration Management
- **Centralized Config**: CONFIG object manages all file paths consistently
- **Path Resolution**: Fixed relative path issues in backend server
- **Environment Consistency**: Standardized configuration across development and production

## 🚀 Performance Improvements

### Real-time Updates
- **Efficient Refresh Logic**: Smart background updates without disrupting user experience
- **Minimal API Calls**: Optimized refresh intervals to balance real-time updates with performance
- **Cleanup Management**: Proper interval cleanup prevents memory leaks

### UI Responsiveness
- **Non-blocking Operations**: Process start/stop operations don't freeze the UI
- **Background Processing**: Heavy operations moved to background workers
- **Smooth Interactions**: Immediate UI feedback for all user actions

## 📋 Migration Guide

### From v0.11.0 to v0.11.1

#### Database Changes
No database schema changes required. The analysis database location has been standardized to:
```
/home/jdehart/dadm/data/analysis_storage/analysis_data.db
```

#### Configuration Updates
The backend now uses a centralized CONFIG object. No manual configuration changes required.

#### UI Changes
The process management interface has been completely redesigned. Users will notice:
- New auto-refresh toggle in the top-right corner
- Enhanced details dialog with rich troubleshooting information
- Process grouping and version selection dropdowns
- New action buttons for delete operations

## 🔧 Technical Details

### Frontend Architecture
- **React 18**: Modern React with hooks and functional components
- **Material-UI**: Consistent design system with responsive layouts
- **Auto-refresh Logic**: Intelligent interval management with proper cleanup
- **State Management**: Optimized state updates for real-time data

### Backend Architecture
- **Express.js**: RESTful API with comprehensive error handling
- **Data Aggregation**: Multi-source data combination from Camunda and DADM
- **Configuration Management**: Centralized path and setting management
- **Process Management**: Complete CRUD operations for process lifecycle

### Database Integration
- **SQLite**: Analysis data stored in standardized SQLite database
- **Camunda PostgreSQL**: Process engine data in PostgreSQL database
- **Data Consistency**: Ensured data consistency across all operations

## 🧪 Testing

### Test Coverage
- ✅ Process instance auto-refresh functionality
- ✅ Details dialog real-time updates
- ✅ Process definition grouping and version selection
- ✅ Delete operations for definitions and instances
- ✅ Troubleshooting data aggregation
- ✅ Backend API endpoint functionality
- ✅ Database integration and persistence
- ✅ UI responsiveness and non-blocking operations

### Recommended Testing
1. **Start a process** from the UI and verify analysis data is written
2. **Open details dialog** and watch auto-refresh updates
3. **Toggle auto-refresh** on the main table
4. **Delete process instances** and verify proper cleanup
5. **View process documentation** via info buttons
6. **Test version selection** for process definitions

## 📚 Documentation

### Updated Documentation
- [Process Management Guide](docs/process_management_guide.md)
- [API Reference](docs/api_reference.md)
- [Troubleshooting Guide](docs/troubleshooting_guide.md)
- [UI Process Start Hanging Solution](docs/UI_PROCESS_START_HANGING_SOLUTION.md)

### New Features Documentation
- Real-time monitoring capabilities
- Process troubleshooting workflows
- Delete operation procedures
- Auto-refresh configuration options

## 🙏 Acknowledgments

Special thanks to the development team for implementing comprehensive process management capabilities and ensuring robust real-time monitoring functionality.

---

**Previous Release:** [v0.11.0 Release Notes](release_notes_v0.11.0.md)  
**Full Changelog:** [CHANGELOG.md](changelog.md)  
**Issues & Feedback:** [GitHub Issues](https://github.com/your-org/dadm/issues)
