// src/features/users/hooks/useUser.js
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "antd";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { fetchUserById, updateUser } from "../services/userServices";

export function useUser() {
  // --- HOOKS & STATE ---
  const [form] = Form.useForm(); // Tạo instance của form để quản lý
  const { id: userId } = useParams(); // Lấy id từ URL
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [userData, setUserData] = useState(null); // Dữ liệu gốc của user
  const [loading, setLoading] = useState(true); // Loading khi fetch dữ liệu ban đầu
  const [saving, setSaving] = useState(false); // Saving khi cập nhật form
  const [error, setError] = useState(null);

  // Xác định chế độ xem/sửa từ URL search param
  const isViewMode = useMemo(
    () => searchParams.get("view") === "true",
    [searchParams]
  );

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!userId) return; // Không làm gì nếu không có ID

    const loadUser = async () => {
      setLoading(true);
      try {
        const data = await fetchUserById(userId);
        setUserData(data);

        // Chuyển đổi dữ liệu để phù hợp với Ant Design Form (DatePicker cần dayjs)
        const formData = { ...data };
        if (data.ngaySinh) {
          formData.ngaySinh = data.ngaySinh.toDate
            ? dayjs(data.ngaySinh.toDate())
            : dayjs(data.ngaySinh);
        }
        if (data.ngayCapCCCD) {
          formData.ngayCapCCCD = data.ngayCapCCCD.toDate
            ? dayjs(data.ngayCapCCCD.toDate())
            : dayjs(data.ngayCapCCCD);
        }
        form.setFieldsValue(formData); // Set giá trị cho form
      } catch (err) {
        setError(err);
        toast.error("Không tìm thấy thông tin nhân viên.");
        navigate("/users");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, form, navigate]); // Chạy lại khi id, form, navigate thay đổi

  // --- HANDLERS & ACTIONS ---
  const handleSave = async (values) => {
    setSaving(true);
    try {
      // Chuyển đổi dữ liệu từ form về đúng định dạng của Firebase
      const dataToSave = { ...values };
      if (values.ngaySinh) dataToSave.ngaySinh = values.ngaySinh.toDate();
      if (values.ngayCapCCCD)
        dataToSave.ngayCapCCCD = values.ngayCapCCCD.toDate();

      await updateUser(userId, dataToSave);
      toast.success("Cập nhật thông tin nhân viên thành công!");
      navigate("/users");
    } catch (err) {
      setError(err);
      toast.error("Có lỗi xảy ra khi lưu thông tin.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    // Lưu trạng thái hiện tại để có thể rollback nếu lỗi
    const originalStatus = userData.trangThaiTaiKhoan;
    // Cập nhật UI ngay lập tức để người dùng thấy phản hồi
    setUserData((prev) => ({ ...prev, trangThaiTaiKhoan: newStatus }));

    try {
      await updateUser(userId, { trangThaiTaiKhoan: newStatus });
      toast.success("Cập nhật trạng thái thành công!");
    } catch (err) {
      // Nếu có lỗi, rollback lại trạng thái và thông báo
      setUserData((prev) => ({ ...prev, trangThaiTaiKhoan: originalStatus }));
      setError(err);
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };

  // Chuyển đổi giữa chế độ xem và sửa bằng cách thay đổi URL
  const toggleViewMode = () => {
    if (isViewMode) {
      searchParams.delete("view");
    } else {
      searchParams.set("view", "true");
    }
    setSearchParams(searchParams);
  };

  const goBack = () => navigate("/users");

  // --- RETURN VALUE ---
  return {
    form,
    userId,
    userData,
    loading,
    saving,
    error,
    isViewMode,
    handleSave,
    handleStatusChange,
    toggleViewMode,
    goBack,
  };
}
