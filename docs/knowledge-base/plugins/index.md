---
layout: doc

title: Plugins
outline: deep
---

# Plugins

[[toc]]

## Pre plugin
```mermaid
flowchart LR
  options --> generate
```

<style>
.legend-grid {
	display: grid;
	grid-template-columns: max-content max-content;
	grid-column-gap: 1rem;
}

.legend-rect {
	display: inline-block;
	width: 1rem;
	height: 1rem;
	border-radius: 1rem;
	border: 1px solid var(--vp-c-brand-dark);
	vertical-align: middle;
	margin-right: 0.5rem;
}
</style>

<div class="legend-grid">
	<div style="grid-column: 1; grid-row: 1">
		<span class="legend-rect" style="background: var(--red)"></span>hookFirst
	</div>
	<div style="grid-column: 1; grid-row: 2">
		<span class="legend-rect" style="background: var(--vp-c-brand)"></span>hookForPlugin
	</div>
	<div style="grid-column: 1; grid-row: 3">
		<span class="legend-rect" style="background: var(--green)"></span>hookParallel
	</div>
	<div style="grid-column: 2; grid-row: 1">
		<span class="legend-rect" style="background: var(--yellow)"></span>hookSeq
	</div>
</div>

```mermaid
---
config:
  layout: elk
---
flowchart
  classDef default fill:#e1e1e1, color:#000;
  classDef hookFirst fill:#ff6565,stroke:#000;
  classDef hookForPlugin fill:#f58517,stroke:#000;
  classDef hookParallel fill:#5bff89,stroke:#000;
  classDef hookSeq fill:#ffee55,stroke:#f00;

  buildEnd("buildEnd"):::hookParallel
  click buildEnd "#buildend" _parent

  buildStart("buildStart"):::hookParallel
  click buildStart "#buildstart" _parent

  resolvePath("resolvePath"):::hookForPlugin
  click resolvePath "#resolvePath" _parent

  resolveName("resolveName"):::hookForPlugin
  click resolveName "#resolveName" _parent

  safeBuild
--> setup
--> read
--> clean
--> pre

buildStart
--> createBarrelFiles
--> processFiles
--> post
--> buildEnd
--> clear

subgraph plugin[ Plugin x ]
pre
.-> buildStart

name
options
pre
post
context
resolvePath
resolveName
buildEnd
buildStart
end
```

```mermaid
flowchart LR
  orderFiles
  --> processFile
  .-> getSource
  .-> write
  .-> processFile
```
