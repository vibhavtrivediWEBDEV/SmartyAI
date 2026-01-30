"use client";

import Hero from "@/components/Hero";
import Grid from "@/components/Grid";
import RecentProjects from "@/components/RecentProjects";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import Approach from "@/components/Approach";
import Footer from "@/components/Footer";
import PinterestImageGrid from "@/app/components/PinterestImageGrid";
import { navItems } from "@/data";
import FloatingNav from "../ui/FloatingNavbar";

export default function Webpage() {
  return (
    <div  className="w-full   overflow-auto h-screen">
       {/* <FloatingNav navItems={navItems} /> */}
      <Hero />
      {/* <PinterestImageGrid /> */}
      <Grid />
       <RecentProjects />
      <Clients />
      <Experience />
      <Approach />
      <Footer /> 
    </div>
  );
}
