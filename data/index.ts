export const navItems = [
  { name: "About", link: "teaching" },
  { name: "chat", link: "/questions" },
  { name: "Latest", link: "/teaching/history" },
  { name: "Interviews", link: "/user-interviews" },
];

export const gridItems = [
  {
    id: 1,
    title: "Working for the society, to make it a better place.",
    description: "",
    className: "lg:col-span-3 md:col-span-6 md:row-span-4 lg:min-h-[60vh]",
    imgClassName: "w-full h-full",
    titleClassName: "justify-end",
    img: "/b1.png",
    spareImg: "",
  },
  {
    id: 2,
    title: "I aspire to create solutions for clients around the world.",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "",
    spareImg: "",
  },
  {
    id: 3,
    title: "Our tech stack",
    description: "Constantly Adding",
    className: "lg:col-span-2 md:col-span-3 md:row-span-2",
    imgClassName: "",
    titleClassName: "justify-center",
    img: "",
    spareImg: "",
  },
  {
    id: 4,
    title: "Deep Learning enthusiast with a passion for development.",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-1",
    imgClassName: "",
    titleClassName: "justify-start",
    img: "/grid.svg",
    spareImg: "/b4.svg",
  },

  {
    id: 5,
  title: "We brainstorm innovative solutions using industry best practices.",
      description: "DEV's",
    className: "md:col-span-3 md:row-span-2",
    imgClassName: "absolute right-0 bottom-0 md:w-96 w-60",
    titleClassName: "justify-center md:justify-start lg:justify-center",
    img: "/b5.png",
    spareImg: "/grid.svg",
  },
  {
    id: 6,
    title: "Do you want to start a project together?",
    description: "",
    className: "lg:col-span-2 md:col-span-3 md:row-span-1",
    imgClassName: "",
    titleClassName: "justify-center md:max-w-full max-w-60 text-center",
    img: "",
    spareImg: "",
  },
];

// HOC 



export const projects = [
  {
    id: 1,
    title: "Video Generation AI - SaaS App ",
    des: "An app that generates videos from user-provided scripts using AI and ML.",
    img: "tests.png",
    iconLists: ["/postgres.png","/nodepress.png","/firebase.png","/llama.png"],
    link: "https://video-generator-ai.vercel.app/",
  },
  {
    id: 2,
    title: "AI-Powered Supply Chain Solutions ",
    des: "An app that uses AI for Buying and selling ElectronicsProduct.",
    img: "https://sharpbuy-assets.s3.ap-south-1.amazonaws.com/sharpbuy/92ea0ab2cd5e86e670b8a7262256eb717160929403ff9a0b27c1f3142ba68083.com-optimize.gif",
    iconLists: ["/next.svg", "/tail.svg", "/ts.svg", "/stream.svg", "/c.svg"],
    link: "1buy.ai",
  },
  {
    id: 3,
    title: "Mindful Mental Health App",
    des: "A mental health app that helps users practice mindfulness and meditation.",
    img: "/logo.png",
    iconLists: ["/postgres.png","/nodepress.png","/firebase.png","/llama.png"],
    link: "https://github.com/vibhavtrivediwebdev",
  },
  {
    id: 4,
    title: "Smart Krishi - Agriculture App",
    des: "An app that helps farmers monitor their crops and get suggestions.",
    img: "/tester.png",
    iconLists: ["/postgres.png","/nodepress.png","/firebase.png","/llama.png"],
    link: "https://github.com/vibhavtrivediwebdev",
  },
];

export const latest_news = [
  {
    quote:
      "Participated & Won the Code for Impact Hackathon 2024 for developing a solution for the betterment of mental health of the people. Integrated with Fine Tuned AI (GPT-4o, Gemini 1.5-pro, and SDXL-2.0) for better results.",
    name: "Vibhav Trivedi",
    title: "MERN Developer",
  },
  {
    quote:
      "Active Open Source Contributor on GitHub, working on multiple projects to enhance scalability and performance. Passionate about building efficient web applications using MERN stack and optimizing APIs.",
    name: "Vibhav Trivedi",
    title: "MERN Developer",
  },
  {
    quote:
      "Leetcode programmer with a strong problem-solving mindset. Regularly solving complex coding challenges and contributing to discussions on data structures and algorithms to enhance programming efficiency.",
    name: "Vibhav Trivedi",
    title: "MERN Developer",
  },
  {
    quote:
      "SIH 2024 Qualifier and Top Performer. Developed a solution for farmers to help them nurture their crops and get disease predictions along with real-time weather updates and solutions. Incorporated with a custom Hardware Rover for practical implementation.",
    name: "Vibhav Trivedi",
    title: "MERN Developer",
  },
  {
    quote:
      "Participant in the MSME Hackathon 2024. Developed a solution for the betterment of the MSME sector in India and potentially launching it as a startup. Created multiple AI-integrated solutions for the sector.",
    name: "Vibhav Trivedi",
    title: "MERN Developer",
  },
];


export const companies = [
  {
    id: 1,
    name: "NextJS",
    img: "/images2.jpg",
    nameImg: "/checks.png",
  },
  {
    id: 2,
    name: "appwrite",
    img: "/app.svg",
    nameImg: "/appName.svg",
  },
  {
    id: 3,
    name: "Flutter",
    img: "/images.png",
    nameImg: "/second.png",
   
  },
  {
    id: 4,
    name: "stream",
    img: "/s.svg",
    nameImg: "/streamName.svg",
  },
  {
    id: 5,
    name: "docker.",
    img: "/dock.svg",
    nameImg: "/dockerName.svg",
  },
];

export const posts = [
  {
    id: 1,
    title: "Participated in GPT-4o Code and Conquer Hackathon",
    className: "md:col-span-2",
    thumbnail: "/exp1.svg",
  },
  {
    id: 2,
    title: "Participated in Build with AI - Google Developer Groups GGITS Hackathon",
    className: "md:col-span-2", 
    thumbnail: "/exp2.svg",
  },
  {
    id: 3,
    title: "Participated in IngeniumSTEM Summer Hacks 2.0 Hackathon",
    className: "md:col-span-2", // change to md:col-span-2
    thumbnail: "/exp3.svg",
  },
  {
    id: 4,
    title: "Contributed to the Open Source Project - Permit-Cli Tool",
    className: "md:col-span-2",
    thumbnail: "/exp4.svg",
  },
];

export const socialMedia = [
  {
    id: 1,
    img: "/git.svg",
  },
  {
    id: 2,
    img: "/twit.svg",
  },
  {
    id: 3,
    img: "/link.svg",
  },
];
