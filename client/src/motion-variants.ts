import type { Variants } from 'framer-motion';

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};
