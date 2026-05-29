---
name: humanizer
description: Remove AI writing patterns to make documentation sound natural, specific, and human. Covers content patterns, language patterns, style patterns, and communication patterns.
---

# Humanizer

Identifies and removes AI-generated text patterns so documentation sounds natural and specific instead of generic and hollow.

## Process

1. Read the input text
2. Identify AI patterns from the lists below
3. Rewrite problematic sections
4. Do a final anti-AI pass:
   - Ask: "What makes this obviously AI generated?"
   - Answer briefly with the remaining tells
   - Revise to fix them

Ensure the revised text sounds natural when read aloud, varies sentence structure, uses specific details, and maintains the appropriate tone.

---

## Adding voice

Removing AI patterns is only half the job. Sterile, voiceless writing is just as obvious.

Signs of soulless writing:

- Every sentence has the same length and structure
- No opinions, just neutral reporting
- No acknowledgment of uncertainty or mixed feelings
- No humor, no edge, no personality
- Reads like a press release

How to add voice:

- Have opinions. React to facts, do not just report them.
- Vary sentence rhythm. Short punchy sentences. Then longer ones that take their time.
- Acknowledge complexity: "It works, but it also feels like a workaround."
- Use specific details instead of vague claims.
- Let tangents and asides appear where they fit naturally.

---

## Content patterns

### 1. Undue significance

**Phrases to remove:** stands as, testament to, pivotal, underscores, highlights its importance, reflects broader, symbolizing, setting the stage, evolving landscape, key turning point

Inflates importance without adding information. Replace with the specific fact.

> Before: "The 2021 rebranding marked a pivotal moment in the company's evolution."
> After: "The company rebranded in 2021 to target smaller teams instead of enterprise clients."

---

### 2. Credibility signals without content

**Phrases to remove:** independent coverage, major publications, leading expert, widely discussed, active social media presence

Replace vague credibility claims with specific sources.

> Before: "His work has been featured in major publications and widely discussed."
> After: "In a 2023 Wired interview, he explained why most AI tools fail after initial adoption."

---

### 3. Fake depth with -ing participles

**Phrases to remove:** highlighting, emphasizing, ensuring, reflecting, contributing, fostering, showcasing

Participial clauses that imply analysis without providing it.

> Before: "The interface uses soft colors, creating a calming experience and reinforcing simplicity."
> After: "The interface uses muted colors. The designer said the goal was to make it feel less overwhelming."

---

### 4. Marketing language

**Phrases to remove:** vibrant, rich, breathtaking, renowned, nestled, powerful, seamless, intuitive, unlock their full potential

> Before: "This powerful platform offers a seamless and intuitive experience."
> After: "The platform handles task tracking and reporting in one place, which cuts down on tool switching."

---

### 5. Vague attributions

**Phrases to remove:** experts argue, some critics, observers believe, industry reports suggest

Replace with actual sources or remove the claim.

> Before: "Experts believe this approach will transform the industry."
> After: "A 2022 McKinsey report found companies using this approach reduced costs by 18%."

---

### 6. Generic filler sections

Sections titled "challenges and future prospects" or "conclusion" with no concrete information.

> Before: "Despite its success, the product faces challenges such as scalability and user retention."
> After: "The product started losing users after the free tier was removed in late 2022."

---

## Language patterns

### 7. Overused AI vocabulary

**Words to replace:** additionally, crucial, leverage, utilize, delve into, explore, plays a role in, it is worth noting, in today's world, navigate the complexities

> Before: "Additionally, the system plays a crucial role in optimizing workflows."
> After: "The system also helps teams move faster by automating repetitive steps."

---

### 8. Copula avoidance (serves as)

**Phrases to rewrite:** serves as, acts as, functions as — when "is" works fine

> Before: "The dashboard serves as a central hub for analytics."
> After: "The dashboard is where you see your analytics."

---

### 9. Negative parallelisms

> Before: "It's not just about speed, but also about reliability."
> After: "Speed matters, but reliability is just as important."

---

### 10. Rule of three overuse

AI defaults to three-item lists. Use two or one when that is the accurate count.

> Before: "The tool improves efficiency, reduces costs, and enhances collaboration."
> After: "The tool reduces manual work and makes collaboration easier."

---

### 11. Elegant variation (unnecessary synonyms)

Using different words for the same thing to avoid repetition.

> Before: "The app loads slowly. The application also crashes under heavy use."
> After: "The app loads slowly and sometimes crashes under heavy use."

---

### 12. False ranges

> Before: "The platform supports everything from small startups to large enterprises."
> After: "The platform is used by small startups and mid-sized companies."

---

## Style patterns

### 13. Em dash overuse

Replace em dashes with commas, semicolons, or sentence breaks.

> Before: "The update improves performance — especially on older devices."
> After: "The update improves performance, especially on older devices."

---

### 14. Unnecessary bold

Do not bold product names, common nouns, or ordinary words mid-sentence.

> Before: "It integrates with **Slack**, **Notion**, and **Stripe**."
> After: "It integrates with Slack, Notion, and Stripe."

---

### 15. Inline-header lists

**Pattern to avoid:** bullet lists where each item starts with a bolded label followed by a colon.

> Before:
> - **Speed**: Faster load times
> - **Security**: Better encryption

> After: "The update improves load times and strengthens encryption."

---

### 16. Title case headings

Use sentence case for headings.

> Before: `## Product Features And Benefits`
> After: `## Product features and benefits`

---

### 17. Emojis

Remove them from documentation.

---

## Communication patterns

### 18. Chatbot artifacts

**Phrases to remove:** Here is a breakdown, Let me know if you need more details!, Certainly!, Of course!

> Before: "Here is a breakdown of the process. Let me know if you need more details!"
> After: "The process has three steps: data collection, processing, and analysis."

---

### 19. Sycophantic openers

**Phrases to remove:** Great question!, That's a really insightful observation, Absolutely!

> Before: "Great point, this is a really insightful observation."
> After: "This highlights a real limitation in the current approach."

---

## Filler and hedging

### 20. Filler phrases

**Phrases to cut:** in order to, has the ability to, is able to, due to the fact that, it is important to note that, it should be noted that

> Before: "In order to improve performance, the system has the ability to process data faster."
> After: "To improve performance, the system processes data faster."

---

### 21. Excessive hedging

**Phrases to tighten:** might potentially, could possibly, may or may not

> Before: "This might potentially lead to better outcomes."
> After: "This may lead to better outcomes."

---

### 22. Generic conclusions

> Before: "Overall, the outlook is positive and the future looks promising."
> After: "The team plans to launch a mobile version later this year."

---

## Quick reference: words to cut or replace

| Replace | With |
|---------|------|
| utilize | use |
| leverage | use |
| implement | add, build |
| facilitate | help, allow |
| comprehensive | — (just omit) |
| seamless | — (just omit) |
| powerful | — (be specific) |
| innovative | — (be specific) |
| robust | — (be specific) |
| in order to | to |
| it is worth noting | — (just state it) |
| as mentioned above | — (cut the reference) |

<!--
Source references:
- Wikipedia "Signs of AI writing" (WikiProject AI Cleanup)
-->
