// app/issues/[id]/edit/page.tsx
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import EditIssueForm from "./EditIssueForm";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | null;
  category?: 'MOBILE_NETWORK' | 'FIBER_BROADBAND' | 'TELEBIRR_BILLING' | 'CORE_INFRASTRUCTURE' | 'OTHER' | null;
  createdAt: Date;
  updatedAt: Date;
}

export default async function EditIssuePage({ params }: Props) {
  const resolvedParams = 'then' in params ? await params : params;

  const issue = (await prisma.issue.findUnique({
    where: { id: resolvedParams.id }
  })) as Issue | null;

  if (!issue) notFound();

  return <EditIssueForm issue={issue} />;
}