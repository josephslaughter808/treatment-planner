"use client";

import { getInitials } from "@/lib/account-directory";

type AvatarBadgeProps = {
  name: string;
  accentColor: string;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
};

export function AvatarBadge({
  name,
  accentColor,
  imageUrl,
  size = "md"
}: AvatarBadgeProps) {
  return (
    <div
      aria-label={`${name} profile picture`}
      className={`avatar-badge avatar-${size}`}
      style={
        imageUrl
          ? { backgroundImage: `url(${imageUrl})` }
          : {
              backgroundImage: `linear-gradient(135deg, ${accentColor}, color-mix(in srgb, ${accentColor} 35%, white))`
            }
      }
      title={name}
    >
      {imageUrl ? null : <span>{getInitials(name)}</span>}
    </div>
  );
}
