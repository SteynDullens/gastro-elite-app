"use client";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

type PinKeypadProps = {
  disabled?: boolean;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
};

/** Touch-friendly numeric keypad (no empty grid cells that steal taps on iOS). */
export default function PinKeypad({ disabled, onDigit, onBackspace }: PinKeypadProps) {
  const keyClass =
    "min-h-[52px] rounded-xl py-3 text-lg font-medium text-gray-800 touch-manipulation active:bg-gray-200 disabled:opacity-50";

  return (
    <div className="grid grid-cols-3 gap-2 select-none">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          disabled={disabled}
          onPointerUp={(e) => {
            e.preventDefault();
            if (!disabled) onDigit(key);
          }}
          className={keyClass}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          {key}
        </button>
      ))}
      <div aria-hidden className="min-h-[52px]" />
      <button
        type="button"
        disabled={disabled}
        onPointerUp={(e) => {
          e.preventDefault();
          if (!disabled) onDigit("0");
        }}
        className={keyClass}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        0
      </button>
      <button
        type="button"
        disabled={disabled}
        onPointerUp={(e) => {
          e.preventDefault();
          if (!disabled) onBackspace();
        }}
        className={keyClass}
        style={{ WebkitTapHighlightColor: "transparent" }}
        aria-label="Backspace"
      >
        ⌫
      </button>
    </div>
  );
}
