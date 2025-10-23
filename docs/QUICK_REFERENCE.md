# 🚀 Quick Reference Guide

**Last Updated:** October 22, 2025  
**Status:** System Operational

---

## 📍 Find What You Need

### "What's the latest status?"
→ **[2025-10-22/SESSION_SUMMARY.md](./2025-10-22/SESSION_SUMMARY.md)**

### "Is everything working?"
→ **[2025-10-22/SYSTEM_STATUS.md](./2025-10-22/SYSTEM_STATUS.md)**

### "How do I improve quality?"
→ **[2025-10-21/HIGH_FIDELITY_CONFIG.md](./2025-10-21/HIGH_FIDELITY_CONFIG.md)**

### "What are the technical details?"
→ **[2025-10-21/COLMAP_IMPROVEMENTS.md](./2025-10-21/COLMAP_IMPROVEMENTS.md)**

### "What was fixed recently?"
→ **[2025-10-21/RECONSTRUCTION_STATUS.md](./2025-10-21/RECONSTRUCTION_STATUS.md)**

---

## ⚡ Quick Commands

### Start Everything
```bash
./start-local.sh
```

### Check Backend
```bash
curl http://localhost:8000/health | python3 -m json.tool
```

### Open Frontend
```bash
open http://localhost:3000
```

### View Logs
```bash
tail -f backend.log    # Backend logs
tail -f frontend.log   # Frontend logs
```

---

## 📊 Current Metrics

- **Backend:** Port 8000 ✅
- **Frontend:** Port 3000 ✅
- **COLMAP:** 3.12.6 ✅
- **Demo Points:** 892K-1M+ ✅
- **Quality:** 5-100x improved ✅

---

## 📁 Documentation Structure

```
docs/
├── QUICK_REFERENCE.md       ← You are here
├── README.md                ← Full index
│
├── 2025-10-22/             ← Latest (Oct 22)
│   ├── SESSION_SUMMARY.md   ← Start here
│   └── SYSTEM_STATUS.md     ← Full status
│
├── 2025-10-21/             ← Previous (Oct 21)
│   ├── RECONSTRUCTION_STATUS.md
│   ├── COLMAP_IMPROVEMENTS.md
│   └── HIGH_FIDELITY_CONFIG.md
│
└── logs/                   ← Historical (42 files)
```

---

## 🎯 Common Tasks

### Upload New Video
1. Go to http://localhost:3000
2. Login: demo@colmap.app
3. Open project
4. Click "New Scan"
5. Upload video
6. Wait 5-60 minutes

### View Existing Scans
1. http://localhost:3000
2. Click "Demo Showcase Project"
3. View scans with 892K-1M+ points

### Monitor Processing
```bash
# Watch logs
tail -f backend.log | grep -E "Stage|progress|points"

# Check job status
curl http://localhost:8000/health
```

---

**Quick Tip:** Always start with `docs/2025-10-22/SESSION_SUMMARY.md` for the latest info!


