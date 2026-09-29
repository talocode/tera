import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ActivityScreen,
  HomeScreen,
  ReceiveScreen,
  SecurityScreen,
  SendScreen,
  SettingsScreen,
  TokenScreen,
} from "@/components/wallet/session";
import {
  BackupScreen,
  ConfirmScreen,
  ImportScreen,
  LandingScreen,
  PasscodeScreen,
  UnlockScreen,
} from "@/components/wallet/onboarding";
import { subscribe, readRoute } from "@/nav";
import "@/wallet/polyfill";
import "./styles.css";

function applyTheme(value: string | null) {
  const theme = value === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
}

applyTheme(new URLSearchParams(window.location.search).get("theme"));
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  const data = event.data as { type?: string; theme?: string } | null;
  if (data?.type === "tera-theme") applyTheme(data.theme ?? null);
});

function readLocation() {
  return readRoute();
}

function Screen() {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => subscribe(() => setLocation(readLocation())), []);
  const { path, mint } = location;
  if (path === "/backup") return <BackupScreen />;
  if (path === "/confirm") return <ConfirmScreen />;
  if (path === "/passcode") return <PasscodeScreen />;
  if (path === "/import") return <ImportScreen />;
  if (path === "/unlock") return <UnlockScreen />;
  if (path === "/home") return <HomeScreen />;
  if (path === "/receive") return <ReceiveScreen />;
  if (path === "/send") return <SendScreen initialMint={mint} />;
  if (path === "/activity") return <ActivityScreen />;
  if (path === "/settings") return <SettingsScreen />;
  if (path === "/security") return <SecurityScreen />;
  if (path.startsWith("/token/")) {
    return <TokenScreen mint={decodeURIComponent(path.slice("/token/".length))} />;
  }
  return <LandingScreen />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <StrictMode>
    <Screen />
  </StrictMode>,
);
