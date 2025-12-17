import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success', duration: number = 3000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, type, message, duration };

        setToasts(prev => [...prev, newToast]);

        // Auto remove after duration
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Toast Container Component
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
    if (toasts.length === 0) return null;

    const getToastStyle = (type: ToastType) => {
        switch (type) {
            case 'success':
                return { background: 'var(--success)', color: 'white' };
            case 'error':
                return { background: 'var(--error)', color: 'white' };
            case 'warning':
                return { background: 'var(--warning)', color: 'white' };
            case 'info':
                return { background: 'var(--info)', color: 'white' };
        }
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return '✓';
            case 'error': return '✕';
            case 'warning': return '⚠';
            case 'info': return 'ℹ';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 'var(--space-lg)',
            right: 'var(--space-md)',
            left: 'var(--space-md)',
            zIndex: 'var(--z-toast)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)',
            pointerEvents: 'none',
        }}>
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    onClick={() => onRemove(toast.id)}
                    className="animate-slide-up"
                    style={{
                        ...getToastStyle(toast.type),
                        padding: 'var(--space-sm) var(--space-md)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-sm)',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 500,
                        maxWidth: '400px',
                        marginLeft: 'auto',
                    }}
                >
                    <span style={{ fontSize: 'var(--font-size-lg)' }}>{getIcon(toast.type)}</span>
                    <span style={{ flex: 1 }}>{toast.message}</span>
                </div>
            ))}
        </div>
    );
};

export default ToastProvider;
