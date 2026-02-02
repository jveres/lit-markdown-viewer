# Markdown Viewer Showcase

A comprehensive demonstration of all supported markdown features, edge cases, and rendering capabilities.

---

## Typography & Text Formatting

### Basic Formatting

This is regular paragraph text. It can contain **bold text**, *italic text*, ***bold and italic***, ~~strikethrough~~, and `inline code`. You can also use __underscores for underline__ and _underscores for italic_.

### Special Characters & Escaping

Escape special characters: \*asterisks\*, \`backticks\`, \[brackets\], \#hashtags

Unicode support: café, naïve, 日本語, العربية, 中文, Ελληνικά, עברית

Emojis: 🚀 🎉 ✨ 💡 🔥 ⚡ 🎯 🌟 💻 🔧

Symbols: © ® ™ § ¶ † ‡ • ° ± × ÷ ≠ ≤ ≥ ∞ √ ∑ ∏ ∫ ∂ ∆ ∇

### Line Breaks & Paragraphs

This paragraph has a soft break  
created with two trailing spaces.

This is a new paragraph separated by a blank line. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.

---

## Headings

# Heading 1 - The Main Title
## Heading 2 - Major Section
### Heading 3 - Subsection
#### Heading 4 - Minor Section
##### Heading 5 - Detail Level
###### Heading 6 - Smallest Heading

---

## Lists

### Unordered Lists

- First level item
- Another first level item
  - Second level nested
  - Another nested item
    - Third level deep
    - Even deeper nesting
      - Fourth level
  - Back to second level
- Back to first level

Alternative markers:

* Asterisk item 1
* Asterisk item 2

+ Plus item 1
+ Plus item 2

### Ordered Lists

1. First item
2. Second item
3. Third item
   1. Nested ordered item
   2. Another nested item
      1. Deep nested
      2. Another deep nested
   3. Back to first nesting
4. Fourth item

### Mixed Lists

1. Ordered item one
   - Unordered nested
   - Another unordered
2. Ordered item two
   1. Ordered nested
   2. Another ordered nested
      - Mixed deeper
      - And another

### Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Yet another todo
  - [x] Nested completed
  - [ ] Nested incomplete

---

## Links & References

### Inline Links

Visit [Google](https://www.google.com) for search.

Link with title: [GitHub](https://github.com "The world's leading software development platform")

### Auto-links

Direct URL: https://www.example.com

Email: user@example.com

### Reference Links

[Reference style link][ref1]

[Another reference][ref2]

[ref1]: https://www.mozilla.org "Mozilla"
[ref2]: https://www.wikipedia.org "Wikipedia"

---

## Images

![Placeholder Image](https://placehold.co/400x200/3498db/ffffff?text=Sample+Image)

![Small badge](https://img.shields.io/badge/markdown-viewer-blue)

---

## Blockquotes

> Simple single-line blockquote.

> Multi-line blockquote with content.
> This continues on the next line.
> And another line here.

> **Nested blockquotes:**
>
> > This is nested inside.
> >
> > > And this is even deeper.
> > >
> > > Multiple paragraphs in deep nesting.
>
> Back to first level.

> ### Blockquote with Other Elements
>
> - List item inside quote
> - Another item
>
> `code` and **bold** work too!
>
> ```js
> // Code block inside blockquote
> const quoted = true;
> ```

---

## Code

### Inline Code

Use `console.log()` to debug. The `Array.prototype.map()` method creates a new array. Paths like `/usr/local/bin` and commands like `npm install` should be monospaced.

### Fenced Code Blocks

#### JavaScript / TypeScript

```javascript
// JavaScript ES6+ features showcase
class DataProcessor {
  #privateField = 'secret';
  
  constructor(options = {}) {
    this.options = { ...options };
    this.data = [];
  }

  async fetchData(url) {
    try {
      const response = await fetch(url);
      const json = await response.json();
      this.data = json.results ?? [];
      return this.data;
    } catch (error) {
      console.error('Fetch failed:', error.message);
      throw error;
    }
  }

  process = (transformer) => {
    return this.data
      .filter(Boolean)
      .map(transformer)
      .reduce((acc, val) => [...acc, val], []);
  };

  *iterate() {
    for (const item of this.data) {
      yield item;
    }
  }
}

