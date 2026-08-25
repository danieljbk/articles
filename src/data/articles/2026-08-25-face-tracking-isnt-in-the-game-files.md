---
title: "The face tracking isn't in the game files"
description: "Could you extract a life sim's character creator and face tracking and repackage them as a standalone VTuber face cam?"
pubDate: 2026-08-25
tags:
  - unreal-engine
  - streaming
  - face-tracking
  - reverse-engineering
draft: false
---

The facial capture in inZOI is not inZOI's technology. It is Apple's ARKit, running on an iPhone's TrueDepth camera, streamed to the PC over Wi-Fi by a free Epic app called Live Link Face, and arriving as 52 floating-point numbers. The game is the receiver. Krafton wrote the part that takes those 52 numbers and drives a face; Apple wrote the part that looks at yours.

That single fact reorders the whole question. If the goal is to lift the character creator and the face tracking out of a purchased copy and repackage them as a standalone webcam replacement for streaming, the file extraction is not the efficient path — it is the path that acquires the least transferable component through the most difficult and most legally exposed method, while the component that looks like the hard part is a free download.

## Where this came from

The thought is an obvious one for anyone who has seen a modern life sim's character creator: a face that good, driven live by your own expressions, is a better facecam than a webcam pointed at your actual face. Realistic-avatar streaming looks like where the category is heading, and the fastest route to a prototype looks like the one where somebody has already built and shipped the hard parts — you own a copy, the assets are sitting on your disk, so strip out the simulation and keep the two subsystems you want.

The proposal has a specific shape worth stating precisely, because each clause fails for a different reason: run *only* the character creator and the tracking, drop the rest of the game, and make it *efficient*.

## What the game is actually doing when it tracks your face

ARKit's face tracking produces a standard 52-channel blendshape vector — `jawOpen`, `eyeBlinkLeft`, `mouthSmileRight`, and 49 others, each a number between 0 and 1 describing how much of that expression is currently on your face. This is an Apple-defined standard, not a per-game invention, and it has become the interchange format for the entire facial-animation industry.

Live Link Face, Epic's free iOS app, does the capture and ships that vector over the local network using Unreal's Live Link protocol. Krafton's implementation keeps the stream local — the data goes phone to PC, nothing to a server. Webcam support without an iPhone has been stated as planned rather than shipped.

So the extraction target decomposes like this:

| Component | Where it lives | Can you get it out of the game? |
|---|---|---|
| Face tracking model | Apple's OS, on the phone | Not in the game at all — download the app |
| 52-blendshape protocol | Public standard | Not in the game at all — it's documented |
| Network receiver | Compiled into the game's executable | No, and you'd reimplement it in an afternoon |
| Character rig, skin, hair, materials | Cooked asset containers | Only by defeating encryption; also the one part you can't use |
| Creator UI and slider-to-morph logic | Compiled into the executable | No |

The two rows you *want* are the two rows that are free elsewhere. The row that requires the extraction is the row you cannot legally ship, stream, or even show.

## Why "just the character creator" is not a subset you can carve out

There is no seam to cut along. A modern Unreal Engine 5 title ships as one executable plus cooked asset containers — `.pak` files, or the newer IO Store `.utoc`/`.ucas` pairs. The split between them is not "features" versus "the rest of the game." It is **data versus behavior**.

Meshes, textures, materials, and animation curves are data, sitting in the containers. Everything that *does* something — the character creator's UI flow, the mapping from a slider position to a set of morph targets, the Live Link receiver, the rendering setup that makes the skin look like skin — is compiled C++ and Blueprint bytecode bound to the game's own classes inside the executable. There is no build target called "character creator" waiting to be extracted, because the character creator is a mode inside one monolithic application.

The practical consequence is the whole answer. Even granting a perfect extraction, you do not end up with a smaller version of the creator. You end up with a folder of meshes and textures and a blank project, and you now have to write the parameter system, the morph blending, the shading, the tracking receiver, and the streaming output yourself. At which point you have built the entire tool and merely sourced the art dishonestly — the exact inversion of the efficiency the plan was chasing.

There is also a lock on the door before any of that. Those containers are typically AES-encrypted with the key embedded in the executable. Recovering it is circumvention of a technological protection measure, which is a separate legal question from copying, and one where personal, non-distributed use is not a recognized exception.

## The part that is genuinely valuable, and its free equivalent

The instinct that the character creation is where the value sits is correct. Building a creator whose output looks good *across the entire parameter space* is a hard problem, and it is an art-direction problem more than an engineering one. Anyone can expose 250 sliders; making every combination of them produce a face that doesn't fall into the uncanny valley takes an enormous amount of authored corrective work.

That problem has a free solution, and it happens to be the one the industry standardized on. MetaHuman is Epic's photoreal human system, its facial rig is aligned to the same 52 ARKit blendshapes, and in 2025 Epic relicensed it: free below $1 million in revenue, and — the change that matters here — usable outside Unreal Engine entirely, in Unity, Godot, Blender, or Maya, including commercially.

Read that against the plan. The proposal was to break encryption to obtain a rig you can never show anyone, in order to avoid using a rig that is free, better documented, legal in a commercial product, and natively compatible with the exact tracking data you were going to feed it.

