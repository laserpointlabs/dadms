import ExternalReferenceNode from './ExternalReferenceNode';
import OntologyNoteNode from './OntologyNoteNode';
import SimpleOntologyNode from './SimpleOntologyNode';

export {
    ExternalReferenceNode, OntologyNoteNode, SimpleOntologyNode
};

export const nodeTypes = {
    entity: SimpleOntologyNode,
    object_property: SimpleOntologyNode,
    data_property: SimpleOntologyNode,
    external_reference: ExternalReferenceNode,
    note: OntologyNoteNode,
}; 