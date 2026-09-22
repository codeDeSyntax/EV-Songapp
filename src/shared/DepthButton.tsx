import React from "react";

type ClickHandler<T> = (() => void) | ((event: React.MouseEvent<T>) => void);

export interface DepthButtonProps extends Omit<
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
      sizeClassName = "w-7 h-7 rounded-md",
      className = "",
      inactiveClassName = "text-app-text border-app-border hover:bg-app-surface-hover hover:text-app-text",
      activeClassName = "text-white bg-app-accent border-app-accent",
      inactiveSurfaceClassName = "",
      activeSurfaceClassName = "",
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

    const surfaceClass = active
      ? (activeSurfaceClassName || "bg-app-accent")
      : (inactiveSurfaceClassName || "bg-app-surface");

    return (
      <button
        {...restButtonProps}
        ref={ref}
        onClick={handleClick}
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        className={`relative flex items-center justify-center ${sizeClassName} border transition-colors duration-150 outline-none ${
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
        } ${active ? activeClassName : inactiveClassName} ${surfaceClass} ${className}`}
      >
        <span className="flex items-center justify-center">
          {children}
        </span>
      </button>
    );
  },
);

DepthButton.displayName = "DepthButton";

export interface DepthSurfaceProps {
  className?: string;
  surfaceClassName?: string;
  children: React.ReactNode;
  onClick?: ClickHandler<HTMLDivElement>;
  title?: string;
  style?: React.CSSProperties;
}

export const DepthSurface: React.FC<DepthSurfaceProps> = ({
  className = "",
  surfaceClassName = "bg-black/5 dark:bg-black/30 border border-app-border",
  children,
  onClick,
  style,
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
      style={{ WebkitAppRegion: "no-drag", ...style } as React.CSSProperties}
      className={`rounded ${surfaceClassName} ${className} ${onClick ? "cursor-pointer" : ""}`}
    >
      {children}
    </div>
  );
};