// Usage with async/await
const processor = new DataProcessor({ debug: true });
const results = await processor.fetchData('https://api.example.com/data');
console.log(`Processed ${results.length} items`);
```

```typescript
// TypeScript with advanced types
interface User<T extends Record<string, unknown> = {}> {
  id: string;
  email: string;
  metadata: T;
  createdAt: Date;
}

type UserRole = 'admin' | 'editor' | 'viewer';

type PermissionMap = {
  [K in UserRole]: readonly string[];
};

const permissions: PermissionMap = {
  admin: ['read', 'write', 'delete', 'manage'] as const,
  editor: ['read', 'write'] as const,
  viewer: ['read'] as const,
};

function createUser<T extends Record<string, unknown>>(
  email: string,
  metadata?: T
): User<T> {
  return {
    id: crypto.randomUUID(),
    email,
    metadata: metadata ?? ({} as T),
    createdAt: new Date(),
  };
}

// Generic utility types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

type Awaited<T> = T extends Promise<infer U> ? U : T;
```

#### Python

```python
#!/usr/bin/env python3
"""Advanced Python showcase with type hints and modern features."""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import TypeVar, Generic, Callable, Iterator
from collections.abc import Sequence
import asyncio
from functools import lru_cache

T = TypeVar('T')
R = TypeVar('R')

@dataclass
class Result(Generic[T]):
    """A Result type for error handling without exceptions."""
    value: T | None = None
    error: str | None = None
    _metadata: dict = field(default_factory=dict)
    
    @property
    def is_ok(self) -> bool:
        return self.error is None
    
    def map(self, fn: Callable[[T], R]) -> Result[R]:
        if self.is_ok and self.value is not None:
            return Result(value=fn(self.value))
        return Result(error=self.error)
    
    def unwrap_or(self, default: T) -> T:
        return self.value if self.is_ok else default


class AsyncDataPipeline:
    """Async data processing pipeline with backpressure."""
    
    def __init__(self, concurrency: int = 10):
        self.concurrency = concurrency
        self.semaphore = asyncio.Semaphore(concurrency)
    
    async def process_batch(
        self,
        items: Sequence[T],
        processor: Callable[[T], R]
    ) -> list[Result[R]]:
        async def process_one(item: T) -> Result[R]:
            async with self.semaphore:
                try:
                    result = await asyncio.to_thread(processor, item)
                    return Result(value=result)
                except Exception as e:
                    return Result(error=str(e))
        
        tasks = [process_one(item) for item in items]
        return await asyncio.gather(*tasks)


@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    """Memoized Fibonacci with cache."""
    match n:
        case 0 | 1:
            return n
        case _ if n < 0:
            raise ValueError("Negative numbers not supported")
        case _:
            return fibonacci(n - 1) + fibonacci(n - 2)


# Generator expression with walrus operator
def find_primes(limit: int) -> Iterator[int]:
    """Generate prime numbers up to limit using sieve."""
    sieve = [True] * (limit + 1)
    for num in range(2, int(limit ** 0.5) + 1):
        if sieve[num]:
            yield num
            for multiple in range(num * num, limit + 1, num):
                sieve[multiple] = False
    yield from (n for n in range(int(limit ** 0.5) + 1, limit + 1) if sieve[n])
```

#### Rust

```rust
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// A thread-safe cache with TTL support
pub struct Cache<K, V> {
    store: Arc<RwLock<HashMap<K, CacheEntry<V>>>>,
    default_ttl: std::time::Duration,
}

struct CacheEntry<V> {
    value: V,
    expires_at: std::time::Instant,
}

impl<K, V> Cache<K, V>
where
    K: Eq + std::hash::Hash + Clone,
    V: Clone,
{
    pub fn new(default_ttl: std::time::Duration) -> Self {
        Self {
            store: Arc::new(RwLock::new(HashMap::new())),
            default_ttl,
        }
    }

    pub async fn get(&self, key: &K) -> Option<V> {
        let store = self.store.read().await;
        store.get(key).and_then(|entry| {
            if entry.expires_at > std::time::Instant::now() {
                Some(entry.value.clone())
            } else {
                None
            }
        })
    }

    pub async fn set(&self, key: K, value: V) {
        let mut store = self.store.write().await;
        store.insert(key, CacheEntry {
            value,
            expires_at: std::time::Instant::now() + self.default_ttl,
        });
    }

    pub async fn get_or_insert_with<F, Fut>(&self, key: K, f: F) -> V
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = V>,
    {
        if let Some(value) = self.get(&key).await {
            return value;
        }
        
        let value = f().await;
        self.set(key, value.clone()).await;
        value
    }
}

