// src/services/catalogoService.js
// Consultas al catálogo de productos en Firestore.
//
// Estructura sugerida del documento en la colección "productos":
// {
//   nombre: string,
//   descripcion: string,
//   precio: number,
//   unidad: string,          // ej: "libra", "unidad", "bulto"
//   disponibilidad: number,  // cantidad disponible
//   categoria: string,
//   productor: string,
//   imagenUrl: string,
//   activo: boolean
// }
// src/services/catalogoService.js

import {
  collection,
  getDocs,
  doc,
  getDoc
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import { conTiempoLimite } from "../utils/conTiempoLimite";

/** Nombre real de la colección en el proyecto de Firebase ya cargado. */
const COLECCION_PRODUCTOS = "Productos";

/**
 * Lee el primer campo que exista. En Firestore hay documentos con
 * "nombre" y otros cargados a mano con "Nombre" o "Descripción".
 */
function leerCampo(data, claves) {
  for (const clave of claves) {
    const valor = data?.[clave];
    if (valor != null && valor !== "") return valor;
  }
  return undefined;
}

/**
 * Deja cualquier documento de Productos en la forma que usa la app,
 * venga en minúscula (pastel de queso) o con mayúscula (el resto).
 */
export function normalizarProducto(id, data = {}) {
  return {
    id,
    nombre: leerCampo(data, ["nombre", "Nombre"]) || "Sin nombre",
    descripcion: leerCampo(data, ["descripcion", "Descripcion", "Descripción"]) || "",
    precio: Number(leerCampo(data, ["precio", "Precio"])) || 0,
    unidad: leerCampo(data, ["unidad", "Unidad"]) || "unidad",
    disponibilidad: Number(leerCampo(data, ["disponibilidad", "Disponibilidad"])) || 0,
    categoria: leerCampo(data, ["categoria", "Categoria", "Categoría"]) || "Sin categoría",
    productor: leerCampo(data, ["productor", "Productor"]) || "",
    imagenUrl: leerCampo(data, ["imagenUrl", "ImagenUrl", "imagenURL"]) || "",
    activo: leerCampo(data, ["activo", "Activo"]) !== false,
  };
}

/**
 * Trae todos los productos de la colección, sin filtrar por "activo".
 * Ese filtro solo devolvía el pastel de queso, el único con el campo en minúscula.
 */
export async function obtenerCatalogo() {
  const snapshot = await conTiempoLimite(getDocs(collection(db, COLECCION_PRODUCTOS)));

  return snapshot.docs.map((docSnap) => normalizarProducto(docSnap.id, docSnap.data()));
}


/**
 * Trae el detalle de un producto por su id.
 * Falla con un mensaje claro si el documento ya no existe.
 */
export async function obtenerProducto(productoId) {

  const ref = doc(
    db,
    COLECCION_PRODUCTOS,
    productoId
  );

  const snap = await conTiempoLimite(getDoc(ref));

  if (!snap.exists()) {
    throw new Error(
      "El producto ya no existe en el catálogo."
    );
  }

  return normalizarProducto(snap.id, snap.data());
}