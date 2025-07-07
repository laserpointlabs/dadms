import { AccountTree, Analytics, Chat, Dashboard, Monitor, PlayArrow, Settings, Storage, Terminal } from '@mui/icons-material';
import { AppBar, Box, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes, useLocation } from 'react-router-dom';

// Import components
import AIChat from './components/AIChat';
import AnalysisDataViewer from './components/AnalysisDataViewer';
import BPMNWorkspace from './components/BPMNWorkspace';
import CLIManager from './components/CLIManager';
import DashboardOverview from './components/DashboardOverview';
import ProcessManager from './components/ProcessManager';
import SystemManager from './components/SystemManager';
import TechStackMonitor from './components/TechStackMonitor';
import ThreadContextViewer from './components/ThreadContextViewer';

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'BPMN AI Workspace', icon: <AccountTree />, path: '/bpmn' },
    { text: 'System Management', icon: <Settings />, path: '/system' },
    { text: 'Process Management', icon: <PlayArrow />, path: '/processes' },
    { text: 'CLI Manager', icon: <Terminal />, path: '/cli' },
    { text: 'Tech Stack Monitor', icon: <Monitor />, path: '/monitor' },
    { text: 'Analysis Data', icon: <Analytics />, path: '/analysis' },
    { text: 'Thread Context', icon: <Storage />, path: '/threads' },
    { text: 'AI Assistant', icon: <Chat />, path: '/chat' },
];

function App() {
    const [selectedPath, setSelectedPath] = useState('/');

    return (
        <Router>
            <AppContent selectedPath={selectedPath} setSelectedPath={setSelectedPath} />
        </Router>
    );
}

function AppContent({ selectedPath, setSelectedPath }: { selectedPath: string; setSelectedPath: (path: string) => void }) {
    const location = useLocation();
    const isBpmnWorkspace = location.pathname === '/bpmn';

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: `calc(100% - ${drawerWidth}px)`,
                    ml: `${drawerWidth}px`,
                    backgroundColor: 'primary.main'
                }}
            >
                <Toolbar>
                    <Typography variant="h6" noWrap component="div">
                        DADM - Decision Analysis and Decision Management
                    </Typography>
                </Toolbar>
            </AppBar>

            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: drawerWidth,
                        boxSizing: 'border-box',
                        backgroundColor: 'background.paper',
                    },
                }}
                variant="permanent"
                anchor="left"
            >
                <Toolbar>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        DADM UI
                    </Typography>
                </Toolbar>
                <Divider />
                <List>
                    {menuItems.map((item) => (
                        <ListItem key={item.text} disablePadding>
                            <ListItemButton
                                selected={selectedPath === item.path}
                                onClick={() => setSelectedPath(item.path)}
                                component="a"
                                href={item.path}
                            >
                                <ListItemIcon sx={{ color: selectedPath === item.path ? 'primary.main' : 'inherit' }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{ color: selectedPath === item.path ? 'primary.main' : 'inherit' }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    bgcolor: isBpmnWorkspace ? 'background.paper' : 'background.default',
                    p: isBpmnWorkspace ? 0 : 3,
                    mt: 8,
                    height: isBpmnWorkspace ? 'calc(100vh - 64px)' : 'auto',
                    minHeight: isBpmnWorkspace ? 'calc(100vh - 64px)' : 'calc(100vh - 64px)',
                    overflow: isBpmnWorkspace ? 'hidden' : 'auto'
                }}
            >
                <Routes>
                    <Route path="/" element={<DashboardOverview />} />
                    <Route path="/bpmn" element={<BPMNWorkspace />} />
                    <Route path="/system" element={<SystemManager />} />
                    <Route path="/processes" element={<ProcessManager />} />
                    <Route path="/cli" element={<CLIManager />} />
                    <Route path="/monitor" element={<TechStackMonitor />} />
                    <Route path="/analysis" element={<AnalysisDataViewer />} />
                    <Route path="/threads" element={<ThreadContextViewer />} />
                    <Route path="/chat" element={<AIChat />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Box>
        </Box>
    );
}

export default App;
