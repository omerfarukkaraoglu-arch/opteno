import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  QrCode,
  Check,
  Scan,
  ArrowRight,
  RotateCcw,
  Eye,
  Save,
  X,
  Edit3,
  HelpCircle,
  Plus,
  UploadCloud,
  Flashlight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { omrEngine } from '../../services/omrEngine';
import { storageService } from '../../services/storageService';
import { qrService } from '../../services/qrService';
import { Exam, ScanResult, OMRQRData, Student, SubjectResult } from '../../types';
import { getExamAnswerBottom } from '../../services/pdfService';

function playBeepSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // AudioContext blocked
  }
}

function triggerVibrate() {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 50, 80]);
    }
  } catch (e) {
    // ignore
  }
}

interface CameraScannerProps {
  onScanComplete?: (result: ScanResult) => void;
}

export type ScanStage = 'STEP1_QR' | 'STEP2_A4_FORM';

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScanComplete }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Workflow Stage
  const [scanStage, setScanStage] = useState<ScanStage>('STEP1_QR');

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);

  // Verification & Review Modal States
  const [pendingResult, setPendingResult] = useState<ScanResult | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [activeSubjectTab, setActiveSubjectTab] = useState<number>(0);

  // When verification modal opens, focus on first subject with uncertain marks (or first subject)
  useEffect(() => {
    if (isVerifyModalOpen && pendingResult && detectedExam && detectedExam.subjects.length > 0) {
      const uncertainIdx = detectedExam.subjects.findIndex(s =>
        pendingResult.answers.some(a => a.subjectName === s.name && a.isUncertain)
      );
      if (uncertainIdx !== -1) {
        setActiveSubjectTab(uncertainIdx);
      } else {
        setActiveSubjectTab(0);
      }
    }
  }, [isVerifyModalOpen]);

  // HUD Realtime Detection States
  const [detectedQR, setDetectedQR] = useState<OMRQRData | null>(null);
  const [detectedStudent, setDetectedStudent] = useState<Student | null>(null);
  const [detectedExam, setDetectedExam] = useState<Exam | null>(null);
  const [isCornersAligned, setIsCornersAligned] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Optik üzerindeki Karekodu (QR) kare kameraya doğrultun');
  const [scanPaperFormat, setScanPaperFormat] = useState<'A4' | 'A5'>('A4');
  const [isTorchSupported, setIsTorchSupported] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [sessionScannedCount, setSessionScannedCount] = useState<number>(0);

  const toggleTorch = async () => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextState = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextState }]
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.warn('Torch constraint failed:', err);
    }
  };

  const exams = storageService.getExams();

  useEffect(() => {
    if (exams.length > 0 && !selectedExamId) {
      setSelectedExamId(exams[0].id);
    }
  }, []);

  // Stop current active media stream
  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsTorchOn(false);
    setIsTorchSupported(false);
    setIsCameraActive(false);
  }, []);

  // Start Camera Stream with multi-stage fallback
  const startCamera = async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Tarayıcınız kamera erişimini desteklemiyor veya bağlantınız HTTPS değil.";
      setCameraError(msg);
      return;
    }

    // Brief pause to allow camera hardware to release previous stream tracks cleanly
    await new Promise(r => setTimeout(r, 150));

    let stream: MediaStream | null = null;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } catch (e1) {
      console.warn('Stage 1 camera request failed, trying simple rear camera constraint...', e1);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      } catch (e2) {
        console.warn('Stage 2 camera request failed, trying default camera...', e2);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (e3: any) {
          console.error('All camera attempts failed:', e3);
          const errorMsg = `${e3.name || 'Erişim Engellendi'}: ${e3.message || 'Kamera açılamadı'}`;
          setCameraError(errorMsg + ' (Lütfen tarayıcı izinlerinden kameraya izin verildiğinden emin olun.)');
          setIsCameraActive(false);
          return;
        }
      }
    }

    if (stream) {
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(playErr => {
          console.warn('Video play deferred or blocked:', playErr);
        });
      }

      // Check hardware torch capability
      try {
        const track = stream.getVideoTracks()[0];
        const caps = (track as any)?.getCapabilities?.();
        if (caps && 'torch' in caps) {
          setIsTorchSupported(true);
        } else {
          setIsTorchSupported(false);
        }
      } catch {
        setIsTorchSupported(false);
      }

      setIsCameraActive(true);
      if (scanStage === 'STEP1_QR') {
        setStatusMessage('Optik üzerindeki Karekodu (QR) kare kameraya doğrultun');
      } else {
        setStatusMessage('Cevap alanının 4 köşesindeki siyah kareleri ekrandaki çerçevelere hizalayın');
      }
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [scanStage]);

  // STAGE 1: Real-Time QR Code Reader Interval
  useEffect(() => {
    if (!isCameraActive || scanStage !== 'STEP1_QR' || isProcessing || isVerifyModalOpen) return;

    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current || isProcessing) return;
      const video = videoRef.current;
      if (video.readyState < 2) return;

      const canvas = canvasRef.current;
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;
      canvas.width = vWidth;
      canvas.height = vHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, vWidth, vHeight);
      const imageData = ctx.getImageData(0, 0, vWidth, vHeight);

      // Attempt 1: Full frame decode
      let qrData = qrService.decodeQRCodeFromImageData(imageData);

      // Attempt 2: Center crop decode
      if (!qrData && vWidth > 100 && vHeight > 100) {
        const cropSize = Math.round(Math.min(vWidth, vHeight) * 0.65);
        const cropX = Math.round((vWidth - cropSize) / 2);
        const cropY = Math.round((vHeight - cropSize) / 2);
        try {
          const centerData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
          qrData = qrService.decodeQRCodeFromImageData(centerData);
        } catch {
          // ignore crop errors
        }
      }

      if (qrData && (qrData.examId || qrData.examCode)) {
        const exams = storageService.getExams();
        const matchedExam = storageService.getExamById(qrData.examId) ||
          exams.find(e => e.examCode === qrData.examCode || e.id === qrData.examId) ||
          (qrData.examId ? qrService.examFromQR(qrData) : undefined);

        if (matchedExam) {
          setDetectedQR(qrData);
          setDetectedExam(matchedExam);
          setSelectedExamId(matchedExam.id);
          playBeepSound();
          triggerVibrate();

          if (qrData.studentId || qrData.studentNo) {
            const instId = qrData.instId || storageService.getCurrentUser().institutionId;
            const students = storageService.getStudents(instId);
            const matchedStudent = students.find(s => s.id === qrData.studentId || s.studentNo === qrData.studentNo);
            if (matchedStudent) {
              setDetectedStudent(matchedStudent);
            }
          }

          setTimeout(() => {
            setScanStage('STEP2_A4_FORM');
          }, 300);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isCameraActive, scanStage, isProcessing, isVerifyModalOpen]);

  const alignmentLockCountRef = useRef<number>(0);
  const isAutoScanningRef = useRef<boolean>(false);
  const lastCornersRef = useRef<{ x: number; y: number } | null>(null);

  // STAGE 2: Real-time Auto-Scan Alignment Detector Loop (Strict 4/4 Anchor Verification)
  useEffect(() => {
    if (!isCameraActive || scanStage !== 'STEP2_A4_FORM' || isProcessing || isVerifyModalOpen || pendingResult) {
      alignmentLockCountRef.current = 0;
      lastCornersRef.current = null;
      return;
    }

    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || isProcessing || isAutoScanningRef.current || isVerifyModalOpen) return;
      const video = videoRef.current;
      if (video.readyState < 2) return;

      const canvas = canvasRef.current;
      const vWidth = video.videoWidth || 1280;
      const vHeight = video.videoHeight || 720;
      canvas.width = vWidth;
      canvas.height = vHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, vWidth, vHeight);

      try {
        const imageData = ctx.getImageData(0, 0, vWidth, vHeight);
        const grayData = new Uint8Array(vWidth * vHeight);
        const pixels = imageData.data;
        for (let i = 0; i < grayData.length; i++) {
          grayData[i] = Math.round(0.299 * pixels[i * 4] + 0.587 * pixels[i * 4 + 1] + 0.114 * pixels[i * 4 + 2]);
        }

        const alignResult = omrEngine.checkAlignmentQuick(grayData, vWidth, vHeight, detectedExam || undefined);
        const isAligned = alignResult.aligned;
        setIsCornersAligned(isAligned);

        if (isAligned) {
          // Check corner stability to guarantee the phone is motionless (prevents motion blur)
          const curTL = alignResult.corners.TL;
          const prevTL = lastCornersRef.current;
          const cornerShift = prevTL ? Math.hypot(curTL.x - prevTL.x, curTL.y - prevTL.y) : 0;
          lastCornersRef.current = curTL;

          if (cornerShift > 10) {
            // Hand moved during alignment; reset counter to prevent blurry capture
            alignmentLockCountRef.current = 1;
            setStatusMessage('🎯 Hizalandı! Kamerayı sabit tutun...');
          } else {
            alignmentLockCountRef.current += 1;
            const pct = Math.min(100, Math.round((alignmentLockCountRef.current / 6) * 100));
            setStatusMessage(`🎯 Sabit Tutun... (%${pct})`);

            // Require 6 steady ticks (~1.8s) of motionless alignment
            if (alignmentLockCountRef.current >= 6 && !isAutoScanningRef.current) {
              isAutoScanningRef.current = true;
              alignmentLockCountRef.current = 0;
              lastCornersRef.current = null;
              setStatusMessage('📸 Optik Okunuyor...');
              await captureAndScan();
              isAutoScanningRef.current = false;
            }
          }
        } else {
          alignmentLockCountRef.current = 0;
          lastCornersRef.current = null;
          setStatusMessage('4 köşe kareyi ekrandaki kutulara hizalayın ve sabit tutun');
        }
      } catch (err) {
        // ignore auto-scan loop errors
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isCameraActive, scanStage, isProcessing, isVerifyModalOpen, pendingResult, detectedExam]);

  // STAGE 2: Explicit Snapshot Reading & Overlay Verification Trigger
  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) return;

    const video = videoRef.current;
    if (video.readyState < 2) {
      setStatusMessage('Kamera görüntüsü bekleniyor...');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Optik Okunuyor ve Cevaplar Analiz Ediliyor...');

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1920;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const res = await omrEngine.processCanvas(
        canvas,
        selectedExamId,
        detectedStudent?.id,
        detectedQR || undefined
      );

      setIsCornersAligned(res.cornersAligned);
      if (res.qrData) setDetectedQR(res.qrData);
      if (res.detectedStudent) setDetectedStudent(res.detectedStudent);
      if (res.detectedExam) setDetectedExam(res.detectedExam);

      if (res.success && res.result) {
        setPendingResult(res.result);
        setIsVerifyModalOpen(true);
        setStatusMessage('Optik Okundu! Lütfen eşleşmeleri kontrol edip "Okumayı Bitir ve Kaydet" butonuna tıklayın.');
        playBeepSound();
        triggerVibrate();
      } else {
        setStatusMessage(res.error || 'Optik form okunamadı. Lütfen cevap alanının 4 siyah köşe karesini çerçeveye hizalayın.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setStatusMessage('Optik tarama sırasında hata oluştu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset workflow back to Stage 1 (QR Scanner)
  const handleResetToQR = () => {
    setDetectedQR(null);
    setDetectedExam(null);
    setDetectedStudent(null);
    setLastResult(null);
    setPendingResult(null);
    setIsVerifyModalOpen(false);
    setIsCornersAligned(false);
    setScanStage('STEP1_QR');
  };

  // Demo Sample Test Sheet Generator
  const runDemoScan = async () => {
    if (!canvasRef.current || isProcessing) return;

    setIsProcessing(true);
    setStatusMessage('Demo Optik Hazırlanıyor ve Okunuyor...');

    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Answer Section Corners in Demo Canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(80, 250, 60, 60); // TL
    ctx.fillRect(canvas.width - 140, 250, 60, 60); // TR
    ctx.fillRect(80, canvas.height - 100, 60, 60); // BL
    ctx.fillRect(canvas.width - 140, canvas.height - 100, 60, 60); // BR

    const targetExam = detectedExam || (exams.length > 0 ? exams[0] : null);
    const examIdToUse = targetExam ? targetExam.id : selectedExamId;

    setTimeout(async () => {
      const res = await omrEngine.processCanvas(canvas, examIdToUse, detectedStudent?.id, detectedQR || undefined);
      setIsCornersAligned(true);
      if (res.qrData) setDetectedQR(res.qrData);

      if (res.success && res.result) {
        setPendingResult(res.result);
        setIsVerifyModalOpen(true);
        setStatusMessage('Demo Optik Okundu! Sonucu kontrol edip kaydedebilirsiniz.');
      } else {
        setStatusMessage(res.error || 'Demo okuma tamamlandı.');
      }
      setIsProcessing(false);
    }, 400);
  };

  // Toggle or Update Selected Option in Verification Modal (Interactive Virtual OMR)
  const handleAnswerOptionChange = (questionIndex: number, newOption: string | null) => {
    if (!pendingResult || !detectedExam) return;

    const updatedAnswers = pendingResult.answers.map((ans, idx) => {
      if (idx !== questionIndex) return ans;
      // Toggle if clicking already selected option
      const finalOpt = ans.selectedOption === newOption ? null : newOption;
      const isBlank = finalOpt === null;
      const isCorrect = finalOpt === ans.correctAnswer;
      return {
        ...ans,
        selectedOption: finalOpt,
        isBlank,
        isCorrect,
        isUncertain: false // Manually verified by operator
      };
    });

    const penaltyRatio = detectedExam.netPenaltyRatio !== undefined ? detectedExam.netPenaltyRatio : 4;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalEmpty = 0;

    const updatedSubjectResults: SubjectResult[] = detectedExam.subjects.map(subject => {
      let subCorrect = 0;
      let subWrong = 0;
      let subEmpty = 0;

      const subAnswers = updatedAnswers.filter(a => a.subjectName === subject.name);
      subAnswers.forEach(a => {
        if (a.isBlank) subEmpty++;
        else if (a.isCorrect) subCorrect++;
        else subWrong++;
      });

      totalCorrect += subCorrect;
      totalWrong += subWrong;
      totalEmpty += subEmpty;

      const subNet = penaltyRatio > 0
        ? Math.max(0, parseFloat((subCorrect - subWrong / penaltyRatio).toFixed(2)))
        : subCorrect;

      return {
        subjectName: subject.name,
        correctCount: subCorrect,
        wrongCount: subWrong,
        emptyCount: subEmpty,
        netCount: subNet
      };
    });

    const totalNet = penaltyRatio > 0
      ? Math.max(0, parseFloat((totalCorrect - totalWrong / penaltyRatio).toFixed(2)))
      : totalCorrect;

    const totalMaxQuestions = detectedExam.totalQuestions || 40;
    const totalScore = parseFloat(((totalNet / totalMaxQuestions) * 500).toFixed(2));

    setPendingResult({
      ...pendingResult,
      answers: updatedAnswers,
      subjectResults: updatedSubjectResults,
      totalCorrect,
      totalWrong,
      totalEmpty,
      totalNet,
      totalScore
    });
  };

  // Finalize & Save Scan Result to System Storage
  const handleConfirmAndSave = (redirectToExams: boolean = true) => {
    if (!pendingResult) return;

    storageService.saveScanResult(pendingResult);
    setLastResult(null);
    setSessionScannedCount(prev => prev + 1);
    setIsVerifyModalOpen(false);
    const savedResult = pendingResult;
    setPendingResult(null);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    if (redirectToExams && onScanComplete) {
      onScanComplete(savedResult);
      return;
    }

    // Reset back to Stage 1 for next student scan
    setDetectedQR(null);
    setDetectedExam(null);
    setDetectedStudent(null);
    setIsCornersAligned(false);
    setScanStage('STEP1_QR');
    setStatusMessage('✅ Öğrenci sonucu başarıyla kaydedildi! Yeni kağıt için karekodu okutun.');
  };

  // Retake Scan
  const handleRetakeScan = () => {
    setPendingResult(null);
    setIsVerifyModalOpen(false);
    setStatusMessage('Yeniden tarama için çerçeveyi hizalayıp butona dokunun.');
  };

  return (
    <div className="mx-auto max-w-4xl px-2 sm:px-4 py-4 space-y-4">
      {/* Stage Tracker Header */}
      <div className="glass-panel p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg ${
            scanStage === 'STEP1_QR' ? 'bg-indigo-600 shadow-indigo-500/30' : 'bg-emerald-600 shadow-emerald-500/30'
          }`}>
            {scanStage === 'STEP1_QR' ? <QrCode className="h-6 w-6" /> : <Scan className="h-6 w-6" />}
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-white flex items-center gap-2">
              {scanStage === 'STEP1_QR' ? 'Aşama 1: Karekod (QR) Tarama' : 'Aşama 2: Cevap Alanı Optik Okuma'}
            </h1>
            <p className="text-xs text-slate-400">
              {scanStage === 'STEP1_QR'
                ? 'Optik üzerindeki karekodu aşağıdaki kare kameraya hizalayın.'
                : 'Cevap alanının 4 köşesindeki siyah köşe karelerini ekrandaki çerçevelere hizalayın.'}
            </p>
          </div>
        </div>

        {scanStage === 'STEP2_A4_FORM' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToQR}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Başka bir optik QR tara"
            >
              <RotateCcw className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">Karekod Değiştir</span>
            </button>
          </div>
        )}
      </div>

      <div className="glass-panel overflow-hidden p-4 sm:p-6 space-y-4">

        {/* Detected Exam Information Banner (Stage 2) */}
        {detectedExam && (
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-between gap-3 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2 truncate">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="truncate">
                <strong className="text-white">Algılanan Sınav:</strong> {detectedExam.title} ({detectedExam.examCode})
              </span>
            </div>
            {detectedStudent && (
              <span className="badge badge-success text-[10px] shrink-0">
                {detectedStudent.firstName} {detectedStudent.lastName} ({detectedStudent.studentNo})
              </span>
            )}
          </div>
        )}

        {/* STAGE 1: SQUARE QR SCANNER VIEWFINDER */}
        {scanStage === 'STEP1_QR' && (
          <div className="space-y-4 text-center">
            <div className="relative max-w-xs aspect-square mx-auto w-full overflow-hidden rounded-3xl bg-black border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Karekod Kamera Görünümü"
                className={`h-full w-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {!isCameraActive && (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-slate-950">
                  {cameraError ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-rose-300">Kamera İzni Gerekli</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed px-2">
                        {cameraError}
                      </p>
                      <button
                        onClick={startCamera}
                        className="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 mx-auto"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Kamerayı Yeniden Başlat
                      </button>
                    </div>
                  ) : (
                    <>
                      <QrCode className="h-14 w-14 text-indigo-400 mb-2 animate-pulse" />
                      <p className="text-xs font-bold text-slate-200">Kamera Açılıyor...</p>
                    </>
                  )}
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Square QR Target Guideline Frame */}
              {isCameraActive && (
                <>
                  <div className="absolute inset-8 border-2 border-indigo-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="w-full h-0.5 bg-indigo-500/80 animate-pulse shadow-md shadow-indigo-500" />
                  </div>

                  <div className="absolute inset-x-3 bottom-4 flex justify-center pointer-events-none">
                    <div className="bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-indigo-500/40 text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5 shadow-xl">
                      <Zap className="h-3.5 w-3.5 text-amber-400 animate-spin" /> {statusMessage}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              {isTorchSupported && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
                    isTorchOn
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-amber-300'
                  }`}
                  title={isTorchOn ? 'Flaş / Feneri Kapat' : 'Flaş / Feneri Aç'}
                >
                  <Flashlight className={`w-3.5 h-3.5 ${isTorchOn ? 'fill-slate-950' : ''}`} />
                  <span>{isTorchOn ? 'Flaş Açık' : 'Flaş'}</span>
                </button>
              )}
              <button
                onClick={() => {
                  if (exams.length > 0) {
                    setDetectedExam(exams[0]);
                    setScanStage('STEP2_A4_FORM');
                  }
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Karekodu Atla (Manuel Devam Et)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STAGE 2: PORTRAIT A4 / A5 OPTICAL FORM SCANNER VIEWFINDER */}
        {scanStage === 'STEP2_A4_FORM' && (
          <div className="space-y-3">
            {/* Viewfinder Format Selector (A4 vs A5) & Flashlight */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-300">Vizör Rehberi:</span>
              <div className="flex items-center gap-2">
                {isTorchSupported && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    className={`px-3 py-1 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border ${
                      isTorchOn
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/20'
                        : 'bg-slate-900/90 text-slate-300 border-slate-700/60 hover:text-amber-300'
                    }`}
                    title={isTorchOn ? 'Flaş / Feneri Kapat' : 'Flaş / Feneri Aç'}
                  >
                    <Flashlight className={`w-3.5 h-3.5 ${isTorchOn ? 'fill-slate-950' : ''}`} />
                    <span>{isTorchOn ? 'Flaş Açık' : 'Flaş'}</span>
                  </button>
                )}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/60 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setScanPaperFormat('A4')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      scanPaperFormat === 'A4'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    📄 A4 Standart
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanPaperFormat('A5')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      scanPaperFormat === 'A5'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    ✂️ A5 Tasarruf
                  </button>
                </div>
              </div>
            </div>

            <div className="relative max-w-sm sm:max-w-md mx-auto aspect-[3/4] sm:aspect-[1/1.41] h-[64vh] min-h-[440px] sm:h-[540px] w-full overflow-hidden rounded-3xl bg-black border-2 border-slate-700/80 shadow-2xl">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                aria-label="Optik Form Kamera Görünümü"
                className={`h-full w-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
              />

              {/* Real-time Session Scanned Counter Badge */}
              {sessionScannedCount > 0 && isCameraActive && (
                <div className="absolute top-3.5 left-3.5 bg-emerald-950/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/50 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5 shadow-xl z-20 animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Okunan: {sessionScannedCount} Kağıt</span>
                </div>
              )}

              {!isCameraActive && (
                <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center bg-slate-950">
                  <Camera className="h-16 w-16 text-indigo-400 mb-3 animate-pulse" />
                  <p className="text-sm font-bold text-slate-200 mb-1">Kamera Akışı Bekleniyor</p>
                  <button onClick={startCamera} className="btn btn-primary text-xs py-2.5 px-6 mt-4 font-bold flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" /> Kamerayı Yeniden Başlat
                  </button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* Dynamic HUD Overlay for Cevaplandırma Alanı (Guaranteed fully visible on all devices) */}
              {isCameraActive && (() => {
                const answerBottomMm = getExamAnswerBottom(detectedExam || undefined);
                const isA5 = scanPaperFormat === 'A5';

                // Physical ratio of the 4 corner anchors (Height / Width)
                const anchorHeightMm = Math.max(50, answerBottomMm - 58);
                const anchorRatio = anchorHeightMm / 184;
                const containerRatio = 0.72; // Typical mobile portrait container aspect ratio

                // Calculate bounding dimensions tailored for viewport
                let targetHeightPct = 80 * anchorRatio * containerRatio * (isA5 ? 0.90 : 1.0);
                let boxHeightPct = targetHeightPct;
                let boxWidthPct = 80;

                // Strict clamp: never exceed 62% viewport height so it leaves >= 24% clearance above bottom status pill
                if (boxHeightPct > 62) {
                  boxHeightPct = 62;
                  boxWidthPct = Math.min(84, Math.max(48, 62 / (anchorRatio * containerRatio * (isA5 ? 0.90 : 1.0))));
                } else if (boxHeightPct < 36) {
                  boxHeightPct = 36;
                  boxWidthPct = Math.min(84, Math.max(55, 36 / (anchorRatio * containerRatio * (isA5 ? 0.90 : 1.0))));
                }

                // Vertical centering: Y center at 42% (comfortably clearing bottom status pill at 88%-96%)
                const boxTopPct = Math.max(8, 42 - (boxHeightPct / 2));
                const boxLeftPct = (100 - boxWidthPct) / 2;

                return (
                  <>
                    {/* Centered Guide Frame */}
                    <div 
                      className="absolute border-2 border-dashed border-emerald-400/50 rounded-2xl pointer-events-none transition-all duration-300"
                      style={{
                        top: `${boxTopPct}%`,
                        left: `${boxLeftPct}%`,
                        width: `${boxWidthPct}%`,
                        height: `${boxHeightPct}%`
                      }}
                    >
                      {/* Animated Neon Laser Sweep Bar */}
                      <div className="absolute inset-x-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-laser-sweep pointer-events-none rounded-full opacity-90" />

                      {/* Top Header Badge */}
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-950/95 text-emerald-300 text-[9.5px] font-bold px-3 py-0.5 rounded-full border border-emerald-500/40 whitespace-nowrap shadow-xl flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>{isA5 ? 'A5 KESİM CEVAP ALANI (4 KÖŞEYİ HİZALAYIN)' : 'CEVAP ALANI ÇERÇEVESİ (4 KÖŞEYİ HİZALAYIN)'}</span>
                      </div>

                      {/* 4 Thick L-Shaped Target Brackets exactly at the 4 corners of the frame */}
                      <div className={`absolute -top-1 -left-1 w-8 h-8 border-t-[5px] border-l-[5px] rounded-tl-sm transition-all ${
                        isCornersAligned ? 'border-emerald-300 scale-110 shadow-lg shadow-emerald-500/80' : 'border-emerald-400'
                      }`} />
                      <div className={`absolute -top-1 -right-1 w-8 h-8 border-t-[5px] border-r-[5px] rounded-tr-sm transition-all ${
                        isCornersAligned ? 'border-emerald-300 scale-110 shadow-lg shadow-emerald-500/80' : 'border-emerald-400'
                      }`} />
                      <div className={`absolute -bottom-1 -left-1 w-8 h-8 border-b-[5px] border-l-[5px] rounded-bl-sm transition-all ${
                        isCornersAligned ? 'border-emerald-300 scale-110 shadow-lg shadow-emerald-500/80' : 'border-emerald-400'
                      }`} />
                      <div className={`absolute -bottom-1 -right-1 w-8 h-8 border-b-[5px] border-r-[5px] rounded-br-sm transition-all ${
                        isCornersAligned ? 'border-emerald-300 scale-110 shadow-lg shadow-emerald-500/80' : 'border-emerald-400'
                      }`} />
                    </div>

                    {/* Floating Status Message Pill at bottom */}
                    <div className="absolute inset-x-4 bottom-3 flex justify-center pointer-events-none">
                      <div className="bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-emerald-500/50 text-xs font-semibold text-emerald-300 flex items-center gap-2 shadow-xl">
                        <Zap className="h-4 w-4 text-amber-400 animate-spin" /> {statusMessage}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Action Controls for Stage 2 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={captureAndScan}
                disabled={!isCameraActive || isProcessing}
                className="btn btn-primary flex-1 py-3.5 text-sm font-bold shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
                {isProcessing ? 'Optik İşleniyor ve Okunuyor...' : 'Optik Formu Şimdi Oku'}
              </button>

              <button
                onClick={runDemoScan}
                disabled={isProcessing}
                className="btn btn-secondary text-xs py-3.5 px-4 flex items-center gap-1.5 text-emerald-400 border-emerald-500/30"
              >
                <Sparkles className="h-4 w-4" /> Demo İle Test Et
              </button>
            </div>
          </div>
        )}

        {/* INTERACTIVE VERIFICATION & VIRTUAL OMR REVIEW MODAL */}
        {isVerifyModalOpen && pendingResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-xl overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl overflow-hidden">
              
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-md border border-emerald-500/30">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-base sm:text-lg text-white flex items-center gap-2">
                      Sanal Optik Eşleşme Kontrolü
                    </h2>
                    <p className="text-xs text-slate-400">
                      Öğrenci: <strong className="text-white">{pendingResult.studentName}</strong> (No: {pendingResult.studentNo}) | Sınav: <strong className="text-emerald-300">{pendingResult.examTitle}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleRetakeScan}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  title="Kapat"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Main Content (Split View: Left Photo, Right Virtual OMR Grid) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                
                {/* Live Real-time Score Summary Header */}
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                  <div>
                    <div className="text-xs text-slate-400 font-semibold">Hesaplanan Toplam Puan ve Net</div>
                    <div className="flex items-baseline gap-3 mt-0.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-display">{pendingResult.totalNet} NET</span>
                      <span className="text-sm font-bold text-slate-300">({pendingResult.totalScore} / 500 Puan)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                    {pendingResult.answers.some(a => a.isUncertain) && (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/50 text-xs font-bold flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        {pendingResult.answers.filter(a => a.isUncertain).length} Silik / Şüpheli İşaret
                      </span>
                    )}
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {pendingResult.totalCorrect} Doğru
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 border border-rose-500/40">
                      {pendingResult.totalWrong} Yanlış
                    </span>
                    <span className="px-3 py-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-500/40">
                      {pendingResult.totalEmpty} Boş
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

                  {/* Left Column: Captured Photo with Overlay Rings */}
                  <div className="md:col-span-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Camera className="h-4 w-4 text-indigo-400" /> Optik Fotoğrafı & Karalama Tespiti
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-semibold">
                        <span className="text-emerald-400">● Net</span>
                        <span className="text-amber-400">● Silik / Şüpheli</span>
                      </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl max-h-[380px] flex items-center justify-center">
                      {pendingResult.rawImageBase64 ? (
                        <img
                          src={pendingResult.rawImageBase64}
                          alt="Çekilen Optik Form"
                          className="w-full h-full object-contain max-h-[380px]"
                        />
                      ) : (
                        <div className="p-8 text-center text-xs text-slate-500">Fotoğraf Önizlemesi Alınamadı</div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 text-center italic">
                      Yeşil daireler net işaretleri, sarı daireler ise silik veya şüpheli işaretleri gösterir.
                    </p>
                  </div>

                  {/* Right Column: Interactive Virtual OMR Form Grid */}
                  <div className="md:col-span-7 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Edit3 className="h-4 w-4 text-emerald-400" /> Sanal Optik Eşleşmesi (İnteraktif)
                      </h3>
                      <span className="text-[11px] text-indigo-300 font-semibold">Şıklara dokunarak değiştirebilirsiniz</span>
                    </div>

                    {/* Warning Banner if any uncertain questions exist */}
                    {pendingResult.answers.some(a => a.isUncertain) && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center gap-2 text-xs text-amber-300 animate-pulse">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span><strong>Dikkat:</strong> Sarı ile vurgulanan sorularda silik işaretleme tespit edildi. Doğru şıkkı tıklayarak onaylayabilir veya düzeltebilirsiniz.</span>
                      </div>
                    )}

                    {/* Subject Tabs for Mobile & Quick Navigation */}
                    {detectedExam && detectedExam.subjects.length > 1 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-700/80 -mx-1 px-1">
                        <button
                          type="button"
                          onClick={() => setActiveSubjectTab(-1)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                            activeSubjectTab === -1
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                          }`}
                        >
                          <span>Tüm Dersler</span>
                          <span className="text-[10px] opacity-75">({pendingResult.answers.length})</span>
                        </button>
                        {detectedExam.subjects.map((subject, subIdx) => {
                          const uncertainCount = pendingResult.answers.filter(
                            a => a.subjectName === subject.name && a.isUncertain
                          ).length;

                          return (
                            <button
                              key={subIdx}
                              type="button"
                              onClick={() => setActiveSubjectTab(subIdx)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                                activeSubjectTab === subIdx
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                              }`}
                            >
                              <span>{subject.name}</span>
                              <span className="text-[10px] opacity-75">({subject.questionCount})</span>
                              {uncertainCount > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse flex items-center gap-0.5">
                                  <span>⚠️</span>{uncertainCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Questions Breakdown by Subject */}
                    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                      {detectedExam?.subjects
                        .map((subject, subIdx) => ({ subject, subIdx }))
                        .filter(({ subIdx }) => activeSubjectTab === -1 || activeSubjectTab === subIdx)
                        .map(({ subject, subIdx }) => {
                          const subjectAnswers = pendingResult.answers.filter(a => a.subjectName === subject.name);
                          const subRes = pendingResult.subjectResults.find(r => r.subjectName === subject.name);

                          return (
                            <div key={subIdx} className="glass-card p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
                                <span className="font-bold text-xs text-indigo-300">{subject.name} ({subject.questionCount} Soru)</span>
                                {subRes && (
                                  <span className="text-xs font-bold text-emerald-400">
                                    {subRes.correctCount}D {subRes.wrongCount}Y {subRes.emptyCount}B | <strong className="text-white">{subRes.netCount} Net</strong>
                                  </span>
                                )}
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {subjectAnswers.map((ans) => {
                                  const globalQIdx = pendingResult.answers.indexOf(ans);
                                  const optionCount = subject.optionCount || 5;
                                  const optionLabels = optionCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D'];

                                  return (
                                    <div
                                      key={ans.questionNumber}
                                      className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
                                        ans.isUncertain
                                          ? 'bg-amber-950/40 border-amber-500/70 ring-1 ring-amber-500/50 shadow-md shadow-amber-900/20'
                                          : ans.isBlank
                                          ? 'bg-slate-900/60 border-slate-800'
                                          : ans.isCorrect
                                          ? 'bg-emerald-950/40 border-emerald-500/40'
                                          : 'bg-rose-950/40 border-rose-500/40'
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <span className="font-mono font-bold text-slate-300 w-6">
                                          {ans.questionNumber.toString().padStart(2, '0')}.
                                        </span>
                                        {ans.isUncertain && (
                                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1 py-0.5 rounded border border-amber-500/40" title="Silik işaret tespit edildi">
                                            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                                            <span className="hidden sm:inline">Silik</span>
                                          </span>
                                        )}
                                      </div>

                                      {/* Option Buttons */}
                                      <div className="flex items-center gap-1">
                                        {optionLabels.map((opt) => {
                                          const isSelected = ans.selectedOption === opt;
                                          const isCorrectOpt = ans.correctAnswer === opt;

                                          return (
                                            <button
                                              key={opt}
                                              onClick={() => handleAnswerOptionChange(globalQIdx, opt)}
                                              className={`h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                                                isSelected
                                                  ? isCorrectOpt
                                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/40 scale-105'
                                                    : 'bg-rose-600 text-white shadow-md shadow-rose-600/40 scale-105'
                                                  : isCorrectOpt
                                                  ? 'bg-slate-700/60 text-emerald-400 border border-emerald-500/30'
                                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                              }`}
                                              title={`Soru ${ans.questionNumber} - Şık ${opt}`}
                                            >
                                              {opt}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Next / Previous Subject Navigation in Single Tab Mode */}
                              {activeSubjectTab !== -1 && detectedExam && detectedExam.subjects.length > 1 && (
                                <div className="pt-2 flex justify-between items-center text-xs border-t border-slate-700/60">
                                  {subIdx > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveSubjectTab(subIdx - 1)}
                                      className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                                    >
                                      ← Önceki Ders ({detectedExam.subjects[subIdx - 1].name})
                                    </button>
                                  ) : <div />}
                                  {subIdx < detectedExam.subjects.length - 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => setActiveSubjectTab(subIdx + 1)}
                                      className="text-indigo-300 hover:text-indigo-200 flex items-center gap-1 font-bold ml-auto cursor-pointer py-1 px-2.5 rounded-lg bg-indigo-950/60 border border-indigo-500/30 hover:bg-indigo-900/60 transition-colors"
                                    >
                                      Sonraki Ders ({detectedExam.subjects[subIdx + 1].name}) →
                                    </button>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleRetakeScan}
                  className="btn btn-secondary text-xs py-3 px-4 font-semibold text-slate-300 border-slate-700 flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" /> Yeniden Tara
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleConfirmAndSave(false)}
                    className="btn btn-secondary text-xs py-3 px-4 font-semibold text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/40 flex items-center gap-2 cursor-pointer"
                    title="Sonucu kaydeder ve sıradaki kağıdı okumak için kamerada kalır"
                  >
                    <Plus className="h-4 w-4 text-emerald-400" /> Kaydet & Sıradakini Oku
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConfirmAndSave(true)}
                    className="btn btn-primary text-sm py-3 px-6 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                  >
                    <UploadCloud className="h-5 w-5" /> Sonucu Yükle & Sınavlara Git
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
