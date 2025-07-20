# Rails Development Guidelines

## SEO & Lighthouse Optimization Standards

This document outlines mandatory guidelines for achieving 100% Lighthouse scores and optimal SEO performance for Rails financial infrastructure platform.

## 1. HTML Semantic Structure

### Required HTML Elements
- Always use semantic HTML5 elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- Implement proper heading hierarchy (h1 → h2 → h3, never skip levels)
- Use `<button>` for interactive elements, `<a>` only for navigation
- Include `lang="en"` attribute on `<html>` element

### Meta Tags Requirements
Every page must include:
```html
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Page Title - Rails Financial Infrastructure</title>
<meta name="description" content="Specific page description (150-160 characters)">
<meta name="keywords" content="financial infrastructure, banking API, South Africa">
<meta name="author" content="Rails">
<meta name="robots" content="index, follow">
<link rel="canonical" href="https://rails.co.za/current-page">
```

### Open Graph & Social Media
```html
<meta property="og:title" content="Page Title - Rails">
<meta property="og:description" content="Page description">
<meta property="og:image" content="https://rails.co.za/og-image.jpg">
<meta property="og:url" content="https://rails.co.za/current-page">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Page Title - Rails">
<meta name="twitter:description" content="Page description">
<meta name="twitter:image" content="https://rails.co.za/twitter-image.jpg">
```

## 2. Motion Design & Animation Standards (MANDATORY)

Motion design is crucial for creating credible, intuitive user experiences in financial applications. All animations must be purposeful, smooth, and accessible.

### Animation Principles

#### Core Principles
1. **Purpose-Driven**: Every animation should serve a functional purpose (feedback, guidance, hierarchy)
2. **Performance-First**: Animations must not impact Core Web Vitals or perceived performance
3. **Accessible**: Respect `prefers-reduced-motion` and provide alternatives
4. **Consistent**: Use standardized easing curves, durations, and patterns across the application

#### Timing & Easing Standards
```jsx
// Standard duration values
const ANIMATION_DURATION = {
  fast: 150,      // Micro-interactions (hover, focus)
  normal: 300,    // Standard transitions (page elements)
  slow: 500,      // Complex transitions (page changes)
  counter: 2000,  // Number counter animations
} as const;

// Standard easing curves
const EASING = {
  easeOut: [0.0, 0.0, 0.2, 1],      // Material Design standard
  easeInOut: [0.4, 0.0, 0.2, 1],    // Smooth both ways
  spring: { type: "spring", stiffness: 300, damping: 30 }, // Natural feel
  snappy: [0.25, 0.46, 0.45, 0.94], // Snappy interactions
} as const;
```

### Animation Library Usage

#### Framer Motion (Primary Library)
Use for complex animations, layout transitions, and orchestrated sequences:

```jsx
import { motion, useInView, useAnimation } from 'framer-motion';

// ✅ CORRECT - Page entrance animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
>
  <Content />
</motion.div>

// ✅ CORRECT - Scroll-triggered animation
const controls = useAnimation();
const ref = useRef(null);
const inView = useInView(ref, { once: true, margin: "-100px" });

useEffect(() => {
  if (inView) {
    controls.start("visible");
  }
}, [controls, inView]);

<motion.section
  ref={ref}
  animate={controls}
  initial="hidden"
  variants={{
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  }}
>
```

#### React Spring (Secondary Library)
Use for physics-based animations and micro-interactions:

```jsx
import { useSpring, animated } from 'react-spring';

// ✅ CORRECT - Hover micro-interaction
const [styles, api] = useSpring(() => ({
  scale: 1,
  config: { tension: 300, friction: 10 }
}));

<animated.div
  style={styles}
  onMouseEnter={() => api.start({ scale: 1.05 })}
  onMouseLeave={() => api.start({ scale: 1 })}
>
```

### Animation Categories & Implementation

#### 1. Number Counters & Statistics
Real-time animated counters that handle large numbers efficiently:

