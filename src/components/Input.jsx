import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, error, id, className = "", ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input ref={ref} id={id} className={`input ${error ? "border-red-400 focus:ring-red-200" : ""} ${className}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
});

export default Input;
