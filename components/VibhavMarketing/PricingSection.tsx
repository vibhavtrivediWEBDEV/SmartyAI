"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Check, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const gradients = {
  free: "from-gray-600 to-gray-700",
  starter: "from-white to-gray-100",
  pro: "from-gray-400 to-pink-600",
};

const pricingPlans = [
  {
    id: "free",
    name: "Personal Desktop",
    description: "For developers starting their journey",
    price: "₹0",
    period: "forever",
    cta: "Create My Desktop - Free",
    gradient: "from-emerald-500 to-cyan-400",
    popular: true,
    features: [Is the personal desktop really free?",
    answer: "Yes! Your shareable portfolio desktop is free forever. Upload resume, get your interactive portfolio, share your URL - all free. No credit card required.",
  },
  {
    question: "What do I get in the free tier?",
    answer: "Public portfolio desktop, 1 GB storage, resume AI extraction, basic apps (Projects, Resume, About, Skills), shareable URL, and basic customization. Perfect for getting started.",
  },
  {
    question: "When should I upgrade?",
    answer: "Upgrade when you need: Private files, more storage, AI credits for advanced features, custom domains, or interview prep AI. Start free, upgrade only if you need more.",
  },
  {
    question: "What are AI credits?",
    answer: "AI credits power advanced features: Your personal AI assistant, interview question generation, project analysis, content creation. Free tier includes limited credits; paid plans offer more.",
  },
  {
    question: "Can I export my desktop?",
    answer: "Yes, you can export your desktop data anytime. Your data is always yours. We use end-to-end encryption for all your personal informa
    popular: false,
    features: [
      "Everything in Personal",
      "10 GB storage",
      "100 AI credits/month",
      "Private files",
      "Custom domain",
      "Interview prep AI",
      "Priority support",
    ],
  },
  {
    id: "pro",
    name: "Professional",
    description: "For serious professionals",
    price: "₹799",
    period: "per month",
    cta: "Coming Soon",
    gradient: "from-blue-500 to-indigo-400",
    popular: false,
    features: [
      "Everything in Starter",
      "Unlimited storage",
      "500 AI credits/month",
      "Advanced analytics",
      "Password protection",
      "Custom apps & themes",
      "API access",
      "White-label option",
    ],
  },
];

const faqs = [
  {
    question: "What are AI credits?",
    answer: "AI credits are used for AI-powered features like code generation, content creation, image generation, and advanced AI queries. Different operations consume different amounts of credits.",
  },
  {
    question: "Can I switch plans anytime?",
    answer: "Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect immediately for upgrades and at the next billing cycle for downgrades.",
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use end-to-end encryption for all data. Your AI interactions and personal data never leave your workspace without your explicit permission.",
  },
  {
    question: "What happens when I run out of AI credits?",
    answer: "You can purchase additional credits or upgrade to a higher plan. Your access to non-AI features remains unaffected.",
  },
  {
    question: "Can I use VibhavMacOS offline?",
    answer: "Core apps like Notes, Calendar, and File Storage work offline. AI-powered features require an internet connection.",
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  return (
    <section ref={ref} className="relative py-32 bg-black" id="pricing">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-white/10 via-gray-400/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-bl from-pink-600/10 via-gray-400/5 to-transparent rounded-full blur-3xl" />
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
            Start Free.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Upgrade When Ready.
            </span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Your professional desktop is free forever. Pay only for AI usage and advanced features.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${plan.popular ? "lg:-mt-4 lg:mb-4" : ""}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-gray-400 to-pink-600 text-white text-xs font-semibold shadow-lg">
                    <Sparkles className="w-3 h-3" />emerald-500 to-cyan-500 text-white text-xs font-semibold shadow-lg">
                    <Star className="w-3 h-3" />
                    Start Here
                </div>
              )}

              <div className={`relative h-full p-6 rounded-3xl border backdrop-blur-xl ${
                plan.popular
                  ? "bg-gradient-to-br from-white/15 to-white/10 border-gray-500/30 shadow-2xl shadow-gray-400/20"
                  : "bg-gradient-to-br from-white/10 to-white/5 border-white/10"
              }`}>
                {/* Gradient Top Border */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${plan.gradient}`} />

                {/* Plan Name */}
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {plan.description}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => {
                    if (plan.id === "free") window.location.href = "/sign-up";
                  }}
                  disabled={plan.id !== "free"}
                  className={`w-full py-6 rounded-2xl font-semibold text-lg ${
                    plan.popular
                      ? "id === "free"
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-6
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI Credits Info */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-white/10 to-gray-100/10 border border-white/10 backdrop-blur-xl"
        >
          <h3 className="text-2xl font-bold text-white mb-4 text-center">
            AI Credits System
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { action: "Code Generation", cost: "2 credits" },
              { action: "AI Search", cost: "1 credit" },
              { action: "Image Generation", cost: "5 credits" },
              { action: "Content Analysis", cost: "3 credits" },
            ].map((item, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-black/30">
                <div className="text-sm text-gray-300 mb-1">{item.action}</div>
                <div className="text-lg font-semibold text-gray-200">{item.cost}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32"
        >
          <h3 className="text-4xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h3>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <button
                key={index}
                onClick={() => setActiveFAQ(activeFAQ === index ? null : index)}
                className="w-full text-left"
              >
                <div className={`p-6 rounded-2xl border transition-all duration-300 ${
                  activeFAQ === index
                    ? "bg-gradient-to-br from-white/15 to-white/10 border-gray-100/30"
                    : "bg-white/5 border-white/10 hover:bg-white/10"
                }`}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      {faq.question}
                    </h4>
                    <motion.div
                      animate={{ rotate: activeFAQ === index ? 180 : 0 }}
                      className="text-white/50"
                    >
                      ↓
                    </motion.div>
                  </div>
                  
                  <motion.div
                    initial={false}
                    animate={{
                      height: activeFAQ === index ? "auto" : 0,
                      opacity: activeFAQ === index ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-4 text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
