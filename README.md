# Road of Life

A mobile-first endless runner built with HTML Canvas, CSS, and vanilla JavaScript.

## Play locally

Open `index.html` in a browser to play. For testing install and offline support, serve the folder from `localhost` or another HTTPS origin.

## Deploy to GitHub Pages

The included GitHub Actions workflow deploys the repository root to GitHub Pages whenever a commit is pushed to `main`.

1. In the repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
2. Push a commit to `main`, or run the **Deploy to GitHub Pages** workflow from the **Actions** tab.
3. GitHub will show the published site URL under **Settings → Pages**.

The app uses relative asset and service-worker paths, so it works from a project Pages URL such as `https://username.github.io/road-of-lyfe/`.

## Controls

- Swipe left/right or use the on-screen arrows on touch devices.
- Press **A / D** or **← / →** on a keyboard.
- Press **Enter** to start or restart.

## Game design

See [spec.md](./spec.md) for the game design and technical specification.
