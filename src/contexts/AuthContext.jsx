import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase"; // Import từ config
import { getUserProfile } from "../features/auth/services/authService"; // Import service

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // Chỉ loading lần đầu tiên

  useEffect(() => {
    // onAuthStateChanged trả về một hàm unsubscribe
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Nếu có user, lấy thông tin từ service
        const profile = await getUserProfile(currentUser.uid);
        setUser(currentUser);
        setUserData(profile);
      } else {
        // Nếu không có user (logout), reset state
        setUser(null);
        setUserData(null);
      }
      // Sau lần kiểm tra đầu tiên, tắt loading
      if (loading) {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [loading]); // Thêm loading vào dependency để chỉ chạy logic setLoading một lần

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      // Không cần set state ở đây, onAuthStateChanged sẽ tự động bắt sự kiện logout và cập nhật
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, []);

  // Ghi nhớ giá trị của context để tránh re-render không cần thiết
  const value = useMemo(
    () => ({
      user,
      userData,
      loading,
      isAuthenticated: !!user,
      logout,
    }),
    [user, userData, loading, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {/* Chỉ render children khi không còn loading để đảm bảo có dữ liệu auth */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;