# Push Docker Image from Codespace

The image is built! Now push it to GitHub.

## Commands to Run in Codespace:

```bash
# 1. Create GitHub Personal Access Token
# Go to: https://github.com/settings/tokens/new?scopes=write:packages
# Copy the token

# 2. Login to GitHub Container Registry
# Replace YOUR_TOKEN_HERE with your actual token
echo "YOUR_TOKEN_HERE" | docker login ghcr.io -u marco-interact --password-stdin

# 3. Push the image
docker push ghcr.io/marco-interact/colmap-mvp:latest

# 4. Verify
echo "✅ Image pushed! Check: https://github.com/marco-interact?tab=packages"
```

## Expected Output:

```
The push refers to repository [ghcr.io/marco-interact/colmap-mvp]
5f70bf18a086: Pushed 
314dfa0e5f74: Pushed 
latest: digest: sha256:xxxxxxxxxxxx size: 1234
✅ Done!
```

## Next Steps After Push:

1. **Make Package Public:**
   - Go to: https://github.com/marco-interact?tab=packages
   - Click `colmap-mvp`
   - Package settings → Change visibility → Public

2. **Update Northflank:**
   - Go to colmap-worker-gpu service
   - Settings → Build → External Image
   - Image: `ghcr.io/marco-interact/colmap-mvp:latest`
   - Deploy

## Timeline:

- Push: ~3-5 minutes (5.23GB upload)
- Make public: 30 seconds
- Northflank deploy: 2-3 minutes

**Total: ~10 minutes to working app!**

