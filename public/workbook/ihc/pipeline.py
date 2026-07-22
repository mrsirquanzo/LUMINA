"""Reproducible CDCP1 IHC quantification for the LUMINA workbook.

The pipeline uses Ruifrok-Johnston HED color deconvolution through
``skimage.color.rgb2hed``. It scores DAB optical density only within a tissue
mask, then writes genuine analysis figures and a machine-readable data file.

The fixed DAB-OD thresholds are screening assumptions, not fitted to either
image: 0/1+ at 0.04, 1+/2+ at 0.08, and 2+/3+ at 0.16. Pixel-area scoring is
used because no validated cell or membrane segmentation model is available.
"""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
from matplotlib.colors import BoundaryNorm, ListedColormap
import numpy as np
from PIL import Image
from skimage.color import rgb2hed
from skimage.morphology import remove_small_objects


OUT = Path(__file__).resolve().parent
TISSUE_OD_THRESHOLD = 0.12
DAB_THRESHOLDS = (0.04, 0.08, 0.16)
MIN_TISSUE_OBJECT_PX = 64
DISPLAY_MAX_PX = 1800

SLATE_900 = "#1e293b"
SLATE_700 = "#334155"
SLATE_500 = "#64748b"
SLATE_400 = "#94a3b8"
TEAL = "#2f9e8f"
BROWN = "#92400e"

IMAGES = (
    ("lung_cancer_high", "source_lungcancer_high.jpg", "HIGH", "HIGH core"),
    ("lung_cancer_high_field_2", "source_lungcancer_high_2.jpg", "HIGH", "HIGH field 2"),
    ("normal_lung", "source_normal_lung.jpg", "NOT DETECTED", "Normal lung"),
)

plt.rcParams.update(
    {
        "figure.dpi": 150,
        "savefig.dpi": 150,
        "font.size": 9,
        "font.family": "sans-serif",
        "axes.spines.top": False,
        "axes.spines.right": False,
        "axes.edgecolor": SLATE_400,
        "axes.labelcolor": SLATE_700,
        "axes.titlecolor": SLATE_900,
        "axes.titlesize": 11,
        "axes.titleweight": "bold",
        "text.color": SLATE_700,
        "xtick.color": SLATE_500,
        "ytick.color": SLATE_500,
    }
)


def load_rgb(path: Path) -> np.ndarray:
    """Load an image as float RGB in the closed interval [0, 1]."""

    with Image.open(path) as image:
        return np.asarray(image.convert("RGB"), dtype=np.float32) / 255.0


