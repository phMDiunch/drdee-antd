# 📞 Treatment Care Call Scripts

> **📋 Mục đích**: Kịch bản gọi điện chăm sóc khách hàng sau điều trị  
> **🔗 Sử dụng trong**: Treatment Care System - CreateTreatmentCareModal  
> **🔧 Implementation**: `src/features/treatment-care/constants/callScripts.ts`

## 💡 Hướng dẫn sử dụng

- **Hiển thị**: Expandable panel trong CreateTreatmentCareModal
- **Mục đích**: Tham khảo, không bắt buộc
- **Storage**: Hardcoded constants (Phase 1 MVP)
- **Tương lai**: Có thể chuyển sang database để edit qua UI

---

## 1. Phẫu Thuật / Nhổ Răng Khôn

```
[Giọng điệu: Quan tâm, chuyên nghiệp]

Xin chào anh/chị [Tên],
Em là [Tên lễ tân] từ phòng khám nha khoa [Tên phòng khám].

Hôm qua anh/chị có [tên dịch vụ] với bác sĩ [Tên bác sĩ] ạ.
Em gọi để hỏi thăm tình trạng sức khỏe của anh/chị sau khi điều trị.

☑️ CHECKLIST (Hỏi từng câu):
1. Vết thương có đau không ạ? (Nếu đau: "Đau mức nào từ 1-10 ạ?")
   → Nếu đau > 7/10: "🚨 Anh/chị vui lòng đến phòng khám ngay để bác sĩ kiểm tra ạ"

2. Có sưng không ạ? (Nếu sưng: "Sưng nhiều không ạ?")
   → Nếu sưng quá: "Anh/chị đắp khăn lạnh 15-20 phút mỗi 2 tiếng ạ"

3. Có chảy máu không ạ?
   → Nếu còn chảy máu: "🚨 Anh/chị vui lòng đến phòng khám kiểm tra ạ"

4. Anh/chị có uống thuốc đúng giờ không ạ?
   → Nhắc nhở: "Nhớ uống thuốc kháng sinh đủ liều theo đơn của bác sĩ nhé ạ"

5. Có ăn uống được bình thường không ạ?
   → Tư vấn: "Nên ăn mềm, tránh nóng/cay trong 3 ngày đầu ạ"

✅ KẾT THÚC:
- "Nếu có bất kỳ vấn đề gì, anh/chị gọi ngay cho em theo số [SĐT] nhé ạ"
- "Hẹn anh/chị tái khám ngày [Ngày hẹn] ạ"
- "Chúc anh/chị mau khỏe ạ!"

🚨 RED FLAGS (Cần báo bác sĩ NGAY):
- Đau > 7/10
- Chảy máu không ngừng
- Sưng quá mức, sốt cao
- Dị ứng thuốc (ngứa, phát ban)
```

---

## 2. Trám Răng / Điều Trị Tủy

```
Xin chào anh/chị [Tên],
Em là [Tên lễ tân] từ phòng khám nha khoa [Tên phòng khám].

Hôm qua anh/chị có [trám răng/điều trị tủy] với bác sĩ [Tên bác sĩ].
Em gọi hỏi thăm anh/chị có ổn không ạ?

☑️ CHECKLIST:
1. Răng có đau khi ăn nhai không ạ?
2. Có cảm giác khó chịu ở răng vừa trám không?
3. Có nhạy cảm với đồ nóng/lạnh không ạ?
   → Nếu có: "Bình thường sau trám 2-3 ngày sẽ hết ạ. Nếu quá 1 tuần vẫn còn thì anh/chị quay lại kiểm tra nhé"

✅ LƯU Ý:
- "Tránh ăn cứng ở vị trí vừa trám trong 24h đầu ạ"
- "Đánh răng nhẹ nhàng khu vực đó ạ"

🚨 RED FLAGS:
- Đau nhức liên tục > 3 ngày
- Miếng trám bị rơi/bong ra
```

---

