"use client";

import React, { useRef, useState } from "react";

const TAB_ERRORS = "Errors";
const TAB_INFO = "Info";
const TAB_AAS = "AAS";
const TABS = [TAB_ERRORS, TAB_INFO, TAB_AAS];

export default function AASCar() {
    const [visible, setVisible] = useState(true);
    const [height, setHeight] = useState(250);
    const [activeTab, setActiveTab] = useState(TAB_AAS);
    const [aasInput, setAasInput] = useState("");
    const dragRef = useRef<HTMLDivElement>(null);
    const startY = useRef<number | null>(null);
    const startHeight = useRef<number>(height);

    const handleDragStart = (e: React.MouseEvent) => {
        startY.current = e.clientY;
        startHeight.current = height;
        document.body.style.cursor = "ns-resize";
        window.addEventListener("mousemove", handleDragMove);
        window.addEventListener("mouseup", handleDragEnd);
    };

    const handleDragMove = (e: MouseEvent) => {
        if (startY.current !== null && startHeight.current !== null) {
            const newHeight = Math.max(100, startHeight.current - (e.clientY - startY.current));
            setHeight(newHeight);
        }
    };

    const handleDragEnd = () => {
        document.body.style.cursor = "";
        window.removeEventListener("mousemove", handleDragMove);
        window.removeEventListener("mouseup", handleDragEnd);
        startY.current = null;
    };

    const handleAasSend = () => {
        if (aasInput.trim()) {
            // For now, just log the input
            console.log("AAS User Input:", aasInput);
            setAasInput("");
        }
    };

    if (!visible) {
        return (
            <button
                className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded shadow-lg hover:bg-blue-700"
                onClick={() => setVisible(true)}
            >
                Show AAS
            </button>
        );
    }

    return (
        <div
            className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t shadow-xl flex flex-col"
            style={{ height }}
        >
            {/* Drag handle */}
            <div
                ref={dragRef}
                className="w-full h-2 cursor-ns-resize bg-gray-200 hover:bg-gray-300"
                onMouseDown={handleDragStart}
                title="Drag to resize"
            />
            {/* Tabs */}
            <div className="flex flex-row border-b bg-gray-50">
                {TABS.map((tab) => (
                    <button
                        key={tab}
                        className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${activeTab === tab
                                ? "border-blue-600 text-blue-700 bg-white"
                                : "border-transparent text-gray-500 hover:text-blue-600"
                            }`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
                <div className="flex-1" />
                <button
                    className="px-3 py-2 text-gray-400 hover:text-red-500"
                    onClick={() => setVisible(false)}
                    title="Hide"
                >
                    &#10005;
                </button>
            </div>
            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-4 bg-white">
                {activeTab === TAB_ERRORS && (
                    <div className="text-red-600">[Errors placeholder]</div>
                )}
                {activeTab === TAB_INFO && (
                    <div className="text-blue-600">[Info placeholder]</div>
                )}
                {activeTab === TAB_AAS && (
                    <div className="flex flex-col h-full">
                        <div className="flex-1 text-gray-800">[AAS Assistant placeholder]</div>
                        <form
                            className="mt-4 flex gap-2"
                            onSubmit={e => {
                                e.preventDefault();
                                handleAasSend();
                            }}
                        >
                            <input
                                type="text"
                                className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring focus:border-blue-400"
                                placeholder="Ask the AAS a question or leave a comment..."
                                value={aasInput}
                                onChange={e => setAasInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                                disabled={!aasInput.trim()}
                            >
                                Send
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
} 