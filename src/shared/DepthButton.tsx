import React from "react";

type ClickHandler<T> = (() => void) | ((event: React.MouseEvent<T>) => void);

interface DepthButtonProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick"
> {
  active?: boolean;
  sizeClassName?: string;
  inactiveClassName?: string;
  activeClassName?: string;
  inactiveSurfaceClassName?: string;
  activeSurfaceClassName?: string;
  onClick?: ClickHandler<HTMLButtonElement>;
}

export const DepthButton = React.forwardRef<
  HTMLButtonElement,
  DepthButtonProps
>(
  (
    {
      active = false,
      sizeClassName = "w-7 h-7 rounded-3xl",
      className = "",
      inactiveClassName = "text-app-text border-app-border hover:text-app-text",
      activeClassName = "text-white border-app-accent",
      inactiveSurfaceClassName = "bg-gradient-to-br from-app-bg via-app-surface to-app-bg group-hover:from-app-surface-hover group-hover:via-app-bg group-hover:to-app-surface-hover",
      activeSurfaceClassName = "bg-gradient-to-br from-app-accent/90 via-app-accent to-app-accent/80",
      children,
      ...buttonProps
    },
    ref,
  ) => {
    const { disabled, onClick, ...restButtonProps } = buttonProps;

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
      if (disabled || !onClick) return;
      onClick(event);
    };

    return (
      <button
        {...restButtonProps}
        ref={ref}
        onClick={handleClick}
        className={`relative flex items-center justify-center ${sizeClassName} overflow-hidden border transition-all duration-200 outline-none group ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${active ? activeClassName : inactiveClassName} ${className}`}
      >
        <span
          className={`absolute inset-0 transition-all duration-200 ${
            active ? activeSurfaceClassName : inactiveSurfaceClassName
          }`}
        />
        <span className="absolute left-1.5 right-1.5 top-1 h-2 rounded-full bg-white/65 dark:bg-white/10 blur-[1px] opacity-85" />
        <span className="absolute inset-[1px] rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.35)]" />
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  },
);

DepthButton.displayName = "DepthButton";

interface DepthSurfaceProps {
  className?: string;
  surfaceClassName?: string;
  children: React.ReactNode;
  onClick?: ClickHandler<HTMLDivElement>;
  title?: string;
}

export const DepthSurface: React.FC<DepthSurfaceProps> = ({
  className = "",
  surfaceClassName = "bg-gradient-to-br from-white/20 via-white/15 to-white/10 border border-white/20",
  children,
  onClick,
  ...divProps
}) => {
  const handleClick: React.MouseEventHandler<HTMLDivElement> | undefined =
    onClick
      ? (event) => {
          onClick(event);
        }
      : undefined;

  return (
    <div
      {...divProps}
      onClick={handleClick}
      className={`relative overflow-hidden rounded ${className} ${onClick ? "cursor-pointer" : ""}`}
    >
      <span className={`absolute inset-0 ${surfaceClassName}`} />
      <span className="absolute left-2 right-2 top-[2px] h-1.5 rounded-full bg-white/35 blur-[1px]" />
      <span className="absolute inset-[1px] rounded-[inherit] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.12)]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
