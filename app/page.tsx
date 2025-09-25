"use client";

import { useRef, useState } from "react";

export default function Home() {
  const audioRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("en"); // 👈 default English

  // - mic recording state --
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handlePlayAndTranscribe = async () => {
    // Play audio
    audioRef!.current!.play();

    // Send file to API
    setLoading(true);
    try {
      const formData = new FormData();
      const response = await fetch("/cholesterol_bilirubin_high.m4a");
      const blob = await response.blob();
      formData.append("file", blob, "cholesterol_bilirubin_high.m4a");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "x-language": language },
        body: formData,
      });

      const data = await res.json();
      setTranscript(data.transcript || "No transcript returned");
    } catch (err) {
      console.error("Error: ", err);
      setTranscript("Failed to transcribe");
    } finally {
      setLoading(false);
    }
  };

  // Start mic recording (not realtime transcription)
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      if (audioBlob.size === 0) {
        console.error("Empty audio blob");
        setTranscript("❌ No audio captured");
        return;
      }

      const formData = new FormData();
      formData.append("file", audioBlob, "mic-input.webm");

      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        console.log("Transcription response:", data); // ✅ debug log
        setTranscript(data.transcript || "❌ No transcript returned");
      } catch (err) {
        console.error("Mic error:", err);
        setTranscript("❌ Mic transcription failed");
      }
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🎙️ Voice Agent Demo</h1>

      {/* Language toggle */}
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="en">English</option>
        <option value="ko">한국어 (Korean)</option>
      </select>

      {/* Play & Transcribe (file) */}
      <div className="space-y-2">
        <button
          onClick={handlePlayAndTranscribe}
          className="px-4 py-2 bg-blue-600 text-white rounded"
          disabled={loading}
        >
          {loading ? "Transcribing..." : "▶️ Play & Transcribe File"}
        </button>
        <audio ref={audioRef} src="/cholesterol_bilirubin_high.m4a" />
      </div>

      {/* Record & Transcribe (mic) */}
      <div className="space-y-2">
        <button
          onClick={recording ? stopRecording : startRecording}
          className={`px-4 py-2 rounded ${
            recording ? "bg-red-600" : "bg-green-600"
          } text-white`}
        >
          {recording ? "⏹ Stop Recording" : "🎤 Start Recording"}
        </button>
      </div>

      {/* Transcript output */}
      {transcript && (
        <div className="mt-6 p-4 border rounded bg-gray-50">
          <h2 className="font-semibold text-black">Transcript:</h2>
          <p className="text-black">{transcript}</p>
        </div>
      )}
    </main>
  );
}
