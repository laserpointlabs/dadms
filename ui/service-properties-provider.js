import { is } from 'bpmn-js/lib/util/ModelUtil';

import {
    TextFieldEntry,
    isTextFieldEntryEdited
} from '@bpmn-io/properties-panel';

import { useService } from 'bpmn-js-properties-panel';

// Service Task Properties Provider
export function ServiceTaskPropertiesProvider(props) {
    const { element } = props;

    if (!is(element, 'bpmn:ServiceTask')) {
        return null;
    }

    return (
        <ServiceTaskProperties element={element} />
    );
}

function ServiceTaskProperties(props) {
    const { element } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getValue = (key) => {
        return element.businessObject.get(key) || '';
    };

    const setValue = (key, value) => {
        modeling.updateProperties(element, {
            [key]: value
        });
    };

    const getExtensionValue = (key) => {
        return element.businessObject.get(`service:${key}`) || '';
    };

    const setExtensionValue = (key, value) => {
        const attrs = { ...element.businessObject.$attrs };
        if (value && value.trim() !== '') {
            attrs[`service:${key}`] = value;
        } else {
            delete attrs[`service:${key}`];
        }
        modeling.updateProperties(element, { $attrs: attrs });
    };

    return (
        <div>
            <TextFieldEntry
                id="serviceType"
                label={translate('Service Type')}
                getValue={() => getExtensionValue('serviceType')}
                setValue={(value) => setExtensionValue('serviceType', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="serviceName"
                label={translate('Service Name')}
                getValue={() => getExtensionValue('serviceName')}
                setValue={(value) => setExtensionValue('serviceName', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="serviceVersion"
                label={translate('Service Version')}
                getValue={() => getExtensionValue('serviceVersion')}
                setValue={(value) => setExtensionValue('serviceVersion', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="serviceEndpoint"
                label={translate('Endpoint URL')}
                getValue={() => getExtensionValue('serviceEndpoint')}
                setValue={(value) => setExtensionValue('serviceEndpoint', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="serviceTimeout"
                label={translate('Timeout (ms)')}
                getValue={() => getExtensionValue('serviceTimeout')}
                setValue={(value) => setExtensionValue('serviceTimeout', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="serviceRetries"
                label={translate('Retries')}
                getValue={() => getExtensionValue('serviceRetries')}
                setValue={(value) => setExtensionValue('serviceRetries', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />
        </div>
    );
}

// Script Task Properties Provider
export function ScriptTaskPropertiesProvider(props) {
    const { element } = props;

    if (!is(element, 'bpmn:ScriptTask')) {
        return null;
    }

    return (
        <ScriptTaskProperties element={element} />
    );
}

function ScriptTaskProperties(props) {
    const { element } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getExtensionValue = (key) => {
        return element.businessObject.get(`service:${key}`) || '';
    };

    const setExtensionValue = (key, value) => {
        const attrs = { ...element.businessObject.$attrs };
        if (value && value.trim() !== '') {
            attrs[`service:${key}`] = value;
        } else {
            delete attrs[`service:${key}`];
        }
        modeling.updateProperties(element, { $attrs: attrs });
    };

    return (
        <div>
            <TextFieldEntry
                id="scriptLanguage"
                label={translate('Script Language')}
                getValue={() => getExtensionValue('scriptLanguage')}
                setValue={(value) => setExtensionValue('scriptLanguage', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="scriptVersion"
                label={translate('Script Version')}
                getValue={() => getExtensionValue('scriptVersion')}
                setValue={(value) => setExtensionValue('scriptVersion', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="scriptTimeout"
                label={translate('Timeout (ms)')}
                getValue={() => getExtensionValue('scriptTimeout')}
                setValue={(value) => setExtensionValue('scriptTimeout', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />
        </div>
    );
}

// User Task Properties Provider
export function UserTaskPropertiesProvider(props) {
    const { element } = props;

    if (!is(element, 'bpmn:UserTask')) {
        return null;
    }

    return (
        <UserTaskProperties element={element} />
    );
}

function UserTaskProperties(props) {
    const { element } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getExtensionValue = (key) => {
        return element.businessObject.get(`service:${key}`) || '';
    };

    const setExtensionValue = (key, value) => {
        const attrs = { ...element.businessObject.$attrs };
        if (value && value.trim() !== '') {
            attrs[`service:${key}`] = value;
        } else {
            delete attrs[`service:${key}`];
        }
        modeling.updateProperties(element, { $attrs: attrs });
    };

    return (
        <div>
            <TextFieldEntry
                id="assignee"
                label={translate('Assignee')}
                getValue={() => getExtensionValue('assignee')}
                setValue={(value) => setExtensionValue('assignee', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="candidateGroups"
                label={translate('Candidate Groups')}
                getValue={() => getExtensionValue('candidateGroups')}
                setValue={(value) => setExtensionValue('candidateGroups', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="candidateUsers"
                label={translate('Candidate Users')}
                getValue={() => getExtensionValue('candidateUsers')}
                setValue={(value) => setExtensionValue('candidateUsers', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="dueDate"
                label={translate('Due Date')}
                getValue={() => getExtensionValue('dueDate')}
                setValue={(value) => setExtensionValue('dueDate', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="priority"
                label={translate('Priority')}
                getValue={() => getExtensionValue('priority')}
                setValue={(value) => setExtensionValue('priority', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />
        </div>
    );
}

// Call Activity Properties Provider
export function CallActivityPropertiesProvider(props) {
    const { element } = props;

    if (!is(element, 'bpmn:CallActivity')) {
        return null;
    }

    return (
        <CallActivityProperties element={element} />
    );
}

function CallActivityProperties(props) {
    const { element } = props;

    const modeling = useService('modeling');
    const translate = useService('translate');
    const debounce = useService('debounceInput');

    const getExtensionValue = (key) => {
        return element.businessObject.get(`service:${key}`) || '';
    };

    const setExtensionValue = (key, value) => {
        const attrs = { ...element.businessObject.$attrs };
        if (value && value.trim() !== '') {
            attrs[`service:${key}`] = value;
        } else {
            delete attrs[`service:${key}`];
        }
        modeling.updateProperties(element, { $attrs: attrs });
    };

    return (
        <div>
            <TextFieldEntry
                id="calledElement"
                label={translate('Called Element')}
                getValue={() => getExtensionValue('calledElement')}
                setValue={(value) => setExtensionValue('calledElement', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="calledElementBinding"
                label={translate('Binding')}
                getValue={() => getExtensionValue('calledElementBinding')}
                setValue={(value) => setExtensionValue('calledElementBinding', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />

            <TextFieldEntry
                id="calledElementVersion"
                label={translate('Version')}
                getValue={() => getExtensionValue('calledElementVersion')}
                setValue={(value) => setExtensionValue('calledElementVersion', value)}
                debounce={debounce}
                isEdited={isTextFieldEntryEdited}
            />
        </div>
    );
} 