// Pattern matching with guards
fn classify_number(n: i32) -> &'static str {
    match n {
        0 => "zero",
        n if n < 0 => "negative",
        1..=10 => "small positive",
        11..=100 => "medium positive",
        _ => "large positive",
    }
}
```

#### Go

```go
package main

import (
    "context"
    "fmt"
    "sync"
    "time"
)

// Worker pool pattern with generics
type Pool[T any, R any] struct {
    workers    int
    jobQueue   chan T
    results    chan R
    processor  func(T) R
    wg         sync.WaitGroup
}

func NewPool[T any, R any](workers int, processor func(T) R) *Pool[T, R] {
    return &Pool[T, R]{
        workers:   workers,
        jobQueue:  make(chan T, workers*2),
        results:   make(chan R, workers*2),
        processor: processor,
    }
}

func (p *Pool[T, R]) Start(ctx context.Context) {
    for i := 0; i < p.workers; i++ {
        p.wg.Add(1)
        go func(id int) {
            defer p.wg.Done()
            for {
                select {
                case job, ok := <-p.jobQueue:
                    if !ok {
                        return
                    }
                    result := p.processor(job)
                    p.results <- result
                case <-ctx.Done():
                    return
                }
            }
        }(i)
    }
}

func (p *Pool[T, R]) Submit(job T) {
    p.jobQueue <- job
}

func (p *Pool[T, R]) Close() {
    close(p.jobQueue)
    p.wg.Wait()
    close(p.results)
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    pool := NewPool(4, func(n int) int {
        time.Sleep(100 * time.Millisecond)
        return n * n
    })

    pool.Start(ctx)

    go func() {
        for i := 1; i <= 10; i++ {
            pool.Submit(i)
        }
        pool.Close()
    }()

    for result := range pool.results {
        fmt.Printf("Result: %d\n", result)
    }
}
```

#### Shell / Bash

```bash
#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/var/log/backup.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

error() { log "${RED}ERROR${NC}" "$@" >&2; }
warn()  { log "${YELLOW}WARN${NC}" "$@"; }
info()  { log "${GREEN}INFO${NC}" "$@"; }

# Backup function with progress
backup_directory() {
    local src="$1"
    local dest="$2"
    
    if [[ ! -d "$src" ]]; then
        error "Source directory does not exist: $src"
        return 1
    }
    
    info "Starting backup: $src -> $dest"
    
    rsync -avz --progress --delete \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='*.log' \
        "$src/" "$dest/" 2>&1 | while read -r line; do
            echo "  $line"
        done
    
    info "Backup completed successfully"
}

# Main execution with argument parsing
main() {
    local source_dir=""
    local backup_dir=""
    
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -s|--source)
                source_dir="$2"
                shift 2
                ;;
            -d|--dest)
                backup_dir="$2"
                shift 2
                ;;
            -h|--help)
                echo "Usage: $0 -s <source> -d <destination>"
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    backup_directory "$source_dir" "$backup_dir"
}

main "$@"
```

#### SQL

```sql
-- Complex analytics query with CTEs and window functions
WITH monthly_sales AS (
    SELECT 
        DATE_TRUNC('month', order_date) AS month,
        product_category,
        SUM(quantity * unit_price) AS revenue,
        COUNT(DISTINCT customer_id) AS unique_customers,
        COUNT(*) AS order_count
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE order_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY 1, 2
),
ranked_categories AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (PARTITION BY month ORDER BY revenue DESC) AS rank,
        LAG(revenue) OVER (PARTITION BY product_category ORDER BY month) AS prev_month_revenue,
        revenue - LAG(revenue) OVER (PARTITION BY product_category ORDER BY month) AS revenue_change
    FROM monthly_sales
)
SELECT 
    month,
    product_category,
    revenue,
    unique_customers,
    order_count,
    ROUND(revenue_change / NULLIF(prev_month_revenue, 0) * 100, 2) AS growth_percentage,
    SUM(revenue) OVER (
        PARTITION BY product_category 
        ORDER BY month 
        ROWS UNBOUNDED PRECEDING
    ) AS cumulative_revenue
