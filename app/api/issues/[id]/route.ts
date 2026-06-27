// app/api/issues/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client";
import { patchIssueSchema } from "@/app/validationSchemas";

interface RouteParams {
  params: { id: string } | Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    const body = await request.json();
    const validation = patchIssueSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!issue) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 404 });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: resolvedParams.id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        category: body.category,
      },
    });

    return NextResponse.json(updatedIssue);
  } catch (error) {
    console.error("PATCH /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = 'then' in params ? await params : params;
    
    const issue = await prisma.issue.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!issue) {
      return NextResponse.json({ error: "Invalid issue ID" }, { status: 404 });
    }

    await prisma.issue.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: "Issue deleted successfully." });
  } catch (error) {
    console.error("DELETE /api/issues/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}