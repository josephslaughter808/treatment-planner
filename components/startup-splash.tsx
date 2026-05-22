"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
        <Image alt="ClearPath Care" className="startup-logo" height={520} priority src="/clearpath-silhouette-logo.svg" width={420} />
      </div>
    </div>
  );
}
