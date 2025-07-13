// src/services/userServices.js
import { db } from "../../../services/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";

// Lấy danh sách users
export async function fetchUsers() {
  const q = query(collection(db, "users"), orderBy("hoTen", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Lấy chi tiết user theo id
export async function fetchUserById(id) {
  const docRef = doc(db, "users", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error("Không tìm thấy user");
  return { id, ...docSnap.data() };
}

// Tạo mới user (nếu cần)
export async function createUser(data) {
  const docRef = await addDoc(collection(db, "users"), data);
  return docRef.id;
}

// Cập nhật user
export async function updateUser(id, data) {
  const docRef = doc(db, "users", id);
  await updateDoc(docRef, data);
}

// Xóa user (nếu cần)
export async function deleteUser(id) {
  const docRef = doc(db, "users", id);
  await deleteDoc(docRef);
}
