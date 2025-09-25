// fast experimenting with speech to text aka DeepGram's biggest supported strength
import { NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

export async function POST(req) {
  try {
    const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

    const lang = req.headers.get("x-language") || "en";

    // Get file from request
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let options = { smart_format: true };
    if (lang == "ko") {
      // https://deepgram.com/learn/enhanced-korean
      options.model = "general";
      options.language = "ko";
      options.tier = "enhanced";
      options.version = "beta";
      options.smart_format = true;
    } else {
      options.model = "nova-3";
    }

    // Send to Deepgram
    const response = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      options
    );

    const transcript =
      response.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
      "";

    return NextResponse.json({
      transcript,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