def tissue_mask(rgb: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Exclude white glass using luminance optical density."""

    luminance = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    optical_density = -np.log(np.clip(luminance, 1.0 / 255.0, 1.0))
    mask = optical_density > TISSUE_OD_THRESHOLD
    mask = remove_small_objects(mask, min_size=MIN_TISSUE_OBJECT_PX)
    return mask, optical_density


def quantify(key: str, filename: str, hpa_call: str, label: str) -> dict:
    """Deconvolve one image and calculate tissue-area DAB intensity bins."""

    rgb = load_rgb(OUT / filename)
    hed = rgb2hed(rgb)
    hematoxylin = np.maximum(hed[..., 0], 0.0)
    dab = np.maximum(hed[..., 2], 0.0)
    mask, optical_density = tissue_mask(rgb)

    if not np.any(mask):
        raise RuntimeError(f"No tissue detected in {filename}")

    bins = np.zeros(mask.shape, dtype=np.uint8)
    bins[mask] = np.digitize(dab[mask], DAB_THRESHOLDS).astype(np.uint8)
    counts = np.bincount(bins[mask], minlength=4)
    percentages = counts / counts.sum() * 100.0
    intensity_index = float(percentages @ np.arange(4))

    threshold_record = {
        "negative_to_1_plus": DAB_THRESHOLDS[0],
        "1_plus_to_2_plus": DAB_THRESHOLDS[1],
        "2_plus_to_3_plus": DAB_THRESHOLDS[2],
        "units": "rgb2hed DAB optical density",
    }
    metrics = {
        "source_file": filename,
        "label": label,
        "area_intensity_index": round(intensity_index, 2),
        "pct_positive": round(float(100.0 - percentages[0]), 2),
        "bin_percentages": {
            "0": round(float(percentages[0]), 2),
            "1+": round(float(percentages[1]), 2),
            "2+": round(float(percentages[2]), 2),
            "3+": round(float(percentages[3]), 2),
        },
        "tissue_area_px": int(mask.sum()),
        "tissue_fraction_pct": round(float(mask.mean() * 100.0), 2),
        "thresholds_used": threshold_record,
        "hpa_reference_call": hpa_call,
    }
    return {
        "key": key,
        "rgb": rgb,
        "hematoxylin": hematoxylin,
        "dab": dab,
        "optical_density": optical_density,
        "mask": mask,
        "bins": bins,
        "metrics": metrics,
    }


def display_slice(array: np.ndarray) -> np.ndarray:
    """Downsample figure rasters while retaining full-resolution quantification."""

    stride = max(1, int(np.ceil(max(array.shape[:2]) / DISPLAY_MAX_PX)))
    return array[::stride, ::stride]


def save_figure(filename: str) -> None:
    plt.tight_layout()
    plt.savefig(OUT / filename, bbox_inches="tight", facecolor="white")
    plt.close()


def source_figure(primary: dict) -> None:
    fig, ax = plt.subplots(figsize=(6.2, 6.2))
    ax.imshow(display_slice(primary["rgb"]))
    ax.set_title("CDCP1 IHC - HPA lung cancer HIGH core")
    ax.axis("off")
    save_figure("01_source.png")


def channel_figure(primary: dict, channel: str, filename: str, title: str, cmap: str) -> None:
    values = primary[channel]
    vmax = float(np.percentile(values[primary["mask"]], 99.5))
    fig, ax = plt.subplots(figsize=(6.2, 6.2))
    image = ax.imshow(display_slice(values), cmap=cmap, vmin=0, vmax=vmax)
    ax.set_title(title)
    ax.axis("off")
    colorbar = fig.colorbar(image, ax=ax, fraction=0.046, pad=0.04)
    colorbar.set_label("HED optical density", color=SLATE_700)
    colorbar.ax.tick_params(colors=SLATE_500, labelsize=8)
    save_figure(filename)


def tissue_figure(primary: dict) -> None:
    rgb = display_slice(primary["rgb"])
    mask = display_slice(primary["mask"])
    overlay = np.zeros((*mask.shape, 4), dtype=np.float32)
    overlay[..., :3] = np.array([47, 158, 143], dtype=np.float32) / 255.0
    overlay[..., 3] = mask.astype(np.float32) * 0.28

    fig, ax = plt.subplots(figsize=(6.2, 6.2))
    ax.imshow(rgb)
    ax.imshow(overlay)
    ax.set_title(
        f"Tissue mask - {primary['metrics']['tissue_fraction_pct']:.2f}% of image area"
    )
    ax.axis("off")
    ax.text(
        0.02,
        0.02,
        f"Luminance OD > {TISSUE_OD_THRESHOLD:.2f}",
        transform=ax.transAxes,
        color=SLATE_900,
        fontsize=9,
        bbox={"facecolor": "white", "edgecolor": SLATE_400, "alpha": 0.92, "pad": 4},
    )
    save_figure("04_tissue_mask.png")


def bin_figure(primary: dict) -> None:
    mask = display_slice(primary["mask"])
    bins = display_slice(primary["bins"])
    mapped = np.where(mask, bins + 1, 0)
    colors = ["#f8fafc", "#cbd5e1", "#fcd9a3", "#d97706", "#78350f"]
    cmap = ListedColormap(colors)
    norm = BoundaryNorm(np.arange(-0.5, 5.5, 1), cmap.N)

    fig, ax = plt.subplots(figsize=(6.2, 6.2))
    image = ax.imshow(mapped, cmap=cmap, norm=norm)
    ax.set_title("DAB intensity classification - fixed optical-density bins")
    ax.axis("off")
    colorbar = fig.colorbar(image, ax=ax, fraction=0.046, pad=0.04, ticks=range(5))
    colorbar.ax.set_yticklabels(["Glass", "0", "1+", "2+", "3+"])
    colorbar.ax.tick_params(colors=SLATE_500, labelsize=8)
    save_figure("05_intensity_bins.png")


def scorecard_figure(primary: dict) -> None:
    metrics = primary["metrics"]
    grades = ["0", "1+", "2+", "3+"]
    values = [metrics["bin_percentages"][grade] for grade in grades]
    colors = ["#cbd5e1", "#fcd9a3", "#d97706", "#78350f"]

    fig, ax = plt.subplots(figsize=(6.0, 3.9))
    bars = ax.bar(grades, values, color=colors, width=0.68)
    for bar, value in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + 1.2,
            f"{value:.2f}%",
            ha="center",
            va="bottom",
            fontsize=8,
            color=SLATE_700,
        )
    ax.set_ylim(0, max(values) * 1.22)
    ax.set_xlabel("DAB intensity grade")
    ax.set_ylabel("% of tissue pixels")
    ax.set_title("CDCP1 DAB scorecard - lung cancer HIGH core")
    strong = metrics["bin_percentages"]["2+"] + metrics["bin_percentages"]["3+"]
    ax.text(
        0.98,
        0.93,
        f"{metrics['pct_positive']:.1f}% DAB-positive\n{strong:.1f}% at 2+/3+",
        transform=ax.transAxes,
        ha="right",
        va="top",
        fontsize=10,
        fontweight="bold",
        color=SLATE_900,
        bbox={"facecolor": "white", "edgecolor": SLATE_400, "alpha": 0.95, "pad": 5},
    )
    save_figure("06_scorecard.png")


def cross_reference_figure(results: list[dict]) -> None:
    labels = [result["metrics"]["label"] for result in results]
    positives = [result["metrics"]["pct_positive"] for result in results]
    strong = [result["metrics"]["bin_percentages"]["2+"] + result["metrics"]["bin_percentages"]["3+"] for result in results]
    calls = [result["metrics"]["hpa_reference_call"] for result in results]
    y = np.arange(len(results))

    fig, ax = plt.subplots(figsize=(7.2, 4.1))
    width = 0.34
    bars_p = ax.barh(y + width / 2, positives, height=width, color=TEAL, label="% DAB-positive")
    bars_s = ax.barh(y - width / 2, strong, height=width, color=BROWN, label="% at 2+/3+ (strong signal)")
    ax.set_yticks(y, labels)
    ax.invert_yaxis()
    ax.set_xlabel("% of tissue area")
    ax.set_title("Automated CDCP1 positivity vs HPA pathologist reference")
    ax.legend(loc="lower right", frameon=False)
    ax.set_xlim(0, max(max(positives), max(strong)) * 1.5)

    for bar, value in zip(bars_p, positives):
        ax.text(value + 0.3, bar.get_y() + bar.get_height() / 2, f"{value:.1f}%", va="center", fontsize=8)
    for bar, value, call in zip(bars_s, strong, calls):
        ax.text(value + 0.3, bar.get_y() + bar.get_height() / 2, f"{value:.1f}%", va="center", fontsize=8)
        ax.text(
            ax.get_xlim()[1] * 0.97,
            bar.get_y() + bar.get_height() / 2,
            f"HPA: {call}",
            ha="right",
            va="center",
            fontsize=8,
            fontweight="bold",
            color=SLATE_700,
        )
    ax.text(
        0,
        -0.23,
        "Fixed DAB-OD cutoffs: 0.04, 0.08, 0.16. Area-based fractions, not a cell-level pathologist score.",
        transform=ax.transAxes,
        color=SLATE_500,
        fontsize=8,
    )
    save_figure("07_crossref.png")


def main() -> None:
    results = [quantify(*image) for image in IMAGES]
    primary = results[0]

    source_figure(primary)
    channel_figure(primary, "hematoxylin", "02_hematoxylin.png", "Hematoxylin channel - nuclei and counterstain", "Blues")
    channel_figure(primary, "dab", "03_dab.png", "DAB channel - CDCP1 chromogen optical density", "YlOrBr")
    tissue_figure(primary)
    bin_figure(primary)
    scorecard_figure(primary)
    cross_reference_figure(results)

    data = {
        "analysis": {
            "target": "CDCP1 / ENSG00000163814",
            "antibody_source": "Human Protein Atlas",
            "chromogen": "DAB",
            "counterstain": "hematoxylin",
            "color_deconvolution": "skimage.color.rgb2hed (Ruifrok-Johnston HED)",
            "scoring_unit": "tissue pixels",
            "tissue_mask": (
                f"luminance optical density > {TISSUE_OD_THRESHOLD:.2f}; "
                f"objects smaller than {MIN_TISSUE_OBJECT_PX} pixels removed"
            ),
            "dab_thresholds": {
                "negative_to_1_plus": DAB_THRESHOLDS[0],
                "1_plus_to_2_plus": DAB_THRESHOLDS[1],
                "2_plus_to_3_plus": DAB_THRESHOLDS[2],
                "units": "rgb2hed DAB optical density",
            },
            "area_intensity_index_definition": "1*pct_1_plus + 2*pct_2_plus + 3*pct_3_plus (area-based intensity index, not a cell-level pathologist score)",
        },
        "images": {result["key"]: result["metrics"] for result in results},
        "figures": [
            "01_source.png",
            "02_hematoxylin.png",
            "03_dab.png",
            "04_tissue_mask.png",
            "05_intensity_bins.png",
            "06_scorecard.png",
            "07_crossref.png",
        ],
    }
    with (OUT / "ihc_data.json").open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2)
        handle.write("\n")

    print(json.dumps(data["images"], indent=2))


if __name__ == "__main__":
    main()
