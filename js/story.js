// story.js — Day 1, door to door. Story and characters by two siblings;
// the officer's thoughts, the extra lines, and the ending tease are filled in
// around what they wrote.
'use strict';

function newState() {
  return { day: 1, time: 0.12, visited: {}, flags: {}, lampsOn: false, flashlight: false };
}

async function runScript(fn) {
  if (G.busy) return;
  G.busy = true;
  try { await fn(); } catch (e) { console.error(e); }
  G.busy = false;
}

// every visit makes it a little darker out
function advanceTime(to) { G.state.time = Math.max(G.state.time, to); }

function visitedAll() { return ['ozzie', 'oldman', 'jeffery', 'kidnapper'].every(id => G.state.visited[id]); }

const STORY = {
  async intro() {
    G.busy = true;
    await wait(30);
    await say('you', '(Ten kids missing in three weeks. Now whole families are disappearing. Even grown-ups.)');
    await say('you', "(Chief wants every door on Hollow Lane knocked on before dark. Let's get to it.)");
    await say('you', '(Walk with LEFT and RIGHT. Press A to knock. Hold B to hurry.)');
    G.busy = false;
  },

  async door(id) {
    if (id === 'home') return STORY.home();
    if (G.state.visited[id] && id !== 'oldman') {
      await say('you', {
        ozzie: "(Ozzie already told me what she knows. I shouldn't keep bugging her.)",
        jeffery: "(The lights are off now. Jeffery's not answering again.)",
        kidnapper: "(...I'd rather not knock on that door twice.)",
      }[id]);
      return;
    }
    await STORY[id]();
    G.state.visited[id] = true;
    advanceTime({ ozzie: 0.3, oldman: 0.45, jeffery: 0.6, kidnapper: 0.72 }[id]);
    saveGame();
    if (visitedAll() && !G.state.flags.dusk) await STORY.dusk();
  },

  // ------------------------------------------------ house 1: Ozzie
  async ozzie() {
    await openTalk('ozzie', 'ozzie');
    await say('ozzie', 'Oh! Hi, Officer. Is everything okay?');
    const asked = {};
    for (;;) {
      await say('ozzie', 'What can I help you with?', { noWait: true, keep: true });
      const opts = ['Ask about the missing kids', 'Ask about the neighbors', 'Say goodbye'];
      const pick = await choose(opts);
      if (pick === 0) {
        asked.kids = true;
        await say('ozzie', "Yeah... it's awful, isn't it? First it was those two kids selling cookies door to door.");
        await say('ozzie', "Then more kids. Now I hear it's whole families. Even grown-ups.");
        await say('ozzie', "I've started locking my door at night. Just in case. Hehe... silly, right?");
      } else if (pick === 1) {
        asked.neighbors = true;
        await say('ozzie', "Mm, most people on Hollow Lane are really nice.");
        await say('ozzie', 'But the person two houses down? Kinda creepy. Always jumpy, always sweating, never looks you in the eye.');
        await say('ozzie', "Don't tell him I said that, okay?");
      } else {
        if (!asked.kids || !asked.neighbors) {
          await say('you', "(I should ask her about everything first. It's my job.)");
          continue;
        }
        break;
      }
    }
    await say('ozzie', "Be careful out there, Officer. Come back anytime. I'll make tea!");
    await closeTalk();
    await say('you', '(Two houses down from Ozzie... that would be Jeffery.)');
  },

  // ------------------------------------------------ house 2: the old man (who never answers)
  async oldman() {
    await openTalk('oldman', null, { closed: true });
    await wait(20);
    Audio.knock(3);
    await wait(90);
    await say('nobody', '...');
    Audio.knock(4);
    await wait(100);
    await say('nobody', '...');
    await say('you', "(Weird. Mr. Hollis always yells \"GO AWAY!\" before I can even knock twice.)");
    await say('you', "(His porch light's off, too. And the curtains are shut tight.)");
    G.state.flags.oldmanNoAnswer = true;
    await fadeOut(18);
    G.scene = 'street';
    await fadeIn(18);
  },

  async mailbox() {
    await say('you', "(Mr. Hollis's mailbox is stuffed full. Some letters fell into the grass.)");
    await say('you', '(How long has it been since he checked it...?)');
    G.state.flags.sawMail = true;
  },

  // ------------------------------------------------ house 3: Jeffery (moth mask, sweating)
  async jeffery() {
    await openTalk('jeffery', 'jeffery');
    Talk.twitch = 30;
    await say('jeffery', "...Officer. H-hi. Sorry. You startled me.");
    sweatDrop();
    await say('you', "(He's sweating. It isn't even warm out.)");
    await say('jeffery', "The missing kids? No. No, I haven't seen anything. I mostly stay inside.");
    Talk.twitch = 40; sweatDrop(); sweatDrop();
    await say('jeffery', "...");
    await say('jeffery', "Oh! The only weird thing is... Mr. Hollis next door stopped grabbing his mail.");
    await say('jeffery', "It's been piling up for a while now.");
    Talk.twitch = 20; sweatDrop();
    await say('jeffery', 'I-I should go. Goodnight, Officer.');
    await closeTalk();
    await say('you', '(That was the fastest anyone has ever shut a door on me.)');
  },

  // ------------------------------------------------ house 4: the Kidnapper (turtle mask, oddly calm)
  async kidnapper() {
    Audio.setMood('uneasy', 2);
    // he opens the door before you can even knock
    await openTalk('kidnapper', 'kidnapper', { noKnock: true });
    await wait(30);
    await say('kidnapper', 'Good evening, Officer.');
    await say('you', "(I didn't even knock yet.)");
    await say('kidnapper', 'The missing children. Yes. Terrible business.');
    await say('kidnapper', "You might keep an eye on the young man next door. Jeffery.");
    await say('kidnapper', 'I saw him handing some children something last week. Little packages.');
    await say('you', '(He saw that... and never reported it?)');
    await say('kidnapper', 'Would you like a slice of pie, Officer? It is fresh from the oven.', { noWait: true, keep: true });
    const pick = await choose(['No, thank you', "I'm on duty"]);
    await say('kidnapper', pick === 0 ? 'Pity.' : 'Of course you are.');
    await say('kidnapper', 'Another time, then. Do get home safe.');
    Audio.sting();
    await closeTalk();
    Audio.setMood('calm', 4);
    await say('you', '(...Something about that guy.)');
  },

  // ------------------------------------------------ the Lollipop Kid (party hat)
  async kid() {
    await openTalk('street', 'kid', { noKnock: true });
    if (!G.state.flags.metKid) {
      G.state.flags.metKid = true;
      await say('kid', "Hi, officer! Wanna see my lollipop? It's cherry.");
      await say('kid', "You're looking for the missing kids, huh? I don't know anything.");
      await say('kid', "Momma says I gotta come inside when the streetlights come on. It's not safe after dark anymore.");
      await say('kid', 'Hee hee.');
    } else {
      const lines = [
        'The cookie kids came to my house too. Momma bought two boxes. They were really good.',
        "I'm not scared of the dark. I'm only a little scared of the dark.",
        "Hee hee. You look tired, officer.",
        "When the streetlights come on, I go home. That's the rule.",
      ];
      await say('kid', lines[(G.state.flags.kidTalks = (G.state.flags.kidTalks || 0) + 1) % lines.length]);
    }
    await fadeOut(14);
    G.scene = 'street';
    await fadeIn(14);
  },

  // ------------------------------------------------ after the fourth door: night falls
  async dusk() {
    G.state.flags.dusk = true;
    await wait(20);
    await say('you', "(That's every house on the street.)");
    for (let i = 0; i < 60; i++) { G.state.time = Math.min(0.92, G.state.time + 0.004); await nextFrame(); }
    Audio.tone(110, 0.4, 'square', 0.04); Audio.tone(55, 0.6, 'square', 0.04, 0, 0.05);
    G.state.lampsOn = true;
    await wait(40);
    if (Street.kid.here) {
      await say('kid', "Streetlights! Bye, officer! Momma's calling me!");
      Street.kid.here = false;
    }
    Audio.setMood('night', 4);
    Audio.crickets = true;
    G.state.flashlight = true;
    Audio.tone(900, 0.04, 'square', 0.04);
    await say('you', "(It's getting dark. Flashlight on.)");
    await say('you', '(I should head home. None of this adds up...)');
    Street.watcher = true;
    saveGame();
  },

  // ------------------------------------------------ home
  async home() {
    if (!G.state.flags.dusk) {
      await say('you', "(Not yet. There are still doors to knock on.)");
      return;
    }
    Street.watcher = false;
    Audio.creak();
    await fadeOut(40);
    G.scene = 'home';
    Audio.crickets = false;
    Audio.setMood('silent', 2);
    await wait(60);
    await say('you', "(Jeffery says watch the old man. Oliver says watch Jeffery. Ozzie says watch the guy two doors down.)");
    await say('you', '(And Mr. Hollis never came to the door.)');
    await wait(60);
    Audio.knock(3);
    await wait(100);
    await say('you', '(...Who is knocking this late?)');
    await openTalk('home', null, { noKnock: true });
    await wait(40);
    G.state.flags.pie = true;
    Audio.sting();
    await wait(60);
    await say('you', '(Nobody here.)');
    await say('you', '(Just a pie, still warm, sitting on my doorstep. There is a note.)');
    await say('nobody', '"For our hardworking officer. -O"');
    await say('you', "(...I never told him where I live.)");
    await fadeOut(60);
    G.scene = 'end';
    G.state.day = 2;
    saveGame();
    await fadeIn(60);
    await waitPress('a', 'start');
    try { localStorage.removeItem(SAVE_KEY); localStorage.setItem('kidnapper-beat-day1', '1'); } catch (e) {}
    location.reload();
  },
};
