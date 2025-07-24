import DADMSRelationshipEdge from './DADMSRelationshipEdge';
import NoteConnectionEdge from './NoteConnectionEdge';

export { DADMSRelationshipEdge, NoteConnectionEdge };

export const edgeTypes = {
    default: DADMSRelationshipEdge,
    dadms_relationship: DADMSRelationshipEdge,
    note_connection: NoteConnectionEdge,
}; 