FROM ranked_categories
WHERE rank <= 5
ORDER BY month DESC, revenue DESC;
```

#### JSON

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "Application Configuration",
  "type": "object",
  "required": ["app", "database", "features"],
  "properties": {
    "app": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
        "environment": { "enum": ["development", "staging", "production"] }
      }
    },
    "database": {
      "type": "object",
      "properties": {
        "host": { "type": "string", "format": "hostname" },
        "port": { "type": "integer", "minimum": 1, "maximum": 65535 },
        "credentials": {
          "type": "object",
          "properties": {
            "username": { "type": "string" },
            "password": { "type": "string", "writeOnly": true }
          }
        }
      }
    },
    "features": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "enabled": { "type": "boolean", "default": false },
          "config": { "type": "object", "additionalProperties": true }
        }
      }
    }
  }
}
```

#### YAML

```yaml
# Kubernetes Deployment Configuration
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  namespace: production
  labels:
    app: api-server
    version: v2.1.0
  annotations:
    kubernetes.io/change-cause: "Update to v2.1.0 with performance fixes"
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: api-server
  template:
    metadata:
      labels:
        app: api-server
    spec:
      serviceAccountName: api-server
      containers:
        - name: api
          image: registry.example.com/api-server:v2.1.0
          ports:
            - containerPort: 8080
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: url
            - name: LOG_LEVEL
              value: "info"
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
```

