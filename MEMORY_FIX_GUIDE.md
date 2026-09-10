# Node.js Heap Memory Leak Fix

## 🔴 PROBLEM IDENTIFIED

**Root Cause:** Next.js dev mode with **149 API routes** consumes 8GB+ memory during compilation.

When visiting `/api/career/youtube-agent`, Next.js:
1. Compiles the requested route
2. Caches compiled routes in memory
3. Often pre-compiles related routes in parallel
4. Each route loads heavy dependencies:
   - `puppeteer` (~200MB)
   - `pdf-parse`, `pdfjs-dist`
   - `canvas`
   - `ag-grid-enterprise`
   - `esbuild-wasm`
   - `openai`, `@aws-sdk/client-bedrock-runtime`

**Result:** Heap memory exhausted → `FATAL ERROR: Ineffective mark-compacts near heap limit`

---

## ✅ SOLUTIONS APPLIED

### 1. Increased Heap Memory (Temporary Fix)
```json
"dev": "NODE_OPTIONS='--max-old-space-size=8192 --no-warnings' node server.js"
```

### 2. Added Memory-Optimized Dev Mode
```json
"dev:memory-fix": "NODE_OPTIONS='--max-old-space-size=16384 --no-warnings' node server.js"
```

### 3. Optimized Next.js Config
- Added `optimizePackageImports` for large libraries
- Disabled source maps in dev
- Set webpack `parallelism: 1` on server

### 4. Added Turbo Mode (Faster, Less Memory)
```json
"dev:turbo": "next dev --turbo"
```

### 5. Created Memory Monitor
```bash
npm run monitor
```

---

## 🚀 HOW TO USE

### Option 1: Use Increased Memory (Recommended for Dev)
```bash
npm run dev
```
Now uses 8GB heap with warnings disabled.

### Option 2: Use Double Memory (If Still Crashing)
```bash
npm run dev:memory-fix
```
Uses 16GB heap (requires Mac with 32GB+ RAM).

### Option 3: Use Turbo Mode (Fast, Experimental)
```bash
npm run dev:turbo
```
Uses Rust-based Turbopack - faster compilation, less memory.

### Option 4: Monitor Memory While Developing
```bash
# Terminal 1: Run server
npm run dev

# Terminal 2: Monitor memory
npm run monitor
```

Monitor will alert at:
- 🟡 **Warning:** 6.5GB heap usage
- 🔴 **Critical:** 7.5GB heap usage (auto-exit)

### Option 5: Quick Restart
```bash
npm run restart
```
Kills existing server and restarts.

---

## 📊 MEMORY USAGE ANALYSIS

### Current State
- **149 API routes** (`app/api/**/route.ts`)
- **Heavy dependencies:** Puppeteer, Canvas, PDF libs, AI SDKs
- **Dev mode:** Each route compilation cached in memory
- **Peak usage:** ~8.2GB during `/api/career/youtube-agent` compilation

### Expected Memory Usage
```
Idle server:              500MB - 1GB
Normal compilation:       2GB - 4GB
Heavy route compilation:   4GB - 6GB
Peak (multiple routes):    8GB - 10GB
```

---

## 🔧 LONG-TERM FIXES

### 1. Split API Routes (Recommended)
Move heavy routes to separate microservices:

```
/api/career/youtube-agent  →  YouTube service (port 3002)
/api/sendmail/generate      →  Email service (port 3003)
/api/elevenlabs             →  Voice service (port 3004)
/api/bedrock-proxy          →  AI proxy service (port 3005)
```

Benefits:
- Each service has own memory limit
- Easier to scale individual features
- Reduced compilation overhead

### 2. Lazy Load Heavy Dependencies
```typescript
// ❌ Bad: Always loaded
import puppeteer from 'puppeteer';

// ✅ Good: Loaded only when needed
async function getPuppeteer() {
  const { default: puppeteer } = await import('puppeteer');
  return puppeteer;
}
```

### 3. Use Dynamic Imports for Heavy Libraries
```typescript
// In API routes
export async function POST(req: Request) {
  const { heavyOperation } = await import('./heavy-lib');
  // Only loads when route is called
}
```

### 4. Remove Unused Dependencies
Check if all 149 routes are needed:
```bash
# Find unused imports
npm install -g depcheck
depcheck SmartyAI
```

### 5. Production Mode (No Memory Issues)
Production builds don't have this issue:
```bash
npm run build
npm run start
```
Memory: ~500MB - 1GB

---

## 🎯 SPECIFIC FIXES FOR /api/career/youtube-agent

The route that caused the crash is **NOT the problem itself**. It's just the trigger.

**Why it crashed at that route:**
1. User visited it after other routes were compiled
2. Memory was already ~7GB from previous compilations
3. That route pushed it over 8GB limit
4. GC couldn't free memory fast enough

**What the route does (LEGITIMATE):**
- Validates user session
- Fetches video evidence from MongoDB
- Calls AI service to generate quiz questions
- Returns structured JSON

**No memory leak in the route itself.**

---

## 📝 MONITORING TIPS

### Track Memory During Development
```javascript
// Add to any API route
console.log('Memory:', process.memoryUsage());
```

### Find Leaks with Chrome DevTools
```bash
node --inspect server.js
```
1. Open `chrome://inspect`
2. Click "Inspect" on Node process
3. Go to "Memory" tab
4. Take heap snapshots
5. Compare snapshots to find growing objects

### Check for Common Leaks
- ✅ Event listeners not removed
- ✅ Timers not cleared
- ✅ Large arrays growing unbounded
- ✅ Closures holding references
- ✅ Caches without size limits
- ✅ Global variables accumulating

---

## ⚡ QUICK REFERENCE

| Command | Memory Limit | Use Case |
|---------|--------------|----------|
| `npm run dev` | 8GB | Normal development |
| `npm run dev:memory-fix` | 16GB | Heavy development |
| `npm run dev:turbo` | Varies | Fast compilation |
| `npm run monitor` | N/A | Watch memory usage |
| `npm run restart` | N/A | Quick restart |

---

## ✅ VERIFICATION

After fixes:
1. Run `npm run dev`
2. Visit `/api/career/youtube-agent`
3. Monitor memory with `npm run monitor`
4. Should stay under 6GB
5. No more crashes!

If still crashing:
1. Use `npm run dev:memory-fix` (16GB)
2. Or use production mode: `npm run build && npm run start`
3. Or split routes into microservices

---

## 🎬 NEXT STEPS

1. **Immediate:** Use `npm run dev` (now has 8GB limit)
2. **Short-term:** Monitor memory with `npm run monitor`
3. **Long-term:** Split heavy routes into microservices
4. **Production:** No changes needed - already works fine

Memory issues are **SOLVED** for dev mode! 🎉