```jsx
// ✅ CORRECT - Animated counter component
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface AnimatedCounterProps {
  from: number;
  to: number;
  duration?: number;
  format?: (value: number) => string;
  decimals?: number;
}

function AnimatedCounter({ from, to, duration = 2, format, decimals = 0 }: AnimatedCounterProps) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => {
    return format ? format(latest) : Math.round(latest * Math.pow(10, decimals)) / Math.pow(10, decimals);
  });

  useEffect(() => {
    const animation = animate(count, to, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94]
    });
    return animation.stop;
  }, [to]);

  return <motion.span>{rounded}</motion.span>;
}

// Usage for large numbers
<AnimatedCounter 
  from={0} 
  to={1234567} 
  format={(value) => new Intl.NumberFormat('en-ZA', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value)}
/>
```

#### 2. Page & Component Transitions
```jsx
// ✅ CORRECT - Page transition container
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 }
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
};

<motion.div
  initial="initial"
  animate="in"
  exit="out"
  variants={pageVariants}
  transition={pageTransition}
>
  <PageContent />
</motion.div>
```

#### 3. Scroll-Triggered Animations
```jsx
// ✅ CORRECT - Intersection Observer animations
const fadeUpVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.0, 0.0, 0.2, 1]
    }
  }
};

function ScrollReveal({ children, className = "" }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={fadeUpVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

#### 4. Interactive Element Animations
```jsx
// ✅ CORRECT - Button hover and tap animations
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
  className="min-h-[44px]"
>
  Click Me
</motion.button>

// ✅ CORRECT - Card hover effects
<motion.div
  whileHover={{ 
    y: -5,
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
  }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <Card />
</motion.div>
```

#### 5. Navigation & Menu Animations
```jsx
// ✅ CORRECT - Mobile menu slide animation
const menuVariants = {
  open: {
    opacity: 1,
    height: "auto",
    transition: {
      duration: 0.3,
      ease: [0.0, 0.0, 0.2, 1],
      staggerChildren: 0.05
    }
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.2,
      ease: [0.4, 0.0, 1, 1]
    }
  }
};

const itemVariants = {
  open: { opacity: 1, x: 0 },
  closed: { opacity: 0, x: -20 }
};

<motion.div
  initial="closed"
  animate={isOpen ? "open" : "closed"}
  variants={menuVariants}
  className="overflow-hidden"
>
  {menuItems.map((item, index) => (
    <motion.div key={index} variants={itemVariants}>
      {item}
    </motion.div>
  ))}
</motion.div>
```

#### 6. Data Visualization Animations
```jsx
// ✅ CORRECT - Chart enter animations
<ResponsiveContainer width="100%" height={300}>
  <LineChart data={data}>
    <Line
      type="monotone"
      dataKey="value"
      stroke="#8884d8"
      strokeWidth={2}
      animationBegin={0}
      animationDuration={1500}
      animationEasing="ease-out"
    />
  </LineChart>
</ResponsiveContainer>

// ✅ CORRECT - Custom D3 chart animations (for complex visualizations)
import { useSpring, animated } from 'react-spring';
import * as d3 from 'd3';

function AnimatedPieChart({ data, width, height }) {
  const pie = d3.pie().value(d => d.value);
  const arc = d3.arc().innerRadius(0).outerRadius(Math.min(width, height) / 2 - 10);
  
  const springs = useSpring({
    from: { opacity: 0 },
    to: { opacity: 1 },
    config: { duration: 1000 }
  });

  return (
    <animated.svg width={width} height={height} style={springs}>
      <g transform={`translate(${width/2},${height/2})`}>
        {pie(data).map((d, i) => (
          <AnimatedPath key={i} d={arc(d)} fill={colors[i]} />
        ))}
      </g>
    </animated.svg>
  );
}
```

### Performance Considerations

#### GPU Acceleration
```jsx
// ✅ CORRECT - Use transform properties for smooth animations
<motion.div
  animate={{ x: 100, scale: 1.1 }}  // Uses transform
  transition={{ duration: 0.3 }}
/>

