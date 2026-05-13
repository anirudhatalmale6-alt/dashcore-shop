import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CmsPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const page = await prisma.cmsPage.findUnique({
    where: { slug, active: true },
  });

  if (!page) notFound();

  return (
    <div>
      <section className="hero-light relative pt-28 pb-10 sm:pt-36 sm:pb-14">
        <div className="hero-pattern" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a]">
            {page.title}
          </h1>
        </div>
      </section>

      <section className="pb-16 sm:pb-24 -mt-4 relative z-10">
        <div className="mx-auto max-w-3xl px-5">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] p-7 sm:p-10 shadow-sm">
            <div
              className="prose prose-sm max-w-none text-[#475569]"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
