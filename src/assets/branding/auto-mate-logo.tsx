/**
 * AUTO/MATE brand mark — 🦦.
 *
 * Drop-in replacement for the SVGR-generated logo components this app used to
 * render (`width`/`height`/`className` land on the root `<svg>`), so it slots
 * into the same layout boxes without touching their sizing.
 *
 * The glyph is emoji text inside the SVG rather than traced paths: it picks up
 * the platform's color emoji font, so it renders identically in the browser
 * and in the Electron shell with no asset pipeline. The square viewBox plus
 * the default `xMidYMid meet` means a non-square width/height letterboxes the
 * otter instead of stretching it.
 */
export type AutoMateLogoProps = React.SVGProps<SVGSVGElement>;

export function AutoMateLogo({
  width = 32,
  height = 32,
  ...props
}: AutoMateLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={width}
      height={height}
      {...props}
    >
      <text
        x="16"
        y="16"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="26"
      >
        🦦
      </text>
    </svg>
  );
}

export default AutoMateLogo;
