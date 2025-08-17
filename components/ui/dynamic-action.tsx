// component.tsx
import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  content: React.ReactNode;
  dimensions: {
    width: number;
    height: number;
  };
  onClick?: () => void;
  onMouseEnter?: () => void;
}

export interface DynamicActionBarProps
  extends React.HTMLAttributes<HTMLDivElement> {
  actions: ActionItem[];
}

const DynamicActionBar = React.forwardRef<
  HTMLDivElement,
  DynamicActionBarProps
>(({ actions, className, ...props }, ref) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeAction = activeIndex !== null ? actions[activeIndex] : null;

  const BUTTON_BAR_HEIGHT = 56;

  const containerAnimate = activeAction
    ? {
        width: "100%",
        height: activeAction.dimensions.height + BUTTON_BAR_HEIGHT,
      }
    : {
        width: "100%",
        height: BUTTON_BAR_HEIGHT,
      };

  const transition = { type: "spring" as const, stiffness: 400, damping: 35 };

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      onMouseLeave={() => setActiveIndex(null)}
      {...props}
    >
      <motion.div
        className="flex flex-col overflow-hidden rounded-2xl bg-black/5 backdrop-blur-xl border-2 border-[#47624f] shadow-lg"
        animate={containerAnimate}
        transition={transition}
        initial={{ width: "100%", height: BUTTON_BAR_HEIGHT }}
      >
        <div
          className="flex flex-shrink-0 items-center justify-between px-6 py-2"
          style={{ height: `${BUTTON_BAR_HEIGHT}px` }}
        >
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onMouseEnter={() => {
                  setActiveIndex(index);
                  action.onMouseEnter?.();
                }}
                onClick={action.onClick}
                className="group relative flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-zinc-800 transition-all duration-300 hover:bg-[#47624f] hover:text-white overflow-hidden"
              >
                {/* Diagonal shimmer effect for action bar buttons */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                </div>
                
                <Icon className="size-5 relative z-10" />
                <span className="font-medium relative z-10">{action.label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex-grow overflow-hidden">
          <AnimatePresence>
            {activeAction && (
              <motion.div
                className="w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                {activeAction.content}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
});

DynamicActionBar.displayName = "DynamicActionBar";

export default DynamicActionBar;
