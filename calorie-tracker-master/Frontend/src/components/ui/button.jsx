// src/components/ui/button.jsx
import * as React from "react"

const Button = React.forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  children,
  disabled,
  type = "button",
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
  
  const variantStyles = {
    default: "bg-[#008000] text-primary-foreground shadow hover:bg-[#008000]/90",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-[#008000] text-secondary-foreground shadow-sm hover:bg-[#008000]/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-[#008000] underline-offset-4 hover:underline"
  }

  const sizeStyles = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-3 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-9 w-9"
  }

  return (
    <button
      type={type}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      ref={ref}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
})
Button.displayName = "Button"

export { Button }