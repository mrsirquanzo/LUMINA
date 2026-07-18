"""Real B-cell immunophenotyping gating pipeline for the A02 WLSM FCS file.
Produces genuine figures + a scenario.json driving the Sonny workbook replay.
Sony ID7000 spectral, 13-colour panel, spectrally unmixed (WLSM) Area channels.
"""
import json, os, warnings
import numpy as np
import pandas as pd
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import fcsparser

warnings.filterwarnings("ignore")

FCS = "/Users/quanho/Downloads/A02 Well - A02 WLSM.fcs"
OUT = "/private/tmp/claude-501/-Users-quanho/35d39a2c-2df7-4460-b340-b3c28387140c/scratchpad/flow_out"
os.makedirs(OUT, exist_ok=True)
COFACTOR = 6000.0
TEAL = "#2f9e8f"

plt.rcParams.update({
    "figure.dpi": 150, "savefig.dpi": 150, "font.size": 9,
    "axes.spines.top": False, "axes.spines.right": False,
    "axes.edgecolor": "#94a3b8", "axes.labelcolor": "#334155",
    "text.color": "#334155", "xtick.color": "#64748b", "ytick.color": "#64748b",
    "axes.titlesize": 10, "axes.titleweight": "bold", "axes.titlecolor": "#1e293b",
    "font.family": "sans-serif",
})

meta, df = fcsparser.parse(FCS, reformat_meta=True)
N0 = len(df)
asinh = lambda x: np.arcsinh(x / COFACTOR)

M = {  # marker -> channel
    "CD40": "CD40 : BUV395 - Area", "IgD": "IgD : BUV737 - Area", "IgM": "IgM : BV421 - Area",
    "CD27": "CD27 : BV785 - Area", "CD86": "CD86 : KB520 - Area", "CD3": "CD3 : SparkBlue-550 - Area",
    "CD197": "CD197 : PE - Area", "CD80": "CD80 : PE-Dazzle594 - Area", "HLA-DR": "HLA-DR : PE-Fire810 - Area",
    "CD38": "CD38 : SparkNIR-685 - Area", "Live/Dead": "Live Dead : Zombie-NIR - Area", "CD19": "CD19 : APC-Fire810 - Area",
}
for k, v in M.items():
    df[k] = asinh(df[v].values)

def otsu(vals):
    v = vals[np.isfinite(vals)]
    hist, edges = np.histogram(v, bins=256)
    hist = hist.astype(float); centers = (edges[:-1] + edges[1:]) / 2
    w = np.cumsum(hist); wb = w; wf = w[-1] - w
    with np.errstate(invalid="ignore", divide="ignore"):
        mb = np.cumsum(hist * centers) / wb
        mf = (np.cumsum((hist * centers)[::-1])[::-1]) / wf
        var = wb * wf * (mb - mf) ** 2
    return centers[np.nanargmax(var)]

def scatter(ax, x, y, s=1, alpha=0.12):
    ax.scatter(x, y, s=s, c="#1f2937", alpha=alpha, linewidths=0, rasterized=True)

figs = {}
def save(name):
    p = os.path.join(OUT, name)
    plt.tight_layout(); plt.savefig(p, bbox_inches="tight", facecolor="white"); plt.close()
    return name

# ---- Step 2: cell gate FSC-A vs SSC-A ----
fa, sa = df["FSC - Area"].values, df["SSC - Area"].values
cell = (fa >= 100_000) & (fa <= 500_000) & (sa >= 20_000) & (sa <= 400_000)
pct_cell = 100 * cell.mean()
fig, ax = plt.subplots(figsize=(4.6, 3.8))
scatter(ax, fa, sa)
ax.add_patch(plt.Rectangle((100_000, 20_000), 400_000, 380_000, fill=False, ec=TEAL, ls="--", lw=1.3))
ax.text(105_000, 405_000, "Cell gate", color=TEAL, fontsize=8, fontweight="bold")
ax.set_xlim(0, 800_000); ax.set_ylim(0, 650_000)
ax.set_xlabel("FSC-A (Forward Scatter Area)"); ax.set_ylabel("SSC-A (Side Scatter Area)")
ax.set_title("FSC-A vs SSC-A - All Events")
figs["cell_gate"] = save("01_cell_gate.png")

