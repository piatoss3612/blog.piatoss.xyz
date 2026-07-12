# Ink theme palette

```css
[data-theme="ink"] {
  /* Washi field */
  --sl-bg: #f2ebdc;
  --sl-bg-raised: #fbf7ed;

  /* Three-step sumi scale */
  --sl-text: #211f1b;
  --sl-text-muted: #5f5a51;
  --sl-muted: #9c9487;

  /* Vermillion: one visual punctuation, three UI strengths */
  --sl-accent: #b83a2c;
  --sl-accent-strong: #8f2b22;
  --sl-accent-dim: #d58576;

  /* Translucent paper cards */
  --sl-card-bg: rgba(255, 252, 244, 0.76);
  --sl-card-border: rgba(52, 47, 40, 0.22);
  --sl-card-border-dim: rgba(52, 47, 40, 0.12);

  /* Optional atmospheric depth, never a competing accent */
  --sl-indigo-wash: rgba(75, 85, 113, 0.12);
}
```

## Rationale

- **Washi field** — `--sl-bg` is a warm, fibrous cream rather than white; `--sl-bg-raised` is only one paper layer lighter, so cards feel stacked instead of backlit.
- **Sumi scale** — the text tokens move from near-black wet ink through settled gray to a pale dry-brush residue. The steps preserve hierarchy without introducing another hue.
- **Vermillion trio** — the base is close to traditional 朱 and is reserved for seals, lantern light, links, and focus. `strong` carries small text; `dim` is for quiet fills or rules, not body copy.
- **Paper cards** — translucent warm-white lets the washi grain remain visible. Neutral sumi borders replace shadows and keep the light mode materially flat.
- **Indigo wash** — the low-alpha blue-gray is only for distant mist, hover atmosphere, or layered depth; it should never appear at full opacity.

## Usage guardrail

Keep vermillion to one focal cluster per component or illustration, with no more than two visible marks in a viewport. Let negative space and ink density—not extra color—carry hierarchy.
