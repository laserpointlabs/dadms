import { Box, Paper } from '@mui/material';
import ThreadManager from '../../components/ThreadManager';

const ThreadPage = () => (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 6, px: 2 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <ThreadManager />
        </Paper>
    </Box>
);

export default ThreadPage; 