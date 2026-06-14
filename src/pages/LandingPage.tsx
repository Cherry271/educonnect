import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  Users,
  Sparkles,
  MessageSquare,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Share Resources",
    desc: "Upload PDFs, docs, videos and learn together",
  },
  {
    icon: MessageSquare,
    title: "Discussions",
    desc: "Reddit-style threads for academic conversations",
  },
  {
    icon: Sparkles,
    title: "AI Assistant",
    desc: "EduConnect AI powered by Groq Llama 3.3 with RAG",
  },
  {
    icon: Users,
    title: "Study Groups",
    desc: "Collaborate in course and department groups",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-white" size={32} />
          <span className="text-white font-bold text-xl">EduConnect</span>
        </div>
        <div className="flex gap-4">
          <Link
            to="/login"
            className="text-white/90 hover:text-white px-4 py-2"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-white text-primary-700 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-bold text-white mb-6"
        >
          Connecting Students and Teachers
          <br />
          Through Collaborative Learning
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto"
        >
          The educational social platform where knowledge meets community. Share
          resources, join discussions, and learn with AI-powered assistance.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-colors"
          >
            Join EduConnect <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20"
          >
            <Icon className="text-primary-200 mb-4" size={32} />
            <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
            <p className="text-primary-100 text-sm">{desc}</p>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