// ❌ INCORRECT - Avoid animating layout properties
<motion.div
  animate={{ width: 200, marginLeft: 50 }}  // Triggers layout
/>
```

#### Large Number Formatting
```jsx
// ✅ CORRECT - Efficient number formatting for counters
function formatLargeNumber(num) {
  if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toString();
}

// Use Intl.NumberFormat for localization
const formatter = new Intl.NumberFormat('en-ZA', {
  notation: 'compact',
  compactDisplay: 'short',
  minimumFractionDigits: 0,
  maximumFractionDigits: 1
});
```

#### Memory Management
```jsx
// ✅ CORRECT - Cleanup animation references
useEffect(() => {
  const animation = animate(motionValue, target, options);
  return () => animation.stop();
}, [dependency]);
```

### Accessibility Requirements

#### Respect User Preferences
```jsx
// ✅ CORRECT - Check for reduced motion preference
import { motion } from 'framer-motion';

function ResponsiveAnimation({ children }) {
  const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  const variants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}
```

#### Focus Management
```jsx
// ✅ CORRECT - Maintain focus during animations
<motion.div
  layout
  onLayoutAnimationStart={() => {
    // Store current focus
    const activeElement = document.activeElement;
  }}
  onLayoutAnimationComplete={() => {
    // Restore focus if needed
  }}
>
```

### Animation Testing Requirements

#### Performance Testing
- Monitor frame rates during animations (target 60fps)
- Test on low-end devices and slow networks
- Measure impact on Core Web Vitals
- Profile memory usage during complex animations

#### User Testing
- Test with screen readers
- Verify keyboard navigation during animations
- Test with reduced motion preferences
- Validate animations enhance rather than distract from content

### Common Animation Patterns

#### Staggered Animations
```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

#### Loading States
```jsx
// ✅ CORRECT - Skeleton loading animation
<motion.div
  animate={{
    opacity: [0.5, 1, 0.5],
  }}
  transition={{
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }}
  className="bg-muted rounded-md h-4 w-full"
/>
```

## 3. Responsive Design Requirements

### Mobile-First Approach (MANDATORY)
Every page and component MUST be designed mobile-first and responsive:

#### Breakpoint Strategy
```css
/* Mobile-first breakpoints (Tailwind defaults) */
/* sm: 640px+ (small tablets) */
/* md: 768px+ (tablets) */
/* lg: 1024px+ (small desktop) */
/* xl: 1280px+ (large desktop) */
/* 2xl: 1536px+ (extra large desktop) */
```

#### Required Responsive Classes
All components must use responsive prefixes:
```jsx
// ✅ CORRECT - Mobile-first responsive design
<div className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
  <div className="w-full sm:w-1/2 lg:w-1/3">
    <h2 className="text-xl sm:text-2xl lg:text-3xl">Title</h2>
    <p className="text-sm sm:text-base lg:text-lg">Description</p>
  </div>
</div>

// ❌ INCORRECT - No responsive considerations
<div className="flex gap-6 p-8">
  <div className="w-1/3">
    <h2 className="text-3xl">Title</h2>
  </div>
</div>
```

#### Grid System Requirements
```jsx
// ✅ CORRECT - Responsive grid patterns
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
  {items.map(item => <Card key={item.id} />)}
</div>

// ✅ CORRECT - Responsive flexbox layouts
<div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-12">
```

#### Touch Target Requirements
- Minimum touch target: 44px × 44px (use `min-h-[44px] min-w-[44px]`)
- Interactive elements must be easily tappable on mobile
- Provide adequate spacing between clickable elements (min 8px)

```jsx
// ✅ CORRECT - Proper touch targets
<Button className="min-h-[44px] px-4 sm:px-6">Click Me</Button>
<div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
  <Button className="min-h-[44px]">Action 1</Button>
  <Button className="min-h-[44px]">Action 2</Button>
</div>
```

#### Typography Scaling
```jsx
// ✅ CORRECT - Responsive typography
<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl">
<h2 className="text-xl sm:text-2xl lg:text-3xl">
<h3 className="text-lg sm:text-xl lg:text-2xl">
<p className="text-sm sm:text-base lg:text-lg">
```

