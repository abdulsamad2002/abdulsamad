"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Home, User, GitBranch, Mail, ExternalLink, BookOpen, Github, FileText, Download, Linkedin, Newspaper } from 'lucide-react';

const SidebarPortfolio = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [particles, setParticles] = useState([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [cursorGlow, setCursorGlow] = useState({ x: 0, y: 0 });
  const [loadedImages, setLoadedImages] = useState({});
  const [pdfPages, setPdfPages] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const canvasRef = useRef(null);
  const contentRef = useRef(null);
  const imageRefs = useRef({});
  const pdfScriptRef = useRef(null);

  useEffect(() => {
    const initParticles = [];
    for (let i = 0; i < 50; i++) {
      initParticles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 1.5
      });
    }
    setParticles(initParticles);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      if (contentRef.current) {
        const rect = contentRef.current.getBoundingClientRect();
        setCursorGlow({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || particles.length === 0) return;

    const ctx = canvas.getContext('2d');
    
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    let animationFrameId;
    let localParticles = [...particles];

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      localParticles = localParticles.map(p => {
        let newX = p.x + p.vx;
        let newY = p.y + p.vy;

        if (newX < 0 || newX > canvas.width) {
          p.vx *= -1;
          newX = Math.max(0, Math.min(canvas.width, newX));
        }
        if (newY < 0 || newY > canvas.height) {
          p.vy *= -1;
          newY = Math.max(0, Math.min(canvas.height, newY));
        }

        return { ...p, x: newX, y: newY };
      });

      localParticles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
        ctx.fill();
      });

      for (let i = 0; i < localParticles.length; i++) {
        for (let j = i + 1; j < localParticles.length; j++) {
          const p1 = localParticles[i];
          const p2 = localParticles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const opacity = 0.2 * (1 - distance / 120);
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [particles.length]);

  useEffect(() => {
    if (activeSection !== 'projects') return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = entry.target.getAttribute('data-index');
            if (index !== null) {
              setLoadedImages(prev => ({ ...prev, [index]: true }));
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    const currentRefs = Object.values(imageRefs.current).filter(ref => ref !== null);
    currentRefs.forEach((ref) => {
      observer.observe(ref);
    });

    return () => {
      currentRefs.forEach((ref) => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [activeSection]);

  // Load PDF with PDF.js from CDN
  useEffect(() => {
    if (activeSection !== 'resume') {
      // Cleanup when leaving resume section
      if (pdfScriptRef.current && document.body.contains(pdfScriptRef.current)) {
        document.body.removeChild(pdfScriptRef.current);
        pdfScriptRef.current = null;
      }
      setPdfPages([]);
      setPdfLoading(false);
      return;
    }

    const loadPDF = async () => {
      setPdfLoading(true);
      setPdfPages([]);
      
      try {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.async = true;
        pdfScriptRef.current = script;
        
        script.onload = async () => {
          try {
            const pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

            const pdfUrl = '/resume.pdf';
            
            const loadingTask = pdfjsLib.getDocument(pdfUrl);
            const pdf = await loadingTask.promise;
            
            const pages = [];
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const viewport = page.getViewport({ scale: 1.5 });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.height = viewport.height;
              canvas.width = viewport.width;
              
              await page.render({
                canvasContext: context,
                viewport: viewport
              }).promise;
              
              pages.push(canvas.toDataURL());
            }
            
            setPdfPages(pages);
          } catch (err) {
            console.error('PDF rendering error:', err);
          } finally {
            setPdfLoading(false);
          }
        };
        
        script.onerror = () => {
          console.error('Failed to load PDF.js');
          setPdfLoading(false);
        };
        
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading PDF:', error);
        setPdfLoading(false);
      }
    };

    loadPDF();

    return () => {
      // Cleanup on unmount
      if (pdfScriptRef.current && document.body.contains(pdfScriptRef.current)) {
        document.body.removeChild(pdfScriptRef.current);
        pdfScriptRef.current = null;
      }
    };
  }, [activeSection]);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'about', icon: User, label: 'About' },
    { id: 'projects', icon: GitBranch, label: 'Projects' },
    { id: 'resume', icon: FileText, label: 'Resume' },
    { id: 'contact', icon: Mail, label: 'Contact' }
  ];

  const projects = [
    {
      title: "PassVault",
      description: "PassVault is a client-side encrypted password manager where passwords are encrypted in the browser before transmission. The server never has access to plaintext credentials or the master password.",
      tech: ["React.js", "MongoDB", "Vercel", "Express.js" ,  "JavaScript",  "TailwindCSS"],
      documentation: "#",
      github: "https://github.com/abdulsamad2002/passvault-frontend",
      liveDemo: "https://passvault-frontend.vercel.app/",
      screenshot: "/passvault.png"
    },
    {
      title: "FundFlow",
      description: "A modern crowdfunding platform built with Next.js, enabling users to create, manage, and support fundraising campaigns.",
      tech: ["Next.js", "MongoDB", "Vercel", "NextAuth.js", "JavaScript",  "TailwindCSS"],
      documentation: "#",
      github: "https://github.com/abdulsamad2002/fundflow-crowdfunding",
      liveDemo: "https://fundflow-crowdfunding.vercel.app/",
      screenshot: "/fundflow.png"
    },
    
    {
      title: "MiniLinks",
      description: "MiniLinks is a minimalist URL shortener built with Next.js. No analytics, no premium tiers, no bloat—just straightforward link shortening.",
      tech: ["Next.js", "JavaScript", "MongoDB", "TailwindCSS", "React Hook Form"],
      documentation: "#",
      github: "https://github.com/abdulsamad2002/minilinks-url-shortenerr",
      liveDemo: "https://minilinks-rose.vercel.app/",
      screenshot: "/minilinks.png"
    },
    {
      title: "LeafLink",
      description: "A powerful link management platform that allows you to create a personalized landing page for all your important links. Share one simple URL and give your audience access to everything you offer",
      tech: ["Next.js", "MongoDB", "Vercel", "NextAuth.js", "JavaScript",  "TailwindCSS"],
      documentation: "#",
      github: "https://github.com/abdulsamad2002/leaflink",
      liveDemo: "https://leaflink-rouge.vercel.app/",
      screenshot: "/leaflink.png"
    },
    {
      title: "Nasheedzz",
      description: "A media player which has my favourite nasheeds. Made completely using HTML, CSS and Vanilla JavaScript. ",
      tech: ["JavaScript", "HTML", "CSS"],
      documentation: "#",
      github: "https://github.com/abdulsamad2002/nasheedzz",
      liveDemo: "https://nasheedzz.vercel.app/",
      screenshot: "/nasheedzz.png"
    },
  ];

const experience = [
    {
      title: ".NET Developer Trainee",
      company: "HCLTech",
      period: "2025 - Present",
      description: "",
      current: true
    }
  ];

  const education = [
    {
      degree: "Bachelor of Technology in Computer Science and Engineering",
      institution: "Dr. A. P. J. Abdul Kalam Technical University, Lucknow",
      period: "2022 - 2026",
      description: "",
      current: true
    },
    {
      degree: "High School and Senior Secondary",
      institution: "St. Joseph's College, Allahabad",
      period: "2009 - 2022",
      description: ""
    }
  ];

  const skills = [
    { 
      category: "Frontend", 
      items: [
        { name: "React" },
        { name: "Next.js" },
        { name: "Tailwind CSS" },
        { name: "Redux" },
        { name: "CSS3" },
      ]
    },
    { 
      category: "Backend", 
      items: [
        { name: "Node.js" },
        { name: "Express" },
        { name: "REST APIs" },
        { name: "MongoDB" },
        { name: "SQL" }
      ]
    },
    { 
      category: "Languages", 
      items: [
        { name: "C" },
        { name: "C#" },
        { name: "Java" },
        { name: "Python" },
        { name: "JavaScript" },
      ]
    },
    { 
      category: "Tools & DevOps", 
      items: [
        { name: "Git" },
        { name: "Docker" },
        { name: "CI/CD" },
        { name: "Kubernetes" },
        { name: "Nginx" }
      ]
    }
  ];

  const renderContent = () => {
    switch(activeSection) {
      case 'home':
        return (
          <div className="flex flex-col justify-center h-full">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light mb-4 tracking-tight animate-staggered-1">
              Abdul Samad
            </h1>
            <p className="text-2xl sm:text-3xl md:text-4xl text-gray-400 font-light mb-6 md:mb-8 tracking-wide animate-staggered-2">
              Web Application Developer
            </p>
            <p className="text-base sm:text-lg text-gray-500 font-light leading-relaxed max-w-2xl mb-8 md:mb-10 animate-staggered-3">
              Crafting elegant solutions with modern web technologies. Specialized in building and deploying 
              scalable applications from concept to deployment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-staggered-4">
              <button
                onClick={() => setActiveSection('projects')}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 text-center"
              >
                View Projects
              </button>
              <button
                onClick={() => setActiveSection('contact')}
                className="px-6 sm:px-8 py-3 sm:py-4 border-2 border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all duration-300 text-center"
              >
                Contact Me
              </button>
            </div>
          </div>
        );

      case 'about':
        return (
          <div>
            <h2 className="text-4xl sm:text-5xl font-light mb-6 md:mb-8 tracking-tight">About Me</h2>
            <div className="space-y-4 md:space-y-6 text-base md:text-lg text-gray-300 leading-relaxed max-w-3xl mb-10 md:mb-12">
              <p>
                I'm a web application developer with a passion for creating seamless digital experiences. 
                With expertise spanning both frontend and backend technologies, I bring ideas to life 
                through clean code and thoughtful design.
              </p>
              <p>
                I specialize in building scalable applications using modern frameworks and best practices. 
                I believe in writing code that's not just functional, but maintainable and elegant.
              </p>
            </div>

            <div className="mb-12 md:mb-16">
              <h3 className="text-2xl sm:text-3xl font-light mb-6 md:mb-8 tracking-tight text-blue-400">Experience</h3>
              <div className="space-y-6 md:space-y-8">
                {experience.map((exp, index) => (
                  <div key={index} className="relative pl-6 md:pl-8 border-l-2 border-gray-800 hover:border-blue-500 transition-colors duration-300">
                    <div className="absolute -left-[7px] md:-left-[9px] top-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500 border-2 md:border-4 border-gray-950"></div>
                    
                    <div className="pb-6 md:pb-8">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h4 className="text-lg sm:text-xl font-light text-white">{exp.title}</h4>
                        {exp.current && (
                          <span className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 w-fit">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 mb-1 text-sm sm:text-base">{exp.company}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-3">{exp.period}</p>
                      <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-12 md:mb-16">
              <h3 className="text-2xl sm:text-3xl font-light mb-6 md:mb-8 tracking-tight text-blue-400">Education</h3>
              <div className="space-y-6 md:space-y-8">
                {education.map((edu, index) => (
                  <div key={index} className="relative pl-6 md:pl-8 border-l-2 border-gray-800 hover:border-blue-500 transition-colors duration-300">
                    <div className="absolute -left-[7px] md:-left-[9px] top-0 w-3 h-3 md:w-4 md:h-4 rounded-full bg-blue-500 border-2 md:border-4 border-gray-950"></div>
                    
                    <div className="pb-6 md:pb-8">
                      <h4 className="text-lg sm:text-xl font-light text-white mb-2">{edu.degree}</h4>
                      <p className="text-gray-400 mb-1 text-sm sm:text-base">{edu.institution}</p>
                      <p className="text-xs sm:text-sm text-gray-500 mb-3">{edu.period}</p>
                      <p className="text-gray-300 leading-relaxed text-sm sm:text-base">{edu.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-light mb-6 md:mb-8 tracking-tight text-blue-400">Technologies & Tools</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {skills.map((skillGroup, index) => (
                  <div key={index} className="border border-gray-800 p-4 md:p-5">
                    <h4 className="text-base sm:text-lg font-light text-white mb-3">{skillGroup.category}</h4>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.items.map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 text-gray-400 border border-gray-800"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'projects':
        return (
          <div>
            <h2 className="text-4xl sm:text-5xl font-light mb-8 md:mb-12 tracking-tight">My Projects</h2>
            <div className="space-y-6 md:space-y-8">
              {projects.map((project, index) => (
                <div
                  key={index}
                  className="border border-gray-800 hover:border-blue-500 transition-all duration-300 overflow-hidden"
                >
                  <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 p-4 sm:p-6 lg:p-8">
                      <h3 className="text-2xl sm:text-3xl font-light mb-3 md:mb-4 text-white">
                        {project.title}
                      </h3>
                      <p className="text-gray-400 mb-4 md:mb-6 leading-relaxed text-sm sm:text-base">
                        {project.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
                        {project.tech.map((tech, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-900 border border-gray-700 text-gray-400"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        <a
                          href={project.documentation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all duration-300 text-sm"
                        >
                          <BookOpen size={16} />
                          <span className="hidden sm:inline">Documentation</span>
                          <span className="sm:hidden">Docs</span>
                        </a>
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-all duration-300 text-sm"
                        >
                          <Github size={16} />
                          <span>GitHub</span>
                        </a>
                        <a
                          href={project.liveDemo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 text-sm"
                        >
                          <ExternalLink size={16} />
                          <span className="hidden sm:inline">Live</span>
                        </a>
                      </div>
                    </div>

                    <div 
                      ref={el => imageRefs.current[index] = el}
                      data-index={index}
                      className="w-full lg:w-96 xl:w-[28rem] bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 relative overflow-hidden"
                    >
                      {loadedImages[index] ? (
                        <div className="relative h-64 sm:h-80 lg:h-full">
                          <img
                            src={project.screenshot}
                            alt={`${project.title} screenshot`}
                            className="w-full h-full object-contain object-center"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 sm:h-80 lg:h-full bg-gray-800 flex items-center justify-center">
                          <div className="animate-pulse text-gray-600">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'resume':
        return (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
              <h2 className="text-4xl sm:text-5xl font-light tracking-tight">Resume</h2>
              <a
                href="/resume.pdf"
                download="Abdul_Samad_Resume.pdf"
                className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 text-sm sm:text-base"
              >
                <Download size={18} />
                <span>Download Resume</span>
              </a>
            </div>

            <div className="border border-gray-800 bg-gray-900 p-4 sm:p-6 md:p-8">
              {pdfLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400 text-sm sm:text-base">Loading resume...</p>
                </div>
              ) : pdfPages.length > 0 ? (
                <div className="space-y-6 md:space-y-8">
                  {pdfPages.map((pageUrl, index) => (
                    <div key={index} className="flex justify-center">
                      <img 
                        src={pageUrl} 
                        alt={`Resume page ${index + 1}`}
                        className="max-w-full h-auto shadow-lg"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20">
                  <p className="text-gray-400 mb-4 text-sm sm:text-base">Unable to load PDF preview</p>
                  <a
                    href="/resume.pdf"
                    download="Abdul_Samad_Resume.pdf"
                    className="text-blue-500 hover:text-blue-400 underline text-sm sm:text-base"
                  >
                    Download resume instead
                  </a>
                </div>
              )}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="flex flex-col justify-center h-full">
            <h2 className="text-4xl sm:text-5xl font-light mb-6 tracking-tight">Connect With Me</h2>
            <p className="text-base sm:text-xl text-gray-400 mb-8 md:mb-12 leading-relaxed max-w-2xl">
               
              Feel free to reach out through any of the channels below.
            </p>

            <div className="mb-8 md:mb-12">
              <button
                onClick={() => {
                  navigator.clipboard.writeText('hello@example.com');
                  setCopiedEmail(true);
                  setTimeout(() => setCopiedEmail(false), 2000);
                }}
                className="group relative px-6 sm:px-8 py-3 sm:py-4 border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 text-base sm:text-lg w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-3">
                  <Mail size={20} />
                  blackhawkalpha009@gmail.com
                </span>
                {copiedEmail && (
                  <span className="absolute -top-12 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded text-sm whitespace-nowrap">
                    Copied to clipboard!
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6">
              <a
                href="https://github.com/abdulsamad2002"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-700 flex items-center justify-center transition-all duration-300 hover:border-blue-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                  <Github size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300 sm:w-8 sm:h-8" />
                </div>
                <span className="text-gray-500 text-xs sm:text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">GitHub</span>
              </a>

              <a
                href="https://linkedin.com/in/abdulsamad4"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-700 flex items-center justify-center transition-all duration-300 hover:border-blue-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                  <Linkedin size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300 sm:w-8 sm:h-8" />
                </div>
                <span className="text-gray-500 text-xs sm:text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">LinkedIn</span>
              </a>

              <a
                href="https://abdulsamad2002.github.io"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-gray-700 flex items-center justify-center transition-all duration-300 hover:border-blue-500 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
                  <Newspaper size={28} className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300 sm:w-8 sm:h-8" />
                </div>
                <span className="text-gray-500 text-xs sm:text-sm mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">Blog</span>
              </a>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }

          @keyframes staggeredFadeIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-staggered-1 {
            animation: staggeredFadeIn 0.6s ease-out 0.1s both;
          }
          .animate-staggered-2 {
            animation: staggeredFadeIn 0.6s ease-out 0.3s both;
          }
          .animate-staggered-3 {
            animation: staggeredFadeIn 0.6s ease-out 0.5s both;
          }
          .animate-staggered-4 {
            animation: staggeredFadeIn 0.6s ease-out 0.7s both;
          }
          
          main::-webkit-scrollbar {
            width: 8px;
          }
          
          main::-webkit-scrollbar-track {
            background: rgba(31, 41, 55, 0.3);
            border-radius: 10px;
          }
          
          main::-webkit-scrollbar-thumb {
            background: rgba(59, 130, 246, 0.5);
            border-radius: 10px;
          }
          
          main::-webkit-scrollbar-thumb:hover {
            background: rgba(59, 130, 246, 0.7);
          }

          main {
            scrollbar-width: thin;
            scrollbar-color: rgba(59, 130, 246, 0.5) rgba(31, 41, 55, 0.3);
          }
        `}
      </style>
      
      <div className="h-screen bg-gray-950 text-white relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
        />

        <div className="relative z-10 h-full flex flex-col-reverse md:flex-row p-4 md:p-6 lg:p-10 gap-4 md:gap-6">
          <aside className="flex-shrink-0 w-full md:w-20 bg-gray-900/80 backdrop-blur-md border border-gray-800 shadow-xl flex flex-row md:flex-col items-center justify-around md:justify-start py-3 md:py-6 gap-1 md:gap-2 md:self-center z-20">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              
              return (
                <div key={item.id} className="relative flex items-center w-auto md:w-full group">
                  {isActive && (
                    <>
                      {/* Desktop indicator */}
                      <div className="absolute left-0 w-1 h-10 md:h-12 bg-blue-500 rounded-r-full hidden md:block" />
                      {/* Mobile indicator */}
                      <div className="absolute bottom-0 h-1 w-full bg-blue-500 md:hidden" />
                    </>
                  )}
                  
                  <button
                    onClick={() => setActiveSection(item.id)}
                    className={`flex flex-col items-center justify-center px-3 md:px-0 md:w-full py-2 md:py-4 transition-all duration-300 relative ${
                      isActive ? 'text-blue-500' : 'text-gray-500 hover:text-blue-400'
                    }`}
                  >
                    <Icon 
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="transition-all duration-300 md:w-6 md:h-6"
                    />
                    
                    <div className={`mt-1 md:mt-2 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? 'bg-blue-500 scale-100' : 'bg-gray-600 scale-0 group-hover:scale-100'
                    }`} />
                    
                    <div className="hidden md:block absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900/60 backdrop-blur-md border border-gray-700/50 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 pointer-events-none">
                      <div className="text-sm text-gray-300">{item.label}</div>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-gray-900/60" />
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-6 border-transparent border-t-gray-700/50" style={{ marginTop: '1px' }} />
                    </div>
                  </button>
                </div>
              );
            })}
          </aside>

          <main 
            ref={contentRef}
            className="flex-1 bg-gray-900/40 backdrop-blur-sm border border-gray-800 shadow-2xl shadow-blue-500/5 p-4 sm:p-6 md:p-8 lg:p-12 overflow-y-auto"
            style={{
              background: `radial-gradient(600px circle at ${cursorGlow.x}px ${cursorGlow.y}px, rgba(59, 130, 246, 0.12), transparent 40%)`
            }}
          >
            <div
              key={activeSection}
              className="animate-fadeIn"
            >
              {renderContent()}
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default SidebarPortfolio;