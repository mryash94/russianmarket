import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface MovingBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  duration?: number;
  radius?: string;
  gap?: string;
  className?: string;
  contentClassName?: string;
}

export function MovingBorder({
  children,
  duration = 2000,
  radius = "30px",
  gap = "4px",
  className,
  contentClassName,
  ...props
}: MovingBorderProps) {
  return (
    <div
      className={cn(
        "relative p-[2px] overflow-hidden flex items-center justify-center",
        className
      )}
      style={{ borderRadius: radius }}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: radius }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: duration / 1000,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute -inset-[150%] bg-[conic-gradient(from_0deg,transparent_0_340deg,var(--primary,#00f0ff)_360deg)]"
        />
      </div>
      <div
        className={cn(
          "relative z-10 flex h-full w-full items-center justify-center",
          contentClassName
        )}
        style={{
          borderRadius: `calc(${radius} - ${gap})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default MovingBorder;
