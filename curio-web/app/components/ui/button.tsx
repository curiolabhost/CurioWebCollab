import * as React from "react";

type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black/20 " +
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-black text-white hover:bg-black/90",
  destructive: "bg-red-600 text-white hover:bg-red-600/90",
  outline: "border border-gray-300 bg-white text-gray-900 hover:bg-gray-50",
  secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
  ghost: "bg-transparent text-gray-900 hover:bg-gray-100",
  link: "bg-transparent text-blue-600 underline-offset-4 hover:underline",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3",
  lg: "h-10 px-6",
  icon: "h-9 w-9 p-0",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(base, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
}
