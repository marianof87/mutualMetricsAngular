# HUMAN-WEEXPECT — Metrix AI

> **PLANTILLA PARA COMPLETAR Y FIRMAR — Mariano Capella.**
> Este archivo todavía **no** es el dossier definitivo. Cuando esté completo y firmado se deposita como
> `HUMAN-WEEXPECT.md` y recién ahí el sistema permite crear el proyecto.

---

## Cómo completarla (leer antes de escribir)

- **Ninguna IA puede completar ni firmar estas respuestas.** Las completás vos (humano). Se puede hacer hablando y que alguien transcriba, pero el contenido tiene que ser tuyo.
- Gramática estricta de historias: `As <rol>, I <hago algo concreto>, so that <el resultado que realmente quiero>. [ID]` — el armazón en inglés lo lee una máquina; el contenido va en castellano.
- De **3 a 7 historias por rol** (menos de 3: no entendemos el rol; más de 7: la v1.0 se agranda de más). Verbos concretos, sin listas de funcionalidades, y cada historia termina en un resultado que el rol puede confirmar que pasó.
- Tres preguntas para destrabarlas: (1) lo primero que harías el día que esto exista; (2) qué hacés hoy a mano que esto debería absorber; (3) qué mirarías cada mañana o cada vez que entrás.
- Al final de cada historia poné entre corchetes a qué id responde (`[VIS-*]`, `[OBJ-*]`, `[MVP-1/2/3]`). Si una historia no responde a ninguno, decilo: probablemente falta un elemento fundacional.
- **§Felt-quality es la sección por la que existe este documento**: barras crudas y específicas, con tus palabras — no las suavices.
- **§Signature**: la línea `attestation` va en inglés, textual, sin cambiarle una coma. Contá cuántas filas escribiste o reescribiste vos y poné ese número (tiene que ser ≥ 1). Un borrador sin tocar o con 0 filas queda `UNSIGNED`.

---

## Referencia rápida — de qué se trata el producto

Para que puedas citar a qué parte responde cada historia. Sale de la visión fundacional ya escrita.

| id | Elemento |
|---|---|
| `VIS-1` | Metrix AI es una IA que ayuda a un dueño de negocio a tomar decisiones de **margen y precio**. |
| `VIS-2` | No es una calculadora: aporta el número que el dueño **no podía calcular solo**. |
| `OBJ-1` | Frontera gratis/pago: es **gratis** si el dueño aportó todos los números; es **pago** si Metrix AI aportó uno que él no tenía. |
| `OBJ-2` | **Honestidad antes que precisión**: un intervalo con su causa y una acción, nunca un número falso con dos decimales. |
| `MVP-1` | **T1** — margen real por unidad después de comisión, merma, flete e IVA; punto de equilibrio; piso de precio por SKU; traslado de una suba del proveedor. |
| `MVP-2` | Calculadora interactiva gratuita como puerta de entrada, con un informe que se desbloquea dejando un contacto. |
| `MVP-3` | **T2** (más adelante, y solo si se mide bien) — curva de demanda estimada con intervalo de confianza. |

---

## §Roles

¿Quiénes son los humanos que van a tocar Metrix AI en la versión 1.0? Corregí, agregá o borrá filas.

| Role | Answered by | Relationship |
|------|-------------|--------------|
| Dueño/a de un negocio (el cliente final) | {nombre del dueño real que respondió} | daily driver |
| Mariano — lead del producto | Mariano Capella | daily driver |
| {¿hay un tercero? contador, encargado de compras, vendedor} | {persona} | {occasional / one-time} |

> **Vale la pena el esfuerzo extra**: si podés contestar la sección "Dueño/a de un negocio" con un dueño
> real al lado —aunque sea media hora por teléfono— este dossier vale diez veces más. Si no se puede,
> contestá vos como su mejor representante y dejá anotado que es una aproximación.

---

## §Stories

### Dueño/a de un negocio