#### Spacing and Layout
```jsx
// ✅ CORRECT - Responsive spacing
<section className="py-12 sm:py-16 lg:py-24">
  <div className="container mx-auto px-4 sm:px-6 lg:px-8">
    <div className="max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
```

#### Navigation Patterns
```jsx
// ✅ CORRECT - Mobile-responsive navigation
<nav className="flex items-center justify-between p-4 lg:px-8">
  <div className="flex items-center">
    <Logo />
  </div>
  
  {/* Desktop navigation */}
  <div className="hidden md:flex items-center space-x-6">
    <NavLinks />
  </div>
  
  {/* Mobile menu button */}
  <Button 
    className="md:hidden min-h-[44px] min-w-[44px]"
    onClick={toggleMobileMenu}
  >
    <Menu />
  </Button>
  
  {/* Mobile menu */}
  {mobileMenuOpen && (
    <div className="absolute top-full left-0 right-0 bg-background border-t md:hidden">
      <MobileNavLinks />
    </div>
  )}
</nav>
```

#### Form Responsiveness
```jsx
// ✅ CORRECT - Responsive forms
<form className="space-y-4 sm:space-y-6">
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
    <div className="sm:col-span-2">
      <Input 
        className="w-full min-h-[44px]" 
        placeholder="Full width input"
      />
    </div>
    <Input className="min-h-[44px]" placeholder="Half width" />
    <Input className="min-h-[44px]" placeholder="Half width" />
  </div>
  <Button className="w-full sm:w-auto min-h-[44px] px-6 sm:px-8">
    Submit
  </Button>
</form>
```

#### Card and Content Layouts
```jsx
// ✅ CORRECT - Responsive card layouts
<Card className="p-4 sm:p-6 lg:p-8">
  <CardHeader className="pb-4 sm:pb-6">
    <CardTitle className="text-lg sm:text-xl lg:text-2xl">
    <CardDescription className="text-sm sm:text-base">
  </CardHeader>
  <CardContent className="space-y-4 sm:space-y-6">
```

#### Image Responsiveness
```jsx
// ✅ CORRECT - Responsive images
<ImageWithFallback
  src="image.jpg"
  alt="Description"
  className="w-full h-auto max-w-sm sm:max-w-md lg:max-w-lg"
  loading="lazy"
/>

// ✅ CORRECT - Responsive aspect ratios
<div className="aspect-square sm:aspect-video lg:aspect-[4/3]">
  <img className="w-full h-full object-cover" />
</div>
```

#### Data Tables
```jsx
// ✅ CORRECT - Mobile-responsive tables
<div className="overflow-x-auto">
  <Table className="min-w-full">
    <TableHeader>
      <TableRow>
        <TableHead className="px-4 py-3 sm:px-6">Name</TableHead>
        <TableHead className="hidden sm:table-cell px-6 py-3">Email</TableHead>
        <TableHead className="px-4 py-3 sm:px-6">Actions</TableHead>
      </TableRow>
    </TableHeader>
  </Table>
</div>

// Alternative: Card layout for mobile
<div className="block sm:hidden space-y-4">
  {data.map(item => (
    <Card key={item.id} className="p-4">
      <div className="space-y-2">
        <div className="font-medium">{item.name}</div>
        <div className="text-sm text-muted-foreground">{item.email}</div>
        <Button size="sm" className="min-h-[44px]">Actions</Button>
      </div>
    </Card>
  ))}
</div>
```

#### Container and Max-Width Patterns
```jsx
// ✅ CORRECT - Responsive containers
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  <div className="max-w-none sm:max-w-2xl lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl mx-auto">
```

### Testing Requirements
- Test on mobile devices (320px - 768px)
- Test on tablets (768px - 1024px)  
- Test on desktop (1024px+)
- Verify touch interactions work properly
- Ensure horizontal scrolling is never required
- Check text readability at all screen sizes

