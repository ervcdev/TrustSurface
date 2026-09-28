# Trust Surface — Pitch de trabajo

Documento vivo — lo vas ajustando a medida que el build avanza. El copy en inglés (blockquotes) está listo para usar tal cual en el post de X, la grabación o la submission — es lo que va a leer el jurado. Las notas en español son para vos. Las partes marcadas **[AJUSTAR]** dependen de datos que todavía no existen (números reales del gate, links, hallazgos concretos).

---

## One-liner (tagline de DoraHacks / bio del post)

> Trust Surface shows you the evidence behind a tokenized asset's market — not a score someone made up.

Alternativa más técnica:

> Five independent evidence checks per tokenized real-world asset, each backed by the raw CoinMarketCap API response behind it. No black-box trust score.

---

## El problema

> Tokenized real-world assets are growing fast, but there's no independent way to check whether the market behind a token is real — deep, covered by more than one issuer, properly documented — or thin and concentrated. Allocators and researchers are left trusting a single number, or trusting nothing at all.

---

## La solución

> Trust Surface pulls five independent signals per asset from CoinMarketCap's Real World Assets API — token-price dispersion, liquidity concentration, issuer exposure, metadata completeness, and exchange coverage — and shows each one next to the raw API call that produced it. No composite score. If a signal can't be computed for an asset, it says "not computable," never a guess.

---

## Por qué esto y no otro explorador de RWA

La trampa obvia de este track es una tabla ordenable de "acá están los activos tokenizados" — eso ya lo hace CoinMarketCap. Trust Surface no ordena por "mejor" o "peor": muestra la evidencia y deja que la persona decida qué le importa a ella. Esa es la diferencia entre un explorador y una herramienta de investigación, y es el argumento que sostiene el "usefulness" del rubric.

---

## Test de contraparte — por qué el API de CMC específicamente

> Swap this for any generic market-data API and the product stops working — there's no comparable dataset of tokenized-asset issuers, per-token breakdowns, or metadata completeness anywhere else.

**[AJUSTAR]** si terminaron integrando `/issuers` y `/issuers/list`, esta es la línea más fuerte que tienen para "uso interesante del API" — casi nadie en el track los va a haber encontrado, porque no aparecen en ninguna página promocional de CMC, solo en la referencia técnica completa.

Endpoints usados — cerrar la lista final antes de escribir la reflexión:
- `/v5/real-world-assets/map`
- `/v5/real-world-assets/info`
- `/v5/real-world-assets/assets/list`
- `/v5/real-world-assets/quotes/latest`
- `/v5/real-world-assets/issuers/list` **[AJUSTAR: confirmar si quedó integrado]**
- `/v5/real-world-assets/issuers` **[AJUSTAR: confirmar si quedó integrado]**

---

## Guión de demo (90 segundos, para la grabación)

1. **(0:00–0:15)** Abrir en Explore. *"This is Trust Surface — evidence for tokenized real-world assets."* Mostrar la grilla filtrable por categoría.
2. **(0:15–0:40)** Entrar al perfil de un asset con dispersión o concentración interesante. Abrir el raw-response drawer de una card — *"every number here traces back to an actual CMC API call, right here."*
3. **(0:40–1:10)** Ir a Compare con dos assets — uno con buena cobertura de issuer, otro con metadata incompleta. *"This is exactly what a single trust score would hide."*
4. **(1:10–1:30)** Cerrar en la página de metodología — *"the weights and formulas are public, on purpose."*

**[AJUSTAR]** una vez que sepan qué par de assets se ve mejor en Compare, nombrarlos acá para no improvisar en la grabación.

---

## Borrador del post de X

> Built Trust Surface for #BuildwithCMC — an evidence layer for tokenized real-world assets. Five checks per asset (price dispersion, liquidity concentration, issuer exposure, metadata completeness, exchange coverage), each backed by the raw CMC API call behind it. No invented trust score.
>
> Demo: [LINK]
> Repo: [LINK]
> Track: Real World Assets

**[AJUSTAR]** agregar los links del demo y del repo antes de publicar.

---

## Reflexión (requisito de la submission — esqueleto, no relleno)

**What the API enabled:**
- **[AJUSTAR]** El hallazgo de los endpoints de issuer, si terminó integrado — es genuino y vale la pena nombrarlo con precisión, no en general.
- **[AJUSTAR]** Cualquier otro hallazgo real del build — ej. qué tan completa resultó la cobertura de tokens por asset una vez corrido el gate.

**Where it fell short:**
- **[AJUSTAR]** Completar con lo que realmente encuentren — huecos de cobertura, campos vacíos, límites de tier. Un jurado nota la diferencia entre una queja específica y una de relleno genérico, así que no conviene escribir esta sección hasta tener algo concreto que decir.
