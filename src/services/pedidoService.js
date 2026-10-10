// src/services/pedidoService.js
// Acceso remoto a la colección "pedidos" en Firestore.
//
// Estructura del documento:
// {
//   usuarioId: string,
//   items: [{ productoId, nombre, precio, cantidad, unidad }],
//   total: number,
//   estado: "recibido" | "en_preparacion" | "listo" | "entregado" | "cancelado",
//   creadoEn: timestamp,
//   idCliente: string   // mismo id del documento; reintentar no duplica el pedido
// }
//
// El descuento atómico de inventario (runTransaction) queda para el
// tercer entregable. Aquí la validación de stock es previa a la escritura.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  deleteDoc,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebaseConfig";
import { obtenerProducto } from "./catalogoService";
import { puedeCancelar, mensajeNoCancelable } from "../domain/estadosPedido";
import { aMillis } from "../utils/formato";
import { conTiempoLimite } from "../utils/conTiempoLimite";

const COLECCION_PEDIDOS = "pedidos";

/**
 * Genera el id del documento antes de enviarlo.
 * Usar siempre el mismo id hace que un reintento de sincronización
 * no cree un segundo pedido.
 */
export function nuevoIdPedido() {
  return `ped_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Valida disponibilidad de cada ítem contra el catálogo vigente.
 * Las lecturas van en paralelo para no alargar la espera sin red.
 * Devuelve mensajes listos para mostrar; no escribe nada.
 */
export async function validarDisponibilidad(items) {
  const revisiones = await Promise.all(
    items.map(async (item) => {
      const productoActual = await obtenerProducto(item.productoId);
      if (productoActual.disponibilidad < item.cantidad) {
        return `"${productoActual.nombre}" solo tiene ${productoActual.disponibilidad} ${productoActual.unidad} disponibles.`;
      }
      return null;
    })
  );

  return revisiones.filter(Boolean);
}

/**
 * Crea el pedido en Firestore con un id ya definido.
 * No valida stock: eso lo hace quien llama, para poder encolar si no hay red.
 */
export async function crearPedidoRemoto({ id, usuarioId, items, total }) {
  const referencia = doc(db, COLECCION_PEDIDOS, id);

  await conTiempoLimite(
    setDoc(referencia, {
      usuarioId,
      items,
      total,
      estado: "recibido",
      idCliente: id,
      creadoEn: serverTimestamp(),
    })
  );

  return { id, total };
}

/**
 * Trae solo los pedidos del usuario autenticado y los deja en JSON plano.
 */
export async function listarPedidosDeUsuario(usuarioId) {
  const consulta = query(
    collection(db, COLECCION_PEDIDOS),
    where("usuarioId", "==", usuarioId)
  );
  const snapshot = await conTiempoLimite(getDocs(consulta));

  return snapshot.docs.map((docSnap) => normalizarPedidoRemoto(docSnap));
}

/**
 * Convierte un documento de Firestore al modelo que usa la app y la caché.
 */
export function normalizarPedidoRemoto(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    usuarioId: data.usuarioId,
    items: data.items || [],
    total: data.total || 0,
    estado: data.estado || "recibido",
    creadoEn: aMillis(data.creadoEn) || Date.now(),
    origen: "remoto",
    syncEstado: "sincronizado",
    syncMensaje: "",
  };
}

/**
 * Cancela el pedido borrándolo de Firestore, si la regla lo permite
 * y el documento pertenece a este usuario.
 */
export async function cancelarPedidoRemoto({ pedidoId, usuarioId }) {
  const referencia = doc(db, COLECCION_PEDIDOS, pedidoId);
  const snap = await conTiempoLimite(getDoc(referencia));

  if (!snap.exists()) {
    throw new Error("El pedido no existe en el servidor.");
  }

  const data = snap.data();
  if (data.usuarioId !== usuarioId) {
    throw new Error("No puedes cancelar un pedido de otra persona.");
  }
  if (!puedeCancelar(data.estado)) {
    const error = new Error(mensajeNoCancelable(data.estado));
    error.estadoServidor = data.estado;
    error.esReglaDeNegocio = true;
    throw error;
  }

  await conTiempoLimite(deleteDoc(referencia));

  return { eliminado: true };
}
