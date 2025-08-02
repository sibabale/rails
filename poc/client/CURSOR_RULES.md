# 🎯 CURSOR RULES FOR VP OF ENGINEERING - ATOMIC DESIGN & TESTING

## 📋 **MANDATORY FILE STRUCTURE & NAMING CONVENTION**

### **RULE 1: Component Organization**
```
components/
├── atoms/                    # Basic building blocks
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.interface.ts      # ALL type definitions
│   │   ├── Button.test.tsx          # ALL tests
│   │   └── index.ts
│   └── Input/
├── molecules/               # Simple combinations
│   ├── FormField/
│   └── SearchBar/
├── organisms/               # Complex UI sections
│   ├── BankLoginForm/
│   └── TransactionTable/
├── templates/               # Page layouts
└── pages/                   # Specific page instances
```

**MANDATORY**: Every component must have:
- `ComponentName.interface.ts` - **ALL** type definitions, interfaces, and public API contracts
- `ComponentName.test.tsx` - **ALL** tests for public interface validation
- `ComponentName.tsx` - **ONLY** implementation logic

---

## 🔧 **RULE 2: Interface File Requirements**

### **MANDATORY STRUCTURE**
```typescript
// ComponentName.interface.ts
export interface ComponentNameProps {
  // ALL props with strict typing and JSDoc comments
  requiredProp: string;
  optionalProp?: number;
  children?: React.ReactNode;
}

export interface ComponentNameState {
  // Internal state types
  isFocused: boolean;
  hasValue: boolean;
}

export interface ComponentNameEvents {
  // Event handler types
  onAction: (data: ActionData) => void;
  onFocus?: (event: React.FocusEvent) => void;
}

export type ComponentNameVariant = 'primary' | 'secondary' | 'danger';
export type ComponentNameSize = 'sm' | 'md' | 'lg';

// Export ALL types for external consumption
export type { ComponentNameProps, ComponentNameState, ComponentNameEvents };
```

### **REQUIREMENTS**
- ✅ **ALL** props must have JSDoc comments
- ✅ **ALL** types must be exported
- ✅ **NO** implementation logic in interface files
- ✅ **STRICT** typing with no `any` types unless absolutely necessary

---

## 🧪 **RULE 3: Test File Requirements**

### **MANDATORY TEST STRUCTURE**
```typescript
// ComponentName.test.tsx
describe('ComponentName', () => {
  describe('Public Interface Validation', () => {
    test('should render with required props', () => {});
    test('should handle optional props correctly', () => {});
    test('should validate prop types', () => {});
  });

  describe('Event Handling', () => {
    test('should call onAction with correct data', () => {});
    test('should handle event propagation', () => {});
  });

  describe('Visual States', () => {
    test('should render loading state', () => {});
    test('should render error state', () => {});
    test('should render disabled state', () => {});
  });

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {});
    test('should support keyboard navigation', () => {});
    test('should be screen reader compatible', () => {});
  });

  describe('Integration', () => {
    test('should work with external dependencies', () => {});
    test('should handle context properly', () => {});
  });

  describe('Edge Cases', () => {
    test('should handle empty children', () => {});
    test('should handle very long text', () => {});
    test('should handle special characters', () => {});
  });
});
```

### **REQUIREMENTS**
- ✅ **100%** public interface coverage
- ✅ **ALL** prop combinations tested
- ✅ **ALL** edge cases covered
- ✅ **ACCESSIBILITY** testing mandatory
- ✅ **INTEGRATION** testing with dependencies
- ✅ **PERFORMANCE** testing for complex components

---

## 🏗️ **RULE 4: Implementation Standards**

### **MANDATORY STRUCTURE**
```typescript
// ComponentName.tsx
import type { ComponentNameProps } from './ComponentName.interface';

export const ComponentName = React.forwardRef<HTMLElement, ComponentNameProps>(
  ({ prop1, prop2, ...props }, ref) => {
    // ONLY implementation logic here
    // NO type definitions
    // NO interface declarations
  }
);

ComponentName.displayName = 'ComponentName';
```

### **REQUIREMENTS**
- ✅ **ONLY** implementation logic in component files
- ✅ **NO** type definitions in component files
- ✅ **FORWARD REF** for all interactive components
- ✅ **DISPLAY NAME** for all components
- ✅ **ACCESSIBILITY** attributes mandatory
- ✅ **ERROR BOUNDARIES** for complex components

---

## 🎯 **RULE 5: Before Writing Code Process (VP Level)**

### **STEP 1: Requirements Analysis (5 minutes)**
- What business problem does this solve?
- Who are the stakeholders?
- What are the success criteria?
- What are the performance requirements?

### **STEP 2: Interface Design (10 minutes)**
- Define the public API contract
- Plan component hierarchy and dependencies
- Consider scalability and reusability
- Design for accessibility from the start

### **STEP 3: Test Strategy (5 minutes)**
- What scenarios must be covered?
- What edge cases are critical?
- How to test performance and accessibility?
- What integration tests are needed?

### **STEP 4: Implementation Planning (5 minutes)**
- Which atomic components to use?
- State management strategy
- Error handling approach
- Performance optimization plan

---

## 📊 **RULE 6: Atomic Design Hierarchy**

### **ATOMS** (Basic Building Blocks)
- Button, Input, Label, Icon, Badge
- **SINGLE** responsibility
- **NO** business logic
- **REUSABLE** across entire application

### **MOLECULES** (Simple Combinations)
- FormField, SearchBar, NavigationItem
- **COMBINE** 2-3 atoms
- **MINIMAL** business logic
- **SPECIFIC** use case

