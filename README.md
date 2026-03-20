# WalkRL Project Page

This directory contains a static project page for the paper **“Muscle Synergy Priors Enhance Biomechanical Fidelity in Predictive Musculoskeletal Locomotion Simulation.”**

The site is designed to be deployed as a standalone GitHub Pages project (static files only). It includes:

- **`index.html`**: Main landing page with title/authors, abstract, BibTeX citation (copy button), and an embedded synchronized video comparison UI (Independent vs. Synergistic).
- **`assets/css/style.css`**: Responsive stylesheet for the landing page. No external frameworks are required.
- **`assets/js/main.js`**: Clipboard-copy helper for the BibTeX citation.
- **`assets/js/video-compare.js`**: Controller for the embedded synchronized comparison. It loads metadata from `Video_Comparison/videos.json` when available (falls back to an embedded set if the fetch is blocked).
- **`assets/images/Framework Diagram_Combined.png`**: Teaser figure used on the landing page (replace this file, or update the `src` in `index.html` if you rename it).
- **`Video_Comparison/`**: Standalone “Results Video” viewer (gallery + synchronized compare). This folder also contains `videos.json` (video metadata) and `Filename_rules.md` (how video tokens were defined).

## Customisation

1. **Results Video link**: update the `href` of the “Results Video” button in `index.html` to point to the deployed URL for `Video_Comparison/index.html` (e.g. `Video_Comparison/index.html`).
2. **Teaser image**: replace `assets/images/Framework Diagram_Combined.png` (or edit the image `src` in `index.html`).
3. **Videos metadata**: edit `Video_Comparison/videos.json` to change what appears in both the embedded compare widget and the standalone viewer.
4. **Code/Dataset buttons**: once available, replace the disabled “Code (Coming Soon)” and “Dataset (Coming Soon)” buttons in `index.html` with real links.

Notes:
- The embedded “Sync Play” uses the YouTube JS API; sync controls may be disabled when opened via `file://` (use http(s) for full functionality).

## Deploying on GitHub Pages

1. Push the repository contents (including `index.html`, `assets/`, and `Video_Comparison/`) to the `main` branch of a GitHub repository named `<username>.github.io` (or enable Pages in the repository settings).
2. Ensure the file structure remains intact (root `index.html`, plus `assets` and `Video_Comparison` folders).
3. After enabling GitHub Pages, your site will be available at `https://<username>.github.io/`.

   Standalone results viewer:
   - `https://<username>.github.io/Video_Comparison/`

## License

This project page template is provided for illustration purposes and may be used freely. If you adapt the design, please include appropriate attribution where applicable.
