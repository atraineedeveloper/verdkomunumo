# Spec-Driven Development

Esta guía define una versión ligera de Spec-Driven Development para Verdkomunumo.

## Objetivo

Antes de implementar una feature o cambio relevante, dejamos una especificación corta que responda:

- qué problema se está resolviendo;
- qué comportamiento se espera;
- qué restricciones existen;
- cómo se va a validar.

La spec no reemplaza el código ni los tests. Sirve para alinear producto, diseño, backend, frontend y QA antes de tocar la implementación.

## Cuándo usarlo

Usa una spec en `docs/` cuando el cambio tenga al menos una de estas señales:

- toca más de una capa: UI, estado, API, DB, notificaciones, permisos;
- cambia reglas de negocio;
- necesita migraciones o contratos nuevos;
- puede romper flujos existentes;
- requiere criterios de aceptación claros;
- el cambio es lo bastante ambiguo como para que “ir viendo” salga caro.

No hace falta para cambios mínimos como:

- copy tweaks;
- estilos aislados;
- fixes triviales sin impacto de comportamiento;
- refactors internos sin cambio funcional.

## Flujo recomendado

1. Crear una spec breve en `docs/specs/`.
2. Revisar huecos, contradicciones y riesgos.
3. Convertir la spec en plan técnico.
4. Implementar.
5. Derivar tests desde la spec.
6. Validar contra criterios de aceptación.
7. Si el comportamiento cambió, actualizar la spec.

## Estructura mínima de una spec

Cada spec debe responder, como mínimo:

### 1. Resumen

Qué se quiere lograr y por qué.

### 2. Alcance

Qué entra y qué no entra en esta iteración.

### 3. Reglas de negocio

Las condiciones que el sistema debe respetar siempre.

### 4. UX esperada

Qué ve y hace el usuario.

### 5. Datos y contratos

Tablas, campos, payloads, tipos, validaciones y compatibilidad.

### 6. Errores y casos borde

Qué debe pasar si hay datos incompletos, permisos insuficientes, duplicados, timeouts o estados inesperados.

### 7. Criterios de aceptación

Condiciones concretas para dar el trabajo por correcto.

### 8. Verificación

Qué tests o checks deben cubrir el cambio:

- unitarios;
- integración;
- E2E;
- accesibilidad;
- visual;
- migraciones o validaciones SQL.

## Convenciones para este repo

### Ubicación

- Guías generales: `docs/`
- Specs de features: `docs/specs/`
- Plantillas: `docs/templates/`

### Nombre de archivo

Usa nombres descriptivos en kebab-case:

- `docs/specs/comment-replies.md`
- `docs/specs/following-feed-ranking.md`
- `docs/specs/report-moderation-actions.md`

### Tamaño

Una buena spec aquí debería caber normalmente entre 40 y 120 líneas. Si empieza a parecer un documento legal, está sobredimensionada.

### Nivel de detalle

Debe ser suficiente para implementar sin adivinar reglas centrales, pero no hace falta describir cada clase o cada componente.

## Qué hace buena una spec

- Define comportamiento observable, no solo intención.
- Declara claramente exclusiones.
- Expone restricciones desde el inicio.
- Tiene criterios de aceptación verificables.
- Permite derivar tests casi de forma directa.

## Qué hace mala una spec

- Mezcla deseos vagos con decisiones obligatorias.
- Omite casos borde importantes.
- No define límites de la iteración.
- Dice “hacerlo como X” sin traducir eso a reglas concretas.
- No deja claro cómo saber si quedó bien.

## Cómo trabajar conmigo usando este flujo

El flujo más útil es este:

1. Me dices el cambio.
2. Yo redacto o completo la spec en `docs/specs/`.
3. Revisamos huecos.
4. Implemento contra esa spec.
5. Corro tests alineados a la spec.
6. Si hay desvíos, ajustamos spec o implementación de forma explícita.

## Relación con tests

La spec define el contrato. Los tests prueban que el contrato se cumple.

Ejemplo práctico:

- Spec: “las respuestas a comentarios solo permiten un nivel”.
- Implementación: UI + validación + migración.
- Tests:
  - DB rechaza respuesta a respuesta;
  - frontend no ofrece responder una reply;
  - render muestra replies solo bajo comentarios raíz.

## Regla pragmática

Si una decisión importante aparece por primera vez durante la implementación, esa decisión probablemente debió existir primero en la spec.

## Siguiente paso sugerido

Cuando abras una feature nueva, crea primero una spec usando la plantilla en [docs/templates/spec-template.md](/c:/Users/DELL/DevProjects/verdkomunumo/docs/templates/spec-template.md).