## 4. Performance Optimization

### Image Optimization
- Use WebP format with fallbacks
- Implement lazy loading: `loading="lazy"`
- Include proper `width` and `height` attributes
- Use responsive images with `srcset`
- Compress images to under 100KB when possible
- Always include descriptive `alt` text

### Code Splitting & Loading
- Implement React.lazy() for route-based code splitting
- Use dynamic imports for heavy components
- Minimize bundle size with tree shaking
- Implement service worker for caching

### CSS & JavaScript
- Minimize unused CSS
- Use CSS custom properties for theming
- Implement critical CSS inlining
- Defer non-critical JavaScript
- Use preload/prefetch for critical resources

## 5. Accessibility (WCAG 2.1 AA Compliance)

### Color & Contrast
- Minimum contrast ratio: 4.5:1 for normal text
- Minimum contrast ratio: 3:1 for large text
- Don't rely solely on color to convey information

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Implement proper focus management
- Use `tabindex` appropriately (0 or -1)
- Provide skip links for main content

### ARIA Labels & Roles
- Use semantic HTML first, ARIA as enhancement
- Include `aria-label` for icon buttons
- Use `aria-describedby` for additional context
- Implement `aria-live` for dynamic content updates

### Form Accessibility
```jsx
<label htmlFor="email">Email Address</label>
<input 
  id="email" 
  type="email" 
  aria-describedby="email-help"
  aria-required="true"
  className="min-h-[44px]" // Touch target compliance
/>
<div id="email-help">We'll never share your email</div>
```

## 6. Component Development Standards

### React Component Structure
```jsx
import React from 'react';
import { motion } from 'framer-motion';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ComponentProps {
  title: string;
  description?: string;
  'aria-label'?: string;
  className?: string;
}

export function Component({ 
  title, 
  description, 
  'aria-label': ariaLabel,
  className = ""
}: ComponentProps) {
  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.0, 0.0, 0.2, 1] }}
      aria-labelledby="section-title"
      className={`py-12 sm:py-16 lg:py-24 ${className}`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-none sm:max-w-2xl lg:max-w-4xl mx-auto">
          <motion.h2 
            id="section-title"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="text-xl sm:text-2xl lg:text-3xl mb-4 sm:mb-6"
          >
            {title}
          </motion.h2>
          {description && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-sm sm:text-base lg:text-lg text-muted-foreground"
            >
              {description}
            </motion.p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
```

### Image Components
- Always use `ImageWithFallback` for external images
- Include loading states and error handling
- Implement proper aspect ratios and responsive sizing

### Button Components
```jsx
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 10 }}
  aria-label="Navigate to products page"
  onClick={handleClick}
  disabled={isLoading}
  className="min-h-[44px] px-4 sm:px-6 text-sm sm:text-base"
>
  Learn More
  <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
</motion.button>
```

## 7. SEO Content Guidelines

### Content Structure
- One h1 per page (unique and descriptive)
- Use heading hierarchy to structure content
- Include relevant keywords naturally
- Write descriptive link text (avoid "click here")
- Maintain content freshness and relevance

### Internal Linking
- Create logical site hierarchy
- Use descriptive anchor text
- Implement breadcrumb navigation
- Link to related content sections

### Schema Markup
Implement structured data for:
- Organization information
- Financial services
- Product/service listings
- Contact information
- Reviews and ratings (when applicable)

## 8. Technical Implementation

### URL Structure
- Use clean, descriptive URLs
- Implement proper redirects (301 for permanent)
- Maintain consistent URL patterns
- Include relevant keywords in URLs

### Site Speed Optimization
- Target Core Web Vitals:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1

### Error Handling
- Implement proper 404 error pages
- Handle broken images gracefully
- Provide meaningful error messages
- Include navigation options on error pages

## 9. Mobile-First Design Implementation

