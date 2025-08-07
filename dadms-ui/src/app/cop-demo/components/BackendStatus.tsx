"use client";

import React, { useEffect, useState } from "react";
import { Icon } from "../../../components/shared/Icon";
import { dadmsTheme } from "../../../design-system/theme";

interface HealthResponse {
    status: string;
    service: string;
    timestamp: string;
    port: number | string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";
const HEALTH_URL = API_BASE.replace(/\/?api\/?$/, "").replace(/\/$/, "") + "/health";

export const BackendStatus: React.FC = () => {
    const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
    const [data, setData] = useState<HealthResponse | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        async function fetchHealth() {
            try {
                const res = await fetch(HEALTH_URL, {
                    signal: controller.signal,
                    headers: { Accept: "application/json" },
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const json = (await res.json()) as HealthResponse;
                if (!isMounted) return;
                setData(json);
                setStatus("ok");
            } catch (e: any) {
                if (!isMounted) return;
                setError(e?.message || "Failed to load backend status");
                setStatus("error");
            }
        }

        fetchHealth();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, []);

    const borderColor =
        status === "ok"
            ? dadmsTheme.colors.accent.success
            : status === "error"
                ? dadmsTheme.colors.accent.error
                : dadmsTheme.colors.border.light;

    return (
        <div
            className="rounded-lg p-4 mb-6"
            style={{
                backgroundColor: dadmsTheme.colors.background.secondary,
                border: `1px solid ${borderColor}`,
                borderRadius: dadmsTheme.borderRadius.lg,
            }}
        >
            <div className="flex items-center gap-2 mb-2">
                <Icon
                    name={status === "ok" ? "check-circle" : status === "error" ? "error" : "loading"}
                    size="sm"
                    className="inline"
                    color={
                        status === "ok"
                            ? dadmsTheme.colors.accent.success
                            : status === "error"
                                ? dadmsTheme.colors.accent.error
                                : dadmsTheme.colors.text.muted
                    }
                />
                <span
                    style={{
                        color: dadmsTheme.colors.text.primary,
                        fontSize: dadmsTheme.typography.fontSize.md,
                        fontWeight: dadmsTheme.typography.fontWeight.semibold,
                    }}
                >
                    Backend Status
                </span>
            </div>

            {status === "loading" && (
                <p
                    style={{
                        color: dadmsTheme.colors.text.muted,
                        fontSize: dadmsTheme.typography.fontSize.sm,
                    }}
                >
                    Checking Project Service at {HEALTH_URL}...
                </p>
            )}

            {status === "error" && (
                <p
                    style={{
                        color: dadmsTheme.colors.accent.error,
                        fontSize: dadmsTheme.typography.fontSize.sm,
                    }}
                >
                    Unable to reach backend: {error}
                </p>
            )}

            {status === "ok" && data && (
                <div
                    className="grid grid-cols-1 md-grid-cols-3 gap-3"
                    style={{ color: dadmsTheme.colors.text.secondary }}
                >
                    <div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.sm, color: dadmsTheme.colors.text.muted }}>
                            Service
                        </div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.md }}>{data.service}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.sm, color: dadmsTheme.colors.text.muted }}>
                            Status
                        </div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.md }}>{data.status}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.sm, color: dadmsTheme.colors.text.muted }}>
                            Port
                        </div>
                        <div style={{ fontSize: dadmsTheme.typography.fontSize.md }}>{String(data.port)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};
