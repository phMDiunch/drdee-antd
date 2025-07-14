import { useState, useEffect, useMemo } from "react";
import { getLeads } from "../services/leadServices";

export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState();
  const [filterPotential, setFilterPotential] = useState();

  useEffect(() => {
    setLoading(true);
    getLeads({
      status: filterStatus,
      potential: filterPotential,
      search,
    }).then((data) => {
      setLeads(data || []);
      setLoading(false);
    });
  }, [filterStatus, filterPotential, search]);

  // Lấy unique nguồn tương tác để lọc nếu cần
  const uniqueChannels = useMemo(
    () => [...new Set(leads.map((l) => l.kenhTuongTac).filter(Boolean))],
    [leads]
  );

  return {
    leads,
    loading,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    filterPotential,
    setFilterPotential,
    uniqueChannels,
  };
}
