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
from scipy.ndimage import gaussian_filter1d, gaussian_filter, label

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

# --- band detection: find each band's ACTUAL pixels per row (no lane-x bias) ---
lanes = ["0 (untreated)", "25 ug/mL", "50 ug/mL"]
sh = int(H*0.075)               # row strip half-height

def row_blobs(y):
    """Threshold a row strip and return up to 3 band blobs (bounding boxes)."""
    y0, y1 = max(0, y-sh), min(H, y+sh)
    strip = gaussian_filter(inv[y0:y1, X0:X1], 1.2)
    bg = float(np.median(strip))
    thr = bg + max(12.0, (np.percentile(strip, 99.5) - bg) * 0.22)
    lbl, n = label(strip > thr)
    comps = []
    for k in range(1, n+1):
        ys, xs = np.where(lbl == k)
        if len(xs) < 80:
            continue
        comps.append({"x0": int(xs.min()+X0), "x1": int(xs.max()+X0),
                      "y0": int(ys.min()+y0), "y1": int(ys.max()+y0),
                      "cx": (xs.min()+xs.max())/2 + X0, "area": len(xs)})
    comps.sort(key=lambda c: -c["area"])
    return comps[:3]

row_det = {i: sorted(row_blobs(y), key=lambda c: c["cx"]) for i, y in enumerate(rpk)}
# Consensus lane x from any row that cleanly found all 3 bands (e.g. GAPDH).
full = [[c["cx"] for c in comps] for comps in row_det.values() if len(comps) == 3]
if full:
    lane_cx = list(np.median(np.array(full), axis=0))
else:
    best = max(row_det.values(), key=len)
    lane_cx = sorted(c["cx"] for c in best)[:3]
allc = [c for comps in row_det.values() for c in comps]
mw = int(np.median([c["x1"]-c["x0"] for c in allc]))  # median band footprint
mh = int(np.median([c["y1"]-c["y0"] for c in allc]))

def bg_and_density(box):
    bx0, by0, bx1, by1 = box
    roi = inv[max(0,by0):min(H,by1), max(0,bx0):min(W,bx1)]
    above = inv[max(0,by0-8):max(0,by0), max(0,bx0):min(W,bx1)]
    below = inv[min(H,by1):min(H,by1+8), max(0,bx0):min(W,bx1)]
    strips = np.concatenate([above.ravel(), below.ravel()])
    bg = float(np.median(strips)) if strips.size else float(np.median(roi))
    return float(np.clip(roi - bg, 0, None).sum())

# Blobs give the band POSITION (so boxes align); a CONSISTENT box SIZE is used
# for measurement so a near-absent band (e.g. untreated HSP90) is not quantified
# with a tiny window - which would make its fold-change denominator explode.
BW = int(mw * 1.10)
BH = int(mh * 1.30)
rows = []; boxes = []
for pi, y in enumerate(rpk):
    comps = row_det[pi]
    for li, lx in enumerate(lane_cx):
        near = [c for c in comps if abs(c["cx"] - lx) < mw * 0.9]
        if near:
            c = min(near, key=lambda c: abs(c["cx"] - lx))
            cx, cy = (c["x0"]+c["x1"])/2, (c["y0"]+c["y1"])/2   # center from the real band
        else:
            cx, cy = lx, y                                       # faint/absent: grid position
        box = (int(cx-BW/2), int(cy-BH/2), int(cx+BW/2), int(cy+BH/2))
        rows.append({"protein": proteins[pi], "lane": lanes[li], "raw_id": round(bg_and_density(box), 0)})
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
           "row_y": [int(y) for y in rpk], "lane_x": [int(x) for x in lane_cx]}
json.dump(summary, open(os.path.join(OUT,"summary.json"),"w"), indent=2)
print("rows_y:", [int(y) for y in rpk], "lanes_x:", [int(x) for x in lane_cx])
print(json.dumps(results, indent=2))
