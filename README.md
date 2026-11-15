# Laboratorio de Navegación & Neurocognición — sitio web

Sitio estático (HTML + CSS + JS, sin dependencias ni compilación). Para verlo, abrir `index.html` en el navegador.
Se puede publicar directamente con GitHub Pages (Settings → Pages → rama y carpeta raíz).

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Portada: marco conceptual, líneas destacadas, personas, publicaciones, subsidios, noticias destacadas, vida del lab, contacto |
| `ribio.html` | RIBio · Marco conceptual (se abre desde el logo de RIBio) |
| `lineas.html` | Todas las líneas de investigación (botón "Ver todas las líneas") |
| `linea.html?id=...` | Página de cada línea de investigación |
| `noticias.html` | Todas las noticias (botón "Ver todas las noticias") |
| `noticia.html?id=...` | Página de cada noticia |
| `admin.html` | Panel de administración (link "Admin" en el pie de página) |
| `linea-ultrasonidos.html`, `linea-desorientacion.html`, `linea-navegacion.html` | Solo redirigen a `linea.html?id=...` (para no romper links viejos) |

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

- **Páginas de noticias y líneas:** cada noticia y cada línea tiene su propia página, que se arma desde el panel
  con bloques: títulos, subtítulos, textos, imágenes con epígrafe, listas, datos destacados y botones.
- **Destacadas:** las noticias y líneas marcadas con ★ salen en la portada. Si hay más que las destacadas,
  aparece el botón "Ver todas las noticias" / "Ver todas las líneas".
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