## What a standalone version actually looks like

Every layer of this has a licensed, documented, free option, and the interfaces between layers are public standards. That is why the tool is buildable by one person and why none of it needs the game.

**Tracking.** Either an iPhone running Live Link Face, which gets you Apple's depth-camera quality, or a plain webcam running Google's MediaPipe Face Landmarker, which detects 478 3D landmarks and emits the *same* 52 ARKit-aligned blendshape scores in real time on ordinary hardware. Both paths converge on one 52-float vector, which is the entire reason this is tractable — swapping tracking backends changes nothing downstream.

**Rig.** MetaHuman, or a scanned custom head, or Character Creator 4. ARKit-aligned rigs are the norm, so the vector maps one-to-one.

**Render.** Unreal 5 if you want maximum fidelity. Unity, or a custom WebGPU renderer, if you want to control the cost.

**Output.** Spout on Windows hands a GPU texture to OBS with no copy back through system memory; NDI does the same across a network; an OBS virtual camera then presents the result to Discord or Zoom as an ordinary webcam. Existing open-source projects already wire exactly this together.

The game gives you none of these interfaces. It is a closed box that happens to contain a nice-looking head.

## The efficiency constraint nobody mentions

"Really efficient" is the requirement that actually binds, and it has nothing to do with which subsystems you strip out.

A photoreal head — subsurface-scattered skin, strand-based hair, eye refraction — is expensive to render, and on a streaming machine it does not get the GPU to itself. It runs alongside the game being streamed *and* the encoder. That contention, not tracking quality, is why the VTuber category is dominated by cheap stylized 2D and low-poly 3D models. The realistic tier has been technically available for years; it costs frames in the game you are actually playing.

Which means the real design work is budget engineering, and it is the same work whether the assets came from a game or from MetaHuman:

- Render the avatar at facecam size. A 512×512 or 720p portrait, not a full-screen scene. The output is a box in the corner.
- Cap the avatar's framerate independently of the game's. Faces are legible at 30fps; a shooter is not.
- Move the renderer to a second machine and bring the result in over NDI. This is what production setups do, and it makes the constraint disappear entirely.
- Cut what a facecam never shows. No environment, no full-body sim, no dynamic lighting rig — one head, one fixed key light, an alpha channel.

## Why "it's just for me" doesn't survive contact with streaming

The personal-use framing is the standard mitigation for this kind of project, and this is the one application where it structurally fails.

A facecam is broadcast by definition. The entire purpose of the tool is to put the rendered asset in front of an audience, recorded, clipped, and archived. There is no version of "I only use it privately" that holds when the output is a public video stream — every viewer sees the extracted asset, continuously, as the centerpiece of the frame. The use case and the mitigation are mutually exclusive.

A Steam purchase licenses you to run the game, not to reuse its contents. Nobody is going to pursue one person doing something offline, and that is worth saying plainly rather than pretending otherwise. But the moment the thing does its job, it is no longer offline — and the project can never become a product, be shared, or be shown, which for a streaming tool means it can never do anything at all.

## What this leaves open

The judgment that realistic-avatar streaming is where the category goes looks sound, and it survives everything above. What the survey changes is *where the difficulty is*. The full stack — capture, rig, render, output — is free, legal, and documented today. No part of it is gated on capability. It is gated on assembly: five tools, a phone or a webcam, a shader budget, and a day of wiring that a non-technical streamer will never do.

That is a packaging problem, not a technology problem, and packaging problems are the ones that make products. The open question is not whether the pipeline can exist but whether a one-click version of it can hit a GPU budget low enough to run beside a real game.

The other live branch avoids 3D entirely. Neural portrait reenactment drives a single still image with a captured performance rather than rigging and rendering a mesh, which sidesteps the entire art pipeline — no rig, no shading, no creator UI. Whether that class of model can hit streaming latency on a consumer card while a game is running is the question that decides which of the two branches the realistic tier actually arrives on.

## Sources

- [Facial Capture in inZOI](https://gamerant.com/inzoi-how-use-facial-capture-live-link-setup/) and [the setup guide](https://game8.co/games/inZOI/archives/504540) — that the feature is Live Link Face over Wi-Fi from an iOS device, with webcam support stated as planned rather than shipped.
- [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) — 478 3D landmarks plus 52 blendshape scores from a webcam in real time.
- [MetaHuman licensing, 2025](https://www.cgchannel.com/2025/06/you-can-now-sell-metahumans-or-use-them-in-unity-or-godot/) and [the license itself](https://www.metahuman.com/license) — free under $1M revenue, usable in any engine or DCC, commercially.
- [MetaHuman facial rig and ARKit alignment](https://medium.com/@Jamesroha/metahuman-5-6-5-7-pipeline-reference-170d302b078e) — the 52 ARKit channels mapped as semantic inputs.
- [OWL VTuber Studio](https://github.com/Off-World-Live-Collaborative/VTuberStudio) — an existing open-source Unreal pipeline doing MediaPipe/VMC tracking into MetaHumans with Spout and NDI output.
