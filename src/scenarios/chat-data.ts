// ─────────────────────────────────────────────────────────────────────────────
// Chat Scenario - Sample Data
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

const SAMPLE_USER_MESSAGES = [
  "What is TypeScript and why should I use it?",
  "Can you show me an example of TypeScript interfaces?",
  "How do generics work in TypeScript?",
  "What's the difference between `type` and `interface`?",
  "Explain TypeScript decorators",
  "How do I handle null and undefined in TypeScript?",
  "What are mapped types?",
  "Can you explain conditional types?",
  "How do I migrate a JavaScript project to TypeScript?",
  "What are some TypeScript best practices?",
  "Explain the quadratic formula",
  "What is the derivative of x²?",
  "Explain matrix multiplication",
  "What is Euler's identity?",
  "How does the Pythagorean theorem work?",
  "How do I use TypeScript with Node.js?",
  "What is `satisfies` keyword?",
  "How do I create type guards?",
  "What are utility types in TypeScript?",
  "Explain the summation notation",
  "What is declaration merging?",
  "How do I type third-party libraries without types?",
  "Explain the `infer` keyword",
  "What are const assertions?",
  "How do I set up a TypeScript monorepo?",
];

const SAMPLE_ASSISTANT_RESPONSES = [
  `**TypeScript** is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.

## Key Benefits

1. **Type Safety** - Catch errors at compile time rather than runtime
2. **Better IDE Support** - Autocompletion, refactoring, and inline documentation
3. **Self-Documenting Code** - Types serve as documentation
4. **Easier Refactoring** - The compiler catches breaking changes

\`\`\`typescript
// Example: Type safety in action
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

greet("World"); // ✅ OK
greet(42);      // ❌ Error: Argument of type 'number' is not assignable
\`\`\``,

  `Here's an example of TypeScript interfaces:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
  age?: number; // Optional property
  readonly createdAt: Date; // Read-only property
}

interface Admin extends User {
  permissions: string[];
}

const user: User = {
  id: 1,
  name: "John Doe",
  email: "john@example.com",
  createdAt: new Date()
};
\`\`\`

Interfaces can also describe function types:

\`\`\`typescript
interface SearchFunc {
  (source: string, subString: string): boolean;
}

const mySearch: SearchFunc = (src, sub) => src.includes(sub);
\`\`\``,

  `## Generics in TypeScript

Generics allow you to write reusable, type-safe code:

\`\`\`typescript
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Usage - type is inferred
const num = identity(42);      // num: number
const str = identity("hello"); // str: string

// Generic interface
interface Box<T> {
  value: T;
  getValue(): T;
}

// Generic class
class Container<T> {
  private items: T[] = [];
  
  add(item: T): void {
    this.items.push(item);
  }
  
  get(index: number): T {
    return this.items[index];
  }
}

// Generic constraints
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}
\`\`\``,

  `## \`type\` vs \`interface\`

| Feature | \`interface\` | \`type\` |
|---------|-------------|---------|
| Extend/Inherit | ✅ \`extends\` | ✅ \`&\` intersection |
| Declaration merging | ✅ Yes | ❌ No |
| Computed properties | ❌ No | ✅ Yes |
| Union types | ❌ No | ✅ Yes |
| Mapped types | ❌ No | ✅ Yes |

\`\`\`typescript
// Interface - can be extended and merged
interface Animal {
  name: string;
}
interface Animal {
  age: number; // Declaration merging
}

// Type - more flexible
type ID = string | number; // Union
type Point = { x: number; y: number };
type Coordinate = Point & { z: number }; // Intersection
\`\`\`

**Rule of thumb:** Use \`interface\` for object shapes, \`type\` for everything else.`,

  `## TypeScript Decorators

Decorators are special declarations that can modify classes, methods, or properties:

\`\`\`typescript
// Method decorator
function log(target: any, key: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(\`Calling \${key} with:\`, args);
    return original.apply(this, args);
  };
}

// Class decorator
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@sealed
class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }
}
\`\`\`

> **Note:** Enable \`experimentalDecorators\` in tsconfig.json`,

  `## Handling \`null\` and \`undefined\`

TypeScript provides several ways to handle nullable values:

\`\`\`typescript
// Strict null checks (enable in tsconfig)
let name: string | null = null;

// Optional chaining
const length = name?.length; // number | undefined

// Nullish coalescing
const displayName = name ?? "Anonymous";

// Non-null assertion (use carefully!)
const definitelyName = name!; // Asserts non-null

// Type guard
function isNotNull<T>(value: T | null): value is T {
  return value !== null;
}

if (isNotNull(name)) {
  console.log(name.toUpperCase()); // name is string here
}
\`\`\``,

  `## Mapped Types

Mapped types transform existing types:

\`\`\`typescript
// Built-in mapped types
type Partial<T> = { [P in keyof T]?: T[P] };
type Required<T> = { [P in keyof T]-?: T[P] };
type Readonly<T> = { readonly [P in keyof T]: T[P] };

// Custom mapped type
type Nullable<T> = { [P in keyof T]: T[P] | null };

interface User {
  name: string;
  age: number;
}

type NullableUser = Nullable<User>;
// { name: string | null; age: number | null }

// Key remapping (TS 4.1+)
type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K]
};
\`\`\``,

  `## Conditional Types

Conditional types select types based on conditions:

\`\`\`typescript
// Basic syntax: T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<string>;  // true
type B = IsString<number>;  // false

// Extract and Exclude
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

type T1 = Extract<"a" | "b" | "c", "a" | "f">;  // "a"
type T2 = Exclude<"a" | "b" | "c", "a">;        // "b" | "c"

// Distributive conditional types
type ToArray<T> = T extends any ? T[] : never;
type StrOrNumArray = ToArray<string | number>; // string[] | number[]
\`\`\``,

  `## Migrating JavaScript to TypeScript

### Step-by-step approach:

1. **Add TypeScript to your project**
\`\`\`bash
npm install typescript --save-dev
npx tsc --init
\`\`\`

2. **Start with loose settings in tsconfig.json**
\`\`\`json
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": false,
    "strict": false,
    "noImplicitAny": false
  }
}
\`\`\`

3. **Rename files gradually**: \`.js\` → \`.ts\`

4. **Add types incrementally**
   - Start with \`any\` where needed
   - Replace \`any\` with proper types over time

5. **Enable strict mode gradually**
\`\`\`json
{
  "strict": true // Enable when ready
}
\`\`\``,

  `## TypeScript Best Practices

### Do ✅
- Enable \`strict\` mode
- Use \`unknown\` instead of \`any\`
- Prefer interfaces for public APIs
- Use \`readonly\` for immutable data
- Let TypeScript infer when possible

### Don't ❌
- Overuse \`any\`
- Use \`// @ts-ignore\` without good reason
- Export mutable objects
- Ignore compiler warnings

\`\`\`typescript
// ✅ Good
function process(data: unknown): string {
  if (typeof data === "string") {
    return data.toUpperCase();
  }
  throw new Error("Expected string");
}

// ❌ Avoid
function process(data: any): any {
  return data.toUpperCase(); // No type safety
}
\`\`\``,

  `## The Quadratic Formula

The **quadratic formula** solves any equation of the form $ax^2 + bx + c = 0$:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

### Components

| Part | Meaning |
|------|---------|
| $a, b, c$ | Coefficients of the quadratic |
| $b^2 - 4ac$ | **Discriminant** - determines number of solutions |
| $\\pm$ | Gives two solutions (roots) |

### Discriminant Cases

- If $b^2 - 4ac > 0$: Two distinct real roots
- If $b^2 - 4ac = 0$: One repeated real root  
- If $b^2 - 4ac < 0$: Two complex conjugate roots

### Example

For $2x^2 + 5x - 3 = 0$:

$$x = \\frac{-5 \\pm \\sqrt{25 + 24}}{4} = \\frac{-5 \\pm 7}{4}$$

So $x = \\frac{1}{2}$ or $x = -3$`,

  `## Derivative of $x^2$

Using the **power rule**: if $f(x) = x^n$, then $f'(x) = nx^{n-1}$

$$\\frac{d}{dx}(x^2) = 2x$$

### Step by Step (from first principles)

Using the limit definition of a derivative:

$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

For $f(x) = x^2$:

$$\\begin{aligned}
f'(x) &= \\lim_{h \\to 0} \\frac{(x+h)^2 - x^2}{h} \\\\
&= \\lim_{h \\to 0} \\frac{x^2 + 2xh + h^2 - x^2}{h} \\\\
&= \\lim_{h \\to 0} \\frac{2xh + h^2}{h} \\\\
&= \\lim_{h \\to 0} (2x + h) \\\\
&= 2x
\\end{aligned}$$

### Common Derivatives

| Function | Derivative |
|----------|------------|
| $x^n$ | $nx^{n-1}$ |
| $e^x$ | $e^x$ |
| $\\ln(x)$ | $\\frac{1}{x}$ |
| $\\sin(x)$ | $\\cos(x)$ |`,

  `## Matrix Multiplication

For matrices $A$ (size $m \\times n$) and $B$ (size $n \\times p$), the product $C = AB$ has size $m \\times p$.

Each element $c_{ij}$ is computed as:

$$c_{ij} = \\sum_{k=1}^{n} a_{ik} \\cdot b_{kj}$$

### Example

$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\times \\begin{pmatrix} 5 & 6 \\\\ 7 & 8 \\end{pmatrix} = \\begin{pmatrix} 19 & 22 \\\\ 43 & 50 \\end{pmatrix}$$

**Calculation:**
- $c_{11} = 1 \\cdot 5 + 2 \\cdot 7 = 19$
- $c_{12} = 1 \\cdot 6 + 2 \\cdot 8 = 22$
- $c_{21} = 3 \\cdot 5 + 4 \\cdot 7 = 43$
- $c_{22} = 3 \\cdot 6 + 4 \\cdot 8 = 50$

### Key Properties

- **Not commutative**: $AB \\neq BA$ in general
- **Associative**: $(AB)C = A(BC)$
- **Distributive**: $A(B + C) = AB + AC$`,

  `## Euler's Identity

Often called the "most beautiful equation in mathematics":

$$e^{i\\pi} + 1 = 0$$

This elegant formula connects **five fundamental constants**:

| Constant | Meaning |
|----------|---------|
| $e$ | Euler's number ($\\approx 2.71828$) |
| $i$ | Imaginary unit ($\\sqrt{-1}$) |
| $\\pi$ | Pi ($\\approx 3.14159$) |
| $1$ | Multiplicative identity |
| $0$ | Additive identity |

### Derivation from Euler's Formula

Euler's formula states:

$$e^{ix} = \\cos(x) + i\\sin(x)$$

When $x = \\pi$:

$$e^{i\\pi} = \\cos(\\pi) + i\\sin(\\pi) = -1 + 0i = -1$$

Therefore: $e^{i\\pi} + 1 = 0$ ✨`,

  `## Pythagorean Theorem

For a right triangle with legs $a$ and $b$, and hypotenuse $c$:

$$a^2 + b^2 = c^2$$

Or equivalently: $c = \\sqrt{a^2 + b^2}$

### Visual Proof

The theorem states that the area of the square on the hypotenuse equals the sum of the areas of the squares on the other two sides.

### Common Pythagorean Triples

| $a$ | $b$ | $c$ |
|-----|-----|-----|
| 3 | 4 | 5 |
| 5 | 12 | 13 |
| 8 | 15 | 17 |
| 7 | 24 | 25 |

### 3D Extension

In three dimensions:

$$d = \\sqrt{x^2 + y^2 + z^2}$$

### Example

A ladder 10m long leans against a wall. If the base is 6m from the wall, how high does it reach?

$$h = \\sqrt{10^2 - 6^2} = \\sqrt{100 - 36} = \\sqrt{64} = 8\\text{m}$$`,
];

export function generateChatMessages(count: number): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const pairs = Math.floor(count / 2);
  
  for (let i = 0; i < pairs; i++) {
    messages.push({
      id: i * 2,
      role: "user",
      content: SAMPLE_USER_MESSAGES[i % SAMPLE_USER_MESSAGES.length],
    });
    messages.push({
      id: i * 2 + 1,
      role: "assistant",
      content: SAMPLE_ASSISTANT_RESPONSES[i % SAMPLE_ASSISTANT_RESPONSES.length],
    });
  }
  
  return messages;
}
