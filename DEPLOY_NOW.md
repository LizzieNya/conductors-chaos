# 🚀 Deploy to GitHub Pages - Quick Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `conductors-chaos` (or your preferred name)
3. Make it Public
4. Don't initialize with README (we already have one)
5. Click "Create repository"

## Step 2: Update Base URL (if needed)

If your repository name is NOT `conductors-chaos`, edit `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/', // Change this to match your repo name
})
```

## Step 3: Push to GitHub

Run these commands in your terminal:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Deploy Conductor's Chaos v3.0 with mini-games"

# Set main branch
git branch -M main

# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/conductors-chaos.git

# Push to GitHub
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Pages" in the left sidebar
4. Under "Build and deployment":
   - Source: Select "GitHub Actions"
5. Wait 2-3 minutes for the deployment to complete

## Step 5: Access Your Game

Your game will be live at:
```
https://YOUR_USERNAME.github.io/conductors-chaos/
```

## Troubleshooting

### Build Failed?
- Check the "Actions" tab on GitHub for error details
- Ensure Node.js version is 18+ in the workflow
- Verify all dependencies are in package.json

### 404 Error?
- Confirm the `base` in `vite.config.ts` matches your repo name
- Check that GitHub Pages is enabled
- Wait a few minutes for DNS propagation

### Assets Not Loading?
- Verify the base URL is correct
- Check browser console for errors
- Ensure all imports use relative paths

## Updating Your Game

After making changes:

```bash
git add .
git commit -m "Update: description of changes"
git push
```

The game will automatically redeploy in 2-3 minutes!

## Custom Domain (Optional)

To use your own domain:

1. Create a file `public/CNAME` with your domain:
   ```
   yourdomain.com
   ```

2. Configure DNS with your domain provider:
   - Add A records pointing to GitHub's IPs
   - Or add a CNAME record pointing to YOUR_USERNAME.github.io

3. Enable "Enforce HTTPS" in GitHub Pages settings

## Share Your Game!

Once deployed, share your game:
- Twitter: "Check out my orchestra conducting game! 🎼"
- Reddit: r/gamedev, r/WebGames
- Discord: Game dev communities
- Friends and family!

## Need Help?

- GitHub Pages Docs: https://docs.github.com/pages
- Vite Deployment: https://vitejs.dev/guide/static-deploy
- Issues: Create an issue on your repository

---

## What You've Built

✅ Complete orchestra conducting game
✅ 4 WarioWare-style mini-games
✅ Full gamification system (XP, levels, titles)
✅ Daily challenges and streaks
✅ 11 upgrades, 12 achievements
✅ 6 chaos types, 4 power-ups
✅ Professional UI and animations
✅ Automatic GitHub Pages deployment
✅ ~289KB optimized bundle

**Congratulations! You're ready to share your game with the world! 🎉**
