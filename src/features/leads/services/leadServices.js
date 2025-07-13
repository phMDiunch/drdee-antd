import { db } from "../../../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";

// Lấy danh sách leads (có filter theo status, channel)
export async function getLeads({ status, channel }) {
  let q = collection(db, "leads");

  // Tạo query động
  const queryConstraints = [];
  if (status) queryConstraints.push(where("trangThai", "==", status));
  if (channel) queryConstraints.push(where("kenhNguon", "==", channel));
  queryConstraints.push(orderBy("thoiGianTiepNhan", "desc"));

  if (queryConstraints.length > 0) {
    q = query(collection(db, "leads"), ...queryConstraints);
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Thêm mới lead
export async function addLead(data) {
  const docRef = await addDoc(collection(db, "leads"), {
    ...data,
    thoiGianTiepNhan: new Date().toISOString(),
  });
  return docRef.id;
}

// Lấy chi tiết lead theo id
export async function getLeadById(id) {
  const docRef = doc(db, "leads", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id, ...docSnap.data() };
  }
  return null;
}

// Cập nhật lead
export async function updateLead(id, data) {
  const docRef = doc(db, "leads", id);
  await updateDoc(docRef, data);
}

// Xóa lead
export async function deleteLead(id) {
  const docRef = doc(db, "leads", id);
  await deleteDoc(docRef);
}
