"use client";

import { Icon } from '../../components/shared/Icon';
import { dadmsTheme } from '../../design-system/theme';
import { BackendStatus } from './components/BackendStatus';

export default function COPDemoPage() {
    return (
        <div
            className="min-h-screen p-8"
            style={{ backgroundColor: dadmsTheme.colors.background.primary }}
        >
            <div className="max-w-4xl mx-auto">
                <div
                    className="rounded-lg p-8"
                    style={{
                        backgroundColor: dadmsTheme.colors.background.elevated,
                        border: `1px solid ${dadmsTheme.colors.border.default}`,
                        boxShadow: dadmsTheme.shadows.md
                    }}
                >
                    <h1
                        className="text-3xl font-bold mb-4"
                        style={{
                            color: dadmsTheme.colors.text.primary,
                            fontSize: dadmsTheme.typography.fontSize.xxxl,
                            fontWeight: dadmsTheme.typography.fontWeight.bold
                        }}
                    >
                        Blue Force COP Demonstration
                    </h1>
                    <div
                        className="text-lg mb-8"
                        style={{
                            color: dadmsTheme.colors.text.secondary,
                            fontSize: dadmsTheme.typography.fontSize.lg
                        }}
                    >
                        Common Operating Picture - AI-Driven Semantic Interoperability
                    </div>

                    <div
                        className="rounded-lg p-6 mb-8"
                        style={{
                            backgroundColor: dadmsTheme.colors.background.secondary,
                            border: `1px solid ${dadmsTheme.colors.accent.info}`,
                            borderRadius: dadmsTheme.borderRadius.lg
                        }}
                    >
                        <h2
                            className="text-xl font-semibold mb-2"
                            style={{
                                color: dadmsTheme.colors.accent.info,
                                fontSize: dadmsTheme.typography.fontSize.xl,
                                fontWeight: dadmsTheme.typography.fontWeight.semibold
                            }}
                        >
                            <Icon name="beaker" size="sm" className="inline mr-2" />
                            Coming Soon
                        </h2>
                        <p
                            style={{
                                color: dadmsTheme.colors.text.secondary,
                                fontSize: dadmsTheme.typography.fontSize.md
                            }}
                        >
                            This is the foundation for our Blue Force COP demonstration.
                            We'll be building the Program Manager dashboard, AI persona coordination,
                            and semantic ontology integration here.
                        </p>
                    </div>

                    {/* Backend health status */}
                    <BackendStatus />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { icon: "pulse", title: "PM Dashboard", desc: "Real-time workflow monitoring and persona oversight" },
                            { icon: "robot", title: "AI Personas", desc: "Standards Analyst, Data Modeler, Pipeline Engineer, UI Prototyper" },
                            { icon: "type-hierarchy", title: "Ontology Integration", desc: "Semantic interoperability through knowledge extraction" },
                            { icon: "lightbulb-sparkle", title: "Live Demo", desc: "Link-16 and VMF standards integration demonstration" }
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="rounded-lg p-4 transition-colors"
                                style={{
                                    backgroundColor: dadmsTheme.colors.background.secondary,
                                    border: `1px solid ${dadmsTheme.colors.border.light}`,
                                    borderRadius: dadmsTheme.borderRadius.lg,
                                    transition: dadmsTheme.transitions.fast
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = dadmsTheme.colors.background.hover;
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = dadmsTheme.colors.background.secondary;
                                }}
                            >
                                <h3
                                    className="font-semibold mb-2"
                                    style={{
                                        color: dadmsTheme.colors.text.primary,
                                        fontSize: dadmsTheme.typography.fontSize.lg,
                                        fontWeight: dadmsTheme.typography.fontWeight.semibold
                                    }}
                                >
                                    <Icon name={item.icon as any} size="sm" className="inline mr-2" />
                                    {item.title}
                                </h3>
                                <p
                                    className="text-sm"
                                    style={{
                                        color: dadmsTheme.colors.text.muted,
                                        fontSize: dadmsTheme.typography.fontSize.sm
                                    }}
                                >
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}