- As dueño de un negocio, I cargo el costo, la comisión y el precio de lista de un producto, so that veo si ese producto me deja plata o me la saca. [MVP-1]
- As dueño de un negocio, I pruebo un descuento del 10%, so that sé cuántas unidades más tengo que vender para no perder margen. [MVP-1]
- As dueño de un negocio, I cargo la suba que me pasó el proveedor, so that sé cuánto tengo que mover el precio y a partir de cuándo. [MVP-1]
- {tu historia}. [{ID}]
- {tu historia}. [{ID}]

### Mariano — lead del producto

- As lead del producto, I {…}, so that {…}. [{ID}]
- As lead del producto, I {…}, so that {…}. [{ID}]
- As lead del producto, I {…}, so that {…}. [{ID}]
- {tu historia}. [{ID}]

---

## §Felt-quality

**Esta es la sección por la que existe todo este documento.** Contestá las dos preguntas, por rol, con tus
palabras — no las suavices. Cuanto más específica y más cruda la respuesta, mejor sirve.

Estas respuestas quedan como un eje del tablero de calidad que **solo vos podés poner en verde**, después
de usar el producto con datos reales. Ningún test automático lo puede aprobar.

### Dueño/a de un negocio

- **Refuse-to-use bar** (qué te haría no volver a abrirlo): {…}
- **Workable bar** (qué se siente cuando funciona): {…}

### Mariano — lead del producto

- **Refuse-to-use bar**: {…}
- **Workable bar**: {…}

---

## §Demo-scene

Una escena observable por rol — la escena contra la cual vas a juzgar si la v1.0 está lista. Formato:

`I open <qué abro>, I see <qué veo>, I complete <qué logro> in ≤ <N> steps.`

### Dueño/a de un negocio

- I open {la calculadora}, I see {…}, I complete {…} in ≤ {N} steps.

### Mariano — lead del producto

- I open {…}, I see {…}, I complete {…} in ≤ {N} steps.

---

## §Signature

Una fila cuenta como HUMANA solo bajo esta firma. Un borrador entregado sin tocar es **no firmable**:
`rows-authored-or-rewritten: 0` o un firmante de ejemplo lo dejan como `UNSIGNED`.

Contá cuántas filas escribiste o reescribiste vos y poné ese número.

- signed-by: Mariano Capella
- signed-at: {AAAA-MM-DD}
- rows-authored-or-rewritten: 0
- attestation: I read every row; the rows counted above I authored or deliberately rewrote myself.

> ⚠️ **La línea `attestation` va en inglés, textual, sin cambiarle una coma** — la lee una máquina que
> compara carácter por carácter. Traducida, el sistema rechaza el dossier aunque esté todo lo demás bien.
> Dice: *"Leí todas las filas; las que conté arriba las escribí o las reescribí deliberadamente yo."*
> (Ya está puesta arriba: no la toques, solo cambiá la fecha y el número.)

---

## §Waiver — la salida sancionada para un proyecto sin humanos

Solo para un producto **sin ninguna superficie humana** en la v1.0 (una librería headless, una API que
solo consumen máquinas). **No es el caso de Metrix AI** — dejalo en `false`.

- waived: false
- waiver-rationale: {n/a — Metrix AI tiene usuarios humanos}
- waiver-signed-by: {n/a}
- waiver-signed-at: {n/a}

---

## Qué pasa cuando lo devolvés

1. Se deposita firmado como `HUMAN-WEEXPECT.md` junto a la visión fundacional.
2. Se crea el proyecto Metrix AI en su propia raíz sellada, con vos como lead.
3. Tus barras de "no lo uso / así sí funciona" quedan como un eje del tablero que ningún test puede
   aprobar por vos.

**Dos decisiones siguen siendo tuyas y de nadie más**, y no dependen de este documento: la decisión de
propiedad intelectual sobre el material académico de referencia (son cinco autores y no hay licencia), y
los precios y niveles del producto.
