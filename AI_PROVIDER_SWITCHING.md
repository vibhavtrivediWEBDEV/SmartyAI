# AI Provider Switching Guide

Complete guide to switching between OpenAI, AWS Bedrock, and Google Gemini.

---

## Quick Start

Just set ONE environment variable and ALL AI flows will use that provider:

```bash
# Option 1: Use Bedrock (recommended for cost)
USE_AI_PROVIDER=bedrock

# Option 2: Use OpenAI
USE_AI_PROVIDER=openai

# Option 3: Use Gemini
USE_AI_PROVIDER=gemini

# Option 4: Auto-detect (default)
# Don't set USE_AI_PROVIDER - system auto-detects based on available credentials
```

---

## Priority Order

The system auto-detects provider in this order:

1. **Explicit Setting**: If `USE_AI_PROVIDER` is set → use that
2. **Auto-Detect**: 
   - If `OPENAI_API_KEY` exists → OpenAI
   - Else if `AWS_ACCESS_KEY_ID` exists → Bedrock
   - Else if `GOOGLE_GENERATIVE_AI_API_KEY` exists → Gemini
3. **Fallback**: OpenAI (default)

---

## Configuration

### OpenAI

```bash
USE_AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini  # Optional: gpt-4o, gpt-4-turbo
```

**Pricing**:
- gpt-4o-mini: $0.15 / 1M input tokens
- gpt-4o: $2.50 / 1M input tokens

---

### AWS Bedrock (GLM-5)

```bash
USE_AI_PROVIDER=bedrock
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=ap-south-1
BEDROCK_MODEL=zai.glm-5

# No proxy needed - Direct SDK integration
```

**Pricing** (ap-south-1):
- GLM-5: Competitive pricing via Bedrock

**Models Available**:
- `zai.glm-5` - GLM-5 model (default)
- Works with any Bedrock-compatible model

---

### Google Gemini

```bash
USE_AI_PROVIDER=gemini
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-flash
```

**Pricing**:
- gemini-1.5-flash: FREE (within limits)
- gemini-1.5-pro: Paid

**Models Available**:
- `gemini-1.5-flash` - Fast, free
- `gemini-1.5-pro` - More capable
- `gemini-2.0-flash-exp` - Experimental

---

## Updated API Routes

All these routes now support multi-provider:

✅ **ai/stream** - Safari AI Search (streaming)
✅ **ai/smarty-ai** - Smarty assistant
✅ **ai/gpt4o** - NCERT teaching
✅ **ai/terminalAI** - Terminal assistant
✅ **ai/gemini/generate** - Gemini route (now uses unified)

---

## Usage in Code

### Server-Side (API Routes)

```typescript
import { createAIService } from '@/lib/ai'

const ai = createAIService()

// Chat with messages
const response = await ai.chat([
  { role: 'system', content: 'You are helpful' },
  { role: 'user', content: 'Hello!' }
])

// Complete single prompt
const response = await ai.complete('What is AI?')

// Stream response
await ai.stream(messages, (chunk) => {
  console.log(chunk)
})
```

### Client-Side (React Components)

```typescript
import { useAIProvider } from '@/hooks/useAIProvider'

function MyComponent() {
  const { provider, name } = useAIProvider()
  
  return <div>Using: {name}</div>
}
```

---

## Testing Your Setup

### Test Current Provider

```bash
npm run dev

# Check console:
# ✅ Using AWS Bedrock (via Anthropic proxy)
```

### Test API Route

```bash
curl -X POST http://localhost:3002/api/stream \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"hello"}'
```

**Success Response**: Stream of text (non-JSON)

**Error Response** (if credentials invalid):
```json
{"success": false, "error": "OpenAI API key is invalid"}
```

---

## Switching Providers

### Method 1: Environment Variable (Recommended)

Edit `.env`:
```bash
USE_AI_PROVIDER=bedrock  # Switch by changing this
```

Restart server:
```bash
npm run dev
```

### Method 2: Remove Credentials

```bash
# Force OpenAI
USE_AI_PROVIDER=openai

# Or just remove other credentials to auto-detect
```

---

## Cost Comparison

| Provider | Model | Cost (1M tokens) | Speed | Quality |
|----------|-------|------------------|-------|---------|
| OpenAI | gpt-4o | $2.50 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| OpenAI | gpt-4o-mini | $0.15 | ⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| Bedrock | claude-sonnet | $3.00 | ⚡⚡⚡ | ⭐⭐⭐⭐⭐ |
| Bedrock | claude-haiku | $0.25 | ⚡⚡⚡⚡⚡ | ⭐⭐⭐⭐ |
| Gemini | gemini-flash | FREE | ⚡⚡⚡⚡ | ⭐⭐⭐ |

**Recommendations**:
- **Development**: OpenAI gpt-4o-mini or Gemini Flash (cheap/free)
- **Production**: Bedrock Claude Haiku (fast, cheap, good quality)
- **High Quality**: OpenAI gpt-4o or Bedrock Claude Sonnet

---

## Troubleshooting

### "OpenAI API key is invalid"

```bash
# Check key exists
echo $OPENAI_API_KEY

# Update .env
OPENAI_API_KEY=sk-proj-...
```

### "Cannot connect to Bedrock proxy"

```bash"

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check environment variables
echo $AWS_ACCESS_KEY_ID
echo $AWS_SECRET_ACCESS_KEY
### "AWS credentials are invalid"

```bash
# Verify credentials
aws sts get-caller-identity

# Update .env
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
```

### "Model not found"

```bash
# Check model name

# List available models
aws bedrock list-foundation-models --region ap-south-1
```

---

## Files Changed

### New Files Added:
```
lib/ai/
  ├── providerFactory.ts    # Provider selection
  ├── aiService.ts          # Service interface
  ├── openai.ts             # OpenAI implementation
  ├── bedrock.ts            # Bedrock implementation
  ├── gemini.ts             # Gemini implementation
  └── index.ts              # Main export

hooks/
  └── useAIProvider.ts      # Client-side hook
```

### Updated Files:
```
app/api/stream/route.ts
app/api/smarty-ai/route.ts
app/api/gpt4o/route.ts
app/api/terminalAI/route.ts
app/api/gemini/generate/route.ts
.env
```

---

## Architecture Benefits

1. ✅ **Single Switch** - Change one env var, all APIs switch
2. ✅ **Auto-Fallback** - If provider fails, can fallback
3. ✅ **Easy Testing** - Test different providers easily
4. ✅ **Cost Control** - Use cheapest provider for task
5. ✅ **Vendor Lock-in Free** - Switch anytime

---

## Next Steps

1. Set `USE_AI_PROVIDER=bedrock` in `.env`
2. Add AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
3. Test with `/api/stream` endpoint
4. Deploy to Vercel - Works serverlessly!

---

**Need Help?**
- Check console logs for provider detection
- Check Bedrock proxy is running
- Verify credentials in `.env`
- Test individual API routes

---

**Last Updated**: 2026-07-28
