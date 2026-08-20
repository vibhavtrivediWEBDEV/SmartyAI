import { NextResponse } from "next/server";
import { requireFinderSubscription } from "@/lib/auth/finder-access";
import { seedLoaderProject } from "@/modules/workspace/workspace.repository";

/**
 * POST /api/workspaces/seed
 * Seed a complete React project with loader components
 */
export async function POST(request: Request) {
  try {
    const access = await requireFinderSubscription();
    if (access.response) return access.response;
    const user = access.user!;

    const workspace = await seedLoaderProject(user.id);

    return NextResponse.json({
      success: true,
      data: workspace,
      message: "Loader project seeded successfully",
    }, { status: 201 });
  } catch (error) {
    console.error("Error seeding loader project:", error);
    return NextResponse.json(
      { 
        error: "Failed to seed loader project",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
