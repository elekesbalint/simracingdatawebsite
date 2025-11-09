# F1 Track Maps

Place the exported circuit layout images in this folder so the application can render them across the dashboard, track list and overview pages.

The React app expects 24 images using the following naming convention (webp recommended for size, but png/jpg also work):

```
bahrain.webp
saudi-arabia.webp
australia.webp
japan.webp
china.webp
miami.webp
emilia-romagna.webp
monaco.webp
spain.webp
canada.webp
austria.webp
great-britain.webp
hungary.webp
belgium.webp
netherlands.webp
italy.webp
azerbaijan.webp
singapore.webp
usa.webp
mexico.webp
brazil.webp
las-vegas.webp
qatar.webp
abu-dhabi.webp
```

Feel free to use `.png` or `.jpg` files if preferred—just update the `mapImageUrl` paths in `src/data/tracks.ts` to match the chosen extension. Each file should contain the high-contrast map graphic the team provided (DRS zones, sector colors, etc.).

