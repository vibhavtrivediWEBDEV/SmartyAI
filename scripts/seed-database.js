"use client"

const admin = require("firebase-admin")

// Initialize Firebase Admin (you'll need to set up your service account)
const serviceAccount = {
  type: "service_account",
  project_id: "smarty-a99d5",
//   private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDdafxDbdFPkuov\ns0698o7nYedtPDEdTT2zW3sCGXVYoPDKxATKJ1aej0tBM/rHzeiSlE60OL7NPeT2\nIII8JMw+Kvhl/QGTA1LbXOIeCX6mlaYy93fZV0lTaEukwRTlYsm3ThNRem0vGvB3\n7B0bKnZwGv+g6hvVHO/VkcROM578P1Lg48ty0GJmiruGsv+g4BSqFztjSUL0YUYT\njnEDz6LzQ2BAA2wHl3wUguO4lKFRbUIwKgc71WSxr61of7/JgayBuFKzrKEMEAsm\ncMLNP8kzogIvat0ZhCF+p/cJrI6I2At5qzpak0jqvPfAWd1t65t2CBKHYqMQM4Nk\nrTDkF4KFAgMBAAECggEALSoAnV+CBeWNtBezDO90o3GW07MmwJegKZ0UOSAozeCc\nZXv5DyRZmKPZoa4A7m9LzNSIPl5h2ztQID2O20ZVTCwXObSTdOHFbb4jWKWuqjvV\n6EkO7yxNJoCch3mkMctGIshADAt5SJXJ7ehhoog1mxYCxVfjwAO0T1/5x0rj2AeQ\nkX/MXHuuxEPYOBwekOo49QMQZ7XslUY5xm3QOXeVGucNGO5BWTn0sIXSLevCm3zM\nUxhCxRRl6wLjGbcGsaDTpHoo1tm/y3C89xnEKCwS+U1Jx3bR01r74c7wcywMTiWt\ns1if+gia0uOTr51CuBUGzjPu1CbnNdETEOmwgq7msQKBgQDzNi5mh5IyRR+RTpgN\nqWwqoRAho+eTXL264PkB5KK6PjLqTyAEcdBzvPXLZJbn8JvRyokQRnlDhrg/jIs2\nw5TFrZoE75pnkJHQUOks1n6372IDOAkoJYYCugcTfMRUM4yx1TIOaEOBjzNS6CdE\nM8z2m/hYgRNuAmhwtOggPnnj1QKBgQDpDmQRRZJp8efcBsJZjWLEmPyAsluw8EhJ\n+Zs/dkXMMr8fKLLV04ob474Ca7p/f3DHa7ZFf/QmlFP0THylAfh2hy2VhmW7+HvJ\nBSG5CbtmrWRa7bziIQgvBU0KhKr/JFyrWYFHvVAXuFSGjPMHbYhIDoq01pQorwPj\nV/e1UaZr8QKBgBCYieIFLjyv6s+HhWipPvBJvUgOXyb3FRtDbrpqV5BN3juO2qhy\n+75qDnuqiYGaMYfHQkMSDARHlRsBBB7gia5TgkcD8o1OmCSW4NJmcI8sjouZr0ZG\nCTb2arUxtlPokJkx6xCAnNqiYuYtYUCOKFZLnk6rwB+pmmbWcWCB4t9hAoGAbGaQ\nLuRwVKz7DoFqVqMHxK/wCqBrO6KXzSi3iE4n6vHTqdeRTxnkzFIi6BdZmMIbH/a+\nwhbg5izp2+DTvSBshB0eG8V2fnb2hKrJY7reGsUdv5mC2J9KoixSCElrC9/K5rxs\nAIVSwqWvUyIuTE8rK3DwHWsNYNr+8PjSs9i1ktECgYEA1AvRL+YVkyn4zStia3VJ\nXcKSga5NO8Jp0aqgawIpODvcfLTconU/CRmZSaLPlvU21qdY7iM75TwASVwX9PZu\n/+l+032ZY+WK+SrNRHfPPYzWlquHXuByy3+jZdTxzfl66aiVeAQ7IfqhcJTpainD\nuq9ot7vwZA2mldL2FEbc66A=\n-----END PRIVATE KEY-----\n"?.replace(/\\n/g, "\n"),
  client_email: "firebase-adminsdk-fbsvc@smarty-a99d5.iam.gserviceaccount.com",
  // client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc@smarty-a99d5.iam.gserviceaccount.com`,
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://smarty-a99d5-default-rtdb.firebaseio.com`,
  })
}

