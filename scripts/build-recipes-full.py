#!/usr/bin/env python3
"""
Build public/data/recipes_full.json — the aggregate the React app expects.

The app's Home slider, Recipes page, and Catalog all fetch /data/recipes_full.json,
but that file was never generated. The real recipe data lives in ~148 per-country
files (each using a custom top-level key like `afghanistanRecipes`, often nested by
meal). This script flattens them into one { recipes: [...] } file and enriches each
record so the app's filters (cuisine + meal type) and name filter actually work.

Run from the project root:
    python3 scripts/build-recipes-full.py
"""
import json
import os
import re
import glob
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA_DIR = os.path.join(ROOT, "public", "data")
INDEX = os.path.join(DATA_DIR, "recipes-index.json")
OUT = os.path.join(DATA_DIR, "recipes_full.json")

PHASE_TOKENS = {"authentic", "recipes", "recipe", "phase", "final", "batch"}
MEAL_TYPES = [
    "breakfast", "lunch", "dinner", "dessert", "snack", "drink",
    "beverage", "soup", "appetizer", "side", "sauce", "bread", "salad",
]
# small fixups so inferred cuisine labels read naturally
CUISINE_FIX = {
    "Usa": "American", "Uk": "British", "Uae": "Emirati",
    "South Africa": "South African", "New Zealand": "New Zealand",
    "Costa Rica": "Costa Rican", "Czech Republic": "Czech",
    "Sri Lanka": "Sri Lankan", "Saudi Arabia": "Saudi",
}


def cuisine_from_filename(stem: str) -> str:
    parts = [p for p in stem.split("-")
             if not (p in PHASE_TOKENS or re.fullmatch(r"phase\d*", p) or re.fullmatch(r"batch\d*", p))]
    label = " ".join(parts).strip().title()
    return CUISINE_FIX.get(label, label)


def infer_meal_type(recipe: dict, parent_keys: list) -> str:
    # 1) explicit field
    for f in ("recipe_type", "category", "mealType", "meal_type", "type", "course"):
        v = recipe.get(f)
        if isinstance(v, str) and v.strip():
            v = v.strip().lower()
            for m in MEAL_TYPES:
                if m in v:
                    return m
    # 2) the id (e.g. "mor-dinner-tagine")
    rid = str(recipe.get("id", "")).lower()
    for m in MEAL_TYPES:
        if m in rid:
            return m
    # 3) the nesting key it was found under
    for k in reversed(parent_keys):
        kl = str(k).lower()
        for m in MEAL_TYPES:
            if m in kl:
                return m
    return ""


def to_int(v):
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str):
        m = re.search(r"\d+", v)
        if m:
            return int(m.group())
    return 0


def clean_name(raw: str) -> str:
    """Produce a display name that passes the app's isRealRecipe filter
    (<= 6 words, no parenthetical gloss). Full name is preserved separately."""
    n = (raw or "").strip()
    n = re.sub(r"\s*\(.*?\)\s*", " ", n).strip()   # drop parenthetical gloss
    n = re.sub(r"\s*[–—-]\s*.*$", "", n).strip() if " - " in n or " – " in n else n
    n = re.sub(r"\s+", " ", n)
    words = n.split(" ")
    if len(words) > 6:
        n = " ".join(words[:6])
    return n or (raw or "").strip()


def walk(node, parent_keys):
    """Yield (recipe_dict, parent_keys) for every dict that has name + ingredients."""
    if isinstance(node, dict):
        if "name" in node and "ingredients" in node:
            yield node, parent_keys
        else:
            for k, v in node.items():
                yield from walk(v, parent_keys + [k])
    elif isinstance(node, list):
        for v in node:
            yield from walk(v, parent_keys)


def load_file_list():
    try:
        idx = json.load(open(INDEX))
        files = idx.get("recipeFiles") or []
        if files:
            return files
    except Exception:
        pass
    # fallback: any *authentic* file in the data dir
    return [os.path.basename(p) for p in glob.glob(os.path.join(DATA_DIR, "*authentic*.json"))]


def main():
    files = load_file_list()
    recipes = []
    seen = set()
    skipped_files = 0
    for fname in files:
        path = os.path.join(DATA_DIR, fname)
        if not os.path.exists(path):
            skipped_files += 1
            continue
        try:
            data = json.load(open(path))
        except Exception:
            skipped_files += 1
            continue
        cuisine = cuisine_from_filename(os.path.splitext(fname)[0])
        for r, parents in walk(data, []):
            rid = str(r.get("id") or "").strip()
            name = clean_name(r.get("name", ""))
            if not name:
                continue
            key = rid or f"{name.lower()}|{cuisine.lower()}"
            if key in seen:
                continue
            seen.add(key)
            prep = to_int(r.get("prepTime") or r.get("prep_time"))
            cook = to_int(r.get("cookTime") or r.get("cook_time"))
            total = to_int(r.get("totalTime") or r.get("total_time")) or (prep + cook) or 25
            recipes.append({
                "id": rid or key,
                "name": name,
                "full_name": r.get("name", name),
                "cuisine": r.get("cuisine") or r.get("cuisine_type") or cuisine,
                "recipe_type": infer_meal_type(r, parents),
                "difficulty": (r.get("difficulty") or "Easy"),
                "servings": r.get("servings"),
                "prepTime": prep,
                "cookTime": cook,
                "total_time": total,
                "time": total,
                "description": r.get("description") or "",
                "ingredients": r.get("ingredients") or [],
                "instructions": r.get("instructions") or r.get("steps") or [],
                "seasonings": r.get("seasonings") or [],
                "tips": r.get("tips") or ([r.get("notes")] if r.get("notes") else []),
                "fun_fact": r.get("fun_fact") or "",
                "dietary_tags": r.get("dietary_tags") or r.get("diet_tags") or [],
                "dietary_adaptations": r.get("dietary_adaptations") or r.get("dietary_options") or [],
                "alternatives": r.get("alternatives") or [],
                "source_file": fname,
            })

    out = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "count": len(recipes),
        "recipes": recipes,
    }
    with open(OUT, "w") as f:
        json.dump(out, f, ensure_ascii=False)

    cuisines = sorted({r["cuisine"] for r in recipes if r["cuisine"]})
    by_type = {}
    for r in recipes:
        by_type[r["recipe_type"] or "(none)"] = by_type.get(r["recipe_type"] or "(none)", 0) + 1
    print(f"Wrote {OUT}")
    print(f"  recipes:        {len(recipes)}")
    print(f"  files used:     {len(files) - skipped_files} (skipped {skipped_files})")
    print(f"  cuisines:       {len(cuisines)}")
    print(f"  by meal type:   {by_type}")
    print(f"  size:           {os.path.getsize(OUT)//1024} KB")


if __name__ == "__main__":
    main()
