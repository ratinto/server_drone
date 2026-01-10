# 🔧 Fix: Telemetry API Error on Vercel

## Problem
Getting error: `"Cannot read properties of undefined (reading 'findMany')"`

This means the production server on Vercel doesn't have the updated Prisma Client with the new Telemetry model.

---

## ✅ Solution: Redeploy to Vercel

### Option 1: Push to Git (Automatic Deployment)
```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add telemetry API with CRUD operations"

# Push to trigger Vercel deployment
git push
```

Vercel will automatically:
1. Pull your latest code
2. Run `npx prisma generate` during build
3. Deploy the updated server

---

### Option 2: Manual Deployment via Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy to production
vercel --prod
```

---

## 🔍 Why This Happened

1. ✅ You added the Telemetry model to `schema.prisma`
2. ✅ You created the migration (database updated)
3. ✅ You generated Prisma Client locally (`npx prisma generate`)
4. ✅ Local code works fine
5. ❌ **Vercel still has old code without Telemetry model**

---

## ✅ Verify After Deployment

Once redeployed, test the telemetry endpoint:

```bash
# Test POST
curl -X POST https://server-drone.vercel.app/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Telemetry data stored successfully",
  "data": {
    "id": 1,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "altitude": 100.5,
    ...
  }
}
```

---

## 📝 Important Notes

- **Vercel Build Command**: Make sure your `package.json` has a proper build script
- **Prisma Generate**: Vercel automatically runs `prisma generate` during build if it detects Prisma
- **Environment Variables**: Ensure `DATABASE_URL` is set in Vercel dashboard

---

## 🚀 Quick Fix Command

```bash
git add . && git commit -m "feat: Add telemetry API" && git push
```

Wait 1-2 minutes for Vercel to deploy, then test your API again! 🎉
