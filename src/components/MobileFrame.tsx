import { ReactNode } from "react";

interface MobileFrameProps {
  children: ReactNode;
  className?: string;
}

const MobileFrame = ({ children, className = "" }: MobileFrameProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div
        className={`relative w-full max-w-[390px] min-h-[844px] bg-background rounded-[2.5rem] overflow-hidden border border-border ${className}`}
        style={{ boxShadow: "var(--shadow-float)" }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1">
          <span className="text-xs font-semibold text-foreground">9:41</span>
          <div className="flex items-center gap-1">
            <div className="flex gap-[2px]">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-[3px] rounded-full bg-foreground" style={{ height: `${6 + i * 2}px` }} />
              ))}
            </div>
            <svg width="15" height="12" viewBox="0 0 15 12" className="ml-1 text-foreground fill-current">
              <path d="M7.5 3.6C9.4 3.6 11.1 4.4 12.3 5.6L13.7 4.2C12.1 2.6 9.9 1.6 7.5 1.6S2.9 2.6 1.3 4.2L2.7 5.6C3.9 4.4 5.6 3.6 7.5 3.6Z" />
              <path d="M7.5 7.6C8.6 7.6 9.6 8 10.3 8.8L11.7 7.4C10.6 6.2 9.1 5.6 7.5 5.6S4.4 6.2 3.3 7.4L4.7 8.8C5.4 8 6.4 7.6 7.5 7.6Z" />
              <circle cx="7.5" cy="11" r="1.5" />
            </svg>
            <svg width="22" height="11" viewBox="0 0 22 11" className="ml-1">
              <rect x="0" y="0" width="19" height="11" rx="2" className="stroke-foreground fill-none" strokeWidth="1"/>
              <rect x="1.5" y="1.5" width="14" height="8" rx="1" className="fill-foreground"/>
              <rect x="20" y="3" width="2" height="5" rx="1" className="fill-foreground opacity-40"/>
            </svg>
          </div>
        </div>
        <div className="flex flex-col h-[800px] overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export default MobileFrame;
