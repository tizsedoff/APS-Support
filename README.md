# APS Support

Centro de soporte de APS Developer. Atiende consultas sobre **APS Intelligence** y sobre los proyectos web de **APS Developer**.

## Archivos

- `index.html`: estructura y contenido (preguntas frecuentes, planes, contacto).
- `styles.css`: colores de APS Intelligence, con APS Developer como marca principal. Incluye animaciones de scroll, tilt 3D y logo 3D.
- `script.js`: revelado al hacer scroll, barra de progreso, interacciones 3D, filtros de preguntas y envío del formulario.
- `assets/logo-compact.png`: isotipo de APS Intelligence.

## Uso

No necesita build ni dependencias. Abrí `index.html` en el navegador o publicá la carpeta en cualquier hosting estático.

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin animaciones si el sistema lo pide.
- Las animaciones 3D de puntero solo se activan en dispositivos con `hover`.
- Sin frameworks ni librerías externas.

## Pendiente

- Logo de APS Developer (hoy se muestra el nombre escrito).
- Confirmar precios de planes antes de publicar.
- Revisar las respuestas de la sección APS Developer.

## Asistente con IA (Gemini)

- `api/chat.js`: función serverless que llama a Gemini. La clave nunca llega al navegador.
- `chat-widget.js`: burbuja y panel del asistente. Si no sabe o falla, ofrece WhatsApp y correo.

Variables de entorno (configurarlas en el hosting, por ejemplo Vercel):

- `GEMINI_API_KEY`: obligatoria. Sin ella, el asistente responde con la derivación a WhatsApp/correo.
- `GEMINI_MODEL`: opcional. Por defecto `gemini-3.8-flash`. Verificar el nombre vigente en la documentación de Gemini antes de usarlo.

Límites: mensajes de hasta 600 caracteres, historial de 8 mensajes, respuestas de hasta 400 tokens y 15 s de timeout.
