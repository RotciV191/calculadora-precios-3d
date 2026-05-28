# Calculadora de Precios 3D v9.2.1

Corrección del modo lote.

## Qué corrige

La versión 9.2 calculaba el precio recomendado usando directamente el costo bajo del lote. Eso servía como precio interno/stock, pero podía bajar demasiado el precio cuando el cliente solo compra 1 pieza.

## Nueva lógica

En modo Lote / stock se separan dos cosas:

1. Costo interno real:
   - costo total del lote
   - costo interno por pieza
   - costo real estimado del pedido

2. Precio al cliente:
   - Precio individual público
   - Mayoreo según cantidad
   - Costo lote + margen

## Recomendación de uso

- Cliente compra 1: usa Precio individual público.
- Cliente compra varias: usa Mayoreo según cantidad.
- Solo usa Costo lote + margen si quieres vender barato por stock, liquidación o pedido grande.

## Publicar actualización

1. Sube/reemplaza estos archivos en GitHub:
   - index.html
   - package.json
   - README.md
   - src/main.jsx
   - src/styles.css
2. Haz commit.
3. Vercel publicará automáticamente.
