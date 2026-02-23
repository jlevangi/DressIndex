import { useState, useEffect } from "react";

function getIsIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  return isIOS && isSafari;
}

export default function useInstall() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches || !!navigator.standalone;
  });
  const [isIOSSafari] = useState(getIsIOSSafari);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

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
    if (isIOSSafari) {
      setShowIOSGuide(true);
      return;
    }
    if (!installPrompt) return;
    installPrompt.prompt();
    const result = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (result.outcome === "accepted") setIsInstalled(true);
  };

  const canInstall = !isInstalled && (!!installPrompt || isIOSSafari);

  return { installPrompt, isInstalled, handleInstall, canInstall, isIOSSafari, showIOSGuide, setShowIOSGuide };
}
