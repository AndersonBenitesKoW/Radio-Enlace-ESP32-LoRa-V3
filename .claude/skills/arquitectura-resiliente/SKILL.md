---
name: arquitectura-resiliente
description: Garantiza la separación de responsabilidades, evita regresiones en código existente, obliga al logueo de errores en consola y asegura la resiliencia del sistema.
license: MIT
compatibility: opencode
metadata:
  idioma: es
  proposito: calidad-y-estabilidad
---

# Arquitectura Resiliente

## Qué hago (Mis funciones)

1. **Protejo el código existente**: No modifico, muevo ni reescribo funciones, scripts modulares o lógicas que el usuario ya haya validado como correctas o estables, a menos que se me pida explícitamente una refactorización.
2. **Mantengo la separación de responsabilidades**: Aseguro que cada componente o script tenga una única tarea clara (modularidad estricta), evitando mezclar lógica de procesamiento, control y visualización en un solo lugar.
3. **Obligo a mostrar errores en consola**: Configuro cada captura de excepción para que imprima un mensaje detallado en la consola (`sys.stderr`, `print` con traceback o logs visibles), facilitando la depuración inmediata del desarrollador.
4. **Garantizo resiliencia (Try-Catch / Try-Except)**: Implemento bloques de control de excepciones robustos en los puntos críticos del sistema para evitar que la aplicación o el flujo principal se caigan ante fallos inesperados.

## Cuándo usarme

- Úsame siempre que vayas a escribir nuevas funcionalidades, integrar scripts de procesamiento o modificar flujos lógicos en el sistema.
- Actívame cuando estés diseñando la estructura de manejo de errores o depurando fallos que no muestran información clara.

## Reglas de desarrollo obligatorias

1. **No regresión**: Antes de modificar un archivo, analiza qué partes ya funcionan. Tu propuesta debe integrarse de forma incremental sin alterar el comportamiento de los procesos que ya son eficientes.
2. **Depuración transparente**: Está estrictamente prohibido usar bloques de excepción vacíos (ej. `except: pass`). Cada bloque de captura debe incluir obligatoriamente una impresión clara en consola del tipo de error y dónde ocurrió.
3. **Resiliencia extrema**: Envuelve las operaciones de E/S, llamadas a módulos externos o procesamiento de datos en estructuras try-except adecuadas, retornando estados controlados en lugar de permitir el colapso del programa.
