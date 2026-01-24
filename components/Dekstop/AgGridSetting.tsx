// // Updated dummy data with content, src, and url for various file types
// const projectData: ProjectCategory[] = [
//     // Existing entries from before...
//     {
//       name: "Work",
//       files: [
//         { name: "Work Portfolio.pdf", type: "document", src: "https://ncert.nic.in/textbook/pdf/leph2ps.pdf" },
//         { name: "Client List.xlsx", type: "spreadsheet" },
//         { name: "Team Photo.jpg", type: "image", src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80" },
//       ],
//     },
//     {
//       name: "About Me",
//       files: [
//         {
//           name: "My Story.txt",
//           type: "document",
//           content:
//             "This is a placeholder for my personal story. It's a journey of learning, building, and growing in the world of web development and design. I'm passionate about creating intuitive and impactful digital experiences.",
//         },
//         {
//           name: "Skills.md",
//           type: "document",
//           content:
//             "# My Skills\n\n- React.js\n- Next.js\n- Tailwind CSS\n- TypeScript\n- Node.js\n- Three.js / React Three Fiber\n- UI/UX Design Principles",
//         },
//         {
//           name: "Profile Photo.png",
//           type: "image",
//           src: "https://media.licdn.com/dms/image/v2/D4D03AQHq7rCxnoi26w/profile-displayphoto-crop_800_800/B4DZiD16fFHwAQ-/0/1754558606323?e=1757548800&v=beta&t=mrtA9OYPNBjL_tQl0IEUUycfxVl8a6LPtt8M_xzGE7Y",
//         },
//       ],
//     },
//     {
//       name: "Resume",
//       files: [
//         { name: "Resume_Vibhav.pdf", type: "document", src: "/VIBHAV.pdf" },
//         { name: "Cover Letter.docx", type: "document" },
//         { name: "Certification_TeamLead.pdf", type: "document", src: "https://media.licdn.com/dms/image/v2/D5622AQGBDc92mR-thA/feedshare-shrink_1280/B56ZQWqEJdG4Ak-/0/1735546914254?e=1757548800&v=beta&t=_n-wB9GRPip3y0fQ3kxapnapyHC4QpsTPm0Waqq1ZWk" },
//       ],
//     },
//     {
//       name: "Trash",
//       files: [
//         {
//           name: "Old Ideas.txt",
//           type: "document",
//           content: "Just some old ideas that didn't quite make the cut. Sometimes, you have to discard to innovate!",
//         },
//         { name: "Temporary.zip", type: "archive" },
//         { name: "Unused_Designs.psd", type: "image", src: "b1.png" },
//       ],
//     },
//     {
//       name: "Project 01 (Sharp buy)",
//       files: [
//         { name: "Full case study.fig", type: "folder", icon: <FolderIcon /> },
//         {
//           name:"sharpy",
//           type: "video",
//           src: "https://sharpbuy-assets.s3.ap-south-1.amazonaws.com/sharpbuy/3d45f2d1fb8a0891fc370e6a9483043075044110f5cea6d17d7998d318da202c.AI+Video+V-2+%281%29.mp4",
//         },
//         {
//           name: "overview",
//           type: "document",
//           content:
//             "sharpbuy TL;DR: A design project focused on creating a minimalist and intuitive user interface for a complex data visualization tool. Emphasized clean aesthetics and user flow optimization.",
//         },
        
//         { name: "sharpbuy.ai", type: "link", icon: <GlobeIcon />, url: "https://sharpbuy.ai" },
//         { name: "Design Mockup.png", type: "image", src: "https://via.placeholder.com/600x400?text=AbsolutMess+Mockup" },
//       ],
//     },
//     {
//       name: "Project 02 (My MilkMen)",
//       files: [
//         { name: "Full case study.fig", type: "folder", icon: <FolderIcon /> },
//         { name: "simplingo.mov", type: "video", src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" },
//         {
//           name: "milkmenTL;DR.txt",
//           type: "document",
//           content:
//             "An AI-powered language learning platform. Focused on adaptive learning paths and interactive exercises to make language acquisition engaging and efficient.",
//         },
//         { name: "AI Language Model.pdf", type: "document", src: "https://ncert.nic.in/textbook/pdf/leph2ps.pdf" },
//       ],
//     },
//     {
//       name: "Project 03 (pondriee)",
//       files: [
//         { name: "Full case study.fig", type: "folder", icon: <FolderIcon /> },
//         { name: "leafpress.ai", type: "link", icon: <GlobeIcon />, url: "https://leafpress.vercel.app" },
//         {
//           name: "TL;DR.txt",
//           type: "document",
//           content:
//             "Leafpress TL;DR: A content management system designed for environmental non-profits. Features include easy publishing, donation tracking, and volunteer management, all with a green focus.",
//         },
//         { name: "Leafpress Screenshot.png", type: "image", src: "https://via.placeholder.com/600x400?text=Leafpress+Screenshot" },
//       ],
//     },
//     {
//       name: "Project 04 (Nirantara)",
//       files: [
//         { name: "Amazon_Redesign.fig", type: "image", icon: <FileImage />, src: "https://via.placeholder.com/600x400?text=Amazon+Redesign" },
//         { name: "User Research.pdf", type: "document", src: "https://ncert.nic.in/textbook/pdf/leph2ps.pdf" },
//         { name: "Usability Test.mp4", type: "video", src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" },
//       ],
//     },
  
//     // NEW extended data starts here:
  
