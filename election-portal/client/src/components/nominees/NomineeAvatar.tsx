import { useEffect, useState } from "react";
import {
  extractNomineePhotoRaw,
  getNomineePhotoUrl,
  NOMINEE_DEFAULT_AVATAR,
  type NomineePhotoSource,
} from "@/lib/nomineeHelpers";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
} as const;

interface NomineeAvatarProps {
  nominee: NomineePhotoSource & { name?: string };
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function NomineeAvatar({ nominee, size = "md", className }: NomineeAvatarProps) {
  const name = nominee?.name || "Nominee";
  const assignedPhoto = extractNomineePhotoRaw(nominee);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [assignedPhoto]);

  const showAssignedPhoto = Boolean(assignedPhoto) && !loadFailed;
  const src = showAssignedPhoto ? getNomineePhotoUrl(nominee) : NOMINEE_DEFAULT_AVATAR;

  return (
    <img
      src={src}
      alt={showAssignedPhoto ? `${name} photo` : `${name} (no photo)`}
      loading="lazy"
      decoding="async"
      onError={() => setLoadFailed(true)}
      className={cn(
        sizeClasses[size],
        "shrink-0 rounded-full border border-gray-200 bg-[#E8EDF5] object-cover",
        className,
      )}
    />
  );
}
