// src/app/api/v1/sales-pipeline/kanban/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/server/utils/sessionCache";
import { consultedServiceRepo } from "@/server/repos/consulted-service.repo";
import { SALES_STAGES } from "@/shared/validation/consulted-service.schema";

/**
 * GET /api/v1/sales-pipeline/kanban
 * Fetch paginated data for all stages (Kanban view)
 * Query params:
 * - clinicId?: string (admin can filter by clinic)
 * - stages?: comma-separated stage keys
 * - page?: number (default: 1)
 * - pageSize?: number (default: 20)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clinicIdParam = searchParams.get("clinicId");
    const stagesParam = searchParams.get("stages");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

    // Determine clinic scope
    const isAdmin = user.role === "admin";
    const targetClinicId =
      isAdmin && clinicIdParam ? clinicIdParam : user.clinicId;

    if (!targetClinicId) {
      return NextResponse.json(
        { error: "Clinic ID is required" },
        { status: 400 }
      );
    }

    // Parse stages to fetch
    const stagesToFetch = stagesParam
      ? stagesParam
          .split(",")
          .filter((s) => (SALES_STAGES as readonly string[]).includes(s))
      : SALES_STAGES;

    // Fetch data for all stages in parallel
    const results = await Promise.all(
      stagesToFetch.map((stage) =>
        consultedServiceRepo.listByStage({
          clinicId: targetClinicId,
          stage,
          page,
          pageSize,
        })
      )
    );

    // Transform to grouped response
    const data: Record<string, unknown[]> = {};
    const metadata: Record<string, { hasMore: boolean; totalCount: number }> =
      {};

    stagesToFetch.forEach((stage, index) => {
      const result = results[index];
      data[stage] = result.items;
      metadata[stage] = {
        hasMore: result.hasMore,
        totalCount: result.totalCount,
      };
    });

    return NextResponse.json({ data, metadata });
  } catch (error) {
    console.error("Error fetching Kanban data:", error);
    return NextResponse.json(
      { error: "Failed to fetch Kanban data" },
      { status: 500 }
    );
  }
}
