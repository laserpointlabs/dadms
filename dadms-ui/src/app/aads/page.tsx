"use client";

import { useState } from "react";

export default function AADSPage() {
    const [doc, setDoc] = useState("Executive Summary...\n\nContext...\n\nAlternatives Considered...\n\nDecision & Rationale...\n\nSupporting Data...");
    const [assistantComments, setAssistantComments] = useState([
        { author: "AI Assistant", text: "Consider expanding on the alternatives section for clarity." },
        { author: "Team Member", text: "Looks good, but add more data on risk analysis." }
    ]);
    const [newComment, setNewComment] = useState("");
    const [approvalStatus, setApprovalStatus] = useState("Not Submitted");

    const handleAddComment = () => {
        if (newComment.trim()) {
            setAssistantComments([...assistantComments, { author: "You", text: newComment }]);
            setNewComment("");
        }
    };

    const handleSubmitForApproval = () => {
        setApprovalStatus("Pending Approval (BPMN workflow started)");
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <h1 className="text-2xl font-bold mb-6">Agent Assistance & Documentation Service (AASD)</h1>
            {/* 1. Decision Review */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">1. Decision Review</h2>
                <div className="bg-gray-50 border rounded p-4 text-sm mb-2">
                    <b>Process:</b> Air Refueling Process X<br />
                    <b>Outcome:</b> Use probe Y for tanker fleet Z<br />
                    <b>Key Data:</b> [Summary of supporting data, context, and rationale]
                </div>
            </section>
            {/* 2. Assistant/Team Collaboration */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">2. Assistant/Team Collaboration</h2>
                <div className="bg-white border rounded p-4 mb-2 min-h-[80px]">
                    {assistantComments.map((c, i) => (
                        <div key={i} className="mb-1"><b>{c.author}:</b> {c.text}</div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        className="border rounded px-2 py-1 flex-1"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") handleAddComment(); }}
                    />
                    <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleAddComment}>Add</button>
                </div>
            </section>
            {/* 3. White Paper Editor */}
            <section className="mb-8">
                <h2 className="text-xl font-semibold mb-2">3. White Paper Editor</h2>
                <textarea
                    className="w-full border rounded p-2 min-h-[200px] font-mono"
                    value={doc}
                    onChange={e => setDoc(e.target.value)}
                />
            </section>
            {/* 4. Approval Submission/status */}
            <section>
                <h2 className="text-xl font-semibold mb-2">4. Approval Submission</h2>
                <div className="flex items-center gap-4 mb-2">
                    <button
                        className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50"
                        onClick={handleSubmitForApproval}
                        disabled={approvalStatus !== "Not Submitted"}
                    >
                        Submit for Approval
                    </button>
                    <span className="text-sm">Status: <b>{approvalStatus}</b></span>
                </div>
                {approvalStatus !== "Not Submitted" && (
                    <div className="text-xs text-gray-500">Approval process managed via BPMN workflow. Status updates will appear here.</div>
                )}
            </section>
        </div>
    );
} 