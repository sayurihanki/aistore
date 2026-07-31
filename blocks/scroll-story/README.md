# Scroll Story

## Overview

The `scroll-story` block renders a cinematic editorial sequence built from sticky full-viewport chapters. Each authored row becomes one chapter with a large multi-line headline, a compact caption stack, and two floating side images that reveal with staged motion and gentle parallax.

This block is designed for storytelling sections rather than utility content. It fits brand manifestos, ingredient or sourcing narratives, product philosophy pages, and campaign interludes where the copy should feel immersive instead of grid-like.

## Live Example

The table below is a real block instance so the block library page can render an actual preview instead of only listing the field shape.

| scroll-story | | | | |
| --- | --- | --- | --- | --- |
| We go back to<br><em>basics</em>, only <em>real</em><br>ingredients. | No additive. No artifice. | In a world of shortcuts, we choose restraint.<br>No additives. No artifice. Fewer, better elements handled with care.<br>Letting nature do what it already does best. | ![Rain-washed evergreen branches](https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80) | ![Forest water reflection](https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80) |
| Water born from<br>a <em>landscape</em><br>carved for <em>thousands</em> of years. | Our foundation. Our proof. | Our journey begins deep beneath glacier valleys and mineral-rich stone.<br>Time does the filtering. Pressure does the shaping. We do the listening.<br>What reaches the surface arrives already refined by patience. | ![Moss-covered stones beside a stream](https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80) | ![Mountain lake at dusk](https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80) |
| When nature<br><em>perfects</em> something,<br>we do not alter it,<br>we <em>reveal</em> it. | Distilled, differently. | Purity is not created. It is preserved.<br>This block works best when the copy feels deliberate, sparse, and image-led.<br>Use it when you want readers to move through a point of view, not skim a list. | ![Sunlit tree canopy](https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=900&q=80) | ![Deep green forest path](https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?auto=format&fit=crop&w=900&q=80) |

## Authoring Shape

Use a 5-column table where each row is one chapter.

| Column | Purpose |
| --- | --- |
| Column 1 | Tagline rich text |
| Column 2 | Caption label |
| Column 3 | Caption body rich text |
| Column 4 | Floating image A |
| Column 5 | Floating image B |

Authoring rules:

- Author the small section label such as `Philosophy` as normal content above the block, not inside the block table.
- Multiple paragraphs in column 1 become multiple animated tagline lines.
- `<br>` line breaks in column 1 also become separate tagline lines.
- `<em>` in the tagline is preserved and styled as the editorial accent treatment.
- Multiple paragraphs or `<br>` line breaks in column 3 become staged caption lines.
- Image cells should contain real images whenever possible. If one or both image cells are empty, the block renders designed gradient placeholders instead of collapsing the layout.

## Rendering And Behavior

- Every authored row becomes one sticky chapter scene.
- Chapters alternate their image tilt and left-right emphasis so long sequences do not feel mechanically repeated.
- Floating images use `IntersectionObserver` to reveal when the chapter enters view.
- Parallax is applied with `requestAnimationFrame` and CSS custom properties rather than direct transform string rebuilding on every scroll event.
- On reduced-motion systems and narrow mobile viewports, the block disables parallax and renders the content in its final visible state.
- The block does not introduce CTA or link handling. It is intentionally narrative-first.

## Common Gotchas

- Do not put the section label in the first column. That creates an extra chapter instead of a heading above the block.
- The visual rhythm depends on short, line-broken copy. Very long paragraphs in the tagline column will feel heavy and lose the intended pacing.
- If you paste plain image URLs instead of actual images into columns 4 and 5, the block cannot render the floating media panels correctly.
- Caption body formatting is flattened into reveal lines, so this is not the right block for deeply nested rich text structures.

## DA Library Metadata Table

Use this table for the DA library entry at `/.da/library/blocks/scroll-story`.
Do not paste the block authoring rows above into the library metadata doc.

| library metadata | |
| --- | --- |
| name | scroll story |
| description | Cinematic editorial storytelling block with sticky chapters, staggered copy reveals, floating side images, and gentle parallax. |
| searchtags | scroll story, narrative, editorial, manifesto, philosophy, storytelling, parallax, immersive, campaign, image-led |
