// src/features/leads/hooks/useLeadAnalytics.js
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { getLeadsForAnalytics } from "../services/leadServices";

export function useLeadAnalytics() {
  const [stats, setStats] = useState({ total: 0, scheduled: 0, arrived: 0 });
  const [loading, setLoading] = useState(true);

  const [filterDateRange, setFilterDateRange] = useState("this_month");
  const [filterService, setFilterService] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState(null);

  useEffect(() => {
    const fetchAndCalculateStats = async () => {
      setLoading(true);

      const now = dayjs();
      let startDate, endDate;

      switch (filterDateRange) {
        case "last_3_months":
          startDate = now.subtract(3, "months").startOf("day");
          endDate = now.endOf("day");
          break;
        case "last_6_months":
          startDate = now.subtract(6, "months").startOf("day");
          endDate = now.endOf("day");
          break;
        case "last_1_year":
          startDate = now.subtract(1, "year").startOf("day");
          endDate = now.endOf("day");
          break;
        case "this_month":
        default:
          startDate = now.startOf("month");
          endDate = now.endOf("month");
          break;
      }

      try {
        const leads = await getLeadsForAnalytics({
          startDate: startDate.toDate(),
          endDate: endDate.toDate(),
          service: filterService,
          employeeId: filterEmployee,
        });

        const calculatedStats = leads.reduce(
          (acc, lead) => {
            if (lead.trangThaiLead === "da_den") {
              acc.arrived++;
              acc.scheduled++;
            } else if (lead.trangThaiLead === "dat_lich") {
              acc.scheduled++;
            }
            return acc;
          },
          { total: leads.length, scheduled: 0, arrived: 0 }
        );

        setStats(calculatedStats);
      } catch (error) {
        console.error("Lỗi tính toán thống kê leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndCalculateStats();
  }, [filterDateRange, filterService, filterEmployee]);

  return {
    stats,
    loading,
    filterDateRange,
    setFilterDateRange,
    filterService,
    setFilterService,
    filterEmployee,
    setFilterEmployee,
  };
}
