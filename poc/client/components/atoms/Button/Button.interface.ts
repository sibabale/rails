import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant that determines visual style */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  
  /** Whether the button is in a loading state */
  loading?: boolean;
  
  /** Loading text to display when loading is true */
  loadingText?: string;
  
  /** Icon to display before the button text */
  leftIcon?: React.ReactNode;
  
  /** Icon to display after the button text */
  rightIcon?: React.ReactNode;
  
  /** Whether the button should render as a child component */
  asChild?: boolean;
  
  /** Motion preset for animations */
  motionPreset?: 'default' | 'subtle' | 'bounce' | 'none';
  
  /** Custom motion props */
  whileHover?: any;
  whileTap?: any;
  transition?: any;
  initial?: any;
  animate?: any;
  exit?: any;
  variants?: any;
  layout?: any;
  layoutId?: any;
}

export interface ButtonState {
  /** Whether the button is currently pressed */
  isPressed: boolean;
  
  /** Whether the button is currently focused */
  isFocused: boolean;
  
  /** Whether the button is currently hovered */
  isHovered: boolean;
}

export interface ButtonEvents {
  /** Called when button is clicked */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** Called when button is pressed */
  onPress?: () => void;
  
  /** Called when button is released */
  onRelease?: () => void;
  
  /** Called when button gains focus */
  onFocus?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  
  /** Called when button loses focus */
  onBlur?: (event: React.FocusEvent<HTMLButtonElement>) => void;
  
  /** Called when mouse enters button */
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  /** Called when mouse leaves button */
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export type ButtonVariant = ButtonProps['variant'];
export type ButtonSize = ButtonProps['size'];
export type ButtonMotionPreset = ButtonProps['motionPreset'];

 