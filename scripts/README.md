# 🔧 Scripts Directory

Organized utility scripts for testing, diagnostics, and maintenance.

---

## 📁 Directory Structure

```
scripts/
├── README.md           # This file
├── test/              # Testing scripts
└── diagnostics/       # Diagnostic scripts
```

---

## 🧪 Test Scripts (`test/`)

Scripts for testing various components of the COLMAP system.

### Available Tests

1. **test-colmap-simple.sh**
   - Simple COLMAP pipeline test
   - Downloads sample video
   - Tests full reconstruction pipeline
   - Usage: `./scripts/test/test-colmap-simple.sh`

2. **test-colmap-pipeline.sh**
   - Comprehensive pipeline test
   - Tests all processing stages
   - Usage: `./scripts/test/test-colmap-pipeline.sh`

3. **test-real-upload.sh**
   - Tests real video upload
   - Verifies COLMAP processing
   - Usage: `./scripts/test/test-real-upload.sh`

4. **test_reconstruction.sh**
   - Reconstruction pipeline test
   - Usage: `./scripts/test/test_reconstruction.sh`

5. **test-database.sh**
   - Database connectivity test
   - Tests CRUD operations
   - Usage: `./scripts/test/test-database.sh`

6. **test-cors.sh**
   - CORS and backend connectivity test
   - Usage: `./scripts/test/test-cors.sh`

---

## 🔍 Diagnostic Scripts (`diagnostics/`)

Scripts for system diagnostics and troubleshooting.

### Available Diagnostics

1. **DEEP_DIAGNOSTIC.sh**
   - Deep diagnostic check
   - Comprehensive system analysis
   - Usage: `./scripts/diagnostics/DEEP_DIAGNOSTIC.sh`

2. **diagnose-colmap.sh**
   - COLMAP-specific diagnostics
   - Checks installation and configuration
   - Usage: `./scripts/diagnostics/diagnose-colmap.sh`

---

## 🚀 Quick Usage

### Run Tests
```bash
# Test COLMAP pipeline
./scripts/test/test-colmap-simple.sh

# Test database
./scripts/test/test-database.sh

# Test upload
./scripts/test/test-real-upload.sh
```

### Run Diagnostics
```bash
# Deep diagnostic
./scripts/diagnostics/DEEP_DIAGNOSTIC.sh

# COLMAP diagnostic
./scripts/diagnostics/diagnose-colmap.sh
```

---

## ⚠️ Note

These scripts are for **development and testing** only. For production use:
- Use `./start-local.sh` (in root) to start services
- Access the app at http://localhost:3000

---

## 📝 Adding New Scripts

### Test Scripts
Place in `scripts/test/` and name with `test-*.sh` pattern

### Diagnostic Scripts
Place in `scripts/diagnostics/` and name descriptively

### Production Scripts
Keep in project root (e.g., `start-local.sh`)

---

**Organization:** Clean separation of concerns  
**Maintenance:** Easy to find and manage  
**Production:** Only essential scripts in root

