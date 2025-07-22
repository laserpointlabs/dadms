'use client';

import { Alert, Button, Card, Icon, ThemeSelector } from '../../components/shared';
import { FormField, Input, Select, TextArea } from '../../components/shared/FormField';
import { PageContent, PageLayout } from '../../components/shared/PageLayout';
import { useTheme } from '../../contexts/ThemeContext';

export default function SettingsPage() {
    const { theme } = useTheme();

    return (
        <PageLayout
            title="Settings"
            subtitle="Configure your DADMS preferences and test the theme system"
            icon="settings-gear"
            status={{ text: 'Settings Active', type: 'active' }}
        >
            <PageContent spacing="lg">
                {/* Theme Section */}
                <Card variant="default" padding="lg">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                                Theme Configuration
                            </h2>
                            <p className="text-theme-text-secondary">
                                Choose your preferred color scheme. Changes apply immediately across all components.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Theme Selector Panel */}
                            <ThemeSelector variant="panel" />

                            {/* Current Theme Info */}
                            <Card variant="outlined" padding="md">
                                <h3 className="text-lg font-medium text-theme-text-primary mb-4">
                                    Current Theme Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Active Theme:</span>
                                        <span className="text-theme-text-primary font-medium capitalize">{theme}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">System Preference:</span>
                                        <span className="text-theme-text-primary font-medium">
                                            {typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-theme-text-secondary">Storage:</span>
                                        <span className="text-theme-text-primary font-medium">
                                            {typeof window !== 'undefined' && localStorage.getItem('dadms-theme') ? 'Saved' : 'Default'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </Card>

                {/* Component Testing Section */}
                <Card variant="default" padding="lg">
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-theme-text-primary mb-2">
                                Component Theme Testing
                            </h2>
                            <p className="text-theme-text-secondary">
                                Test how different components appear with the current theme.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div>
                            <h3 className="text-lg font-medium text-theme-text-primary mb-3">Buttons</h3>
                            <div className="flex flex-wrap gap-3">
                                <Button variant="primary">Primary</Button>
                                <Button variant="secondary">Secondary</Button>
                                <Button variant="tertiary">Tertiary</Button>
                                <Button variant="success">Success</Button>
                                <Button variant="danger">Danger</Button>
                                <Button variant="primary" leftIcon="add">With Icon</Button>
                                <Button variant="secondary" loading>Loading</Button>
                            </div>
                        </div>

                        {/* Forms */}
                        <div>
                            <h3 className="text-lg font-medium text-theme-text-primary mb-3">Form Elements</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField label="Text Input" helpText="Enter some text">
                                    <Input placeholder="Type something..." />
                                </FormField>
                                <FormField label="Select Option">
                                    <Select>
                                        <option value="">Choose an option</option>
                                        <option value="option1">Option 1</option>
                                        <option value="option2">Option 2</option>
                                    </Select>
                                </FormField>
                                <div className="md:col-span-2">
                                    <FormField label="Text Area" helpText="Enter a longer description">
                                        <TextArea rows={3} placeholder="Type a longer message..." />
                                    </FormField>
                                </div>
                            </div>
                        </div>

                        {/* Cards */}
                        <div>
                            <h3 className="text-lg font-medium text-theme-text-primary mb-3">Cards</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card variant="default" padding="md">
                                    <div className="flex items-center gap-3">
                                        <Icon name="check-circle" size="lg" className="text-theme-accent-success" />
                                        <div>
                                            <h4 className="font-medium text-theme-text-primary">Default Card</h4>
                                            <p className="text-sm text-theme-text-secondary">Standard appearance</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card variant="elevated" padding="md">
                                    <div className="flex items-center gap-3">
                                        <Icon name="lightbulb" size="lg" className="text-theme-accent-warning" />
                                        <div>
                                            <h4 className="font-medium text-theme-text-primary">Elevated Card</h4>
                                            <p className="text-sm text-theme-text-secondary">With shadow</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card variant="outlined" padding="md">
                                    <div className="flex items-center gap-3">
                                        <Icon name="info" size="lg" className="text-theme-accent-info" />
                                        <div>
                                            <h4 className="font-medium text-theme-text-primary">Outlined Card</h4>
                                            <p className="text-sm text-theme-text-secondary">Outlined style</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        </div>

                        {/* Alerts */}
                        <div>
                            <h3 className="text-lg font-medium text-theme-text-primary mb-3">Alerts</h3>
                            <div className="space-y-3">
                                <Alert variant="success" title="Success">
                                    Theme system is working correctly!
                                </Alert>
                                <Alert variant="info" title="Information">
                                    All components are using theme variables consistently.
                                </Alert>
                                <Alert variant="warning" title="Warning">
                                    Some legacy components may still need theme updates.
                                </Alert>
                                <Alert variant="error" title="Error">
                                    This is how error messages appear in the current theme.
                                </Alert>
                            </div>
                        </div>

                        {/* Color Palette */}
                        <div>
                            <h3 className="text-lg font-medium text-theme-text-primary mb-3">Color Palette</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <div className="w-full h-12 bg-theme-accent-primary rounded border border-theme-border"></div>
                                    <p className="text-xs text-theme-text-secondary text-center">Primary</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-12 bg-theme-accent-success rounded border border-theme-border"></div>
                                    <p className="text-xs text-theme-text-secondary text-center">Success</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-12 bg-theme-accent-warning rounded border border-theme-border"></div>
                                    <p className="text-xs text-theme-text-secondary text-center">Warning</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-full h-12 bg-theme-accent-error rounded border border-theme-border"></div>
                                    <p className="text-xs text-theme-text-secondary text-center">Error</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Instructions */}
                <Card variant="outlined" padding="md">
                    <div className="flex items-start gap-3">
                        <Icon name="lightbulb" size="lg" className="text-theme-accent-warning mt-1" />
                        <div>
                            <h3 className="text-lg font-medium text-theme-text-primary mb-2">
                                Theme Testing Instructions
                            </h3>
                            <ul className="text-sm text-theme-text-secondary space-y-1">
                                <li>• Switch between light and dark themes using the toggle above</li>
                                <li>• Verify all components adapt consistently to the theme change</li>
                                <li>• Check that colors remain readable and accessible</li>
                                <li>• Ensure no hardcoded colors remain visible</li>
                            </ul>
                        </div>
                    </div>
                </Card>
            </PageContent>
        </PageLayout>
    );
} 