// src/features/leads/pages/LeadEdit.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Form, Spin } from "antd";
import LeadForm from "../components/LeadForm";
import {
    getLeadById,
    updateLead,
    deleteLead,
    checkLeadPhoneExists,
} from "../services/leadServices";
import { fetchUsers } from "../../users/services/userServices";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../../contexts/AuthContext";

export default function LeadEdit() {
    const { id } = useParams();
    const [form] = Form.useForm();
    const [initialValues, setInitialValues] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [salesStaff, setSalesStaff] = useState([]);

    // Lấy cả thông tin lead và danh sách nhân viên
    useEffect(() => {
        fetchUsers()
            .then(setSalesStaff)
            .catch(err => toast.error(err.message));

        getLeadById(id)
        // ... logic getLeadById giữ nguyên ...
    }, [id, navigate]);

    // Chuyển đổi danh sách nhân viên sang định dạng cho Select
    const salesStaffOptions = useMemo(() =>
        salesStaff.map(staff => ({
            label: staff.hoTen,
            value: staff.uid,
        })),
        [salesStaff]
    );

    useEffect(() => {
        getLeadById(id)
            .then((data) => {
                if (data) {
                    setInitialValues(data);
                } else {
                    toast.error("Không tìm thấy lead!");
                    navigate('/leads');
                }
            })
            .catch(err => toast.error(err.message))
            .finally(() => setLoading(false));
    }, [id, form, navigate]);

    const handleCheckPhoneExists = async (phone, currentLeadId = null) => {
        if (!phone) return false;
        return await checkLeadPhoneExists(phone, currentLeadId);
    };

    const handleSubmit = async (values) => {
        if (!user) {
            toast.error("Bạn phải đăng nhập để thực hiện hành động này.");
            return;
        }
        setSaving(true);
        try {
            const dataToUpdate = {
                ...values,
                nguoiCapNhat: user.uid,
            };
            await updateLead(id, dataToUpdate);
            toast.success("Cập nhật lead thành công!");
            navigate("/leads");
        } catch (err) {
            toast.error("Lỗi: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setSaving(true);
        try {
            await deleteLead(id);
            toast.success("Xoá lead thành công!");
            navigate("/leads");
        } catch (err) {
            toast.error("Lỗi: " + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading || !initialValues) {
        return <Spin style={{ display: "block", margin: "100px auto" }} />;
    }

    return (
        <div style={{ maxWidth: 900, margin: "auto", marginTop: 24 }}>
            <LeadForm
                form={form}
                initialValues={initialValues}
                onSubmit={handleSubmit}
                loading={saving}
                isEdit={true}
                onBack={() => navigate("/leads")}
                onDelete={handleDelete}
                checkPhoneExists={handleCheckPhoneExists}
                currentLeadId={id}
                salesStaffOptions={salesStaffOptions}
            />
        </div>
    );
}