### **ORGANISMS** (Complex UI Sections)
- BankLoginForm, TransactionTable, DashboardHeader
- **COMBINE** molecules and atoms
- **BUSINESS** logic included
- **SPECIFIC** feature

### **TEMPLATES** (Page Layouts)
- DashboardLayout, AuthLayout, AdminLayout
- **DEFINE** page structure
- **NO** business logic
- **REUSABLE** layouts

### **PAGES** (Specific Instances)
- DashboardPage, LoginPage, SettingsPage
- **SPECIFIC** page implementation
- **BUSINESS** logic and data
- **UNIQUE** instances

---

## 🔒 **RULE 7: Quality Standards**

### **CODE QUALITY**
- ✅ **ESLINT** with strict rules
- ✅ **PRETTIER** formatting
- ✅ **TYPE SCRIPT** strict mode
- ✅ **NO** console.log in production
- ✅ **NO** unused imports or variables

### **PERFORMANCE**
- ✅ **REACT.MEMO** for expensive components
- ✅ **USEMEMO** and **USECALLBACK** for expensive operations
- ✅ **LAZY LOADING** for large components
- ✅ **BUNDLE SIZE** monitoring
- ✅ **RENDER** optimization

### **SECURITY**
- ✅ **INPUT VALIDATION** on all forms
- ✅ **XSS PREVENTION** in all components
- ✅ **CSRF PROTECTION** for forms
- ✅ **SENSITIVE DATA** handling
- ✅ **ACCESS CONTROL** validation

### **ACCESSIBILITY**
- ✅ **ARIA LABELS** on all interactive elements
- ✅ **KEYBOARD NAVIGATION** support
- ✅ **SCREEN READER** compatibility
- ✅ **COLOR CONTRAST** compliance
- ✅ **FOCUS MANAGEMENT** proper handling

---

## 🚀 **RULE 8: Development Workflow**

### **BEFORE WRITING CODE**
1. **ANALYZE** requirements and constraints
2. **DESIGN** the public interface
3. **PLAN** the test strategy
4. **CREATE** the interface file
5. **WRITE** the test file
6. **IMPLEMENT** the component
7. **REFACTOR** for optimization

### **DURING DEVELOPMENT**
1. **FOLLOW** atomic design principles
2. **TEST** as you build
3. **VALIDATE** accessibility
4. **OPTIMIZE** performance
5. **DOCUMENT** complex logic

### **AFTER DEVELOPMENT**
1. **RUN** all tests
2. **CHECK** accessibility
3. **VALIDATE** performance
4. **REVIEW** code quality
5. **UPDATE** documentation

---

## 📝 **RULE 9: Documentation Standards**

### **JSDOC REQUIREMENTS**
```typescript
/**
 * Button component for user interactions
 * 
 * @param props - Button component props
 * @param props.variant - Visual style variant
 * @param props.size - Button size
 * @param props.loading - Loading state
 * @param props.onClick - Click handler
 * 
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 * ```
 */
```

### **README REQUIREMENTS**
- Component purpose and usage
- Props documentation
- Examples and use cases
- Accessibility considerations
- Performance notes
- Breaking changes

---

## 🎯 **RULE 10: VP-Level Decision Making**

### **WHEN TO CREATE A NEW COMPONENT**
- ✅ **REUSABLE** across multiple features
- ✅ **SPECIFIC** responsibility
- ✅ **TESTABLE** independently
- ✅ **ACCESSIBLE** by default
- ✅ **PERFORMANT** implementation

### **WHEN TO REFACTOR**
- ✅ **MULTIPLE** responsibilities
- ✅ **LARGE** component size (>200 lines)
- ✅ **COMPLEX** prop interface
- ✅ **POOR** testability
- ✅ **ACCESSIBILITY** issues

### **WHEN TO DEPRECATE**
- ✅ **UNUSED** in codebase
- ✅ **BETTER** alternative available
- ✅ **SECURITY** vulnerabilities
- ✅ **PERFORMANCE** issues
- ✅ **MAINTENANCE** burden

---

## 🏆 **SUCCESS METRICS**

### **CODE QUALITY**
- 100% test coverage for public interfaces
- 0 ESLint errors or warnings
- 0 TypeScript errors
- 100% accessibility compliance

### **PERFORMANCE**
- <100ms render time for atoms
- <200ms render time for molecules
- <500ms render time for organisms
- <1s total page load time

### **MAINTAINABILITY**
- <200 lines per component
- <10 props per component
- <5 dependencies per component
- Clear separation of concerns

### **REUSABILITY**
- 80%+ component reuse across features
- Consistent API design
- Comprehensive documentation
- Easy integration patterns

---

## 🚨 **ENFORCEMENT**

### **MANDATORY CHECKS**
- ✅ All new components must follow this structure
- ✅ All existing components must be migrated
- ✅ All tests must pass before merge
- ✅ All accessibility requirements must be met
- ✅ All performance benchmarks must be achieved

### **CODE REVIEW REQUIREMENTS**
- Interface file completeness
- Test coverage adequacy
- Implementation quality
- Accessibility compliance
- Performance optimization
- Documentation completeness

### **CONTINUOUS IMPROVEMENT**
- Regular architecture reviews
- Performance monitoring
- Accessibility audits
- Code quality metrics
- Team training and updates

---

**This document is MANDATORY for all development work. Follow these rules to ensure enterprise-grade code quality, maintainability, and scalability.** 