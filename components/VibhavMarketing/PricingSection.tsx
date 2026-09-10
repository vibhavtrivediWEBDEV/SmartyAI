"use client";

import { motion, useInView } from "framer-motion";
import Image from "next/image";
import { useRef, useState } from "react";
import { Check, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PURCHASABLE_PLANS, type Plan } from "@/modules/subscription/plans";

const gradients: Record<Plan, string> = {
  free: "from-slate-500 to-zinc-500",
  trial: "from-emerald-500 to-teal-500",
  starter: "from-blue-600 to-cyan-600",
  pro: "from-purple-600 to-pink-600",
  job_seeker: "from-amber-500 to-orange-600",
};

const pricingPlans = PURCHASABLE_PLANS.map((plan) => ({
  ...plan,
  price: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(plan.priceInr),
  period: `for ${plan.billingPeriod === "day" ? "1 day" : plan.billingPeriod === "week" ? "1 week" : "1 month"}`,
  cta: plan.id === "trial" ? "Start one-day trial" : `Choose ${plan.name}`,
  gradient: gradients[plan.id],
}));

type CheckoutResponse = {
  keyId: string;
  orderId: string;
  amount: number;
  currency: string;
  plan: { name: string };
  customer: { name: string; email: string };
};

type RazorpayResult = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

function loadRazorpay(): Promise<boolean> {
  if ((window as typeof window & { Razorpay?: unknown }).Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const faqs = [
  {
    question: "What are AI credits?",
    answer: "AI credits track actual model usage. Credits are settled from the prompt and generated tokens used by an AI request; opening saved data and using non-AI tools does not consume them.",
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
    answer: "AI generation pauses until your next billing period or until you upgrade. Your access to saved data and non-AI features remains unaffected.",
  },
  {
    question: "Can I use SmartyAI offline?",
    answer: "Core apps like Notes, Calendar, and File Storage work offline. AI-powered features require an internet connection.",
  },
];

export default function PricingSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);

  const beginCheckout = async (planId: Plan) => {
    setCheckoutPlan(planId);
    try {
      const response = await fetch("/api/subscription/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (response.status === 401) {
        window.location.href = `/sign-in?redirect=${encodeURIComponent(`/?plan=${planId}#pricing`)}`;
        return;
      }
      const data = await response.json() as CheckoutResponse & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Could not start checkout");
      if (!(await loadRazorpay())) throw new Error("Razorpay Checkout could not be loaded");

      const Razorpay = (window as typeof window & { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay;
      new Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "SmartyAI",
        description: data.plan.name,
        prefill: data.customer,
        theme: { color: "#2563eb" },
        handler: async (payment: RazorpayResult) => {
          const verification = await fetch("/api/subscription/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId,
              razorpayOrderId: payment.razorpay_order_id,
              razorpayPaymentId: payment.razorpay_payment_id,
              razorpaySignature: payment.razorpay_signature,
            }),
          });
          const result = await verification.json() as { error?: string };
          if (!verification.ok) {
            toast.error(result.error ?? "Payment verification failed");
            return;
          }
          toast.success("Subscription activated");
          window.location.href = "/desktop";
        },
      }).open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout");
    } finally {
      setCheckoutPlan(null);
    }
  };

  return (
    <section ref={ref} className="relative overflow-hidden border-t border-white/8 bg-[#08090b] py-24 sm:py-32" id="pricing">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-size-[64px_64px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-375 px-5 sm:px-8 lg:px-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-14 grid gap-7 lg:grid-cols-[1fr_0.65fr] lg:items-end"
        >
          <div><p className="mb-5 text-xs font-semibold uppercase text-emerald-300">Choose your access</p><h2 className="text-4xl font-semibold leading-[1.06] text-white sm:text-6xl lg:text-7xl">One workspace.<br /><span className="text-white/38">A plan for every pace.</span></h2></div>
          <p className="max-w-xl text-base leading-7 text-white/52 sm:text-lg">Choose the monthly agent capacity that matches your search. No hidden setup fee.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8, delay: 0.1 }} className="relative mb-16 overflow-hidden border border-white/12 bg-black">
          <div className="relative aspect-16/5 min-h-56"><Image src="/screenshots/dekstop.png" alt="The complete SmartyAI Career OS included with every plan" fill sizes="100vw" className="object-cover object-center opacity-72" /><div className="absolute inset-0 bg-linear-to-r from-black via-black/45 to-transparent" /></div>
          <div className="absolute inset-y-0 left-0 flex max-w-xl flex-col justify-center p-7 sm:p-10"><p className="text-xs font-semibold uppercase text-cyan-300">Included in every plan</p><h3 className="mt-3 text-2xl font-semibold text-white sm:text-4xl">The complete Career OS.</h3><p className="mt-3 text-sm leading-6 text-white/58 sm:text-base">Desktop, career agent, learning, interview, coding, resume, files, notes, and connected tools.</p></div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                  <div className="flex items-center gap-1 border border-white/15 bg-white px-3 py-1 text-xs font-semibold text-black shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className={`relative h-full rounded-md border p-6 backdrop-blur-xl ${
                plan.popular
                  ? "border-cyan-300/35 bg-white/10 shadow-2xl shadow-cyan-500/10"
                  : "border-white/10 bg-white/4"
              }`}>
                {/* Gradient Top Border */}
                <div className={`absolute left-0 right-0 top-0 h-0.5 bg-linear-to-r ${plan.gradient}`} />

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
                    <span className="bg-linear-to-r from-white to-gray-300 bg-clip-text text-5xl font-bold text-transparent">
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
                      <Check className="mt-1 h-4 w-4 shrink-0 text-green-400" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => void beginCheckout(plan.id)}
                  disabled={checkoutPlan !== null}
                  className={`w-full rounded-sm py-6 text-lg font-semibold ${
                    plan.popular
                      ? "bg-white text-black hover:bg-cyan-100"
                      : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
                  }`}
                >
                  {checkoutPlan === plan.id && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  {checkoutPlan === plan.id ? "Opening checkout" : plan.cta}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

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
                <div className={`border p-6 transition-all duration-300 ${
                  activeFAQ === index
                    ? "border-cyan-300/30 bg-white/10"
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
