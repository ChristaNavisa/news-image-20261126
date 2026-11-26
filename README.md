# THE WORLD TODAY — 26 November 2026

[![News Image](https://make.fun/badge/news-image-20261126.svg)](https://make.fun/bounty/news-image-20261126)
[![Rank](https://make.fun/badge/news-image-20261126/ChristaNavisa/news-image-20261126/rank.svg)](https://make.fun/bounty/news-image-20261126)
[![Reward](https://make.fun/badge/news-image-20261126/ChristaNavisa/news-image-20261126/reward.svg)](https://make.fun/bounty/news-image-20261126)

A newspaper front page that sums up Thursday 26 November 2026 in one
image: 44 stories, all first reported on 26 November 2026 and verified
against live news sources that day.

## The day at a glance

- **Trade war:** the Trump administration proposes new tariffs on 14
  trading partners, including China, the EU, Japan and India; markets slide.
- **Energy:** Houthi forces claim a strike on Saudi Arabia's Ras Tanura
  refinery; Brent crude tops $94.
- **New York:** the 100th Macy's Thanksgiving Day Parade is postponed by
  severe weather and moved to Saturday 28 November.
- **Around the world:** a pinned world map and a two-column grid carry 41
  more stories from every continent — US growth at 4.3%, Pakistan's first
  astronaut joining China's space station, a Europe-Japan probe reaching
  Mercury, India's Constitution Day, Thanksgiving football, and more.

## How it is drawn

`main.ts` (Node 22, standard library only) renders the whole page with
its own 5x7 bitmap font and its own PNG encoder — no image libraries,
no network, fully deterministic. Run it with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

It writes `entry.png` (1024x1024, under 1 MiB), byte-identical on every run.

Revision note: after a first visual check, the small deck text under each
story headline was darkened (grey 138 to 85) so it stays legible at small
sizes — the layout itself was unchanged.
