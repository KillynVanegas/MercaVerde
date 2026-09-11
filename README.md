# MercaVerde — Primer Entregable

Aplicación móvil de pedidos a mercados campesinos y cafetería del Tecnológico de Antioquia.
Este código cubre las **4 funcionalidades mínimas de la Parte B** del primer entregable:

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

Crea manualmente en la consola de Firestore una colección **`productos`** con documentos como este (o usa un script de seed):

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
  context/       # AuthContext (usuario logueado), CartContext (carrito en memoria)
  navigation/     # Stack de autenticación y stack principal
  screens/        # Login, Registro, Catálogo, Detalle, Carrito
  services/       # firebaseConfig, authService, catalogoService, pedidoService
```

## Colecciones de Firestore

| Colección   | Uso |
|-------------|-----|
| `usuarios`  | Perfil del usuario (nombre, correo, rol) creado al registrarse. |
| `productos` | Catálogo semanal: nombre, precio, unidad, disponibilidad, categoría, productor, imagen. |
| `pedidos`   | Pedidos confirmados: usuarioId, items, total, estado, fecha. |

## Investigación de campo → producto

- **H-01** (catálogo se anuncia en cartelera / fila para saber qué queda) → resuelto por el catálogo consultable de esta entrega.
- **H-02** (pedido se arma sin señal, precios cambian) → se resuelve con el modo offline del **segundo entregable**.
- **H-03 / H-04 (FE-01 / FE-02)** → completar en `/docs/investigacion/matriz-trazabilidad.pdf` con los hallazgos propios del equipo.

Evidencias de investigación de campo (entrevistas, fotos, ficha de observación, informe de hallazgos y matriz de trazabilidad) van en `/docs/investigacion`, enlazadas desde este README.

## Pendiente para el segundo entregable (no incluido aquí)

- Persistencia offline del catálogo y del carrito (`AsyncStorage` o `expo-sqlite`).
- Indicador de estado de conexión (`@react-native-community/netinfo`).
- Módulo "Mis pedidos" con estados y cancelación.
- Cola de acciones pendientes por sincronizar.
- FE-01.
