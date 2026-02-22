import { useState, useEffect } from "react";

export default function useInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
  );

  // Detect standalone (installed PWA) mode
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const handler = (e) => setIsInstalled(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Capture beforeinstallprompt and appinstalled events
  useEffect(() => {
    const onBeforeInstall = (e) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setIsInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (result.outcome === "accepted") setIsInstalled(true);
  };

  return { installPrompt, isInstalled, handleInstall };
}
