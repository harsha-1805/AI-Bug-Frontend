import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(function Input(
  { label, error, id, className = "", maxLength, showCounter = true, value, type, ...props },
  ref
) {
  const currentLength = typeof value === "string" ? value.length : 0;
  const nearLimit = maxLength && currentLength >= maxLength * 0.9;

  // Password fields get a show/hide toggle (eye icon) on the right side —
  // applies everywhere `type="password"` is used (Login, Signup, Settings)
  // since they all render through this shared component.
  const isPassword = type === "password";
  const [revealed, setRevealed] = useState(false);

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
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={isPassword ? (revealed ? "text" : "password") : type}
          maxLength={maxLength}
          value={value}
          style={isPassword ? { paddingRight: "2.5rem" } : undefined}
          className={`input ${error ? "border-red-400 focus:ring-red-200" : ""} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Input;