//     {
//       name: "Freelance Projects",
//       files: [
//         { name: "E-commerce Store", type: "folder", icon: <FolderIcon /> },
//         {
//           name: "Landing Page Design.pdf",
//           type: "document",
//           src: "https://via.placeholder.com/500x700?text=Landing+Page+Design+PDF",
//         },
//         {
//           name: "Client Feedback.txt",
//           type: "document",
//           content: "Client was happy with the final design and requested additional SEO optimization.",
//         },
//         { name: "Store Demo Link", type: "link", icon: <GlobeIcon />, url: "https://mystore.demo.com" },
//         { name: "Promo Video.mp4", type: "video", src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" },
//       ],
//     },
//     {
//       name: "UI Kits & Templates",
//       files: [
//         { name: "Dark Mode UI Kit.sketch", type: "folder", icon: <FolderIcon /> },
//         { name: "Responsive Templates.zip", type: "archive" },
//         { name: "Wireframe Examples.pdf", type: "document", src: "https://example.com/wireframes.pdf" },
//         {
//           name: "Component Library.md",
//           type: "document",
//           content:
//             "This component library contains reusable React components styled with Tailwind CSS for rapid UI development.",
//         },
//       ],
//     },
//     {
//       name: "Design Inspirations",
//       files: [
//         { name: "Behance Collection.url", type: "link", icon: <GlobeIcon />, url: "https://www.behance.net/gallery/123456789/Inspiration-Collection" },
//         { name: "Dribbble Shots.pdf", type: "document", src: "https://example.com/dribbble-shots.pdf" },
//         {
//           name: "Color Palettes.png",
//           type: "image",
//           src: "https://via.placeholder.com/600x200?text=Color+Palettes",
//         },
//         {
//           name: "Typography Guide.txt",
//           type: "document",
//           content:
//             "A comprehensive typography guide covering font choices, sizes, line heights, and usage in web design projects.",
//         },
//       ],
//     },
//     {
//       name: "Tech Blog",
//       files: [
//         {
//           name: "Building Scalable React Apps.md",
//           type: "document",
//           content:
//             "# Building Scalable React Apps\n\nIn this post, we discuss strategies for optimizing React apps for performance and scalability, including code splitting and memoization.",
//         },
//         {
//           name: "Next.js SEO Tips.txt",
//           type: "document",
//           content:
//             "Tips and tricks to improve SEO in Next.js apps using static generation and server-side rendering.",
//         },
//         {
//           name: "Deploying to Vercel.pdf",
//           type: "document",
//           src: "https://example.com/deploying-vercel.pdf",
//         },
//       ],
//     },
//     {
//       name: "Learning & Tutorials",
//       files: [
//         { name: "React Tutorial.pdf", type: "document", src: "https://example.com/react-tutorial.pdf" },
//         { name: "Advanced TypeScript.md", type: "document", content: "# Advanced TypeScript\n\nLearned types, generics, and advanced typing techniques." },
//         { name: "Three.js Basics.mp4", type: "video", src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" },
//         { name: "Tailwind CSS Guide.pdf", type: "document", src: "https://example.com/tailwind-guide.pdf" },
//       ],
//     },
//     {
//       name: "Personal Projects",
//       files: [
//         {
//           name: "MyPortfolioWebsite",
//           type: "folder",
//           icon: <FolderIcon />,
//         },
//         {
//           name: "Portfolio Live Link",
//           type: "link",
//           icon: <GlobeIcon />,
//           url: "https://vibhav-portfolio.vercel.app",
//         },
//         {
//           name: "Code Snippet.js",
//           type: "document",
//           content:
//             `// Example React hook for fetching user data
//   import { useState, useEffect } from "react";
//   export function useUserData(userId) {
//     const [data, setData] = useState(null);
//     useEffect(() => {
//       fetch('/api/users/' + userId)
//         .then(res => res.json())
//         .then(setData);
//     }, [userId]);
//     return data;
//   }
//   `,
//         },  
//         {
//           name: "Project Screenshots.zip",
//           type: "archive",
//         },
//       ],
//     },
//     {
//       name: "Certificates",
//       files: [
//         {
//           name: " Teamwork Developer.pdf",
//           type: "document",
//           src: "https://media.licdn.com/dms/image/v2/D5622AQGBDc92mR-thA/feedshare-shrink_1280/B56ZQWqEJdG4Ak-/0/1735546914254?e=1757548800&v=beta&t=_n-wB9GRPip3y0fQ3kxapnapyHC4QpsTPm0Waqq1ZWk",
//         },
        
//       ],
//     },
//     {
//       name: "Videos & Tutorials",
//       files: [
//         {
//           name: "React Hooks Deep Dive.mp4",
//           type: "video",
//           src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//         },
//         {
//           name: "Next.js Incremental Static Regeneration.mov",
//           type: "video",
//           src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//         },
//         {
//           name: "Design Systems Webinar.mp4",
//           type: "video",
//           src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//         },
//       ],
//     },
//     {
//       name: "Research Papers",
//       files: [
//         {
//           name: "Web Accessibility Standards.pdf",
//           type: "document",
//           src: "https://example.com/accessibility-standards.pdf",
//         },
//         {
//           name: "AI in UI Design.pdf",
//           type: "document",
//           src: "https://example.com/ai-ui-design.pdf",
//         },
//         {
//           name: "Progressive Web Apps.pdf",
//           type: "document",
//           src: "https://example.com/pwa.pdf",
//         },
//       ],
//     },
//   ];