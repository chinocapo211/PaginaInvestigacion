# Laboratorio de Navegación & Neurocognición — sitio web

Sitio estático (HTML + CSS + JS, sin dependencias ni compilación). Para verlo, abrir `index.html` en el navegador.
Se puede publicar directamente con GitHub Pages (Settings → Pages → rama y carpeta raíz).

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Portada: marcos conceptuales destacados, líneas destacadas, personas, publicaciones, subsidios, noticias destacadas, vida del lab, contacto |
| `marcos.html` | Todos los marcos conceptuales (botón "Ver todos los marcos conceptuales") |
| `marco.html?id=...` | Página de cada marco conceptual (por ejemplo `marco.html?id=ribio`) |
| `lineas.html` | Todas las líneas de investigación (botón "Ver todas las líneas") |
| `linea.html?id=...` | Página de cada línea de investigación |
| `noticias.html` | Todas las noticias (botón "Ver todas las noticias") |
| `noticia.html?id=...` | Página de cada noticia |
| `admin.html` | Panel de administración (link "Admin" en el pie de página) |
| `linea-ultrasonidos.html`, `linea-desorientacion.html`, `linea-navegacion.html`, `ribio.html` | Solo redirigen a la página nueva (para no romper links viejos) |

## Idiomas (español / inglés)

El sitio arranca en español. El botón **ES / EN** del encabezado cambia el idioma y la elección se recuerda al navegar.
Cada texto está escrito dos veces, una por idioma:

```html
<span lang="es">Texto en español</span><span lang="en">English text</span>
```

Al editar un texto, cambiar ambas versiones.

## Panel de administración (`admin.html`)

> **Modo maqueta (activado):** los cambios del panel se guardan solo en el navegador de quien los hace y el sitio
> los muestra ahí mismo, sin publicar ni conectar con GitHub. "Volver al contenido original" los borra.
> Para pasar a publicar de verdad en GitHub, cambiar `MODO_LOCAL = true` por `false` en `assets/js/contenido.js`.

Líneas de investigación, personas, noticias, publicaciones, subsidios, fotos de "Vida de laboratorio", datos de contacto
y los recuadros amarillos de "Contenido de ejemplo" se editan desde el panel, sin tocar código.

- **Páginas con bloques:** cada noticia, línea y marco conceptual tiene su propia página, que se arma desde el panel
  con bloques: títulos, subtítulos, textos, imágenes con epígrafe, listas, datos destacados, botones, texto resaltado
  e imagen con texto al lado.
- **Destacados por orden:** en la portada salen los primeros de cada lista: 1 marco conceptual, y la cantidad de
  noticias y de líneas que se elija en Ajustes (por defecto 1 y 3). El resto se ve con los botones "Ver todos/as".
  Las noticias nuevas se agregan arriba de la lista.
- **Mapa:** en Contacto se puede pegar el link de Google Maps (o el código de "Insertar un mapa"); el panel muestra
  cómo queda antes de guardarlo.
- El panel tiene una guía "¿Cómo funciona este panel?" que explica todo esto.
- Cada elemento del panel muestra dónde aparece en el sitio, con un link que lleva directo a él.

- Los datos viven en `data/contenido.js`. Las páginas los dibujan con `assets/js/contenido.js` en los
  bloques marcados con `data-render="..."` (el HTML que queda adentro solo se ve si los datos no cargan).
- Las personas y publicaciones tienen marcadas sus líneas de investigación: así aparecen también en la página de cada línea.
- Los cambios se guardan como borrador en el navegador. **Vista previa** muestra el sitio con el borrador.
- **Publicar** hace un commit en GitHub (con las fotos nuevas, achicadas automáticamente, en `assets/img/personas/`
  y `assets/img/vida-del-lab/`). Necesita un token de GitHub *fine-grained* con permiso **Contents: Read and write**
  sobre este repositorio; en la pestaña "Conexión con GitHub" del panel están los pasos. GitHub Pages tarda 1–2 minutos en actualizar.
- El panel es público, pero sin token no puede publicar nada.
- Sin GitHub: "Descargar archivos" baja `contenido.js` y las fotos para subirlos a mano.

Para probarlo en la computadora conviene usar un servidor local (`python -m http.server 8000` y abrir
`http://localhost:8000`), porque algunos navegadores no comparten el borrador entre páginas abiertas como archivo.

## Contenido fijo

Los textos de las páginas (marco conceptual, RIBio, descripciones de cada línea) siguen escritos en el HTML.
