---
title: "How  Overwatch Landed Me A Security Conference Talk On Autonomous Red Teaming Agents"
date: "2026-10-19"
seoTitle: "Sombra: Autonomous Red Teaming Agents at STANDCON 2026"
description: "How I built Sombra, an open-source LLM red teaming harness at NUS, and presented my first conference talk on autonomous red teaming agents at STANDCON 2026."
---

So. I presented at my first con. *explosions*

this was a pretty big first for me, and it feels like a pretty suitable place to start this blog.

To the uninitiated, hi! I'm June. I gave my first conference talk at STANDCON 2026, **How to Train Your Mythos: A Field Guide on Creating Autonomous Red-Team Agents**. It was about [Sombra](https://github.com/mintyly/Sombra), an open-source harness I built at NUS for running LLM-driven red-team agents against cyber ranges.

## Why I called it Sombra

I play a lot of Overwatch, and enough that, when I needed a name for the red teaming agent I was building, I named it after Sombra, the ~~DPS~~ support character who looks like the most generic hacker in media.

Sombra felt appropriate for an agent that was supposed to explore a network and break into things. That project eventually became the subject of my STANDCON talk.

so yea! there is now an overwatch reference attached to my first conference talk, yipppppie!

## How I ended up here

After finishing my first year at NUS, I signed up for an introductory research project, *Cyberattack Experimentation and Risk Analysis*, under Anis Yusof. I had a cybersecurity background, but no previous experience building LLM agents or automated pentesting systems.

The task was to build an agent that could operate against a cyber range: a disposable lab network built to be attacked. It needed to discover machines, work out what they were running, exploit something useful, and retrieve a flag.

That is quite a lot to hide inside the word “agent”.

I started reading existing work and looking at how these systems were put together. I wanted to understand how much of an agent's performance depended on the code surrounding the model: the evidence it carried between turns, the actions it could request, and how failures affected its next decision.

## Building Sombra, an LLM red teaming harness

For this project, I use **agent** to mean the decision-making part: the model, its prompt, and the actions it can ask for.

The **harness** is the machinery that makes those requests do something. It runs the loop, owns the VM connections, executes tasks, maintains state, applies scope checks, and writes the logs.

Sombra separates those pieces so I can change a prompt, task set, or target without maintaining another nearly identical script. The project ended up with four configurations, ranging from a scripted Windows scenario to a web agent that has to discover its target. They share the same underlying engine.

| Component | What it does |
| --- | --- |
| Planner | Reads the task menu and current state, then proposes a task as JSON. |
| Engine | Parses the request and dispatches it to a registered executor. |
| Executor | Runs the task through the available transport and returns a result. |
| Range | Provides the lab machines and their actual responses. |
| State | Records observations and renders the summary for the next turn. |

Alongside that loop, an append-only log records decisions, commands, results, refusals, and the end of the run. The log can retain details that do not need to go back into every model request.

A fair amount of the talk was about what happened when these pieces went wrong. At one point, an agent spent twenty turns chasing a webshell it had never successfully uploaded, after the 404 that contradicted its assumption was no longer visible in its context.

That gave me quite a bit to talk about.

## What next?

The NUS research project has already ended, and I'm not actively working on Sombra at the moment. I'm moving on to other things for now.

I'm still interested in the problem, though, and it's something I'd like to come back to one day. There are things I'd want to revisit if I picked it up again, but I don't have immediate plans to do that.

I'm glad I took on the project. I started without much idea of how these agents were built, spent a lot of time figuring out why things weren't working, and eventually got to stand in front of a room and explain what I'd learnt. Including some of the very stupid mistakes.

Getting to give that talk was a pretty big deal to me. Whatever I end up working on next, I'm happy this was my first conference talk, and that I got to share something I'd spent so much time working on.

Thanks to Anis Yusof for supervising the project, and to the N0H4TS team for having me at STANDCON. The [code is still up on GitHub](https://github.com/mintyly/Sombra) if you'd like to have a look.

Special thanks to [Mai](https://maisie.ng), [Xiner](https://meowbreadmeow.com), and [Ray](https://hopelesscaffeineaddict.com) for giving me the confidence to submit in the first place, go check out their blogs as well :>

anyways! first conference talk done, first blogpost done. Pretty cool!
