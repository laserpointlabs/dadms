import React, { useState } from 'react';
import { CreateProjectRequest } from '../../types/services/project';
import { isFormValid, validateForm, validationSchemas } from '../../utils/validation';
import { Button } from '../shared/Button';
import { FormField, Input, TextArea } from '../shared/FormField';

interface CreateProjectProps {
    onSubmit: (project: CreateProjectRequest) => void;
    onCancel: () => void;
}

export const CreateProject: React.FC<CreateProjectProps> = ({ onSubmit, onCancel }) => {
    const [form, setForm] = useState<CreateProjectRequest>({
        name: '',
        description: '',
        knowledgeDomain: '',
        decisionContext: '',
        tags: []
    });

    const [tagInput, setTagInput] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
    };

    const handleBlur = (field: string) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field: string) => {
        const validation = validateForm(
            { [field]: form[field as keyof CreateProjectRequest] },
            { [field]: validationSchemas.project[field as keyof typeof validationSchemas.project] }
        );
        setErrors(prev => ({
            ...prev,
            [field]: validation[field]?.errors || []
        }));
    };

    const handleAddTag = () => {
        const tags = form.tags || [];
        if (tagInput.trim() && tags.length < 10) {
            setForm(prev => ({ ...prev, tags: [...tags, tagInput.trim()] }));
            setTagInput('');
        }
    };

    const handleRemoveTag = (index: number) => {
        setForm(prev => ({
            ...prev,
            tags: (prev.tags || []).filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields
        const validation = validateForm(form, validationSchemas.project);
        const allErrors = Object.entries(validation).reduce((acc, [field, result]) => {
            if (!result.isValid) {
                acc[field] = result.errors;
            }
            return acc;
        }, {} as Record<string, string[]>);

        setErrors(allErrors);
        setTouched({
            name: true,
            description: true,
            knowledgeDomain: true,
            decisionContext: true
        });

        if (isFormValid(validation)) {
            onSubmit(form);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
                label="Project Name"
                error={touched.name ? errors.name : undefined}
                required
                helpText="Choose a descriptive name for your project"
            >
                <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    onBlur={() => handleBlur('name')}
                    placeholder="Enter project name"
                    error={touched.name && !!errors.name}
                />
            </FormField>

            <FormField
                label="Description"
                error={touched.description ? errors.description : undefined}
                required
                helpText="Provide a clear overview of the project's purpose and goals"
            >
                <TextArea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    onBlur={() => handleBlur('description')}
                    placeholder="Describe your project"
                    rows={3}
                    error={touched.description && !!errors.description}
                />
            </FormField>

            <FormField
                label="Knowledge Domain"
                error={touched.knowledgeDomain ? errors.knowledgeDomain : undefined}
                required
                helpText="Specify the primary domain of expertise"
            >
                <Input
                    name="knowledgeDomain"
                    value={form.knowledgeDomain}
                    onChange={handleChange}
                    onBlur={() => handleBlur('knowledgeDomain')}
                    placeholder="e.g., Supply Chain, Healthcare, Finance"
                    error={touched.knowledgeDomain && !!errors.knowledgeDomain}
                />
            </FormField>

            <FormField
                label="Decision Context"
                error={touched.decisionContext ? errors.decisionContext : undefined}
                required
                helpText="Describe the decision-making scenario and constraints"
            >
                <TextArea
                    name="decisionContext"
                    value={form.decisionContext}
                    onChange={handleChange}
                    onBlur={() => handleBlur('decisionContext')}
                    placeholder="What decisions need to be made and under what conditions?"
                    rows={3}
                    error={touched.decisionContext && !!errors.decisionContext}
                />
            </FormField>

            <FormField
                label="Tags"
                error={errors.tags}
                helpText="Add up to 10 tags to categorize your project"
            >
                <div>
                    <div className="flex gap-2 mb-2">
                        <Input
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddTag();
                                }
                            }}
                            placeholder="Add a tag"
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleAddTag}
                            disabled={!tagInput.trim() || (form.tags?.length || 0) >= 10}
                        >
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(form.tags || []).map((tag, index) => (
                            <span
                                key={index}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-900 bg-opacity-20 text-blue-400 rounded text-sm"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => handleRemoveTag(index)}
                                    className="hover:text-blue-300"
                                >
                                    ×
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </FormField>

            <div className="flex gap-2 mt-6">
                <Button type="submit" variant="primary" fullWidth>
                    Create Project
                </Button>
                <Button type="button" variant="secondary" fullWidth onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}; 