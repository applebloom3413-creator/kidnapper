# Kidnapper — Chapter 1

A creepy little side-view mystery game. Kids have been going missing on Hollow Lane,
and you're the officer knocking on every door to find out who's lying.

Story, characters and the real handmade masks are by two very brave siblings.
The masks were photographed and turned into pixel art (`tools/make_masks.py`);
everything else is drawn in code. No downloads, no build step.

## Play it on this PC

```
node serve.js
```

Then open http://localhost:8643. Arrow keys walk, **A** knocks / talks, hold **B** to hurry.

## Where things live

| File | What's in it |
| --- | --- |
| `js/story.js` | Day 1: every conversation and what happens when |
| `js/talk.js` | The doorway conversation scenes and the gold text box |
| `js/street.js` | The street, the houses, walking, the sky going dark |
| `js/art.js` | The officer, the Lollipop Kid, the turtle mask, houses and props |
| `js/light.js` | Darkness, light pools, flashlight, grain and vignette |
| `js/audio.js` | The music box, drone, wind, knocks and footsteps |
| `art/` | Ozzie's and Jeffery's masks, pixelated from photos |

Add `?dev` to the URL to load the test helpers in `tools/dev.js`.
