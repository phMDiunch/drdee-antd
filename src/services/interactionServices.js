import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

// Thêm mới một interaction (liên hệ, chăm sóc)
export async function addInteraction(objectId, data) {
  // objectId có thể là leadId, customerId, v.v. (tuỳ nghiệp vụ)
  return await addDoc(collection(db, "interactions"), {
    objectId, // id của lead/customer...
    ...data,
    thoiGian: serverTimestamp(), // Thời gian tạo interaction
  });
}

// Lấy tất cả interaction của 1 đối tượng (objectId)
export async function getInteractionsByObject(objectId) {
  const q = query(
    collection(db, "interactions"),
    where("objectId", "==", objectId),
    orderBy("thoiGian", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
