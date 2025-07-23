import ExternalReferenceNode from './ExternalReferenceNode';
import SimpleOntologyNode from './SimpleOntologyNode';

export {
    ExternalReferenceNode,
    SimpleOntologyNode
};

export const nodeTypes = {
    entity: SimpleOntologyNode,
    object_property: SimpleOntologyNode,
    data_property: SimpleOntologyNode,
    external_reference: ExternalReferenceNode,
}; 