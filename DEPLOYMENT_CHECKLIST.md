# Deployment Checklist - GLM Direct Integration

## Pre-Deployment Verification

✅ **Build Status:** SUCCESS
```
npm run build
✓ Compiled successfully
```

✅ **Dependencies Installed:**
```
@aws-sdk/client-bedrock-runtime
```

✅ **Files Modified:**
- `lib/ai/bedrock-glm.ts` (NEW - Direct SDK implementation)
- `lib/ai/aiService.ts` (Added AWS credentials)
- `lib/ai/providerFactory.ts` (Updated config)
- `lib/ai/index.ts` (Updated imports)
- `AI_PROVIDER_SWITCHING.md` (Updated docs)

✅ **Files Deleted:**
- `lib/ai/bedrock.ts` (Old proxy implementation)
- `app/api/bedrock-proxy/route.ts` (Proxy route)

---

## Vercel Deployment Steps

### Step 1: Commit Changes
```bash
git add .
git commit -m "feat: Integrate GLM-5 directly via AWS Bedrock SDK

- Replace proxy-based Bedrock with direct SDK integration
- Use zai.glm-5 model
- Remove bedrock-proxy route
- Add AWS credentials to AIConfig
- Update documentation

This enables serverless deployment on Vercel without external proxy dependency."

git push origin <your-branch>
```

### Step 2: Configure Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

**Add these variables:**

| Variable | Value | Scope |
|----------|-------|-------|
| `USE_AI_PROVIDER` | `bedrock` | Production, Preview, Development |
| `AWS_ACCESS_KEY_ID` | `<your_key>` | Production, Preview, Development |
| `AWS_SECRET_ACCESS_KEY` | `<your_key>` | Production, Preview, Development |
| `AWS_REGION` | `ap-south-1` | Production, Preview, Development |
| `BEDROCK_MODEL` | `zai.glm-5` | Production, Preview, Development |

**Important:**
- ⚠️ Mark `AWS_SECRET_ACCESS_KEY` as **Sensitive** (don't expose in logs)
- ✅ Apply to all environments (Production, Preview, Development)

### Step 3: Deploy

**Automatic:**
- Push to main branch triggers deployment

**Manual:**
```bash
vercel --prod
```

### Step 4: Verify Deployment

**Check Logs:**
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Check function logs for:
```
✅ Using AWS Bedrock GLM-5 (Direct SDK)
```

**Test API:**
```bash
curl -X POST https://your-app.vercel.app/api/test-bedrock \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"hello"}'
```

**Expected Response:**
```json
{
  "success": true,
  "response": "...",
  "provider": "bedrock",
  "model": "zai.glm-5"
}
```

---

## Post-Deployment Verification

### 1. Test All AI Features
- [ ] Desktop voice assistant works
- [ ] Interview generation works
- [ ] Safari search works
- [ ] NCERT questions work
- [ ] Teaching assistant works

### 2. Monitor Performance
- [ ] Check Vercel function logs
- [ ] Monitor response times
- [ ] Check AWS Bedrock costs

### 3. Test Streaming
- [ ] Voice responses stream correctly
- [ ] No timeout errors
- [ ] Response quality maintained

---

## Rollback Plan (If Needed)

If deployment fails, rollback quickly:

```bash
# Revert to previous commit
git revert HEAD
git push

# Or switch provider temporarily
# In Vercel env vars, set:
USE_AI_PROVIDER=openai
OPENAI_API_KEY=<your_key>
```

---

## Cost Considerations

**AWS Bedrock Pricing (ap-south-1):**
- GLM-5: Competitive pricing
- Pay per token usage
- Monitor in AWS Cost Explorer

**Vercel:**
- Serverless function execution time
- Check function duration in logs

---

## Security Checklist

- [ ] AWS credentials stored in Vercel (not in code)
- [ ] `AWS_SECRET_ACCESS_KEY` marked as sensitive
- [ ] No credentials in git history
- [ ] IAM user has minimal permissions (only Bedrock)

**Recommended IAM Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:ap-south-1::foundation-model/zai.glm-5"
    }
  ]
}
```

---

## Success Metrics

✅ Deployment successful when:
1. Build completes without errors
2. Environment variables set correctly
3. API responds with GLM model
4. No function timeout errors
5. Response quality maintained

---

## Support

**If issues occur:**

1. **Check Logs:** Vercel Dashboard → Deployments → Function Logs
2. **Verify Credentials:** AWS Console → IAM → Check permissions
3. **Test Locally:** `npm run dev` with same env vars
4. **Check Model Access:** AWS Bedrock Console → Model access

**Common Issues:**
- "Credentials invalid": Check AWS key/secret
- "Model not found": Verify `zai.glm-5` access in Bedrock
- "Timeout": Increase function timeout in Vercel settings

---

## Next Steps After Deployment

1. Monitor first 24 hours of usage
2. Check AWS Bedrock metrics
3. Gather user feedback
4. Optimize if needed

---

**Deployment Date:** 2026-07-29
**Status:** Ready for deployment ✅
