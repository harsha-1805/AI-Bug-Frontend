import { forwardRef } from "react";

const Textarea = forwardRef(function Textarea(
  { label, error, id, className = "", maxLength, showCounter = true, value, ...props },
  ref
) {
  const currentLength = typeof value === "string" ? value.length : 0;
  const nearLimit = maxLength && currentLength >= maxLength * 0.9;

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={id} className="label">
            {label}
          </label>
          {maxLength && showCounter && (
            <span className={`text-[11px] ${nearLimit ? "text-amber-600" : "text-slate-400"}`}>
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        id={id}
        maxLength={maxLength}
        value={value}
        className={`input min-h-[70px] ${error ? "border-red-400 focus:ring-red-200" : ""} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Textarea;