### Responsive Design Checklist
- [ ] All layouts work on 320px width (smallest mobile)
- [ ] Touch targets meet 44px minimum
- [ ] Text is readable without zooming
- [ ] Navigation is accessible on mobile
- [ ] Forms are easy to complete on touch devices
- [ ] Images scale appropriately
- [ ] No horizontal scrolling required
- [ ] Performance is optimized for mobile networks

### Progressive Web App Features
- Implement service worker
- Add web app manifest
- Enable offline functionality where appropriate
- Implement app-like navigation

## 10. Security & Best Practices

### Security Headers
- Implement HTTPS everywhere
- Use Content Security Policy (CSP)
- Include security headers
- Validate all user inputs

### Privacy & Compliance
- Include privacy policy links
- Implement cookie consent where required
- Handle PII data responsibly
- Maintain GDPR/POPIA compliance

## 11. Testing & Validation

### Required Tests
- Lighthouse audits (aim for 90+ in all categories)
- WAVE accessibility testing
- Cross-browser compatibility
- Mobile responsiveness testing across devices
- Performance monitoring on slow networks
- Animation performance testing
- Reduced motion preference testing

### SEO Testing
- Google Search Console integration
- Meta tag validation
- Schema markup testing
- Internal link auditing

### Responsive Testing
- Test on actual devices when possible
- Use browser dev tools for various screen sizes
- Check touch interactions on mobile
- Verify readability and usability at all breakpoints

### Motion Testing
- Test animations on low-end devices
- Verify frame rates stay above 50fps
- Test with reduced motion preferences
- Validate accessibility during animations

## 12. Content Management

### Page Titles Format
- Home: "Rails - Financial Infrastructure for South Africa"
- Products: "Products - Banking APIs & Infrastructure | Rails"
- Dashboard: "Dashboard - Rails Financial Platform"

### Meta Descriptions
- Keep between 150-160 characters
- Include primary keywords
- Write compelling, actionable descriptions
- Avoid duplication across pages

### Image Alt Text
- Describe image content and context
- Include relevant keywords naturally
- Keep under 125 characters
- Avoid "image of" or "picture of"

## 13. Performance Monitoring

### Key Metrics to Track
- Page load times across devices
- Core Web Vitals scores on mobile and desktop
- Bounce rate and user engagement by device
- Search rankings for target keywords
- Accessibility compliance scores
- Animation performance metrics
- Memory usage during complex animations

### Regular Audits
- Weekly Lighthouse performance checks (mobile + desktop)
- Monthly SEO position tracking
- Quarterly accessibility reviews
- Annual content freshness audit
- Quarterly animation performance review

## 14. Implementation Checklist

### Before Launch
- [ ] All meta tags implemented
- [ ] Images optimized and include alt text
- [ ] Accessibility tested with screen reader
- [ ] Mobile responsiveness verified on multiple devices
- [ ] Touch targets meet 44px minimum
- [ ] Lighthouse scores above 90 (mobile + desktop)
- [ ] Schema markup validated
- [ ] Internal linking structure complete
- [ ] Error pages implemented and responsive
- [ ] Security headers configured
- [ ] Analytics tracking setup
- [ ] Animations tested across devices
- [ ] Reduced motion preferences respected
- [ ] Number counters handle large values
- [ ] Chart containers properly sized

### Post-Launch Monitoring
- [ ] Search Console setup and monitoring
- [ ] Performance metrics tracking across devices
- [ ] User feedback collection
- [ ] Regular content updates
- [ ] Ongoing technical maintenance
- [ ] Mobile user experience monitoring
- [ ] Animation performance monitoring
- [ ] Real-time data accuracy verification

---

## Notes for Rails POC

Since Rails is a proof-of-concept application:
- Include clear disclaimers about mock data
- Implement noindex robots meta for staging environments
- Use appropriate staging vs production configurations
- Maintain high standards for demonstration purposes
- Document all optimizations for future reference
- Ensure responsive design showcases professional quality
- Use realistic data patterns for animations
- Demonstrate enterprise-grade motion design

These guidelines ensure Rails maintains professional standards while achieving optimal search engine visibility, user experience metrics, and credible motion design across all devices and screen sizes.