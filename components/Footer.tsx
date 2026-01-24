
import { socialMedia } from "@/data";
import MagicButton from "./MagicButton";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full pt-20 pb-10" id="contact">
      {/* background grid */}
      <div className="w-full absolute left-0 -bottom-72 min-h-96">
        <img
          src="/footer-grid.svg"
          alt="grid"
            height={10000}
             width={10000}
          className="w-full h-full opacity-50 "
        />
      </div>

      <div className="flex flex-col items-center">
        <h1 className="heading lg:max-w-[45vw]">
          Want to <span className="text-purple">Learn More</span> about me & take your
          presence to the next level?
        </h1>
        <p className="text-white-200 md:mt-10 my-5 text-center">
          Reach out to me today and let&apos;s discuss how I can help you
          achieve your goals
        </p>
        <a href="mailto:vibhavtrivedi6@gmail.com">
          <MagicButton
            title="Hire Me Now"
            // icon={<FaLocationArrow />}
            position="right"
          />
        </a>
      </div>
      <div className="flex mt-16 md:flex-row flex-col justify-between items-center">
        <p className="md:text-base text-sm md:font-normal font-light">
          Copyright © 2025 Vibhav Trivedi
        </p>

        <div className="flex items-center md:gap-3 gap-6">
          {socialMedia.map((info) => (
            <div
              key={info.id}
              // onClick={() => {
              //   if (info.id == 1){
              //     window.open(
              //       "https://github.com/vibhavtrivediwebdev",
              //       "_blank"
              //     );
              //   }

              //   else if (info.id == 2) {
              //     window.open("https://x.com",
              //        "_blank");
              //   }

              //   else if (info.id == 3) {
              //     window.open(
              //       "https://video-generator-ai.vercel.app/",
              //       "_blank"
              //     );
              //   }
              // }}
              className="w-10 h-10 cursor-pointer flex justify-center items-center backdrop-filter backdrop-blur-lg saturate-180 bg-opacity-75 bg-black-200 rounded-lg border border-black-300"
            >
              <img src={info.img}  
     alt="icons" width={20} height={20} />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
