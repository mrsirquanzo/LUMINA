"""Western blot densitometry on the BT474 trastuzumab dose series (real CC BY blot,
IJMS 2025, PMC12294885). Ports Biomni's band-detection idea but fixes the science:
background-corrected integrated density, normalized to GAPDH, fold-change vs untreated.
"""
import json, os
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from scipy.signal import find_peaks
from scipy.ndimage import gaussian_filter1d, label

SRC = "/private/tmp/claude-501/-Users-quanho/35d39a2c-2df7-4460-b340-b3c28387140c/scratchpad/wb_source/blot.png"
OUT = "/private/tmp/claude-501/-Users-quanho/35d39a2c-2df7-4460-b340-b3c28387140c/scratchpad/wb_out"
os.makedirs(OUT, exist_ok=True)
TEAL = "#2f9e8f"

img = Image.open(SRC).convert("L")
g = np.asarray(img, dtype=float)
H, W = g.shape
inv = 255.0 - g  # bands (dark) -> high signal

# Blot region excludes the right-side text labels (HER2/HSP90/GAPDH). Bands sit in the left portion.
X0, X1 = int(W*0.02), int(W*0.55)
band = inv[:, X0:X1]

# --- row detection (3 protein rows) via horizontal projection ---
rowproj = gaussian_filter1d(band.sum(axis=1), 6)
rpk, _ = find_peaks(rowproj, distance=H*0.12, prominence=rowproj.max()*0.08)
rpk = sorted(rpk, key=lambda y: -rowproj[y])[:3]
rpk = sorted(rpk)
proteins = ["HER2", "HSP90", "GAPDH"][:len(rpk)]
# row half-height from projection width
rh = int(H*0.06)

# --- lane detection (3 lanes) via vertical projection over all band rows ---
ymask = np.zeros(H, bool)
for y in rpk: ymask[max(0,y-rh):min(H,y+rh)] = True
colproj = gaussian_filter1d(inv[ymask, X0:X1].sum(axis=0), 5)
cpk, _ = find_peaks(colproj, distance=(X1-X0)*0.18, prominence=colproj.max()*0.08)
cpk = sorted(cpk, key=lambda x: -colproj[x])[:3]
cpk = sorted([c+X0 for c in cpk])
lanes = ["0 (untreated)", "25 ug/mL", "50 ug/mL"][:len(cpk)]
spacing = int(np.median(np.diff(cpk))) if len(cpk) > 1 else int((X1-X0)*0.3)
# Generous SEARCH window (contains one full band, excludes neighbours); the drawn
# box is then tightened onto the band itself so it aligns with the blot.
sw = int(spacing*0.48)          # search half-width (x)
sh = int(H*0.085)               # search half-height (y)

def refine_lane(x):
    """Recenter a lane on the actual band mass (bg-subtracted, across all rows)."""
    x0, x1 = max(X0, x-sw), min(X1, x+sw)
    prof = np.zeros(x1-x0)
    for y in rpk:
        w = inv[max(0, y-sh):min(H, y+sh), x0:x1]
        prof += np.clip(w - np.median(w), 0, None).sum(axis=0)
    if prof.sum() == 0:
        return x
    return int(x0 + (np.arange(len(prof))*prof).sum()/prof.sum())

cpk = [refine_lane(x) for x in cpk]

bw = int(spacing*0.64)          # drawn box width (consistent across bands)
bh = int(sh*1.7)                # drawn box height

