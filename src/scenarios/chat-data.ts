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
  "How does type inference work?",
  "What is the `unknown` type?",
  "Explain discriminated unions",
  "How do I type React components with TypeScript?",
  "What are template literal types?",
  "How do I use TypeScript with Node.js?",
  "What is `satisfies` keyword?",
  "How do I create type guards?",
  "What are utility types in TypeScript?",
  "How do I handle async/await with proper types?",
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
