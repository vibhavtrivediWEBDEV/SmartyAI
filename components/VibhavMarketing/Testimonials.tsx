"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Senior Developer at Google",
    avatar: "https://via.placeholder.com/100/1a1a1a/ffffff?text=SC",
    content: "VibhavMacOS completely changed how I work. Having AI-powered coding, search, and productivity tools in one desktop is game-changing. I'm 10x more productive.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "Startup Founder",
    avatar: "https://via.placeholder.com/100/1a1a1a/ffffff?text=MR",
    content: "We switched our entire team to VibhavMacOS. The AI interview feature alone saved us months of hiring time. The automation workflows are incredible.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "PhD Researcher",
    avatar: "https://via.placeholder.com/100/1a1a1a/ffffff?text=PP",
    content: "The AI Teacher helped me synthesize months of research into clear summaries. It's like having a brilliant research assistant available 24/7.",
    rating: 5,
  },
  {
    name: "Alex Thompson",
    role: "Product Designer at Netflix",
    avatar: "https://via.placeholder.com/100/1a1a1a/ffffff?text=AT",
    content: "The glassmorphic design and smooth animations are beautiful. But the real magic is how everything integrates. It feels like the future of desktop computing.",
    rating: 5,
  },
  {
    name: "Emma Williams",
    role: "Content Creator",
    avatar: "https://via.placeholder.com/100/1a1a1a/ffffff?text=EW",
    content: "I use AI Search and Notes daily. Being able to search across all platforms, save to notes, and have the AI remember my preferences is incredible.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "Engineering Manager at Stripe",
    avatar: "https://via.placeholder.com/100/1a1a1a/ffffff?text=DK",
    content: "Finally, a desktop that understands developers. The terminal integration, code generation, and AI debugging have become essential to our workflow.",
    rating: 5,
  },
];

export default function Testimonials() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-32 bg-gradient-to-b from-black via-gray-950 to-black overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
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
              className="group relative"
            >
              <div className="relative h-full p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-xl hover:border-white/20 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-600/10">
                {/* Quote Icon */}
                <div className="absolute top-6 right-6 text-white/5 group-hover:text-white/10 transition-colors">
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
                    className="w-12 h-12 rounded-full border-2 border-white/20"
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