## 3. Lấy Cao Răng / Tẩy Trắng

```
Xin chào anh/chị [Tên],
Em là [Tên lễ tân] từ phòng khám [Tên].

Hôm kia anh/chị có [lấy cao răng/tẩy trắng] với bác sĩ [Tên].
Em gọi hỏi thăm anh/chị cảm thấy thế nào ạ?

☑️ CHECKLIST:
1. Răng có bị nhạy cảm không ạ?
   → Nếu có: "Bình thường ạ, 1-2 ngày sẽ hết. Anh/chị dùng kem đánh răng cho răng nhạy cảm nhé"

2. Lợi có bị đau hoặc chảy máu không?

✅ LƯU Ý:
- "Hẹn anh/chị lấy cao răng định kỳ 6 tháng/lần để giữ răng khỏe mạnh ạ"
- (Nếu tẩy trắng): "Tránh cafe, trà, rượu vang 48h đầu để giữ màu răng đẹp lâu ạ"
```

---

## 4. Implant / Răng Sứ

```
Xin chào anh/chị [Tên],
Em là [Tên lễ tân] từ phòng khám [Tên].

Hôm qua anh/chị có [cấy implant/gắn răng sứ] với bác sĩ [Tên].
Em gọi để kiểm tra tình trạng và nhắc lịch tái khám ạ.

☑️ CHECKLIST:
1. Vị trí cấy implant có đau/sưng không ạ?
2. Anh/chị có uống thuốc đầy đủ không?
3. Có ăn uống bình thường không?
   → Tư vấn: "Tuần đầu nên ăn mềm, tránh nhai ở vị trí cấy implant ạ"

✅ NHẮC HẸN:
- "Anh/chị nhớ tái khám ngày [Ngày] để bác sĩ kiểm tra implant ổn định nhé ạ"
- "Lịch gắn răng sứ vào tháng [Tháng]"

🚨 RED FLAGS:
- Implant bị lung lay
- Đau dữ dội hoặc sưng quá mức
```

---

## 💻 Implementation Reference

### Data Structure

```typescript
// src/features/treatment-care/constants/callScripts.ts
export const CALL_SCRIPTS = {
  SURGERY: {
    name: "Phẫu thuật / Nhổ răng khôn",
    greeting: "Xin chào anh/chị [Tên],\nEm là [Tên lễ tân]...",
    checklist: [
      "Vết thương có đau không ạ?",
      "Có sưng không ạ?",
      "Có chảy máu không ạ?",
      "Anh/chị có uống thuốc đúng giờ không ạ?",
      "Có ăn uống được bình thường không ạ?",
    ],
    redFlags: [
      "Đau > 7/10",
      "Chảy máu không ngừng",
      "Sưng quá mức, sốt cao",
      "Dị ứng thuốc",
    ],
    closing: "Nếu có bất kỳ vấn đề gì, anh/chị gọi ngay cho em...",
  },
  FILLING: { name: "Trám răng / Điều trị tủy" /* ... */ },
  CLEANING: { name: "Lấy cao răng / Tẩy trắng" /* ... */ },
  IMPLANT: { name: "Implant / Răng sứ" /* ... */ },
} as const;
```

### UI Component

```tsx
// CreateTreatmentCareModal
<Collapse>
  <Collapse.Panel header="📞 Kịch bản gọi (Tham khảo)" key="script">
    <Tabs>
      <Tabs.TabPane tab="Phẫu thuật" key="surgery">
        <pre>{CALL_SCRIPTS.SURGERY.greeting}</pre>
        <Typography.Title level={5}>Checklist:</Typography.Title>
        <ul>
          {CALL_SCRIPTS.SURGERY.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <Alert
          type="error"
          message="Red Flags"
          description={
            <ul>
              {CALL_SCRIPTS.SURGERY.redFlags.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          }
        />
      </Tabs.TabPane>
      {/* Other tabs... */}
    </Tabs>
  </Collapse.Panel>
</Collapse>
```
