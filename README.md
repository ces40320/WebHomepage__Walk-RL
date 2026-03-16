# WalkRL Project Page

This directory contains a static project page for the paper **“Muscle Synergy Priors Enhance Biomechanical Fidelity in Predictive Musculoskeletal Locomotion Simulation.”**

The site is designed to be deployed as a standalone GitHub Pages project or hosted on any static web server. It includes:

- **`index.html`**: the main HTML page with sections for title, authors, affiliations, action buttons, a highlight card linking to the WalkRL comparison viewer, abstract, teaser image, BibTeX citation and acknowledgements.
- **`assets/css/style.css`**: a simple responsive stylesheet. No external frameworks are required.
- **`assets/js/main.js`**: a small script to enable clipboard copying of the BibTeX citation.
- **`assets/images/teaser-placeholder.svg`**: a placeholder graphic for the teaser image. Replace this file with your own figure.

## Customisation

1. **Comparison site URL**: replace `YOUR_COMPARISON_SITE_URL_HERE` in `index.html` with the actual URL of your interactive video comparison tool.
2. **Teaser image**: replace `assets/images/teaser-placeholder.svg` with a suitable figure from your paper. Use the same filename or adjust the `src` attribute in `index.html` accordingly.
3. **Code and dataset links**: update the “Code (Coming Soon)” and “Dataset (Coming Soon)” buttons once these resources are available.

## Deploying on GitHub Pages

1. Push the contents of the `walkrl_project_page` directory (including all subfolders) to the `main` branch of a GitHub repository named `<username>.github.io` or enable Pages in the repository settings.
2. Ensure that the file structure remains intact (e.g., `index.html` in the root and `assets` subfolders).
3. After enabling GitHub Pages, your site will be available at `https://<username>.github.io/`.

## License

This project page template is provided for illustration purposes and may be used freely. If you adapt the design, please include appropriate attribution where applicable.