import { db } from "./firebase";

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

// Obtener todos los clientes
export async function fetchClients() {
  const clientesRef = collection(db, "clientes");
  const snapshot = await getDocs(clientesRef);
  const clients = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  return clients;
}

// Crear cliente nuevo
export async function createClient(clientData: any) {
  const clientesRef = collection(db, "clientes");
  const docRef = await addDoc(clientesRef, clientData);
  return { id: docRef.id, ...clientData };
}

// Actualizar cliente
export async function updateClient(id: string, clientData: any) {
  const clienteRef = doc(db, "clientes", id);
  await updateDoc(clienteRef, clientData);
  return { id, ...clientData };
}

// Eliminar cliente
export async function deleteClient(id: string) {
  const clienteRef = doc(db, "clientes", id);
  await deleteDoc(clienteRef);
  return true;
}