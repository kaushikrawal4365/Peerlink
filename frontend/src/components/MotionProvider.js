import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Simple wrapper to ensure Framer Motion context is available
export const MotionProvider = ({ children }) => {
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
};

export default MotionProvider;
