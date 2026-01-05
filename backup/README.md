# Backup Folder Structure

> Last updated: 2026-01-05

This folder contains backup copies of important project files for recovery and version reference.

---

## 📁 Folder Structure

```
backup/
├── html/                   # Old HTML backups (before escrow/warranty updates)
├── js/                     # Old JavaScript backups
├── css/                    # Old CSS backups
├── config/                 # Old Firebase rules backups
└── current_2026-01-05/     # ⭐ FRESH backup of current working files
```

---

## 📂 Folder Contents

### `/html/` - Old HTML Backups (7 files)
| File | Description |
|------|-------------|
| admin.html.backup | Early admin dashboard version |
| admin.html.backup_escrow | Before escrow system |
| cart.html.backup | Early cart page |
| chat.html.backup | Negotiation chat (pre-validation) |
| chat.html.bak | Another chat backup |
| index.html.backup | Early homepage |
| profile.html.backup | Profile before wallet system |

### `/js/` - Old JavaScript Backups (5 files)
| File | Description |
|------|-------------|
| admin.js.backup_escrow | Admin before escrow charts |
| chat.js.bak | Chat before rate limiting |
| firebase-config.js.backup_escrow | Config before warranty constants |
| payment.js.backup_escrow | Payment before 10% commission |
| profile.js.backup_escrow | Profile before warranty flow |

### `/css/` - Old CSS Backups (1 file)
| File | Description |
|------|-------------|
| styles.css.backup | Main styles before glassmorphism |

### `/config/` - Old Firebase Rules (3 files)
| File | Description |
|------|-------------|
| firebase-rules-FINAL.json.backup | Early "final" rules |
| firebase-rules-FIXED.json.backup | After bug fixes |
| firebase-rules-UPDATED.json.backup | Before wallet rules |

### `/current_2026-01-05/` - ⭐ Current Working Backups (10 files)
| File | Size | Purpose |
|------|------|---------|
| admin.js | 123 KB | Admin dashboard with 8 charts |
| profile.js | 83 KB | Profile with wallet & warranty |
| styles.css | 84 KB | Main stylesheet with glassmorphism |
| admin.html | 38 KB | Admin page structure |
| profile.html | 39 KB | Profile page with tabs |
| chat.js | 19 KB | Negotiation with validation |
| firebase-config.js | 18 KB | Firebase setup & utilities |
| auth.js | 13 KB | Authentication with auto-admin |
| payment.js | 13 KB | FPX simulation with escrow |
| firebase-rules.json | 4 KB | Security rules |

---

## 🔄 How to Restore

If you need to restore a backup:

```bash
# Example: Restore admin.js from latest backup
copy "backup\current_2026-01-05\admin.js" "assets\js\admin.js"

# Example: Restore from old backup
copy "backup\js\admin.js.backup_escrow" "assets\js\admin.js"
```

---

## 📝 Backup Naming Convention

| Extension | Meaning |
|-----------|---------|
| `.backup` | General backup |
| `.backup_escrow` | Before escrow/warranty system |
| `.bak` | Quick backup |
| `current_YYYY-MM-DD/` | Dated fresh backup |

---

## ⚠️ Notes

- **Old backups** are from earlier development stages - may have bugs or missing features
- **Current backup** (`current_2026-01-05/`) is the recommended restore point
- Create new dated folders for future backups: `current_YYYY-MM-DD/`
