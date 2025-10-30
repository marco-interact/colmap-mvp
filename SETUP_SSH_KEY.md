# Setup SSH Key for RunPod

## You're Connected to RunPod but Missing SSH Key!

Run these commands in **your Mac Terminal** (the one you just had open):

---

## Step 1: Check if you already have SSH keys

```bash
ls -la ~/.ssh/
```

If you see `id_ed25519` and `id_ed25519.pub`, skip to Step 3.

---

## Step 2: Generate SSH key (if needed)

```bash
ssh-keygen -t ed25519 -C "runpod-access"
```

**When prompted:**
- Press **Enter** to accept default location
- Press **Enter** for no passphrase (or type one if you want)
- Press **Enter** again to confirm

You should see:
```
Your public key has been saved in /Users/marco.aurelio/.ssh/id_ed25519.pub
```

---

## Step 3: Display your public key

```bash
cat ~/.ssh/id_ed25519.pub
```

**This will display something like:**
```
ssh-ed25519 AAAA...xyz runpod-access
```

---

## Step 4: Copy the public key

1. **Select the entire output** from `cat ~/.ssh/id_ed25519.pub`
2. **Copy it** (Cmd+C)

---

## Step 5: Add key to RunPod

1. Open your browser
2. Go to **RunPod Dashboard** → **Settings** → **SSH Keys**
3. Click **"+ Add SSH Key"** button
4. Paste the key you copied
5. Click **"Save"** or **"Add"**

---

## Step 6: Try connecting again

Back in **your Mac Terminal**:

```bash
ssh emdu0sce5iq5zn-644114f6@ssh.runpod.io
```

**You should now be connected!** You'll see:

```
emdu0sce5iq5zn@emdu0sce5iq5zn:~$
```

---

## If You're Still Getting "Permission denied"

1. **Double-check** you added the PUBLIC key (starts with `ssh-ed25519`)
2. **Wait 30 seconds** after adding key in RunPod dashboard
3. Try connecting again

---

## Once You're Connected

You'll be **INSIDE** the RunPod. Then run:

```bash
cd /workspace
git clone https://github.com/marco-interact/colmap-mvp.git
cd colmap-mvp
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**You're almost there!** 🚀