# ---- Step 3: singlets FSC-A vs FSC-H ----
fh = df["FSC - Height"].values
ratio = fh / fa
lo, hi = np.percentile(ratio[cell], 3), np.percentile(ratio[cell], 99.5)
singlet = cell & (ratio >= lo) & (ratio <= hi)
pct_singlet = 100 * singlet.sum() / cell.sum()
fig, ax = plt.subplots(figsize=(4.6, 3.8))
scatter(ax, fa[cell], fh[cell])
xs = np.array([100_000, 500_000])
ax.plot(xs, lo * xs, TEAL, ls="--", lw=1.2); ax.plot(xs, hi * xs, TEAL, ls="--", lw=1.2, label="Singlet gate")
ax.set_xlim(100_000, 520_000); ax.set_ylim(40_000, 420_000)
ax.set_xlabel("FSC-A (Forward Scatter Area)"); ax.set_ylabel("FSC-H (Forward Scatter Height)")
ax.set_title("FSC-A vs FSC-H - Singlet Gating"); ax.legend(loc="lower right", frameon=False, fontsize=8)
figs["singlet"] = save("02_singlet.png")

# ---- Step 4: viability (Zombie-NIR) ----
ld = df["Live/Dead"].values
thr_ld = otsu(df["Live/Dead"].values[singlet])
live = singlet & (df["Live/Dead"].values < thr_ld)
pct_viable = 100 * live.sum() / singlet.sum()
fig, ax = plt.subplots(figsize=(4.6, 3.4))
ax.hist(df["Live/Dead"].values[singlet], bins=200, color=TEAL, alpha=0.55)
ax.axvline(thr_ld, color="#e11d48", ls="--", lw=1.2)
ax.text(thr_ld, ax.get_ylim()[1]*0.9, "  live | dead", color="#e11d48", fontsize=8)
ax.set_xlabel("Live/Dead Zombie-NIR (arcsinh)"); ax.set_ylabel("events")
ax.set_title(f"Viability Gating - {pct_viable:.1f}% live")
figs["viability"] = save("03_viability.png")

# ---- Step 5: lineage CD3- CD19+ ----
thr_cd3 = otsu(df["CD3"].values[live]); thr_cd19 = otsu(df["CD19"].values[live])
cd3 = df["CD3"].values; cd19 = df["CD19"].values
bcell = live & (cd3 < thr_cd3) & (cd19 >= thr_cd19)
n_b = int(bcell.sum())
pct_b_total = 100 * n_b / N0
pct_b_live = 100 * n_b / live.sum()
fig, ax = plt.subplots(figsize=(4.8, 3.9))
scatter(ax, cd3[live], cd19[live], alpha=0.15)
ax.axvline(thr_cd3, color=TEAL, ls="--", lw=1.1); ax.axhline(thr_cd19, color=TEAL, ls="--", lw=1.1)
ax.text(ax.get_xlim()[0]+0.2, thr_cd19+0.3, "CD3- CD19+ B cells", color=TEAL, fontsize=8, fontweight="bold")
ax.set_xlabel("CD3 (arcsinh)"); ax.set_ylabel("CD19 (arcsinh)")
ax.set_title("Lineage Gating - CD3 vs CD19")
figs["lineage"] = save("04_lineage.png")

B = df[bcell]
def pos(marker, subset=B):
    t = otsu(df[marker].values[live])
    return t, 100 * (subset[marker].values >= t).mean()

