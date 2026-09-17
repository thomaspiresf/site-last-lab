import React from "react";
import { ThomasHeader, ThomasFooter } from "../components/ThomasChrome";
import ProjectDetail from "./ProjectDetail";

export default function ThomasProjectDetail() {
  return (
    <div className="w-full bg-white min-h-screen flex flex-col">
      <ThomasHeader />
      <main className="flex-grow">
        <ProjectDetail />
      </main>
      <ThomasFooter />
    </div>
  );
}
