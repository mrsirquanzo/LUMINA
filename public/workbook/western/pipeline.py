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
from scipy.ndimage import gaussian_filter1d

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
cw = int(spacing*0.42)  # wide enough to contain a full band

def centroid_x(y, x):
    """Snap the ROI x-center onto the band's intensity centroid within its lane window."""
    y0,y1 = max(0,y-rh), min(H,y+rh); x0,x1 = max(X0,x-cw), min(X1,x+cw)
    col = inv[y0:y1, x0:x1].sum(axis=0)
    col = np.clip(col - np.median(col), 0, None)
    if col.sum() == 0: return x
    return int(x0 + (np.arange(len(col))*col).sum()/col.sum())

def integrated_density(y, x):
    """Background-corrected integrated density over a band box centered on the band."""
    y0,y1 = max(0,y-rh), min(H,y+rh); x0,x1 = max(0,x-cw), min(W,x+cw)
    roi = inv[y0:y1, x0:x1]
    # local background = median of thin strips just above and below the band, same lane
    above = inv[max(0,y-rh-10):max(0,y-rh), x0:x1]; below = inv[min(H,y+rh):min(H,y+rh+10), x0:x1]
    bg = np.median(np.concatenate([above.ravel(), below.ravel()])) if above.size+below.size else 0
    return float(np.clip(roi - bg, 0, None).sum()), (x0,y0,x1,y1)

rows = []; boxes = []
for pi, y in enumerate(rpk):
    for li, x0c in enumerate(cpk):
        x = centroid_x(y, x0c)
        idv, box = integrated_density(y, x)
        rows.append({"protein": proteins[pi], "lane": lanes[li], "raw_id": round(idv,0)})
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
