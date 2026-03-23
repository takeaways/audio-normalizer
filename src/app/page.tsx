"use client";

import { useState, useRef, useCallback } from "react";

type Status = "idle" | "loading" | "processing" | "done" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FFmpegInstance = any;

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [fileName, setFileName] = useState("");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ffmpegRef = useRef<FFmpegInstance>(null);
  const [ffmpegReady, setFfmpegReady] = useState(false);

  const loadFFmpeg = useCallback(async (): Promise<FFmpegInstance> => {
    if (ffmpegRef.current && ffmpegReady) return ffmpegRef.current;

    setProgressText("오디오 엔진을 준비하고 있습니다... (처음 한 번만)");
    setProgress(0);

    // 로컬에서 ESM 모듈 로드 (same-origin으로 CORS/COEP 문제 없음)
    // @ts-expect-error local ESM import
    const { FFmpeg } = await import(/* webpackIgnore: true */ "/ffmpeg/index.js");

    const ffmpeg = new FFmpeg();
    ffmpeg.on("progress", ({ progress: p }: { progress: number }) => {
      const pct = Math.min(Math.max(Math.round(p * 100), 0), 100);
      setProgress(pct);
    });

    await ffmpeg.load({
      coreURL: "/ffmpeg/ffmpeg-core.js",
      wasmURL: "/ffmpeg/ffmpeg-core.wasm",
    });

    ffmpegRef.current = ffmpeg;
    setFfmpegReady(true);
    return ffmpeg;
  }, [ffmpegReady]);

  const processFile = useCallback(
    async (file: File) => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
        setDownloadUrl(null);
      }

      const ext = file.name.split(".").pop()?.toLowerCase() || "mp3";
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const inputName = `input.${ext}`;
      const tempName = `temp.mp3`;
      const outputName = `output.mp3`;

      setFileName(file.name);
      setStatus("loading");
      setErrorMsg("");
      setProgress(0);

      try {
        const ffmpeg = await loadFFmpeg();

        setStatus("processing");
        setProgressText("파일을 읽고 있습니다...");
        setProgress(5);

        // 파일을 ArrayBuffer로 읽기
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        await ffmpeg.writeFile(inputName, uint8Array);

        // Step 1: 컴프레서 + 리미터
        setProgressText("1단계: 소리 크기를 균일하게 맞추고 있습니다...");
        setProgress(10);
        await ffmpeg.exec([
          "-i",
          inputName,
          "-af",
          "acompressor=threshold=-20dB:ratio=4:attack=10:release=200:makeup=2,alimiter=limit=-1.5dB:level=false",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          tempName,
        ]);

        // Step 2: 라우드니스 정규화
        setProgressText("2단계: 유튜브 표준 볼륨에 맞추고 있습니다...");
        setProgress(55);
        await ffmpeg.exec([
          "-i",
          tempName,
          "-af",
          "loudnorm=I=-16:TP=-1.5:LRA=11",
          "-c:a",
          "libmp3lame",
          "-q:a",
          "2",
          outputName,
        ]);

        setProgressText("완료 파일을 준비하고 있습니다...");
        setProgress(90);
        const data = await ffmpeg.readFile(outputName);
        const blob = new Blob([new Uint8Array(data)], { type: "audio/mpeg" });
        const url = URL.createObjectURL(blob);

        setDownloadUrl(url);
        setDownloadName(`${baseName}_normalized.mp3`);
        setProgress(100);
        setStatus("done");
        setProgressText("");

        // 임시 파일 정리
        try {
          await ffmpeg.deleteFile(inputName);
          await ffmpeg.deleteFile(tempName);
          await ffmpeg.deleteFile(outputName);
        } catch {
          // ignore cleanup errors
        }
      } catch (err) {
        console.error(err);
        setStatus("error");
        setErrorMsg(
          "처리 중 오류가 발생했습니다. 파일이 올바른 오디오 파일인지 확인해주세요."
        );
      }
    },
    [downloadUrl, loadFFmpeg]
  );

  const handleFile = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      const ext = file.name.split(".").pop()?.toLowerCase();
      const validExts = ["mp3", "wav", "m4a", "aac", "flac", "ogg", "mp4"];

      if (!validExts.includes(ext || "")) {
        setStatus("error");
        setErrorMsg(
          "지원하지 않는 파일 형식입니다. MP3, WAV, M4A, AAC, FLAC 파일을 사용해주세요."
        );
        return;
      }
      processFile(file);
    },
    [processFile]
  );

  const reset = useCallback(() => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setStatus("idle");
    setProgress(0);
    setProgressText("");
    setFileName("");
    setDownloadUrl(null);
    setDownloadName("");
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [downloadUrl]);

  return (
    <main className="flex-1 flex flex-col">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 px-6 py-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
          오디오 노멀라이저
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
          오디오 파일의 소리 크기를 유튜브 표준에 맞게
          <br className="hidden sm:block" />
          자동으로 보정해주는 무료 도구입니다
        </p>
      </header>

      {/* 메인 */}
      <div className="flex-1 flex flex-col items-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-2xl space-y-8">
          {/* 업로드 영역 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            {status === "idle" && (
              <div
                className={`
                  border-3 border-dashed rounded-xl p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${
                    dragOver
                      ? "border-blue-600 bg-blue-50 scale-[1.01]"
                      : "border-gray-300 hover:border-blue-600 hover:bg-blue-50/50"
                  }
                `}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files);
                }}
              >
                <div className="text-6xl mb-5">🎵</div>
                <p className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3">
                  여기를 클릭하거나
                  <br />
                  오디오 파일을 끌어다 놓으세요
                </p>
                <p className="text-base text-gray-400">
                  MP3, WAV, M4A, AAC, FLAC 지원
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,.aac,.flac,.ogg,.mp4"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files)}
                />
              </div>
            )}

            {(status === "loading" || status === "processing") && (
              <div className="text-center py-8">
                <div className="text-6xl mb-6 animate-bounce">⏳</div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {fileName}
                </p>
                <p className="text-base text-blue-600 mb-6">{progressText}</p>

                <div className="w-full bg-gray-200 rounded-full h-5 mb-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-base text-gray-500 font-medium">
                  {progress}%
                </p>
              </div>
            )}

            {status === "done" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-5">✅</div>
                <p className="text-2xl font-bold text-green-600 mb-2">
                  처리 완료!
                </p>
                <p className="text-base text-gray-500 mb-8">{fileName}</p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={downloadUrl!}
                    download={downloadName}
                    className="
                      inline-flex items-center justify-center gap-3
                      bg-blue-600 hover:bg-blue-700 text-white
                      text-lg font-semibold px-8 py-4 rounded-xl
                      transition-colors duration-200 shadow-md
                    "
                  >
                    ⬇️ 파일 다운로드
                  </a>
                  <button
                    onClick={reset}
                    className="
                      inline-flex items-center justify-center gap-3
                      bg-gray-100 hover:bg-gray-200 text-gray-700
                      text-lg font-semibold px-8 py-4 rounded-xl
                      transition-colors duration-200
                    "
                  >
                    🔄 다른 파일 처리하기
                  </button>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-8">
                <div className="text-6xl mb-5">❌</div>
                <p className="text-xl font-bold text-red-600 mb-2">
                  오류가 발생했습니다
                </p>
                <p className="text-base text-gray-500 mb-6">{errorMsg}</p>
                <button
                  onClick={reset}
                  className="
                    inline-flex items-center justify-center gap-2
                    bg-blue-600 hover:bg-blue-700 text-white
                    text-lg font-semibold px-8 py-4 rounded-xl
                    transition-colors duration-200
                  "
                >
                  다시 시도하기
                </button>
              </div>
            )}
          </section>

          {/* 사용 방법 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📋 사용 방법
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">
                  1
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    파일 선택
                  </p>
                  <p className="text-base text-gray-500 mt-1">
                    위의 점선 영역을 클릭하거나, 파일을 끌어다 놓으세요
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">
                  2
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    자동 처리
                  </p>
                  <p className="text-base text-gray-500 mt-1">
                    소리 크기 보정과 유튜브 표준 맞춤이 자동으로 진행됩니다
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">
                  3
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    다운로드
                  </p>
                  <p className="text-base text-gray-500 mt-1">
                    &quot;파일 다운로드&quot; 버튼을 눌러 완성된 파일을
                    저장하세요
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 이 도구가 하는 일 */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              🔧 이 도구가 하는 일
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">🔊</div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    소리 크기 균일화 (컴프레서)
                  </p>
                  <p className="text-base text-gray-500 mt-1 leading-relaxed">
                    너무 큰 소리는 줄이고, 너무 작은 소리는 키워서 전체적으로
                    고른 볼륨을 만들어 줍니다. TV 방송처럼 편안하게 들을 수
                    있습니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">📺</div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    유튜브 표준 볼륨 맞춤 (라우드니스 정규화)
                  </p>
                  <p className="text-base text-gray-500 mt-1 leading-relaxed">
                    유튜브 권장 기준(-16 LUFS)에 맞춰 볼륨을 조정합니다. 미리
                    맞춰서 올리면 음질 손실 없이 최적의 소리로 재생됩니다.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="text-3xl flex-shrink-0">🔒</div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">
                    파일이 외부로 전송되지 않습니다
                  </p>
                  <p className="text-base text-gray-500 mt-1 leading-relaxed">
                    모든 처리가 여러분의 컴퓨터(브라우저) 안에서 이루어집니다.
                    파일이 서버로 업로드되지 않으므로 안심하고 사용하세요.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 px-6 py-6 text-center">
        <p className="text-sm text-gray-400">
          브라우저에서 처리되므로 파일이 외부로 전송되지 않습니다
        </p>
      </footer>
    </main>
  );
}
