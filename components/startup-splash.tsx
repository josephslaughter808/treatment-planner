"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import startupOutlineLogo from "@/logo-outline.png";

export function StartupSplash() {
  const [visible, setVisible] = useState(true);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const closeTimer = window.setTimeout(() => setClosing(true), 1450);
    const hideTimer = window.setTimeout(() => setVisible(false), 2350);

    return () => {
      window.clearTimeout(closeTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div aria-hidden="true" className={`startup-splash ${closing ? "startup-splash-hidden" : ""}`}>
      <div className="startup-diagonal startup-diagonal-upper" />
      <div className="startup-diagonal startup-diagonal-lower" />
      <div className="startup-logo-stage">
        <Image alt="ClearPath Care" className="startup-logo" priority src={startupOutlineLogo} />
      </div>
    </div>
  );
}
