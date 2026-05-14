import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Play,
  Sparkles,
  Zap,
  Trophy,
  Route as RouteIcon,
  Boxes,
  Type,
  Link as LinkIcon,
  TreePine,
  Network,
  Search,
  GitBranch,
  Layers,
  Code2,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTransition } from '@/components/PageTransition';
import { fadeUp, stagger } from '@/motion-variants';

const STATS = [
  { label: 'Topics', value: '32' },
  { label: 'Visualizations', value: '120+' },
  { label: 'Problems', value: '250+' },
  { label: 'Developers', value: '10K+' },
];

const TOPICS = [
  { icon: Boxes, name: 'Arrays', count: '12 topics', level: 'Beginner' },
  { icon: Type, name: 'Strings', count: '9 topics', level: 'Beginner' },
  { icon: LinkIcon, name: 'Linked Lists', count: '7 topics', level: 'Beginner' },
  { icon: TreePine, name: 'Trees', count: '9 topics', level: 'Intermediate' },
  { icon: Network, name: 'Graphs', count: '11 topics', level: 'Advanced' },
  { icon: Layers, name: 'Sorting', count: '7 topics', level: 'Beginner' },
  { icon: Search, name: 'Searching', count: '6 topics', level: 'Beginner' },
  { icon: GitBranch, name: 'Dynamic Prog.', count: '13 topics', level: 'Advanced' },
];

export default function HomePage() {
  return (
    <AppShell>
      <PageTransition>
        <div className="mx-auto max-w-[1600px] px-6 pb-8 pt-12">
          <div className="relative grid-bg overflow-hidden rounded-2xl border border-border bg-gradient-surface">
            <div className="pointer-events-none absolute inset-0 bg-[var(--gradient-glow)]" />
            <div className="relative p-10 md:p-16">
              <motion.div initial="hidden" animate="show" variants={stagger} className="max-w-3xl">
                <motion.div
                  variants={fadeUp}
                  className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs text-primary"
                >
                  <Sparkles className="h-3 w-3" /> WELCOME // v1.0
                </motion.div>
                <motion.h1
                  variants={fadeUp}
                  className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
                >
                  Master Data <br />
                  Structures & <span className="text-gradient-primary">Algorithms</span>
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg text-muted-foreground">
                  Visualize. Practice. Conquer. An interactive platform to help developers understand DSA concepts through
                  visualization, real-time battles, and curated paths.
                </motion.p>
                <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
                  <Link
                    to="/path"
                    className="group inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 font-medium text-primary-foreground transition-all hover:shadow-glow"
                  >
                    Start Learning <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/visualizer"
                    className="inline-flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-6 font-medium transition-colors hover:border-primary/50"
                  >
                    <Play className="h-4 w-4" /> Open Visualizer
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-12 grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4"
              >
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-lg border border-border bg-background/50 p-4 backdrop-blur"
                  >
                    <div className="font-display text-2xl font-bold text-primary">{s.value}</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: Trophy, title: 'Battle Mode', desc: 'Match with players worldwide', to: '/playground', color: 'text-primary' },
              { icon: RouteIcon, title: 'Learning Paths', desc: 'From beginner to mastery', to: '/path', color: 'text-info' },
              { icon: Zap, title: 'Live Visualizer', desc: 'Watch algorithms come alive', to: '/visualizer', color: 'text-warning' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Link
                  to={item.to}
                  className="group block rounded-xl border border-border bg-surface p-5 transition-all hover:border-primary/50 hover:bg-surface-elevated"
                >
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                  <div className="mt-3 flex items-center gap-1 font-semibold transition-colors group-hover:text-primary">
                    {item.title}{' '}
                    <ArrowRight className="h-3.5 w-3.5 -translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <div className="mb-2 font-mono text-xs text-primary">EXPLORE_TOPICS/</div>
                <h2 className="font-display text-3xl font-bold">Pick your battlefield</h2>
              </div>
              <Link to="/topics" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
            >
              {TOPICS.map((t) => (
                <motion.div key={t.name} variants={fadeUp}>
                  <Link
                    to="/topics"
                    className="group block rounded-lg border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
                        <t.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.count}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t.level}</div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="relative mt-16 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-surface p-10 text-center md:p-14">
            <div className="absolute inset-0 bg-[var(--gradient-glow)] opacity-50" />
            <div className="relative">
              <Code2 className="mx-auto mb-4 h-10 w-10 text-primary" />
              <h3 className="font-display text-3xl font-bold md:text-4xl">Ready to compile knowledge?</h3>
              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                Join 10,000+ developers leveling up daily. Auth with Google or GitHub — start in 10 seconds.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 font-medium text-primary-foreground transition-all hover:shadow-glow"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}
