
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import UserInterviews from "@/components/UserInterviews";
import AvailableInterviews from "@/components/AvailableInterviews";

import { getCurrentUser } from "@/lib/actions/auth.action";
import {
  getInterviewsByUserId,
  getLatestInterviews,
} from "@/lib/actions/general.action";
import FloatingNav from "@/components/ui/FloatingNavbar";
import Hero from "@/components/Hero";
import RecentProjects from "@/components/RecentProjects";
import Grid from "@/components/Grid";
import Approach from "@/components/Approach";
import Clients from "@/components/Clients";
import Experience from "@/components/Experience";
import { navItems } from "../../data";
import PinterestImageGrid from "../components/PinterestImageGrid";
import Footer from "@/components/Footer";
import { Desktop } from "@/components/Dekstop/deskstop";
import FuturisticPortfolio from "../components/terminal/modelviewr";
import AnimatedPortfolioScene from "../components/three/room";
import HeroPage from "../components/three/room";
import PortfolioView from "../components/terminal/PortfolioView";
import RetroTerminal from "../components/terminal/retroAnimation";


async function Home() {
  // const user = await getCurrentUser();
  // const [userInterviews, allInterview] = await Promise.all([
  //   getInterviewsByUserId(user?.id!),
  //   getLatestInterviews({ userId: user?.id! }),
  // ]);

  return (
    <>
      

      <div className="max-w-9xl w-full">
   {/* <FloatingNav navItems={navItems} /> */}
      {/* <Desktop /> */}
      <PortfolioView />

  
      

      
      {/* <HeroPage /> */}
       
       
      
      {/* <Hero />
      <PinterestImageGrid />
        <Grid />
        <RecentProjects />
        <Clients />
          <Experience />
       <Approach /> 
        <Footer />   */}
     
      </div>

      {/* <UserInterviews interviews={userInterviews || []} userId={user?.id} />
      
      <AvailableInterviews interviews={allInterview || []} userId={user?.id} /> */}
    </>
  );
}

export default Home;
