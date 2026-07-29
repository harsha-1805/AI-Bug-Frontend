import { Bot } from "lucide-react";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Bot size={22} />
          </div>
          <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <div className="card p-7">{children}</div>
      </div>
    </div>
  );
}
