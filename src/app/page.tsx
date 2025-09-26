'use client'
import Link from 'next/link'
import { CubeIcon } from '@heroicons/react/24/outline'
import { motion, type Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1
    }
  }
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

const iconVariants: Variants = {
  hidden: { scale: 0, rotate: -180 },
  visible: { 
    scale: 1, 
    rotate: 0
  }
}

export default function Home() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at center, rgba(147, 51, 234, 0.2) 0%, 
                          rgba(139, 92, 246, 0.1) 50%, 
                          transparent 100%),
          linear-gradient(to bottom, #4c1d95 0%, #581c87 100%)
        `
      }}
    >
      <motion.div 
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.div 
          className="absolute top-20 left-10 w-4 h-4 bg-purple-300 rounded-full"
          animate={{ y: [0, -30, 0], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-3 h-3 bg-purple-200 rounded-full"
          animate={{ y: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div 
          className="absolute bottom-40 left-1/3 w-5 h-5 bg-purple-400 rounded-full"
          animate={{ y: [0, -15, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div 
          className="absolute bottom-20 right-1/4 w-2 h-2 bg-purple-500 rounded-full"
          animate={{ y: [0, 10, 0], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 text-center w-full max-w-md px-4"
      >
        <motion.div 
          variants={iconVariants}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <CubeIcon className="w-16 h-16 text-purple-200 mx-auto mb-4 drop-shadow-lg" />
        </motion.div>
        
        <motion.h1 
          variants={itemVariants}
          className="text-3xl font-bold text-white mb-2"
        >
          Simple Inventory System
        </motion.h1>
        
        <motion.p 
          variants={itemVariants}
          className="text-lg text-purple-100 mb-6"
        >
          Track stock, manage orders, and stay organized effortlessly.
        </motion.p>
        
        <motion.div 
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            href="/view"
            className="relative overflow-hidden inline-block w-full md:w-auto bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl group"
            aria-label="Navigate to inventory dashboard"
          >
            <span className="relative z-10">Go to Inventory</span>
            <motion.div 
              className="absolute inset-0 bg-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              initial={{ scaleX: 0 }}
              whileHover={{ scaleX: 1 }}
              style={{ originX: 0 }}
            />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}