# ---- Step 6: B-cell subsets IgD/CD27 ----
t_igd = otsu(df["IgD"].values[live]); t_cd27 = otsu(df["CD27"].values[live])
igd = B["IgD"].values >= t_igd; cd27 = B["CD27"].values >= t_cd27
naive = 100 * (igd & ~cd27).mean()
unsw = 100 * (igd & cd27).mean()
switched = 100 * (~igd & cd27).mean()
dn = 100 * (~igd & ~cd27).mean()
fig, ax = plt.subplots(figsize=(4.6, 3.9))
scatter(ax, B["IgD"].values, B["CD27"].values, alpha=0.2, s=2)
ax.axvline(t_igd, color=TEAL, ls="--", lw=1.0); ax.axhline(t_cd27, color=TEAL, ls="--", lw=1.0)
xl, yl = ax.get_xlim(), ax.get_ylim()
ax.text(xl[1]-0.2, yl[0]+0.2, f"naive {naive:.1f}%", ha="right", fontsize=7.5, color="#1e293b")
ax.text(xl[1]-0.2, yl[1]-0.4, f"unsw mem {unsw:.1f}%", ha="right", fontsize=7.5, color="#1e293b")
ax.text(xl[0]+0.2, yl[1]-0.4, f"switched {switched:.1f}%", fontsize=7.5, color="#1e293b")
ax.text(xl[0]+0.2, yl[0]+0.2, f"DN {dn:.1f}%", fontsize=7.5, color="#1e293b")
ax.set_xlabel("IgD (arcsinh)"); ax.set_ylabel("CD27 (arcsinh)")
ax.set_title("B-cell Subsets - IgD vs CD27")
figs["subsets"] = save("05_subsets.png")

# constitutive + activation
markers_report = {}
for mk in ["HLA-DR", "CD40", "CD197", "CD86", "CD80", "CD38", "IgM"]:
    t, p = pos(mk); markers_report[mk] = {"pct_pos": round(p, 1), "median_raw": float(np.median(df[M[mk]].values[bcell]))}

# ---- Step 7: co-expression heatmap (Spearman) ----
from numpy import corrcoef
mk_list = ["CD19","IgD","IgM","CD27","CD38","CD86","CD80","CD40","HLA-DR","CD197"]
def rankcorr(a):
    r = np.apply_along_axis(lambda c: pd.Series(c).rank().values, 0, a)
    return np.corrcoef(r, rowvar=False)
mat = rankcorr(B[mk_list].values)
fig, ax = plt.subplots(figsize=(4.8, 4.2))
im = ax.imshow(mat, cmap="RdBu_r", vmin=-1, vmax=1)
ax.set_xticks(range(len(mk_list))); ax.set_yticks(range(len(mk_list)))
ax.set_xticklabels(mk_list, rotation=45, ha="right", fontsize=7); ax.set_yticklabels(mk_list, fontsize=7)
fig.colorbar(im, fraction=0.046, pad=0.04).ax.tick_params(labelsize=7)
ax.set_title("Marker Co-expression (Spearman) - B cells")
figs["heatmap"] = save("06_heatmap.png")

# ---- Step 8: summary bar ----
fig, ax = plt.subplots(figsize=(5.0, 3.2))
subs = {"Naive": naive, "Switched mem": switched, "Double-neg": dn, "Unsw mem": unsw}
cols = ["#2f9e8f", "#f59e0b", "#6366f1", "#94a3b8"]
ax.barh(list(subs.keys())[::-1], list(subs.values())[::-1], color=cols[::-1])
for i, v in enumerate(list(subs.values())[::-1]):
    ax.text(v + 0.5, i, f"{v:.1f}%", va="center", fontsize=8)
ax.set_xlabel("% of B cells"); ax.set_title("B-cell Subset Composition")
figs["summary"] = save("07_summary.png")

summary = {
    "total_events": N0, "cofactor": COFACTOR,
    "cell_gate_pct": round(pct_cell, 1), "singlet_pct": round(pct_singlet, 1),
    "viable_pct": round(pct_viable, 1), "b_cells": n_b,
    "b_pct_total": round(pct_b_total, 1), "b_pct_live": round(pct_b_live, 1),
    "subsets": {"naive": round(naive,1), "switched_memory": round(switched,1),
                "double_negative": round(dn,1), "unswitched_memory": round(unsw,1)},
    "markers": markers_report, "figures": figs,
}
with open(os.path.join(OUT, "summary.json"), "w") as f:
    json.dump(summary, f, indent=2)
print(json.dumps(summary, indent=2))
