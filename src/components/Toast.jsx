import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({ showToast: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, opts = {}) => {
    const { icon = '✓', type = 'info', duration = 2800 } = opts;
    setToast({ msg, icon, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span style={{ fontSize: 16 }}>{toast.icon}</span>
          <span>{toast.msg}</span>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
