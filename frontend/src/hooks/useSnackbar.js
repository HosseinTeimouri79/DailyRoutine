import { useCallback, useEffect, useState } from "react";

export function useSnackbar(timeout = 2600) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const notify = useCallback((message, type = "success") => {
    setSnackbar({ open: true, type, message });
  }, []);

  useEffect(() => {
    if (!snackbar.open) return;
    const timer = setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, timeout);
    return () => clearTimeout(timer);
  }, [snackbar.open, timeout]);

  return { snackbar, notify };
}
