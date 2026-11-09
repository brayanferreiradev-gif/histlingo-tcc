/** Muiraquitã em pixel art: logo do HistLingo. */
export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo-frog.png"
      alt="HistLingo"
      draggable={false}
      width={size}
      height={Math.round((size * 38) / 40)}
      style={{ imageRendering: "pixelated" }}
      className={`select-none shrink-0 ${className}`}
    />
  )
}
