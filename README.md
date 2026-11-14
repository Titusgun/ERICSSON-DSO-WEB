# dso-web — web interface for dso

This is only the **web interface** for **dso**, the Data Storage Optimization tool from the
Ericsson challenge at the Campor × BUILD Hackathon 2026.

**The program itself is in [Titusgun/ERICSSON-DSO](https://github.com/Titusgun/ERICSSON-DSO).**
All the work happens there: transcripts, key frames, speakers, slides, duplicates, revisions,
search, the AI-ready export, savings, offboarding and the OneDrive / SharePoint cleanup.
Setup, commands and results are described in that repository's README.

`dso` does **not** need this interface. Everything runs from the command line. The web
interface is for:

- **presenting** the results (e.g. to a jury or a site owner),
- **administration**: an overview of what has been processed, found and freed,
- **troubleshooting**: checking that `dso` works and that new files are picked up.

It only **reads** data from the local `dso` API. It stores nothing itself, changes nothing
and cannot delete anything.

## Pages

| Page | Shows |
|---|---|
| Dashboard | totals, savings per scenario (video distillation, deduplication, old revisions, offboarding) |
| Search | full-text search over transcripts and slides; a hit shows the key frame or slide, opens the recording at that moment, or the document at that page |
| Recording | a video's key frames with the transcript (and speakers) underneath, matched slides, "Play at" a time |
| Duplicates | exact copies, shared slides, older revisions with the changed slides |
| Offboarding | the dry-run report per departing employee: safe to delete vs. keep |
| Files | every file `dso` knows, with size, source and owner |

The data reloads every 10 seconds, so results from `dso watch` appear by themselves.

## Setup

Requires [Node.js](https://nodejs.org) (LTS) and a working `dso` from
[ERICSSON-DSO](https://github.com/Titusgun/ERICSSON-DSO). Keep both repositories side by side:

```bash
git clone https://github.com/Titusgun/ERICSSON-DSO.git dso
git clone https://github.com/Titusgun/ERICSSON-DSO-WEB.git dso-web
cd dso-web
npm install
```

## Run

Two terminals:

```bash
# terminal 1 - the dso API, in the dso folder
uv run dso web                 # http://127.0.0.1:5000

# terminal 2 - this interface, in the dso-web folder
npm run dev                    # open http://localhost:8080
```

**If the page says it is showing sample ("mock") data,** the `dso web` API is not running or
cannot be reached. Start it in terminal 1 and reload the page.

### Another API address

The interface calls `http://127.0.0.1:5000` by default. To use another port, start the API
with `uv run dso web --port 5001` and this interface with:

```bash
VITE_API_URL=http://127.0.0.1:5001 npm run dev           # bash / zsh
env VITE_API_URL=http://127.0.0.1:5001 npm run dev       # fish
$env:VITE_API_URL="http://127.0.0.1:5001"; npm run dev   # PowerShell
```

The `dso` API only listens on this computer (127.0.0.1) and only answers pages from
`localhost`, so the data is not reachable from the network.

## Development

```bash
npm run test       # unit tests (vitest)
npm run lint       # eslint
```

`npm run build` produces a server-rendered app (not a static folder), so for local use run it
with `npm run dev` as above.

Web page built with the help of GenAI. Main dso repo is the programm that does everything this is just a way to visualize the data. 
