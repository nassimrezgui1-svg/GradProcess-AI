import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let text = ""

    if (fileName.endsWith(".pdf")) {
      // Dynamic import to avoid build-time issues
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = ((await import("pdf-parse")) as any).default ?? (await import("pdf-parse"))
      const result = await pdfParse(buffer)
      text = result.text
    } else if (fileName.endsWith(".docx")) {
      const mammoth = await import("mammoth")
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (fileName.endsWith(".txt")) {
      text = buffer.toString("utf-8")
    } else {
      return NextResponse.json({ error: "Unsupported file type. Please upload PDF, DOCX, or TXT." }, { status: 400 })
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file. Try pasting the CV manually." }, { status: 422 })
    }

    return NextResponse.json({ text: text.trim() })
  } catch (error: any) {
    console.error("CV parse error:", error)
    return NextResponse.json({ error: "Failed to parse file. Try pasting the CV text manually." }, { status: 500 })
  }
}