def band_box(y, x):
    """Center a consistent-size ROI on the band's intensity centroid (so the box
    aligns with the whole band, not just its darkest part) and return its
    background-corrected integrated density."""
    sy0, sy1 = max(0, y-sh), min(H, y+sh)
    sx0, sx1 = max(X0, x-sw), min(X1, x+sw)
    win = inv[sy0:sy1, sx0:sx1]
    if win.size == 0:
        return 0.0, (x-bw//2, y-bh//2, x+bw//2, y+bh//2)
    border = np.concatenate([win[0, :], win[-1, :], win[:, 0], win[:, -1]])
    bg = float(np.median(border))
    sig = np.clip(win - bg, 0, None)
    if sig.sum() > 0:
        colw, roww = sig.sum(axis=0), sig.sum(axis=1)
        cx = sx0 + (np.arange(len(colw))*colw).sum()/colw.sum()
        cy = sy0 + (np.arange(len(roww))*roww).sum()/roww.sum()
    else:
        cx, cy = x, y
    bx0, by0 = int(cx-bw/2), int(cy-bh/2)
    bx1, by1 = bx0+bw, by0+bh
    idv = float(np.clip(inv[max(0,by0):min(H,by1), max(0,bx0):min(W,bx1)] - bg, 0, None).sum())
    return idv, (bx0, by0, bx1, by1)

rows = []; boxes = []
for pi, y in enumerate(rpk):
    for li, x in enumerate(cpk):
        idv, box = band_box(y, x)
        rows.append({"protein": proteins[pi], "lane": lanes[li], "raw_id": round(idv, 0)})
        boxes.append((box, proteins[pi], lanes[li]))

# normalize each target to GAPDH in the same lane; fold-change vs untreated lane
def val(p,l): return next(r["raw_id"] for r in rows if r["protein"]==p and r["lane"]==l)
results = {}
for p in ["HER2","HSP90"]:
    per_lane = {}
    for l in lanes:
        norm = val(p,l)/val("GAPDH",l) if val("GAPDH",l)>0 else 0
        per_lane[l] = norm
    ctrl = per_lane[lanes[0]] or 1
    results[p] = {l: {"norm_gapdh": round(per_lane[l],3), "fold_vs_ctrl": round(per_lane[l]/ctrl,2)} for l in lanes}

# --- annotated blot ---
fig, ax = plt.subplots(figsize=(6.2, 3.3))
ax.imshow(g, cmap="gray"); ax.axis("off")
colmap = {"HER2":"#1d4ed8","HSP90":"#dc2626","GAPDH":"#64748b"}
for (x0,y0,x1,y1),p,l in boxes:
    ax.add_patch(plt.Rectangle((x0,y0),x1-x0,y1-y0,fill=False,ec=colmap[p],lw=1.4))
ax.set_title("Band detection + densitometry ROIs", fontsize=10, fontweight="bold", color="#1e293b")
plt.tight_layout(); plt.savefig(os.path.join(OUT,"wb_annotated.png"),dpi=150,bbox_inches="tight",facecolor="white"); plt.close()

# --- fold-change bar chart ---
fig, ax = plt.subplots(figsize=(5.4, 3.2))
xlab = lanes; xpos = np.arange(len(xlab)); w=0.38
her2 = [results["HER2"][l]["fold_vs_ctrl"] for l in lanes]
hsp = [results["HSP90"][l]["fold_vs_ctrl"] for l in lanes]
ax.bar(xpos-w/2, her2, w, label="HER2", color="#1d4ed8")
ax.bar(xpos+w/2, hsp, w, label="HSP90", color="#dc2626")
ax.axhline(1, color="#94a3b8", ls="--", lw=1)
for i,v in enumerate(her2): ax.text(i-w/2, v+.03, f"{v:.2f}", ha="center", fontsize=8)
for i,v in enumerate(hsp): ax.text(i+w/2, v+.03, f"{v:.2f}", ha="center", fontsize=8)
ax.set_xticks(xpos); ax.set_xticklabels(xlab, fontsize=9); ax.set_ylabel("fold-change vs untreated\n(normalized to GAPDH)")
ax.set_title("HER2 down, HSP90 up with trastuzumab", fontsize=10, fontweight="bold", color="#1e293b")
ax.legend(frameon=False, fontsize=9); ax.spines[["top","right"]].set_visible(False)
plt.tight_layout(); plt.savefig(os.path.join(OUT,"wb_foldchange.png"),dpi=150,bbox_inches="tight",facecolor="white"); plt.close()

summary = {"rows": rows, "results": results, "proteins": proteins, "lanes": lanes,
           "row_y": [int(y) for y in rpk], "lane_x": [int(x) for x in cpk]}
json.dump(summary, open(os.path.join(OUT,"summary.json"),"w"), indent=2)
print("rows_y:", [int(y) for y in rpk], "lanes_x:", [int(x) for x in cpk])
print(json.dumps(results, indent=2))
