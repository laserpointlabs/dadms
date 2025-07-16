import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';
import { Persona, Team } from './types';

// Mocked personas for demo
const mockPersonas: Persona[] = [
    { id: 'p1', name: 'Analyst' },
    { id: 'p2', name: 'Engineer' },
    // ...
];

const initialTeams: Team[] = [
    { id: 't1', name: 'AI Experts', description: 'LLM and AI specialists', persona_ids: ['p1', 'p2'] },
];

const TeamsTab: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [open, setOpen] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    // ... handlers for create/edit/delete ...

    return (
        <Box>
            <Typography variant="h6">Teams</Typography>
            <Button onClick={() => setOpen(true)}>Create Team</Button>
            <List>
                {teams.map(team => (
                    <ListItem key={team.id}>
                        <ListItemText
                            primary={team.name}
                            secondary={team.description}
                        />
                        <Box>
                            {team.persona_ids.map((pid: string) => {
                                const persona = mockPersonas.find(p => p.id === pid);
                                return persona ? <Chip key={pid} label={persona.name} /> : null;
                            })}
                        </Box>
                        {/* Edit/Delete buttons here */}
                    </ListItem>
                ))}
            </List>
            {/* Dialog for create/edit team */}
            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>{editingTeam ? 'Edit Team' : 'Create Team'}</DialogTitle>
                <DialogContent>
                    <TextField label="Name" fullWidth />
                    <TextField label="Description" fullWidth />
                    {/* Multi-select for personas */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button color="primary">Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeamsTab; 