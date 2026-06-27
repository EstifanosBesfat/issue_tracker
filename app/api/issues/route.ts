// app/api/issues/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/client"; 
import { issueSchema } from "@/app/validationSchemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = issueSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(validation.error.format(), { status: 400 });
    }

    const newIssue = await prisma.issue.create({
      data: {
        title: body.title,
        description: body.description,
        priority: body.priority || 'MEDIUM', // Safely fall back to default Priority
        category: body.category || 'OTHER',   // Safely fall back to default Category
      },
    });

    return NextResponse.json(newIssue, { status: 201 });
  } catch (error) {
    // This outputs the exact database error in your server terminal
    console.error("POST /api/issues error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}