const db = admin.firestore()

// Your project data
const projectData = [
  // {
  //   name: "Work",
  //   files: [
  //     { name: "Work Portfolio.pdf", type: "document", src: "https://ncert.nic.in/textbook/pdf/leph2ps.pdf" },
  //     { name: "Client List.xlsx", type: "spreadsheet" },
  //     {
  //       name: "Team Photo.jpg",
  //       type: "image",
  //       src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
  //     },
  //   ],
  // },
  // {
  //   name: "About Me",
  //   files: [
  //     {
  //       name: "My Story.txt",
  //       type: "document",
  //       content:
  //         "This is a placeholder for my personal story. It's a journey of learning, building, and growing in the world of web development and design. I'm passionate about creating intuitive and impactful digital experiences.",
  //     },
  //     {
  //       name: "Skills.md",
  //       type: "document",
  //       content:
  //         "# My Skills\n\n- React.js\n- Next.js\n- Tailwind CSS\n- TypeScript\n- Node.js\n- Three.js / React Three Fiber\n- UI/UX Design Principles",
  //     },
  //     {
  //       name: "Profile Photo.png",
  //       type: "image",
  //       src: "https://media.licdn.com/dms/image/v2/D4D03AQHq7rCxnoi26w/profile-displayphoto-crop_800_800/B4DZiD16fFHwAQ-/0/1754558606323?e=1757548800&v=beta&t=mrtA9OYPNBjL_tQl0IEUUycfxVl8a6LPtt8M_xzGE7Y",
  //     },
  //   ],
  // },
  // {
  //   name: "Resume",
  //   files: [
  //     { name: "Resume_Vibhav.pdf", type: "document", src: "/VIBHAV.pdf" },
  //     { name: "Cover Letter.docx", type: "document" },
  //     {
  //       name: "Certification_TeamLead.pdf",
  //       type: "document",
  //       src: "https://media.licdn.com/dms/image/v2/D5622AQGBDc92mR-thA/feedshare-shrink_1280/B56ZQWqEJdG4Ak-/0/1735546914254?e=1757548800&v=beta&t=_n-wB9GRPip3y0fQ3kxapnapyHC4QpsTPm0Waqq1ZWk",
  //     },
  //   ],
  // },
  // {
  //   name: "Trash",
  //   files: [
  //     {
  //       name: "Old Ideas.txt",
  //       type: "document",
  //       content: "Just some old ideas that didn't quite make the cut. Sometimes, you have to discard to innovate!",
  //     },
  //     { name: "Temporary.zip", type: "archive" },
  //     { name: "Unused_Designs.psd", type: "image", src: "b1.png" },
  //   ],
  // },
  // {
  //   name: "Project 01 (Sharp buy)",
  //   files: [
  //     { name: "Full case study.fig", type: "folder" },
  //     {
  //       name: "sharpy",
  //       type: "video",
  //       src: "",
  //     },
  //     {
  //       name: "overview",
  //       type: "document",
  //       content:
  //         "sharpbuy TL;DR: A design project focused on creating a minimalist and intuitive user interface for a complex data visualization tool. Emphasized clean aesthetics and user flow optimization.",
  //     },
  //     { name: "sharpbuy.ai", type: "link", url: "https://sharpbuy.ai" },
  //     { name: "Design Mockup.png", type: "image", src: "https://via.placeholder.com/600x400?text=AbsolutMess+Mockup" },
  //   ],
  // },
  {
    name: "Project 02 ShowCraft Gloobal solution",
    files: [
      { name: "Full case study.fig", type: "folder" },
      {
        name: "simplingo.mov",
        type: "video",
        src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
      },
      {
        name: "Showcraft;DR.txt",
        type: "document",
        content:
          "At Showcraft, we are architects of imagination and transformation, and weavers of dreams. Our passion lies in bringing your unique visions to life, transforming them into tangible achievements that go beyond the ordinary.",
      },
      { name: "Showcraft Global", type: "link", url: "https://showcraftglobal.com/" },
    ],
  },
  {
    name: "Project 03 (pondriee)",
    files: [
      { name: "Full case study.fig", type: "folder" },
      { name: "leafpress.ai", type: "link", url: "https://leafpress.vercel.app" },
      {
        name: "TL;DR.txt",
        type: "document",
        content:
          "Leafpress TL;DR: A content management system designed for environmental non-profits. Features include easy publishing, donation tracking, and volunteer management, all with a green focus.",
      },
      { name: "my Milkmen", type: "link", url: "mymilkmen.com" },
      {
        name: "Leafpress Screenshot.png",
        type: "image",
        src: "https://via.placeholder.com/600x400?text=Leafpress+Screenshot",
      },
    ],
  },

  // {
  //   name: "Freelance Projects",
  //   files: [
  //     { name: "E-commerce Store", type: "folder" },
  //     {
  //       name: "Landing Page Design.pdf",
  //       type: "document",
  //       src: "https://via.placeholder.com/500x700?text=Landing+Page+Design+PDF",
  //     },
  //     {
  //       name: "Client Feedback.txt",
  //       type: "document",
  //       content: "Client was happy with the final design and requested additional SEO optimization.",
  //     },
  //     { name: "Store Demo Link", type: "link", url: "https://mystore.demo.com" },
  //     {
  //       name: "Promo Video.mp4",
  //       type: "video",
  //       src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
  //     },
  //   ],
  // },
  // {
  //   name: "UI Kits & Templates",
  //   files: [
  //     { name: "Dark Mode UI Kit.sketch", type: "folder" },
  //     { name: "Responsive Templates.zip", type: "archive" },
  //     { name: "Wireframe Examples.pdf", type: "document", src: "https://example.com/wireframes.pdf" },
  //     {
  //       name: "Component Library.md",
  //       type: "document",
  //       content:
  //         "This component library contains reusable React components styled with Tailwind CSS for rapid UI development.",
  //     },
  //   ],
  // },
  // {
  //   name: "Design Inspirations",
  //   files: [
  //     {
  //       name: "Behance Collection.url",
  //       type: "link",
  //       url: "https://www.behance.net/gallery/123456789/Inspiration-Collection",
  //     },
  //     { name: "Dribbble Shots.pdf", type: "document", src: "https://example.com/dribbble-shots.pdf" },
  //     {
  //       name: "Color Palettes.png",
  //       type: "image",
  //       src: "https://via.placeholder.com/600x200?text=Color+Palettes",
  //     },
  //     {
  //       name: "Typography Guide.txt",
  //       type: "document",
  //       content:
  //         "A comprehensive typography guide covering font choices, sizes, line heights, and usage in web design projects.",
  //     },
  //   ],
  // },
  // {
  //   name: "Tech Blog",
  //   files: [
  //     {
  //       name: "Building Scalable React Apps.md",
  //       type: "document",
  //       content:
  //         "# Building Scalable React Apps\n\nIn this post, we discuss strategies for optimizing React apps for performance and scalability, including code splitting and memoization.",
  //     },
  //     {
  //       name: "Next.js SEO Tips.txt",
  //       type: "document",
  //       content: "Tips and tricks to improve SEO in Next.js apps using static generation and server-side rendering.",
  //     },
  //     {
  //       name: "Deploying to Vercel.pdf",
  //       type: "document",
  //       src: "https://example.com/deploying-vercel.pdf",
  //     },
  //   ],
  // },
//   {
//     name: "Learning & Tutorials",
//     files: [
//       { name: "React Tutorial.pdf", type: "document", src: "https://example.com/react-tutorial.pdf" },
//       {
//         name: "Advanced TypeScript.md",
//         type: "document",
//         content: "# Advanced TypeScript\n\nLearned types, generics, and advanced typing techniques.",
//       },
//       {
//         name: "Three.js Basics.mp4",
//         type: "video",
//         src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//       },
//       { name: "Tailwind CSS Guide.pdf", type: "document", src: "https://example.com/tailwind-guide.pdf" },
//     ],
//   },
//   {
//     name: "Personal Projects",
//     files: [
//       {
//         name: "MyPortfolioWebsite",
//         type: "folder",
//       },
//       {
//         name: "Portfolio Live Link",
//         type: "link",
//         url: "https://vibhav-portfolio.vercel.app",
//       },
//       {
//         name: "Code Snippet.js",
//         type: "document",
//         content: `// Example React hook for fetching user data
// import { useState, useEffect } from "react";
// export function useUserData(userId) {
//   const [data, setData] = useState(null);
//   useEffect(() => {
//     fetch('/api/users/' + userId)
//       .then(res => res.json())
//       .then(setData);
//   }, [userId]);
//   return data;
// }`,
//       },
//       {
//         name: "Project Screenshots.zip",
//         type: "archive",
//       },
//     ],
//   },
//   {
//     name: "Certificates",
//     files: [
//       {
//         name: "Teamwork Developer.pdf",
//         type: "document",
//         src: "https://media.licdn.com/dms/image/v2/D5622AQGBDc92mR-thA/feedshare-shrink_1280/B56ZQWqEJdG4Ak-/0/1735546914254?e=1757548800&v=beta&t=_n-wB9GRPip3y0fQ3kxapnapyHC4QpsTPm0Waqq1ZWk",
//       },
//     ],
//   },
//   {
//     name: "Videos & Tutorials",
//     files: [
//       {
//         name: "React Hooks Deep Dive.mp4",
//         type: "video",
//         src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//       },
//       {
//         name: "Next.js Incremental Static Regeneration.mov",
//         type: "video",
//         src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//       },
//       {
//         name: "Design Systems Webinar.mp4",
//         type: "video",
//         src: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
//       },
//     ],
//   },
//   {
//     name: "Research Papers",
//     files: [
//       {
//         name: "Web Accessibility Standards.pdf",
//         type: "document",
//         src: "https://example.com/accessibility-standards.pdf",
//       },
//       {
//         name: "AI in UI Design.pdf",
//         type: "document",
//         src: "https://example.com/ai-ui-design.pdf",
//       },
//       {
//         name: "Progressive Web Apps.pdf",
//         type: "document",
//         src: "https://example.com/pwa.pdf",
//       },
//     ],
//   },
]

async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    const batch = db.batch();

    for (let i = 0; i < projectData.length; i++) {
      const project = projectData[i];

      // ✅ Use a hardcoded doc ID (from project.key or project.id, or fallback)
      const hardcodedId = project.key || project.id || `project_${i + 1}`;
      const docRef = db.collection("ProjectCategory").doc(hardcodedId);

      // Add metadata
      const projectWithMetadata = {
        ...project,
        id: hardcodedId,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: i,
        // Add file metadata
        files: project.files.map((file, fileIndex) => ({
          ...file,
          id: `${hardcodedId}_file_${fileIndex}`,
          createdAt: new Date(),
          size: Math.floor(Math.random() * 1000000) + 1000, // Random file size
          lastModified: new Date(),
        })),
      };

      batch.set(docRef, projectWithMetadata);
      console.log(`📁 Added project: ${project.name} with ${project.files.length} files`);
    }

    await batch.commit();
    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Total projects added: ${projectData.length}`);

    // Verify the data
    const snapshot = await db.collection("ProjectCategory").get();
    console.log(`🔍 Verification: ${snapshot.size} documents in ProjectCategory collection`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    process.exit(0);
  }
}


// Run the seeding function
seedDatabase()
