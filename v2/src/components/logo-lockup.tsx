interface LogoLockupProps {
  light?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LogoLockup({ light = false, size = "md" }: LogoLockupProps) {
  const sizeClasses = {
    sm: {
      text: "text-sm",
      meta: "h-4 w-4",
      sub: "text-[7px]",
    },
    md: {
      text: "text-lg",
      meta: "h-4 w-4",
      sub: "text-[7px]",
    },
    lg: {
      text: "text-xl sm:text-2xl md:text-3xl",
      meta: "h-8 w-8",
      sub: "text-[9px] sm:text-[10px]",
    },
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 select-none">
      <div className={`flex items-center gap-2 ${sizeClasses[size].text} font-bold tracking-tight font-sans ${light ? "text-white" : "text-slate-900"}`}>
        Grow by <span className="text-emerald-500 font-extrabold">Chat</span>
      </div>
      <span className={`text-xs font-light ${light ? "text-slate-600" : "text-slate-300"}`}>✕</span>
      <div className="flex items-center gap-1.5 pl-0.5">
        <svg className={`${sizeClasses[size].meta} text-[#0064E0] fill-current`} viewBox="0 0 16 16">
          <path
            fillRule="evenodd"
            d="M8.217 5.243C9.145 3.988 10.171 3 11.483 3 13.96 3 16 6.153 16.001 9.907c0 2.29-.986 3.725-2.757 3.725-1.543 0-2.395-.866-3.924-3.424l-.667-1.123-.118-.197a55 55 0 0 0-.53-.877l-1.178 2.08c-1.673 2.925-2.615 3.541-3.923 3.541C1.086 13.632 0 12.217 0 9.973 0 6.388 1.995 3 4.598 3q.477-.001.924.122c.31.086.611.22.913.407.577.359 1.154.915 1.782 1.714m1.516 2.224q-.378-.615-.727-1.133L9 6.326c.845-1.305 1.543-1.954 2.372-1.954 1.723 0 3.102 2.537 3.102 5.653 0 1.188-.39 1.877-1.195 1.877-.773 0-1.142-.51-2.61-2.87zM4.846 4.756c.725.1 1.385.634 2.34 2.001A212 212 0 0 0 5.551 9.3c-1.357 2.126-1.826 2.603-2.581 2.603-.777 0-1.24-.682-1.24-1.9 0-2.602 1.298-5.264 2.846-5.264q.137 0 .27.018"
          />
        </svg>
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-wider uppercase ${light ? "text-white" : "text-slate-800"} ${sizeClasses[size].sub === "text-[7px]" ? "text-[10px]" : sizeClasses[size].sub}`}>
            Meta
          </span>
          <span className={`font-semibold tracking-tight ${light ? "text-slate-400" : "text-slate-500"} ${sizeClasses[size].sub}`}>
            Tech Provider
          </span>
        </div>
      </div>
    </div>
  );
}
