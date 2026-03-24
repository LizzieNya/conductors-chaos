# Deployment Guide - GitHub Pages

## Automatic Deployment (Recommended)

The game is configured to automatically deploy to GitHub Pages when you push to the `main` branch.

### Setup Steps:

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Conductor's Chaos with mini-games"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/conductors-chaos.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to Settings → Pages
   - Under "Build and deployment", select "GitHub Actions" as the source
   - The workflow will automatically run and deploy your site

3. **Access Your Game**
   - Your game will be available at: `https://YOUR_USERNAME.github.io/conductors-chaos/`
   - The first deployment takes 2-3 minutes

### Updating the Base URL

If your repository name is different from `conductors-chaos`, update `vite.config.ts`:

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/',
})
```

## Manual Deployment

If you prefer manual deployment:

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder**
   - Use any static hosting service (Netlify, Vercel, etc.)
   - Or manually upload the `dist` folder contents

## Troubleshooting

### 404 Errors
- Ensure the `base` in `vite.config.ts` matches your repository name
- Check that GitHub Pages is enabled in repository settings

### Build Failures
- Verify Node.js version is 18 or higher
- Run `npm ci` to ensure clean dependencies
- Check the Actions tab on GitHub for detailed error logs

### Assets Not Loading
- Confirm the base URL is correct
- Check browser console for 404 errors
- Verify all imports use relative paths

## Custom Domain

To use a custom domain:

1. Add a `CNAME` file to the `public` folder with your domain
2. Configure DNS settings with your domain provider
3. Enable "Enforce HTTPS" in GitHub Pages settings

## Performance Optimization

The build is already optimized with:
- Code splitting
- Minification
- Tree shaking
- Asset optimization

Current bundle size: ~289KB (86KB gzipped)

## Monitoring

After deployment, monitor:
- GitHub Actions for build status
- Browser console for runtime errors
- Performance metrics in browser DevTools
