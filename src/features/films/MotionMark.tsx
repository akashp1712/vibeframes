/** SVG marks keep the motion vocabulary independent of installed symbol fonts. */
export function MotionMark({ kind }: { kind: "arrow" | "check" | "spark" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "inline-block", verticalAlign: "middle" }}
      aria-hidden
    >
      {kind === "arrow" ? (
        <path d="M5 19 19 5M5 5h14v14" />
      ) : kind === "check" ? (
        <path d="m4 12 5 5L20 6" />
      ) : (
        <path d="M12 2v20M2 12h20M5 5l14 14M5 19 19 5" />
      )}
    </svg>
  );
}
