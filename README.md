# Calculadora de Precios 3D v8

App web para cotizar piezas de impresión 3D con dashboard, pedidos, clientes e insumos.

## Nuevas funciones v8 / Fase 9.1

- Reordenamiento en Calculadora:
  - Materiales extra sube antes de Margen y precio
  - Margen y precio baja después de Materiales extra
- Nueva pestaña: Insumos
- Insumos guardados con:
  - nombre
  - costo del paquete
  - cantidad por paquete
  - costo unitario automático
- Materiales extra puede usar insumos guardados
- Chips rápidos para agregar insumos frecuentes
- Opción manual si el insumo no existe
- Botones de limpieza:
  - Limpiar formulario completo
  - Limpiar datos de pieza
  - Limpiar producción
  - Limpiar materiales extra
  - Restaurar márgenes
  - Limpiar datos del pedido
- Renombrado botón fuerte:
  - Restaurar app

## Publicar actualización

1. Sube/reemplaza estos archivos en GitHub:
   - index.html
   - package.json
   - README.md
   - src/main.jsx
   - src/styles.css
2. Haz commit.
3. Vercel publicará automáticamente.
