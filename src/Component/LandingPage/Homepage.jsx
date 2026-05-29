import { motion } from 'framer-motion';
import LevelCard from './LevelCard';
import { Button } from "@/components/ui/button";

const levels = [
  {
    level: 1,
    title: "Explorers",
    description: "Interactive stories, basic numeracy, and playful learning games for the youngest minds.",
    range: "Grades 1 - 4",
    path: "/level1"
  },
  {
    level: 2,
    title: "Adventurers",
    description: "Diving deeper into concepts with visual logic, creative writing, and problem solving.",
    range: "Grades 5 - 8",
    path: "/level2"
  },
  {
    level: 3,
    title: "Strategists",
    description: "Focused preparation, concept mapping, and advanced analytics for high-stakes growth.",
    range: "Grades 9 - 10",
    path: "#"
  },
  {
    level: 4,
    title: "Scholars",
    description: "University-grade research tools, career mapping, and mastery of complex disciplines.",
    range: "Grades 11 - 12",
    path: "#"
  }
];

export default function Homepage() {
  return (
    <main className="min-h-screen px-6 py-20 flex flex-col items-center justify-center max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="inline-block px-4 py-1.5 mb-6 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest uppercase text-level-3"
        >
          Intelligence Redefined
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent"
        >
          Choose Your Path
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-light"
        >
          Tailored learning journeys designed for every stage of your education.
          Select your level to begin the experience.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8"
        >
          <Button className="bg-white text-slate-950 hover:bg-white/90">
            shadcn Button Test
          </Button>
        </motion.div>
      </div>

      {/* Levels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
        {levels.map((lvl) => (
          <LevelCard key={lvl.level} {...lvl} path={lvl.path} />
        ))}
      </div>

      {/* Footer Branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="mt-20 text-white/20 text-sm font-medium tracking-widest uppercase"
      >
        Education AI &copy; 2026
      </motion.div>
    </main>
  );
}
