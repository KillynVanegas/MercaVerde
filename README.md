# MercaVerde

Aplicación móvil de pedidos a mercados campesinos y cafetería del Tecnológico de Antioquia.

El primer entregable cubre las 4 funcionalidades mínimas de la Parte B:

1. Registro e inicio de sesión con Firebase Authentication.
2. Listado del catálogo de productos (Firestore).
3. Vista de detalle del producto.
4. Creación del pedido: agregar productos, ver total y confirmar.

## 1. Configurar Firebase

1. Crea un proyecto en https://console.firebase.google.com
2. Habilita **Authentication → Correo/contraseña**.
3. Crea una base de datos en **Firestore** (modo producción o prueba).
4. Habilita **Storage** (se usará desde el 3er entregable para imágenes).
5. Copia tus credenciales web y pégalas en `src/services/firebaseConfig.js`.

## 2. Instalar dependencias

```bash
npm install
```

## 3. Cargar productos de prueba en Firestore

Crea manualmente en la consola de Firestore una colección **`Productos`** (con P mayúscula, que es el nombre que ya usa el código) con documentos como este:

```json
{
  "nombre": "Aguacate Hass",
  "descripcion": "Aguacate Hass maduro, cultivado en Santa Elena.",
  "precio": 3500,
  "unidad": "unidad",
  "disponibilidad": 24,
  "categoria": "Frutas y verduras",
  "productor": "Finca La Esperanza",
  "imagenUrl": "",
  "activo": true
}
```

Repite con 6–10 productos variados (frutas, verduras, café, panadería) para poder mostrar el catálogo, los filtros y probar el pedido con varios ítems.

## 4. Ejecutar la app

```bash
npx expo start
```

Escanea el QR con Expo Go, o presiona `a` / `i` para emulador Android/iOS.

## 5. Credenciales de prueba

> Completar antes de entregar: crea un usuario de prueba (registro dentro de la app) y anota aquí el correo y la contraseña para que el docente pueda ingresar sin crear cuenta nueva.

- Correo: `demo@mercaverde.test`
- Contraseña: `demo123`

## Estructura del proyecto

```
App.js
src/
  domain/         # reglas puras: estados, cancelación, filtros, alertas FE-01
  data/           # AsyncStorage por usuario (catálogo, pedidos, carrito, cola, seguidos)
  casosdeuso/     # orquesta caché + Firestore sin conocer la UI
  services/       # Firebase: auth, catálogo, pedidos, sincronización
  context/        # sesión, conexión, cola y carrito
  components/     # indicador de red, filtros, etiqueta de estado, tarjeta de pedido
  screens/        # Login, Registro, Catálogo, Detalle, Carrito, Mis pedidos, Alertas
  navigation/
```

La UI no decide si un pedido se puede cancelar ni cómo se filtra el catálogo: eso vive en `src/domain`. Firestore solo se toca desde `src/services`. Lo que debe sobrevivir sin red vive en `src/data`.

## Colecciones de Firestore

| Colección   | Uso |
|-------------|-----|
| `usuarios`  | Perfil del usuario (nombre, correo, rol) creado al registrarse. |
| `Productos` | Catálogo semanal: nombre, precio, unidad, disponibilidad, categoría, productor, imagen. |
| `pedidos`   | Pedidos confirmados: usuarioId, items, total, estado, fecha. |

## Investigación de campo → producto

- **H-01** (catálogo se anuncia en cartelera / fila para saber qué queda) → el catálogo del primer entregable lo consulta; la **FE-01** avisa cuando lo seguido está por agotarse.
- **H-02** (pedido se arma sin señal, precios cambian) → modo offline de este entregable.

La matriz está en `docs/investigacion/matriz-trazabilidad.md`. El PDF original del equipo no estaba en el repositorio; si la matriz de campo priorizó otro hallazgo, ese archivo es el que hay que alinear.

## Segundo entregable

Cubre seguimiento del pedido, modo offline y la funcionalidad emergente FE-01.

- **Mis pedidos:** solo los del usuario autenticado (`usuarioId`). Estados visibles con la misma etiqueta en toda la app: recibido, en preparación, listo, entregado y cancelado.
- **Cancelación:** confirmación previa. Regla del equipo: se puede cancelar en `recibido` y `en_preparacion`. No se puede si está `listo`, `entregado` o `cancelado` (el mercado ya preparó el pedido o ya no aplica).
- **Búsqueda y filtros:** nombre, categoría, disponibilidad (con stock / agotados) y rango de precio. Corren sobre la lista en memoria, también sin red.
- **Modo offline:** caché del catálogo y de los pedidos, carrito en AsyncStorage que sobrevive al cierre, indicador permanente de conexión, aviso de que precio y disponibilidad pueden haber cambiado, y cola de confirmar/cancelar que se envía a Firestore al volver la red. Cada dato local va con el uid y se borra al cerrar sesión.
- **FE-01 — Alertas de stock.** Ver el párrafo de abajo y `docs/investigacion/matriz-trazabilidad.md`.

### FE-01

FE-01 responde al hallazgo H-01 del primer entregable: compradores del mercado campesino y de la cafetería del TdeA contaron que se enteran de lo que queda por la cartelera o haciendo fila, y cuando llegan los productos de más rotación ya se agotaron. Quien lo reportó fue esa comunidad de compradores (estudiantes y personal del campus) durante la investigación de campo. Se implementó como seguimiento de disponibilidad: en el detalle de un producto la persona toca “Seguir disponibilidad” y la pantalla Alertas de stock cruza esa lista con el catálogo en red o con la última copia local, y marca agotado, queda poco (5 unidades o menos) o disponible. Sin conexión la alerta sigue operativa con la caché y la app advierte que el dato puede haber cambiado; al cerrar sesión se borra la lista de ese usuario.

### Cómo probar el modo avión

1. Entra con la cuenta de prueba **con internet** y abre el catálogo (eso descarga la copia local).
2. Arma un pedido, ciérralo sin confirmar, mata la app y ábrela de nuevo: el carrito debe seguir ahí.
3. Activa el modo avión. Deben verse el catálogo, Mis pedidos y las alertas, el indicador “Sin conexión” y el aviso de precios. La app no debe quedarse en un spinner.
4. Confirma un pedido y cancela otro: ambos quedan “Pendiente por sincronizar”.
5. Quita el modo avión. El indicador pasa a “En línea”, la cola se envía a Firestore y el pendiente desaparece.
6. Cierra sesión y entra con otro usuario: no debe ver el carrito ni los pedidos locales del anterior.

Para ver los otros estados, cambia `estado` del documento en la consola de Firestore a `en_preparacion`, `listo`, `entregado` o `cancelado` y refresca Mis pedidos. En `listo` y `entregado` el botón de cancelar no aparece.
