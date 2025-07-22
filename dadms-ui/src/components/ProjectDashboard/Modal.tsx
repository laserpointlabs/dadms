import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="bg-theme-surface border border-theme-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
                <button
                    className="absolute top-4 right-4 text-theme-text-secondary hover:text-theme-text-primary text-2xl leading-none transition-colors"
                    onClick={onClose}
                    aria-label="Close"
                >
                    &times;
                </button>
                {title && <h2 className="text-xl font-semibold mb-4 text-theme-text-primary">{title}</h2>}
                <div className="text-theme-text-primary">
                    {children}
                </div>
            </div>
        </div>
    );
}; 