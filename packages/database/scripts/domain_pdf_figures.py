"""Pull each topic's figure out of its source PDF into public/study-notes/.

The figures are designed slides, one per topic, embedded whole. They are written
as 8-bit non-interlaced RGB PNG because that is the only shape apps/web's
`gen:figures` can decode — and that script is what measures the lettering inside
each figure to decide how large it should render. A JPEG would keep its intrinsic
pixel size instead and land at the wrong apparent scale next to the others.
"""
import io, json, os, shutil
import pymupdf
from PIL import Image

DEST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))))), "apps", "web", "public", "study-notes")


def figure_bytes(subject, src, page):
    doc = pymupdf.open(f"pdfs/{subject}/{src}.pdf")
    imgs = doc[page - 1].get_images(full=True)
    if not imgs:
        return None
    # One designed figure per page; if a page ever carried two, the largest is it.
    best = max(imgs, key=lambda im: im[2] * im[3])
    return doc.extract_image(best[0])


def main():
    total = 0
    for subject in ("CN", "DBMS", "OS"):
        figs = json.load(open(f"out/figures-{subject.lower()}.json"))
        root = os.path.join(DEST, subject.lower())
        if os.path.isdir(root):
            shutil.rmtree(root)          # the previous extraction's figures
        for f in figs:
            if not f["count"]:
                print(f" !! {subject}/{f['slug']}: no figure"); continue
            info = figure_bytes(subject, f["src"], f["page"])
            if info is None:
                print(f" !! {subject}/{f['slug']}: page {f['page']} has no image"); continue
            out_dir = os.path.join(root, f["slug"])
            os.makedirs(out_dir, exist_ok=True)
            path = os.path.join(out_dir, "fig-1.png")
            img = Image.open(io.BytesIO(info["image"]))
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGB")
            img.save(path, "PNG", optimize=True)
            total += 1
        print(f"{subject}: {len(figs)} topics → {root}")
    print("figures written:", total)


if __name__ == "__main__":
    main()
