import React from "react";

export default function Footer() {
  return (
    <footer className="w-full bg-[#222222] py-8 px-6 md:px-12 text-zinc-200">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-medium">
        <p className="text-[#e6e6e6]">© Last Lab. {new Date().getFullYear()}</p>
        <a
          href="mailto:contato@lastlab.com.br"
          className="text-white hover:underline transition-colors"
        >
          contato@lastlab.com.br
        </a>
      </div>
    </footer>
  );
}
