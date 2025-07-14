// src/features/leads/pages/LeadCreate.jsx
import React, { useState, useEffect, useMemo } from "react";
import { Form } from "antd";
import LeadForm from "../components/LeadForm";
import { addLead, checkLeadPhoneExists } from "../services/leadServices";
import { fetchUsers } from "../../users/services/userServices";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";

export default function LeadCreate() {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const [salesStaff, setSalesStaff] = useState([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    // Lấy danh sách nhân viên khi component mount
    useEffect(() => {
        fetchUsers()
            .then(setSalesStaff)
            .catch(err => toast.error(err.message));
    }, []);

    // Chuyển đổi danh sách nhân viên sang định dạng cho Select
    const salesStaffOptions = useMemo(() =>
        salesStaff.map(staff => ({
            label: staff.hoTen,
            value: staff.uid,
        })),
        [salesStaff]
    );

    // Đặt giá trị mặc định cho form
    const initialLeadValues = useMemo(() => ({
        saleOnline: user?.uid, // Tự động chọn người đang đăng nhập
    }), [user]);

    const handleCheckPhoneExists = async (phone, currentLeadId = null) => {
        if (!phone) return false;
        return await checkLeadPhoneExists(phone, currentLeadId);
    };

    const handleSubmit = async (values) => {
        if (!user) {
            toast.error("Bạn phải đăng nhập để thực hiện hành động này.");
            return;
        }
        setLoading(true);
        try {
            const data = {
                ...values,
                trangThaiLead: "so_dien_thoai",
                nguoiTao: user.uid,
                nguoiCapNhat: user.uid,
            };
            await addLead(data);
            toast.success("Thêm mới lead thành công!");
            navigate("/leads");
        } catch (err) {
            toast.error("Lỗi: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 900, margin: "auto", marginTop: 24 }}>
            <LeadForm
                form={form}
                initialValues={initialLeadValues}
                onSubmit={handleSubmit}
                loading={loading}
                isEdit={false}
                onBack={() => navigate("/leads")}
                checkPhoneExists={handleCheckPhoneExists}
                salesStaffOptions={salesStaffOptions}
            />
        </div>
    );
}