# Coptic Hymns Library

Static site built from the `content/` folder. Hosted on Cloudflare Pages, source on GitHub.

## One-time setup

1. **Download everything from Weebly** (needs Node 18+):
   ```
   npm run migrate
   ```
   This fills `content/` with all PDFs and `public/img/` with the logo and section images.
   Check the end of the output for any download that failed.
2. **Preview** (optional): `npm run preview`
3. **Push to GitHub**: create an empty repo, then
   ```
   git init && git add . && git commit -m "Initial site" && git branch -M main
   git remote add origin https://github.com/YOUR-USER/YOUR-REPO.git && git push -u origin main
   ```
4. **Cloudflare**: Workers & Pages > Create > Pages > Connect to Git > pick the repo.
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variable `NODE_VERSION` = `20`
   The site goes live at `https://<project>.pages.dev`. Every push to `main` redeploys.

## Adding material

**Option A: GitHub web page (no setup).** Open the section folder in `content/` on github.com, click *Add file > Upload files*, drop the PDFs, commit.

**Option B: the upload form at `/admin`.** Pick a section, type the titles, choose a file, optionally add a recording link. It commits to GitHub for you.
Setup: in GitHub, create a fine-grained token (Settings > Developer settings > Personal access tokens) limited to this one repo with *Contents: Read and write*. Then in Cloudflare (Pages project > Settings > Variables and Secrets) add:

| Name | Value |
|---|---|
| `ADMIN_PASSWORD` | a long password of your choice |
| `GITHUB_TOKEN` | the token (as a secret) |
| `GITHUB_REPO` | `your-user/your-repo` |
| `GITHUB_BRANCH` | `main` (optional) |

Redeploy once after adding them.

## How content maps to pages

```
content/
  01_vespers/                  -> /vespers/   (number = order in the menu)
    _section.json              -> {"title","titleAr","image","links"}
    01_Intro - مقدمة.pdf        -> row "Intro | مقدمة" with a PDF button
    01_Intro - مقدمة~Recording.url   -> adds a "Recording" button (file contains the link)
  04_liturgy/
    01_offering-of-the-lamb/   -> a headed group on the /liturgy/ page
```
- `English - Arabic.pdf`: the ` - ` splits the two languages. Either one alone is fine.
- A number prefix (`01_`) sets order. Files without one go at the end, alphabetically.
- `Title~Label.pdf` or `Title~Label.url` attaches another button to the same row.
- A new section is just a new folder with a `_section.json`.

## Limits
Cloudflare Pages allows 25 MiB per file. Link larger recordings from Google Drive with a `.url` file.
