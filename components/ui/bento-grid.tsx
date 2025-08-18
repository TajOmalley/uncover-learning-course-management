import { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[28rem] grid-cols-3 gap-4 h-full",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  onClick,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href?: string;
  cta: string;
  onClick?: () => void;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl cursor-pointer",
      // Updated styling to match action bar background while keeping border format
      "bg-black/5 backdrop-blur-xl border-2 border-[#47624f] shadow-lg",
      "transform-gpu transition-all duration-300",
      "hover:bg-[#47624f] hover:border-[#47624f]",
      className,
    )}
    onClick={onClick}
  >
    {/* Diagonal shimmer effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
    </div>
    
    <div>{background}</div>
    <div className="pointer-events-none z-10 flex transform-gpu flex-col items-center justify-center gap-4 p-6 transition-all duration-300 group-hover:items-start group-hover:justify-start group-hover:gap-1 group-hover:-translate-y-4">
      <Icon className="h-20 w-20 origin-center transform-gpu text-[#47624f] transition-all duration-300 ease-in-out group-hover:text-white" />
      <h3 className="text-4xl font-bold text-[#47624f] transition-colors duration-300 group-hover:text-white text-center group-hover:text-left">
        {name}
      </h3>
      <p className="max-w-lg text-gray-600 transition-all duration-300 group-hover:text-white/80 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
              <Button variant="ghost" asChild size="sm" className="pointer-events-auto group-hover:text-white">
          <a href={href || "#"} onClick={(e) => e.preventDefault()}>
            {cta}
          </a>
        </Button>
    </div>
    <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-[#47624f]/5" />
  </div>
);

export { BentoCard, BentoGrid };
