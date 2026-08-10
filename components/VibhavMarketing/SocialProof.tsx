"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Star, MapPin, Calendar } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Frontend Developer",
    location: "Bangalore",
    quote: "I uploaded my resume and got a professional portfolio in 5 minutes. No more building portfolio websites manually!",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Rahul Kumar",
    role: "CS Student",
    location: "Delhi",
    quote: "The AI knew my projects better than I did. HR was impressed when I shared my interactive desktop instead of a boring PDF.",
    rating: 5,
    avatar: "RK",
  },
  {
    name: "Amit Patel",
    role: "Full Stack Developer",
    location: "Mumbai",
    quote: "Finally, a portfolio that represents who I am. The desktop metaphor is perfect - it's how developers actually think.",
    rating: 5,
    avatar: "AP",
  },
];

const stats = [
  { value: "10,000+", label: "Desktops Created" },
  { value: "5 min", label: "Average Setup Time" },
  { value: "100%", label: "AI Extraction Accuracy" },
  { value: "₹0", label: "Starting Price" },
];

export default function SocialProof() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-gradient-to-b from-black via-[#050510] to-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-blue-600/10 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-gray-400 text-sm uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Developers
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Junior developers, students, and professionals are sharing interactive portfolios instead of boring PDFs.
          </p>
        </motion.div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Card */}
              <div className="relative h-full bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl rounded-3xl border border-white/10 p-8 hover:border-blue-500/30 transition-all duration-300">
                {/* Quote Icon */}
                <Quote className="absolute top-6 right-6 w-8 h-8 text-blue-500/20" />

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-300 text-lg leading-relaxed mb-6">{testimonial.quote}</p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  
                  <div className="flex-1">
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                  <MapPin className="w-3 h-3 text-gray-600" />
                  <span className="text-gray-600 text-xs">{testimonial.location}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 text-lg mb-6">Join thousands of developers with interactive portfolios</p>
          <a
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-2xl shadow-2xl shadow-blue-600/30 transition-all duration-300"
          >
            Create My Desktop - It's Free
          </a>
        </motion.div>
      </div>
    </section>
  );
}
