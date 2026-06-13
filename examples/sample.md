# Copyparty Markdown Viewer — Sample

This file exercises the plugin's features inside the **real copyparty** markdown
viewer.

## Text and code

Some **bold**, _italic_, `inline code`, and a [link](https://github.com/9001/copyparty).

```js
function greet(name) {
  return `hello ${name}`;
}
greet("world");
```

## Math (KaTeX)

Inline: $a^2 + b^2 = c^2$ and a block:

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## Task list

- [x] Render markdown
- [x] Math
- [ ] Take over the world

::: tip Pro tip
Diagrams below are rendered client-side by the plugin.
:::

## Mermaid

```mermaid
flowchart LR
  A["Open .md in copyparty"] --> B["Plugin detects view"]
  B --> C{"Has diagrams?"}
  C -->|Yes| D["Upgrade blocks"]
  C -->|No| E["Done"]
```

```mermaid
sequenceDiagram
  participant U as User
  participant P as Plugin
  U->>P: open sample.md
  P-->>U: rendered document
```

## PlantUML

```plantuml
@startuml
Alice -> Bob: Hello
Bob --> Alice: Hi!
@enduml
```

## Table

| Feature | Status |
|---------|--------|
| Mermaid | yes    |
| PlantUML| needs server |
| Math    | yes    |
