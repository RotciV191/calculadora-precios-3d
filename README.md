# Calculadora de Precios 3D v9.2

App web para cotizar piezas individuales o producidas en lote/stock.

## Nuevas funciones v9.2

- Nueva sección: Modo de cotización
- Modo Individual
- Modo Lote / stock
- Piezas producidas en el lote
- Piezas que compra el cliente
- Costo total del lote
- Costo de producción por pieza
- Costo real del cliente
- Precio recomendado total y por pieza
- Pedidos guardan cantidad, modo de producción y costo unitario

## Lógica del modo lote

- Filamento, tiempo, máquina, mano de obra y AMS se dividen entre las piezas producidas.
- Insumos, empaque y extras se multiplican por las piezas que compra el cliente.
- El precio final se calcula con el margen real editable.

## Publicar actualización

1. Sube/reemplaza estos archivos en GitHub:
   - index.html
   - package.json
   - README.md
   - src/main.jsx
   - src/styles.css
2. Haz commit.
3. Vercel publicará automáticamente.
