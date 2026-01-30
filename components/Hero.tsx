import { FaSearch } from "react-icons/fa";

import MagicButton from "./MagicButton";
import { Spotlight } from "./ui/Spotlight";
import { TextGenerateEffect } from "./ui/TextGenerateEffect";
import Link from "next/link";
import { Button } from "./ui/button";
import Image from "next/image";

const Hero = () => {
  return (
    <div className="pb-20 pt-2">
   
   <Spotlight
                className="-top-40 -left-40 md:-left-60 md:-top-40 h-[120vh] w-[70vw] opacity-70"
                fill="rgb(255, 0, 0)"
              />
              <Spotlight
                className="-top-40 -right-40 md:-right-60 md:-top-40 h-[120vh] w-[170vw] opacity-70"
                fill="rgba(18, 109, 255, 0.98)"
              />
              <Spotlight 
                className="top-0 left-1/2 -translate-x-1/2 h-[100vh] w-[80vw] opacity-70" 
                fill="rgb(169, 85, 247)" 
              />

      {/* <div
        className="h-screen mt-10 w-full dark:bg-black-100 bg-whi dark:bg-grid-white/[0.03] bg-grid-black-100/[0.2]
       absolute top-0 left-0 flex items-center justify-center"
      >

       
      </div> */}

      <div className="flex justify-center relative my-20 z-10">
        <div className="max-w-[89vw] md:max-w-2xl lg:max-w-[60vw] flex flex-col items-center justify-center">
          <p className="uppercase tracking-widest text-xs text-center text-blue-100 max-w-96">
            Robust Software Service Company
          </p>

          <TextGenerateEffect
            words="Re-Imagine Re-Create Re-Design
            Your Digital Experience"
            className="text-center text-[40px] md:text-5xl lg:text-6xl"
          />

          <p className="text-center md:tracking-wider mb-4 text-sm md:text-2xl lg:text-2xl">
         building AI-powered apps and modern digital experiences that scale. 
          </p>

          <a href="#about">
            <MagicButton
              title="Show my work"
              icon={<FaSearch />}
              position="right"
            />
          </a>
        </div>
      </div>
      <section className="card-cta">
        <div className="flex flex-col gap-6 max-w-lg">
          <h2>Get Interview-Ready with AI-Powered Practice & Feedback</h2>
          <p className="text-lg">
            Practice real interview questions & get instant feedback
          </p>

          <Button asChild className="btn-primary max-sm:w-full">
            <Link href="/interview">Start an Interview</Link>
          </Button>
        </div>

        <Image
          src="/robot.png"
          alt="robo-dude"
          width={400}
          height={400}
          className="max-sm:hidden"
        />
      </section>
    </div>
  );
};

export default Hero;
