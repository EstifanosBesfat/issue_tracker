// app/issues/[id]/edit/page.tsx
import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import EditIssueForm from "@/app/issues/[id]/edit/EditIssueForm";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function EditIssuePage({ params }: Props) {
  const resolvedParams = 'then' in params ? await params : params;

  const issue = await prisma.issue.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!issue) notFound();

  return <EditIssueForm issue={issue} />;
}