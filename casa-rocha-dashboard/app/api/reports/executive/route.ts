import { NextRequest, NextResponse } from "next/server";
import { buildMarkdown, buildReportData } from "@/lib/report";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const preliminary = req.nextUrl.searchParams.get("preliminar") === "1";
  const data = await buildReportData(preliminary);
  const md = buildMarkdown(data);
  const filename = `resumo-executivo-${preliminary ? "PRELIMINAR-" : ""}${new Date().toISOString().slice(0, 10)}.md`;
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
