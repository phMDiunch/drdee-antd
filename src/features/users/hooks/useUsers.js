// src/features/users/hooks/useUsers.js
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { fetchUsers } from "../services/userServices";
import { ACCOUNT_STATUS } from "../../../constants";

export function useUsers() {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]); // State lưu danh sách user gốc từ DB
  const [loading, setLoading] = useState(false); // State cho trạng thái loading
  const [error, setError] = useState(null); // State để bắt lỗi nếu có

  // State cho các bộ lọc
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRole, setFilterRole] = useState("all");

  // --- DATA FETCHING ---
  // Sử dụng useEffect để tải danh sách users khi hook được sử dụng lần đầu
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const data = await fetchUsers();
        setUsers(data);
      } catch (err) {
        setError(err);
        toast.error("Có lỗi xảy ra khi tải danh sách nhân viên");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []); // Mảng rỗng đảm bảo effect này chỉ chạy 1 lần

  // --- MEMOIZED DERIVED STATE ---
  // Tối ưu hiệu năng: Chỉ tính toán lại khi các dependencies thay đổi

  // Lọc danh sách chức danh duy nhất để hiển thị trong Select
  const uniqueRoles = useMemo(() => {
    return Array.from(new Set(users.map((u) => u.chucDanh).filter(Boolean)));
  }, [users]);

  // Lọc và tìm kiếm user dựa trên các state filter
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchSearch = searchText
        ? user.hoTen?.toLowerCase().includes(searchText.toLowerCase())
        : true;
      const matchStatus =
        filterStatus === "all" || user.trangThaiTaiKhoan === filterStatus;
      const matchRole = filterRole === "all" || user.chucDanh === filterRole;
      return matchSearch && matchStatus && matchRole;
    });
  }, [users, searchText, filterStatus, filterRole]);

  // Tính toán các số liệu thống kê
  const statsData = useMemo(() => {
    const approveCount = users.filter(
      (u) => u.trangThaiTaiKhoan === ACCOUNT_STATUS.APPROVE
    ).length;
    const pendingCount = users.filter(
      (u) => u.trangThaiTaiKhoan === ACCOUNT_STATUS.PENDING
    ).length;
    const rejectCount = users.filter(
      (u) => u.trangThaiTaiKhoan === ACCOUNT_STATUS.REJECT
    ).length;
    return { approveCount, pendingCount, rejectCount };
  }, [users]);

  // --- RETURN VALUE ---
  // Hook trả về các state và hàm cần thiết cho component
  return {
    users: filteredUsers, // Trả về danh sách đã được lọc
    loading,
    error,
    searchText,
    setSearchText,
    filterStatus,
    setFilterStatus,
    filterRole,
    setFilterRole,
    uniqueRoles,
    statsData,
  };
}