#### HTML/CSS

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Component</title>
  <style>
    .card {
      --card-padding: 1.5rem;
      --card-radius: 0.75rem;
      --card-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      
      padding: var(--card-padding);
      border-radius: var(--card-radius);
      box-shadow: var(--card-shadow);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.2);
      }
      
      @media (prefers-color-scheme: dark) {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <article class="card" data-component="feature-card">
    <h2>Feature Title</h2>
    <p>Description of the feature with <strong>emphasis</strong>.</p>
    <button type="button" onclick="handleClick(event)">
      Learn More →
    </button>
  </article>
  
  <script type="module">
    const card = document.querySelector('[data-component="feature-card"]');
    card.animate([
      { opacity: 0, transform: 'translateY(10px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 300, easing: 'ease-out' });
  </script>
</body>
</html>
```

#### Diff

```diff
--- a/config/settings.json
+++ b/config/settings.json
@@ -1,15 +1,18 @@
 {
   "app": {
     "name": "MyApp",
-    "version": "1.0.0",
+    "version": "2.0.0",
     "debug": false
   },
   "database": {
     "host": "localhost",
-    "port": 5432
+    "port": 5432,
+    "pool": {
+      "min": 2,
+      "max": 10
+    }
   },
+  "cache": {
+    "enabled": true,
+    "ttl": 3600
+  }
 }
```

---

## Tables

### Simple Table

| Name    | Age | City        |
|---------|-----|-------------|
| Alice   | 28  | New York    |
| Bob     | 34  | Los Angeles |
| Charlie | 22  | Chicago     |

### Aligned Table

| Left Aligned | Center Aligned | Right Aligned |
|:-------------|:--------------:|--------------:|
| Data         |      Data      |          Data |
| More data    |   More data    |     More data |
| Even more    |   Even more    |     Even more |

### Complex Table

| Feature | Free Tier | Pro Tier | Enterprise |
|:--------|:---------:|:--------:|:----------:|
| Users | 5 | 50 | Unlimited |
| Storage | 1 GB | 100 GB | 1 TB |
| API Calls | 1,000/day | 100,000/day | Unlimited |
| Support | Community | Email | 24/7 Phone |
| SSO | ❌ | ✅ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |
| Custom Domain | ❌ | ✅ | ✅ |
| SLA | None | 99.9% | 99.99% |

---

## Mathematics (KaTeX)

### Inline Math

The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$ which gives the roots of $ax^2 + bx + c = 0$.

Einstein's famous equation $E = mc^2$ relates energy and mass. The derivative $\frac{dy}{dx}$ represents the rate of change.

### Block Math

The Gaussian integral:

$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

Euler's identity, often called the most beautiful equation:

$$
e^{i\pi} + 1 = 0
$$

The definition of the derivative:

$$
f'(x) = \lim_{h \to 0} \frac{f(x + h) - f(x)}{h}
$$

Taylor series expansion:

$$
f(x) = \sum_{n=0}^{\infty} \frac{f^{(n)}(a)}{n!}(x-a)^n = f(a) + f'(a)(x-a) + \frac{f''(a)}{2!}(x-a)^2 + \cdots
$$

Matrix notation:

$$
\mathbf{A} = \begin{pmatrix}
a_{11} & a_{12} & \cdots & a_{1n} \\
a_{21} & a_{22} & \cdots & a_{2n} \\
\vdots & \vdots & \ddots & \vdots \\
a_{m1} & a_{m2} & \cdots & a_{mn}
\end{pmatrix}
$$

Maxwell's equations in differential form:

$$
\begin{aligned}
\nabla \cdot \mathbf{E} &= \frac{\rho}{\varepsilon_0} \\
\nabla \cdot \mathbf{B} &= 0 \\
\nabla \times \mathbf{E} &= -\frac{\partial \mathbf{B}}{\partial t} \\
\nabla \times \mathbf{B} &= \mu_0\mathbf{J} + \mu_0\varepsilon_0\frac{\partial \mathbf{E}}{\partial t}
\end{aligned}
$$

The Schrödinger equation:

$$
i\hbar\frac{\partial}{\partial t}\Psi(\mathbf{r}, t) = \hat{H}\Psi(\mathbf{r}, t)
$$

---

## Alerts / Admonitions

> [!NOTE]
> This is a note callout. Use it for additional information that readers might find helpful.

> [!TIP]
> This is a tip callout. Share best practices and helpful suggestions here.

> [!IMPORTANT]
> This is an important callout. Highlight crucial information that readers shouldn't miss.

> [!WARNING]
> This is a warning callout. Alert readers about potential issues or pitfalls.

> [!CAUTION]
> This is a caution callout. Warn about dangerous or destructive actions.

---

## Horizontal Rules

Three different syntaxes, same result:

---

***

___

---

## Nested & Complex Structures

### Blockquote with Code and Lists

> **Implementation Notes:**
>
> The algorithm works as follows:
>
> 1. Initialize the data structure
> 2. Process each element:
>    - Validate input
>    - Transform data
>    - Store result
> 3. Return aggregated output
>
> Here's the core logic:
>
> ```python
> def process(items):
>     return [transform(x) for x in items if validate(x)]
> ```
>
> > **Performance tip:** Use generators for large datasets to minimize memory usage.

### List with Multiple Paragraphs

1. **First major point**

   This is an extended explanation of the first point. It contains multiple sentences and provides detailed information about the topic at hand.

   Additional paragraph under the same list item, continuing the explanation.

2. **Second major point**

   Another detailed explanation here. Lists can contain complex nested content including code:

   ```javascript
   const example = "This code is inside a list item";
   console.log(example);
   ```

3. **Third major point**

   Final point with a nested list:
   - Sub-item A
   - Sub-item B
   - Sub-item C

---

## Edge Cases & Stress Tests

### Very Long Line

ThisIsAVeryLongWordWithoutAnySpacesThatShouldTriggerOverflowHandlingAndWordBreakBehaviorInTheMarkdownViewerComponentToEnsureProperRenderingOfEdgeCases

### Deep Nesting

> Level 1
> > Level 2
> > > Level 3
> > > > Level 4
> > > > > Level 5
> > > > > > Level 6

### Mixed Content Stress Test

| Header with `code` | **Bold Header** | *Italic Header* |
|:-------------------|:---------------:|----------------:|
| Cell with [link](https://example.com) | $E=mc^2$ | `inline code` |
| Multi<br>line | ~~struck~~ | ***bold italic*** |

### Code in Various Contexts

- List with `inline code` works
- So does **`bold code`** and *`italic code`*

> Blockquote with `code` and $math$ combined.

| Table | With `code` |
|-------|-------------|
| And   | $x^2$       |

---

## Conclusion

This showcase demonstrates the full range of markdown capabilities supported by the viewer. From basic text formatting to complex mathematical equations, from simple lists to nested blockquotes with code, this component handles it all with proper syntax highlighting, responsive layouts, and smooth rendering during streaming.

**Features Tested:**
- ✅ Text formatting (bold, italic, strikethrough, code)
- ✅ All heading levels
- ✅ Ordered, unordered, and task lists
- ✅ Nested lists with mixed types
- ✅ Links (inline, reference, auto-links)
- ✅ Images with various sources
- ✅ Blockquotes with nesting
- ✅ Fenced code blocks with syntax highlighting
- ✅ Tables with alignment
- ✅ KaTeX math (inline and block)
- ✅ GitHub-style alerts
- ✅ Horizontal rules
- ✅ Complex nested structures
- ✅ Edge cases and stress tests

---

*Generated for markdown-viewer testing and demonstration purposes.*
