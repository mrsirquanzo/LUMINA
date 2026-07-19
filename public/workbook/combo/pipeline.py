"""
Real oncology small-molecule drug-combination synergy analysis.

DATA: comboFM experimental validation dataset (real wet-lab dose-response matrices).
  Julkunen et al., "Leveraging multi-way interactions for systematic prediction of
  pre-clinical drug combination effects", Nature Communications 11:6136 (2020).
  Source: https://raw.githubusercontent.com/aalto-ics-kepaco/comboFM/master/experimental_validation_data/drug_combination_testing_data.xlsx

Each combination is measured on an 8x8 dose grid (plus zero-dose single-agent rows/cols),
column RelativeInhibition = % growth inhibition. We convert to viability fraction and
fit Bliss independence (single-drug Hill fits) with the `synergy` package, then score
each combination by mean excess-over-Bliss on the inhibition (killing) scale.

Synergy metric: mean Bliss excess = mean( reference_viability - observed_viability )
  = mean( observed_inhibition - expected_inhibition ). Positive => synergistic.
HSA excess reported alongside for context.
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import TwoSlopeNorm
from synergy.combination import Bliss, HSA

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "exp_valid.xlsx"
DATASET_NAME = "comboFM experimental validation (Julkunen et al. 2020, Nat Commun)"
SOURCE_URL = ("https://raw.githubusercontent.com/aalto-ics-kepaco/comboFM/master/"
              "experimental_validation_data/drug_combination_testing_data.xlsx")
CELL_LINE = "MALME-3M"  # malignant melanoma line; most-screened combos in this dataset

# ---- LUMINA aesthetic -------------------------------------------------------
TEAL = "#2f9e8f"
SLATE = "#1e293b"
plt.rcParams.update({
    "figure.facecolor": "white", "axes.facecolor": "white",
    "font.family": "sans-serif", "font.sans-serif": ["Helvetica", "Arial", "DejaVu Sans"],
    "text.color": SLATE, "axes.labelcolor": SLATE, "axes.edgecolor": SLATE,
    "xtick.color": SLATE, "ytick.color": SLATE, "axes.linewidth": 0.8,
    "figure.dpi": 150,
})

def style(ax):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)


def bliss_reference(d1, d2, via):
    """Fit Bliss (via synergy pkg) and return (reference_viability, hsa_reference)."""
    b = Bliss(); b.fit(d1, d2, via)
    h = HSA(); h.fit(d1, d2, via)
    return np.asarray(b.reference, float), np.asarray(h.reference, float), b, h


def main():
    df = pd.read_excel(DATA)
    sub = df[df.CellLine == CELL_LINE].copy()
    combos = []
    for (dA, dB), g in sub.groupby(["Drug1", "Drug2"]):
        d1 = g.Conc1.values.astype(float)
        d2 = g.Conc2.values.astype(float)
        inhib = g.RelativeInhibition.values.astype(float)
        via = (100.0 - inhib) / 100.0  # viability fraction, E0 ~ 1
        ref_via, hsa_via, bmodel, hmodel = bliss_reference(d1, d2, via)
        # combination wells only (both drugs > 0) for scoring
        mask = (d1 > 0) & (d2 > 0)
        bliss_excess = (ref_via - via)          # positive => synergy (killing scale)
        hsa_excess = (hsa_via - via)
        score = float(np.nanmean(bliss_excess[mask]) * 100.0)   # in inhibition % points
        hsa_score = float(np.nanmean(hsa_excess[mask]) * 100.0)
        combos.append({
            "drug_A": dA, "drug_B": dB,
            "bliss_score": round(score, 3), "hsa_score": round(hsa_score, 3),
            "d1": d1, "d2": d2, "inhib": inhib,
            "bliss_excess_pct": bliss_excess * 100.0,
        })
    combos.sort(key=lambda c: c["bliss_score"], reverse=True)
    return sub, combos


def heatmap_matrix(c):
    """Build dose_A x dose_B matrix of Bliss excess (%) for combination wells."""
    d1 = c["d1"]; d2 = c["d2"]; ex = c["bliss_excess_pct"]
    a = np.unique(d1[d1 > 0]); b = np.unique(d2[d2 > 0])
    M = np.full((len(b), len(a)), np.nan)
    for x, y, v in zip(d1, d2, ex):
        if x > 0 and y > 0:
            M[np.where(b == y)[0][0], np.where(a == x)[0][0]] = v
    return a, b, M


def fig_heatmaps(combos, path):
    top = combos[:3]
    fig, axes = plt.subplots(1, len(top), figsize=(5.2 * len(top), 4.6))
    if len(top) == 1:
        axes = [axes]
    vmax = max(np.nanmax(np.abs(heatmap_matrix(c)[2])) for c in top)
    norm = TwoSlopeNorm(vmin=-vmax, vcenter=0, vmax=vmax)
    for ax, c in zip(axes, top):
        a, b, M = heatmap_matrix(c)
        im = ax.imshow(M, cmap="RdBu_r", norm=norm, origin="lower", aspect="auto")
        ax.set_xticks(range(len(a))); ax.set_xticklabels([f"{v:g}" for v in a], rotation=45, fontsize=7)
        ax.set_yticks(range(len(b))); ax.set_yticklabels([f"{v:g}" for v in b], fontsize=7)
        ax.set_xlabel(f"{c['drug_A']} (nM)", fontsize=9)
        ax.set_ylabel(f"{c['drug_B']} (nM)", fontsize=9)
        ax.set_title(f"{c['drug_A']} + {c['drug_B']}\nBliss score {c['bliss_score']:+.1f}",
                     fontsize=10, fontweight="bold", color=SLATE)
    cb = fig.colorbar(im, ax=axes, fraction=0.025, pad=0.02)
    cb.set_label("Excess over Bliss (% inhibition)", fontsize=8)
    fig.suptitle(f"Bliss synergy surfaces - top combinations in {CELL_LINE} (melanoma)",
                 fontsize=12, fontweight="bold", color=SLATE, x=0.5, y=1.02)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def fig_ranking(combos, path):
    labels = [f"{c['drug_A']} + {c['drug_B']}" for c in combos]
    scores = [c["bliss_score"] for c in combos]
    colors = [TEAL if s >= 0 else "#c05a4d" for s in scores]
    fig, ax = plt.subplots(figsize=(7.5, 0.5 * len(combos) + 1.2))
    y = range(len(combos))
    ax.barh(list(y), scores, color=colors)
    ax.set_yticks(list(y)); ax.set_yticklabels(labels, fontsize=8)
    ax.invert_yaxis()
    ax.axvline(0, color=SLATE, lw=0.8)
    ax.set_xlabel("Mean excess over Bliss (% inhibition points)", fontsize=9)
    ax.set_title(f"Combination synergy ranking - {CELL_LINE}",
                 fontsize=11, fontweight="bold", color=SLATE)
    style(ax)
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


def fig_single_agents(sub, top, path):
    dA, dB = top["drug_A"], top["drug_B"]
    g = sub[(sub.Drug1 == dA) & (sub.Drug2 == dB)]
    fig, axes = plt.subplots(1, 2, figsize=(9, 3.8))
    # drug A alone: Conc2 == 0
    a = g[g.Conc2 == 0].sort_values("Conc1")
    axes[0].plot(a.Conc1, a.RelativeInhibition, "o-", color=TEAL, lw=2)
    axes[0].set_xscale("symlog", linthresh=0.1)
    axes[0].set_title(f"{dA} (single agent)", fontsize=10, fontweight="bold")
    # drug B alone: Conc1 == 0
    b = g[g.Conc1 == 0].sort_values("Conc2")
    axes[1].plot(b.Conc2, b.RelativeInhibition, "o-", color=TEAL, lw=2)
    axes[1].set_xscale("symlog", linthresh=0.1)
    axes[1].set_title(f"{dB} (single agent)", fontsize=10, fontweight="bold")
    for ax in axes:
        style(ax)
        ax.set_xlabel("Concentration (nM)", fontsize=9)
        ax.set_ylabel("% inhibition", fontsize=9)
        ax.set_ylim(-5, 105)
    fig.suptitle(f"Single-agent dose-response - top combo drugs ({CELL_LINE})",
                 fontsize=11, fontweight="bold", color=SLATE)
    fig.tight_layout()
    fig.savefig(path, dpi=150, bbox_inches="tight")
    plt.close(fig)


if __name__ == "__main__":
    sub, combos = main()
    f_heat = HERE / "fig_synergy_matrices.png"
    f_rank = HERE / "fig_ranking.png"
    f_single = HERE / "fig_single_agent.png"
    fig_heatmaps(combos, f_heat)
    fig_ranking(combos, f_rank)
    fig_single_agents(sub, combos[0], f_single)

    def clean(c):
        return {"drug_A": c["drug_A"], "drug_B": c["drug_B"],
                "bliss_score": c["bliss_score"], "hsa_score": c["hsa_score"]}

    summary = {
        "dataset": DATASET_NAME,
        "source_url": SOURCE_URL,
        "cell_line": CELL_LINE,
        "cell_line_context": "malignant melanoma (NCI-60 line)",
        "synergy_metric": "mean excess over Bliss independence (% inhibition points); positive = synergistic. Bliss & HSA references fit with the `synergy` Python package (single-drug Hill fits).",
        "dose_grid": "8x8 concentration matrix per combination (nM)",
        "n_combinations": len(combos),
        "ranked_synergistic_top": [clean(c) for c in combos[:3]],
        "all_combinations_ranked": [clean(c) for c in combos],
        "top_antagonistic": [clean(c) for c in combos[-3:][::-1]],
        "figures": {
            "synergy_matrices": f_heat.name,
            "ranking_bar": f_rank.name,
            "single_agent": f_single.name,
        },
    }
    (HERE / "summary.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps(summary, indent=2))
