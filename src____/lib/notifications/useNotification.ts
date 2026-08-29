import { useCallback, useState } from "react";

export const useNotification = () => {
  const [currentNotification, setCurrentNotification] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null);

  const showNotification = useCallback(
    (message: string, type: "info" | "success" | "warning" | "error") => {
      setCurrentNotification({ message, type });
      setTimeout(() => {
        setCurrentNotification(null);
      }, 5000);
    },
    []
  );

  return { currentNotification, showNotification, setCurrentNotification };
};