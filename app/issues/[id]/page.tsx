import prisma from "@/prisma/client";
import { notFound } from "next/navigation";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

interface Props {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function IssueDetailPage({ params }: Props) {
  const resolvedParams = 'then' in params ? await params : params;
  
  const issue = await prisma.issue.findUnique({
    where: { id: resolvedParams.id }
  });

  if (!issue) notFound();

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-6 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{issue.title}</h1>
          <div className="flex gap-2 items-center mt-2">
            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset ${
              issue.status === 'OPEN' 
                ? 'bg-red-50 text-red-700 ring-red-600/10' 
                : issue.status === 'IN_PROGRESS' 
                ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' 
                : 'bg-green-50 text-green-700 ring-green-600/20'
            }`}>
              {issue.status}
            </span>
            <span className="text-sm text-gray-500">
              Created: {new Date(issue.createdAt).toDateString()}
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Link
            href={`/issues/${issue.id}/edit`}
            className="rounded-md bg-white border border-gray-300 px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Edit
          </Link>
          <DeleteButton issueId={issue.id} />
        </div>
      </div>

      <div className="prose max-w-none pt-2">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Description</h3>
        <p className="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{issue.description}</p>
      </div>
    </div>
  );
}