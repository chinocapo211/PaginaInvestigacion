# Laboratorio de Navegación & Neurocognición — sitio web

Sitio estático (HTML + CSS + JS, sin dependencias ni compilación). Para verlo, abrir `index.html` en el navegador.
Se puede publicar directamente con GitHub Pages (Settings → Pages → rama y carpeta raíz).

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Portada: marco conceptual, líneas, personas, publicaciones, subsidios, noticias, vida del lab, contacto |
| `ribio.html` | RIBio · Marco conceptual (se abre desde el logo de RIBio) |
| `linea-ultrasonidos.html` | Vocalizaciones ultrasónicas y dinámica de la memoria |
| `linea-desorientacion.html` | Desorientación espacial e integración de trayectoria |
| `linea-navegacion.html` | Ecología del movimiento y eficiencia de navegación |
| `lineas.html` | Todas las líneas de investigación (botón "Ver todas las líneas" de la portada) |
| `linea.html?id=...` | Página de las líneas creadas desde el panel |
| `noticias.html` | Todas las noticias (botón "Ver todas las noticias" de la portada) |
| `admin.html` | Panel de administración (link "Admin" en el pie de página) |

## Idiomas (español / inglés)

El sitio arranca en español. El botón **ES / EN** del encabezado cambia el idioma y la elección se recuerda al navegar.
Cada texto está escrito dos veces, una por idioma:

```html
<span lang="es">Texto en español</span><span lang="en">English text</span>
```

Al editar un texto, cambiar ambas versiones.

## Panel de administración (`admin.html`)

Líneas de investigación, personas, noticias, publicaciones, subsidios, fotos de "Vida del lab", datos de contacto
y los recuadros amarillos de "Contenido de ejemplo" se editan desde el panel, sin tocar código.

- **Líneas destacadas:** las marcadas con ★ salen en la portada (se recomiendan 3). Si hay más líneas que destacadas,
  aparece el botón "Ver todas las líneas". Las 3 líneas originales tienen página propia escrita a mano; las nuevas usan `linea.html`.
- **Noticias:** la portada muestra solo la primera de la lista; el resto está en `noticias.html`.
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
