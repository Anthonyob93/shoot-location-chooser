# Penygroes shoot location chooser

Static website for OB Photography. Upload the contents of this folder to the root of a repository called `shoot-location-chooser`.

## GitHub Pages settings

- Source: Deploy from a branch
- Branch: main
- Folder: / (root)
- Entry file: index.html
- No build command, package installation, API key or server is required.
- Include .nojekyll and the complete assets folder.

The expected address is https://YOUR-USERNAME.github.io/shoot-location-chooser/ (replace YOUR-USERNAME).

GitHub Pages restricts sites primarily facilitating commercial transactions. Because this chooser estimates charges for a photography service, confirm suitability with GitHub before relying on Pages for business use. GitHub can store the code even if a different provider hosts the site. See https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Behaviour

Visitors choose locations and follow Google Maps links to find one-way driving mileage from Penygroes, Gwynedd. They enter that mileage themselves. Travel within 20 miles is included; excess miles are charged in both directions at £0.75 per mile. A 25-mile one-way journey adds £7.50.

Suggestions open the visitor's email application with a draft addressed to anthony@obphotography.uk. The visitor must press Send. There is no email delivery server, database or saved visitor entry in this package.

## Credits and updates

Keep the visible photo credits, credits.js, map-points.js and assets/leaflet-LICENSE.txt. Each photograph retains its stated individual licence; this repository does not grant a blanket licence over third-party material.

Edit places.js to update the curated locations. Only personally checked locations should have checked set to true. Update map-points.js for new map positions and credits.js for new photos. Upload changed files to the same paths.

The map tiles and fonts need an internet connection. Google route links open externally. All local paths are relative so the site works under a repository path or a custom domain.

This export is separate from the existing ChatGPT-hosted copy. Updates to one copy do not automatically update the other.
