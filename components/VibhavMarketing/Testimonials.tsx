"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Frontend Developer",
    location: "Bangalore",
    avatar: "PS",
    content: "I uploaded my resume and got a professional portfolio in 5 minutes. No more spending weeks building portfolio websites manually!",
    rating: 5,
  },
  {
    name: "Rahul Kumar",
    role: "CS Student",
    location: "Delhi",
    avatar: "RK",
    content: "The AI knew my projects better than I did. HR was impressed when I shared my interactive desktop instead of a boring PDF resume.",
    rating: 5,
  },
  {
    name: "Amit Patel",
    role: "Full Stack Developer",
    location: "Mumbai",
    avatar: "AP",
    content: "Finally, a portfolio that represents who I am. The desktop metaphor is perfect - it's how developers actually think and work.",
    rating: 5,
  },
  {
    name: "Sneha Gupta",
    role: "UI/UX Designer",
    location: "Pune",
    avatar: "SG",
    content: "I customized my desktop theme to match my design style. It's beautiful and functional. HR can explore my work interactively.",
    rating: 5,
  },
  {
    name: "Vikram Singh",
    role: "Backend Engineer",
    location: "Hyderabad",
    avatar: "VS",
    content: "The AI assistant answered all HR questions about my experience accurately. It's like having a professional spokesperson for my career.",
    rating: 5,
  },
  {
    name: "Neha Reddy",
    role: "Data Scientist",
    location: "Chennai",
    avatar: "NR",
    content: "From resume to shareable portfolio in 5 minutes. I sent my desktop link to 10 companies and got 5 interview calls in one week!",
    rating: 5,
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <section ref={ref} className="relative py-32 bg-gradient-to-b from-[#0d0d15] via-[#0a0a1a] to-[#000000] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="parallax-bg absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/15 via-cyan-500/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-900/10 via-transparent to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-cyan-900/10 via-transparent to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="testimonial-header text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            Loved by Thousands
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Join professionals from top companies who trust VibhavMacOS daily
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group testimonial-card relative"
            >
              <div className="relative h-full p-6 rounded-3xl bg-gradient-to-br from-blue-950/30 via-blue-900/20 to-black/50 border border-blue-500/20 backdrop-blur-xl hover:border-blue-400/40 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/20">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-blue-500/10 group-hover:text-blue-400/20 transition-colors">
                  <Quote className="w-8 h-8" />
                </div>

                {/* Content */}
                <div className="mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="inline-block w-4 h-4 text-yellow-500 fill-current" />
                  ))}
                </div>

                <p className="text-gray-300 leading-relaxed mb-6 relative z-10">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full border-2 border-blue-500/30 hover:border-blue-400/50 transition-colors"
                  />
                  <div>
                    <div className="font-semibold text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-20"
        >
          <p className="text-center text-sm text-gray-500 mb-8 uppercase tracking-wider">
            Trusted by teams at
          </p>
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-40">
            {["Google", "Microsoft", "Netflix", "Stripe", "Meta", "Amazon", "Apple"].map((company) => (
              <div
                key={company}
                className="text-2xl font-bold text-gray-600 tracking-tight"
              >
                {company}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
