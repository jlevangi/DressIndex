import { useState, useEffect } from "react";
import { setConfig } from "../idb-config.js";

function getResolved(pref) {
  if (pref === "light" || pref === "dark") return pref;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyMeta(resolved) {
  const mc = document.querySelector('meta[name="theme-color"]');
  if (mc) mc.setAttribute("content", resolved === "light" ? "#ededed" : "#0a0a0a");
}

export default function useTheme() {
  const [themePref, setThemePref] = useState(() => {
    return localStorage.getItem("dressindex_theme") || "auto";
  });

  const [resolvedTheme, setResolvedTheme] = useState(() => getResolved(themePref));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themePref);
    const resolved = getResolved(themePref);
    setResolvedTheme(resolved);
    applyMeta(resolved);
  }, [themePref]);

  // Listen for system preference changes (matters for auto mode)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const handler = () => {
      if (themePref === "auto") {
        const resolved = getResolved("auto");
        setResolvedTheme(resolved);
        applyMeta(resolved);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [themePref]);

  const setTheme = (pref) => {
    setThemePref(pref);
    localStorage.setItem("dressindex_theme", pref);
    setConfig("theme", pref).catch(() => {});
  };

  return { themePref, resolvedTheme, setTheme };
}
