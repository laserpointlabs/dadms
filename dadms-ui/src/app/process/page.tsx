import { Box, Paper } from '@mui/material';
import ProcessManager from '../../components/ProcessManager';

const ProcessPage = () => (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 6, px: 2 }}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
            <ProcessManager />
        </Paper>
    </Box>
);

export default ProcessPage; 