"use client";

import { Box, Paper } from "@mui/material";
import ContextManager from '../../components/ContextManager/ContextManager';

export default function ContextManagerPage() {
    return (
        <Box sx={{ maxWidth: 1200, mx: "auto", py: 6, px: 2 }}>
            <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
                <ContextManager />
            </Paper>
        </Box>
    );
} 