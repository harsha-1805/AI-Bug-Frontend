 
import { ArrowLeft, Bot } from "lucide-react";

import { Link } from "react-router-dom";

import logo from "../../Public/Logos/logo.png";
 
/** Shared login/signup shell. The right panel uses CSS only, so no image asset is required. */

export default function AuthLayout({ children, title, subtitle }) {

  return (
<div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(360px,2fr)]">
<main className="flex min-h-screen flex-col px-6 py-12 sm:px-10 lg:px-[12%] xl:px-[18%]">
<section className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center">
<div className="mb-8">
<img

              src={logo}

              alt="Efficient Brains IT Solutions Pvt Ltd"

              className="mb-9 h-auto max-h-28 w-auto max-w-full object-contain object-left sm:max-h-32"

            />
<h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>

            {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
</div>

          {children}
</section>
</main>
 
      <aside className="relative hidden min-h-screen items-center justify-center overflow-hidden bg-[#191d59] lg:flex">

        {/* CSS grid decoration; keep this panel image-free until an asset is added. */}
<div

          aria-hidden="true"

          className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(135,148,255,.22)_1px,transparent_1px),linear-gradient(90deg,rgba(135,148,255,.22)_1px,transparent_1px)] [background-size:58px_58px]"

        />
<div aria-hidden="true" className="absolute left-[17%] top-[38%] h-[58px] w-[58px] bg-indigo-300/15" />
<div aria-hidden="true" className="absolute bottom-[37%] right-[15%] h-[58px] w-[58px] bg-indigo-300/15" />
 
        <div className="relative z-10 max-w-md px-8 text-center">
<div className="flex items-center justify-center gap-4 text-white">
<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5065ff] shadow-lg shadow-indigo-950/30">
<Bot size={29} strokeWidth={2.25} />
</div>
<span className="text-4xl font-bold tracking-tight">BugPilot AI</span>
</div>
<p className="mt-5 text-base leading-7 text-indigo-200">Manage bugs smarter with your AI-powered workspace.</p>
</div>
</aside>
</div>

  );

}
 