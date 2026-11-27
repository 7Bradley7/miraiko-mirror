import { useTranslations } from "next-intl";
import Image from "next/image";

export type MascotPose = "point" | "wave" | "search" | "read" | "sleep";

/** Size of each pose in /public/mascot, cut from the Figma artwork. */
const poses: Record<MascotPose, { width: number; height: number }> = {
  point: { width: 331, height: 646 },
  wave: { width: 267, height: 646 },
  search: { width: 264, height: 646 },
  read: { width: 330, height: 646 },
  sleep: { width: 349, height: 646 },
};

type MascotProps = {
  pose: MascotPose;
  /** Display width in pixels (260 in the mockups). The height follows the pose. */
  width?: number;
  /** Describes the mascot to screen readers. Leave it off when she is only decoration. */
  decorative?: boolean;
  preload?: boolean;
  className?: string;
};

/**
 * Miraiko, the site mascot (Figma: Mascot/Point, Wave, Search, Read, Sleep).
 * The images have a transparent background (cut out of the Figma artwork, whole poses with
 * a margin so no arm is cut off): she shows in full colour on any background.
 */
export function Mascot({
  pose,
  width = 260,
  decorative = true,
  preload = false,
  className,
}: MascotProps) {
  const t = useTranslations("mascot");
  const art = poses[pose];
  return (
    <Image
      src={`/mascot/${pose}.webp`}
      alt={decorative ? "" : t(pose)}
      width={width}
      height={Math.round((art.height / art.width) * width)}
      preload={preload}
      className={["select-none", className].filter(Boolean).join(" ")}
      draggable={false}
    />
  );
}
