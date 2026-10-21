# Mi Primer Negocio 36

Aplicación web para un pequeño negocio escolar del CBTIS No. 36.

## Funciones
- Productos: materiales, mano de obra, costo total, precio de venta y ganancia por unidad.
- Gastos fijos: inicia con Internet ($100), Transporte ($150) y Bolsas ($80).
- Ventas: fecha, producto, cantidad, precio, total de venta y utilidad estimada.
- Resumen: ventas totales, utilidad bruta, gastos y ganancia neta estimada.
- Exportación del resumen a CSV.
- Diseño adaptable a celulares, tablets y computadoras.

## Publicar en GitHub Pages
1. Crea un repositorio llamado `mi-primer-negocio-36`.
2. Sube `index.html`, `styles.css`, `app.js` y `README.md` a la raíz.
3. En GitHub abre **Settings → Pages**.
4. En **Build and deployment**, elige **Deploy from a branch**.
5. Selecciona la rama `main` y carpeta `/(root)`, y guarda.
6. Espera a que GitHub Pages muestre el enlace publicado.

## Importante
La aplicación no requiere servidor ni dependencias. Los datos se guardan en `localStorage` del navegador, por lo que no se sincronizan automáticamente entre dispositivos. No borres los datos del navegador si quieres conservarlos. Es un prototipo escolar, no un sistema contable profesional.
