import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../../../services/firebase";

/**
 * Kiểm tra 1 trường đã tồn tại trong collection 'users' chưa.
 * @param {string} field Tên trường cần kiểm tra (ví dụ: "soDienThoai").
 * @param {string} value Giá trị cần kiểm tra.
 * @returns {Promise<boolean>}
 */
export async function checkExists(field, value) {
  const q = query(collection(db, "users"), where(field, "==", value));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Đăng ký tài khoản mới.
 * @param {object} values Dữ liệu từ form đăng ký.
 */
export async function registerUser(values) {
  // Kiểm tra các trường dữ liệu duy nhất, ném ra lỗi với thông điệp rõ ràng
  const phoneExists = await checkExists("soDienThoai", values.soDienThoai);
  if (phoneExists) {
    throw new Error("Số điện thoại này đã được sử dụng.");
  }

  const idCardExists = await checkExists("soCCCD", values.soCCCD);
  if (idCardExists) {
    throw new Error("Số CCCD này đã được sử dụng.");
  }

  // Tạo user trong Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    values.email,
    values.password
  );

  // Chuẩn bị dữ liệu để lưu vào Firestore
  const userData = {
    uid: userCredential.user.uid,
    email: values.email,
    hoTen: values.hoTen,
    ngaySinh: values.ngaySinh.format("YYYY-MM-DD"),
    gioiTinh: values.gioiTinh,
    soDienThoai: values.soDienThoai,
    queQuan: values.queQuan,
    diaChiHienTai: values.diaChiHienTai,
    soCCCD: values.soCCCD,
    ngayCapCCCD: values.ngayCapCCCD.format("YYYY-MM-DD"),
    trangThaiTaiKhoan: "pending", // Trạng thái mặc định
    vaiTro: "user",
    createdAt: new Date().toISOString(),
  };

  // Lưu thông tin user vào Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), userData);
  return userCredential.user;
}

/**
 * Đăng nhập tài khoản.
 * @param {string} email
 * @param {string} password
 */
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
  if (!userDoc.exists()) throw new Error("user-not-found");
  return { user: userCredential.user, userData: userDoc.data() };
}

/**
 * Lấy thông tin chi tiết của người dùng từ Firestore.
 * Hàm này rất hữu ích cho AuthContext và các nơi khác cần dữ liệu người dùng.
 * @param {string} uid User ID của người dùng.
 */
export async function getUserProfile(uid) {
  if (!uid) return null;
  const userDocRef = doc(db, "users", uid);
  const userDoc = await getDoc(userDocRef);
  return userDoc.exists() ? userDoc.data() : null;
}

/**
 * Gửi email reset mật khẩu.
 * @param {string} email
 */
export async function sendResetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}
