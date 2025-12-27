"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Tag,
  Space,
  Button,
  Input,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DollarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { KanbanBoard, useKanbanData } from "@/shared/components/Kanban";
import {
  INITIAL_DEALS,
  MOCK_STAGES,
  MockDeal,
  generateMoreDeals,
} from "./mockData";
import { useNotify } from "@/shared/hooks/useNotify";

const { Title, Text } = Typography;

export default function KanbanDemoPage() {
  const notify = useNotify();
  const [loading, setLoading] = useState(true);

  // 1. Initialize our shared Kanban hook
  const {
    groupedData,
    searchTerm,
    setSearchTerm,
    columnMetadata,
    setColumnMetadata,
    updateItemStatus,
    appendData,
    refreshData,
    data: allData,
  } = useKanbanData<MockDeal>({
    initialData: [],
    columns: MOCK_STAGES,
    groupByField: "stage",
    filterFn: (item, term) =>
      item.customerName.toLowerCase().includes(term.toLowerCase()) ||
      item.serviceName.toLowerCase().includes(term.toLowerCase()),
  });

  // 2. Simulate initial API fetch (As per guideline: Fetch flat items)
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshData(INITIAL_DEALS);

      const meta = MOCK_STAGES.reduce((acc, stage) => {
        acc[stage.key] = {
          hasMore: stage.key === "NEW" || stage.key === "LOST",
          totalCount: stage.key === "NEW" ? 50 : 100,
          isLoadingMore: false,
        };
        return acc;
      }, {} as Record<string, { hasMore: boolean; totalCount: number; isLoadingMore: boolean }>);

      setColumnMetadata(meta);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [refreshData, setColumnMetadata]);

  // 3. Handle Drag End (Guideline: Mutation calls Server Action)
  const handleDragEnd = async (
    itemId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    try {
      // Simulate API call delay
      // await updateStageAction(itemId, newStatus);

      // Pattern: Update local state for immediate feedback
      updateItemStatus(itemId, newStatus);

      const item = allData.find((i) => i.id === itemId);
      notify.success(
        `Đã chuyển ${item?.customerName} sang ${
          MOCK_STAGES.find((s) => s.key === newStatus)?.label
        }`
      );
    } catch (error) {
      notify.error(error);
    }
  };

  // 4. Handle Load More
  const handleLoadMore = (columnKey: string) => {
    setColumnMetadata((prev) => ({
      ...prev,
      [columnKey]: { ...prev[columnKey], isLoadingMore: true },
    }));

    // Simulate API call
    setTimeout(() => {
      const newItems = generateMoreDeals(columnKey, 5);
      appendData(newItems);

      setColumnMetadata((prev) => ({
        ...prev,
        [columnKey]: {
          ...prev[columnKey],
          isLoadingMore: false,
          hasMore:
            prev[columnKey].totalCount > groupedData[columnKey].length + 5,
        },
      }));
    }, 800);
  };

  const getStats = (items: MockDeal[]) => {
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    return {
      count: items.length,
      sum: totalAmount,
      label: `${items.length} deal${items.length !== 1 ? "s" : ""} - ${(
        totalAmount / 1000000
      ).toFixed(1)}M`,
    };
  };

  const renderCard = (deal: MockDeal, isDragging: boolean) => (
    <Card
      size="small"
      hoverable
      style={{
        borderLeft: `4px solid ${
          deal.priority === "High"
            ? "#ff4d4f"
            : deal.priority === "Medium"
            ? "#faad14"
            : "#52c41a"
        }`,
        boxShadow: isDragging
          ? "0 8px 16px rgba(0,0,0,0.1)"
          : "0 1px 2px rgba(0,0,0,0.05)",
      }}
    >
      <Space direction="vertical" style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "start",
          }}
        >
          <Text strong style={{ fontSize: "14px" }}>
            {deal.customerName}
          </Text>
          <Tag
            color={
              deal.priority === "High"
                ? "red"
                : deal.priority === "Medium"
                ? "orange"
                : "green"
            }
            style={{ margin: 0, fontSize: "10px" }}
          >
            {deal.priority}
          </Tag>
        </div>
        <Text type="secondary" style={{ fontSize: "12px" }}>
          {deal.serviceName}
        </Text>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "4px",
          }}
        >
          <Text type="danger" strong>
            {deal.amount.toLocaleString()} đ
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {deal.createdAt}
          </Text>
        </div>
      </Space>
    </Card>
  );

  return (
    <div style={{ padding: "24px" }}>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: "24px" }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Sales Pipeline (Demo)
          </Title>
          <Text type="secondary">
            Sử dụng pattern: shared context + feature hooks
          </Text>
        </Col>
        <Col>
          <Space>
            <Input
              placeholder="Tìm kiếm khách hàng, dịch vụ..."
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />}>
              Thêm Deal
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card styles={{ body: { padding: "12px" } }}>
            <Statistic
              title="Tổng doanh thu tiềm năng"
              value={allData.reduce((s, i) => s + i.amount, 0)}
              prefix={<DollarOutlined />}
              suffix="đ"
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card styles={{ body: { padding: "12px" } }}>
            <Statistic
              title="Tổng số deal"
              value={allData.length}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <KanbanBoard
        data={groupedData}
        isLoading={loading}
        columns={MOCK_STAGES}
        groupByField="stage"
        renderCard={renderCard}
        onDragEnd={handleDragEnd}
        onLoadMore={handleLoadMore}
        columnMetadata={columnMetadata}
        showColumnStats
        getColumnStats={getStats}
        height="calc(100vh - 280px)"
      />
    </div>
  );
}
