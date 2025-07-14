// src/features/leads/services/leadServices.js
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
  limit,
  serverTimestamp,
} from "firebase/firestore";

/**
 * @typedef {object} Lead
 * @property {string} [id] - ID của document trên Firestore.
 * @property {string} hoTen - Họ và tên của lead.
 * @property {string} soDienThoai - Số điện thoại của lead.
 * @property {string[]} dichVuQuanTam - Mảng chứa các dịch vụ lead quan tâm.
 * @property {string} tiemNangLead - Mức độ tiềm năng ('thap', 'trung_binh', 'cao').
 * @property {string} trangThaiLead - Trạng thái của lead ('so_dien_thoai', 'dat_lich'...).
 * @property {string} [tinhThanhPho] - Tỉnh/thành phố của lead.
 * @property {string} [kenhTuongTac] - Kênh tương tác.
 * @property {string} [nguonCuThe] - Nguồn chi tiết.
 * @property {string} [hanhDong] - Hành động của lead.
 * @property {string} [linkChat] - Link đến đoạn chat với lead.
 * @property {string} [idAd] - ID của quảng cáo Facebook.
 * @property {string} [saleOnline] - ID của sale phụ trách.
 * @property {string} nguoiTao - UID của người dùng tạo lead.
 * @property {string} nguoiCapNhat - UID của người dùng cập nhật lead lần cuối.
 * @property {object} ngayTao - Timestamp ngày tạo của Firestore.
 * @property {object} ngayCapNhat - Timestamp ngày cập nhật của Firestore.
 */

const leadsCollectionRef = collection(db, "leads");

const cleanDataForFirestore = (data) => {
  const cleanedData = {};
  for (const key in data) {
    if (data[key] !== undefined) {
      cleanedData[key] = data[key];
    } else {
      cleanedData[key] = null;
    }
  }
  return cleanedData;
};

export async function addLead(leadData) {
  try {
    const cleanedData = cleanDataForFirestore(leadData);
    const dataToSave = {
      ...cleanedData,
      ngayTao: serverTimestamp(),
      ngayCapNhat: serverTimestamp(),
    };
    const docRef = await addDoc(leadsCollectionRef, dataToSave);
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi thêm lead mới:", error);
    throw new Error("Thao tác thêm lead mới đã thất bại. Vui lòng thử lại.");
  }
}

export async function updateLead(leadId, dataToUpdate) {
  if (!leadId) throw new Error("Cần có ID của lead để cập nhật.");
  try {
    const cleanedData = cleanDataForFirestore(dataToUpdate);
    const leadDocRef = doc(db, "leads", leadId);
    const finalData = {
      ...cleanedData,
      ngayCapNhat: serverTimestamp(),
    };
    await updateDoc(leadDocRef, finalData);
  } catch (error) {
    console.error(`Lỗi khi cập nhật lead ${leadId}:`, error);
    throw new Error("Cập nhật lead thất bại. Vui lòng thử lại.");
  }
}

export async function getLeads(filters = {}) {
  const { status, potential, search } = filters;
  try {
    const queryConstraints = [];
    if (status) queryConstraints.push(where("trangThaiLead", "==", status));
    if (potential)
      queryConstraints.push(where("tiemNangLead", "==", potential));
    queryConstraints.push(orderBy("ngayTao", "desc"));

    const q = query(leadsCollectionRef, ...queryConstraints);
    const snapshot = await getDocs(q);

    let leads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (search) {
      const lowercasedSearch = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          (l.hoTen && l.hoTen.toLowerCase().includes(lowercasedSearch)) ||
          (l.soDienThoai && l.soDienThoai.includes(search))
      );
    }
    return leads;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách leads:", error);
    throw new Error("Không thể tải danh sách leads.");
  }
}

export async function checkLeadPhoneExists(phone, currentLeadId = null) {
  if (!phone) return false;
  try {
    const q = query(
      leadsCollectionRef,
      where("soDienThoai", "==", phone),
      limit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return false;
    if (currentLeadId && snapshot.docs[0].id === currentLeadId) return false;

    return true;
  } catch (error) {
    console.error("Lỗi khi kiểm tra số điện thoại:", error);
    return false;
  }
}

export async function getLeadById(id) {
  if (!id) return null;
  try {
    const docRef = doc(db, "leads", id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error(`Lỗi khi lấy lead ${id}:`, error);
    throw new Error("Không thể tải thông tin chi tiết của lead.");
  }
}

export async function deleteLead(id) {
  if (!id) return;
  try {
    const docRef = doc(db, "leads", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Lỗi khi xóa lead ${id}:`, error);
    throw new Error("Xóa lead thất bại.");
  }
}

/**
 * Lấy danh sách leads để phục vụ cho việc thống kê.
 * @param {object} filters
 * @param {Date} [filters.startDate] - Ngày bắt đầu lọc.
 * @param {Date} [filters.endDate] - Ngày kết thúc lọc.
 * @param {string} [filters.service] - Dịch vụ cần lọc.
 * @param {string} [filters.employeeId] - ID của nhân viên phụ trách cần lọc.
 * @returns {Promise<Lead[]>}
 */
export async function getLeadsForAnalytics({
  startDate,
  endDate,
  service,
  employeeId,
} = {}) {
  let q = query(leadsCollectionRef);

  if (startDate && endDate) {
    q = query(
      q,
      where("ngayTao", ">=", startDate),
      where("ngayTao", "<=", endDate)
    );
  }
  if (service) {
    q = query(q, where("dichVuQuanTam", "array-contains", service));
  }
  if (employeeId) {
    q = query(q, where("saleOnline", "==", employeeId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
