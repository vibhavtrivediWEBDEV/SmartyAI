import React, { useState, useEffect } from "react";

interface AnimatedResumeProps {
  onAnimationEnd: () => void;
}

const AnimatedResume: React.FC<AnimatedResumeProps> = ({ onAnimationEnd }) => {
  const [sections, setSections] = useState<string[]>([]);
  const allSections = [
    "header",
    "contact",
    "summary",
    "experience",
    "education",
    "skills",
  ];

  useEffect(() => {
    let delay = 0;
    allSections.forEach((section, index) => {
      setTimeout(() => {
        setSections((prev) => [...prev, section]);
        if (index === allSections.length - 1) {
          setTimeout(onAnimationEnd, 1000); // Callback after a short delay once all sections are visible
        }
      }, delay);
      delay += 500; // Delay for each section
    });
  }, [onAnimationEnd]);

  const renderSection = (sectionName: string) => {
    switch (sectionName) {
      case "header":
        return (
          <div className="mb-4 p-2 bg-gray-800 rounded opacity-0 animate-fade-in" style={{animationDelay: '0ms'}}>
            <h2 className="text-2xl font-bold">Vibhav Trivedi</h2>
            <p className="text-blue-400">Software Engineer</p>
          </div>
        );
      case "contact":
        return (
          <div className="mb-4 p-2 bg-gray-800 rounded opacity-0 animate-fade-in" style={{animationDelay: '500ms'}}>
            <h3 className="text-xl font-semibold">Contact</h3>
            <p>Email: <span className="text-blue-400">vibhav.trivedi@example.com</span></p>
            <p>GitHub: <span className="text-blue-400">github.com/vibhavtrivedi</span></p>
          </div>
        );
      case "summary":
        return (
          <div className="mb-4 p-2 bg-gray-800 rounded opacity-0 animate-fade-in" style={{animationDelay: '1000ms'}}>
            <h3 className="text-xl font-semibold">Summary</h3>
            <p>Experienced software engineer with a passion for building scalable and efficient web applications.</p>
          </div>
        );
      case "experience":
        return (
          <div className="mb-4 p-2 bg-gray-800 rounded opacity-0 animate-fade-in" style={{animationDelay: '1500ms'}}>
            <h3 className="text-xl font-semibold">Experience</h3>
            <p className="font-bold">Senior Developer - Tech Solutions (2022-Present)</p>
            <ul className="list-disc list-inside ml-4">
              <li>Developed and maintained web applications.</li>
              <li>Collaborated with cross-functional teams.</li>
            </ul>
          </div>
        );
      case "education":
        return (
          <div className="mb-4 p-2 bg-gray-800 rounded opacity-0 animate-fade-in" style={{animationDelay: '2000ms'}}>
            <h3 className="text-xl font-semibold">Education</h3>
            <p className="font-bold">University of Example - M.S. Computer Science</p>
            <p>Graduated: 2022</p>
          </div>
        );
      case "skills":
        return (
          <div className="p-2 bg-gray-800 rounded opacity-0 animate-fade-in" style={{animationDelay: '2500ms'}}>
            <h3 className="text-xl font-semibold">Skills</h3>
            <p>JavaScript, React, Node.js, TypeScript, Python, SQL, AWS, Docker</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-900 text-gray-300 font-mono">
      {sections.map((section) => (section && <React.Fragment key={section}>{renderSection(section)}</React.Fragment>))}
    </div>
  );
};

export default AnimatedResume; 