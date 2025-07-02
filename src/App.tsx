import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Download, Settings, Video, FileImage, Package, Monitor } from 'lucide-react';
import GIF from 'gif.js';
const GeometricLoopAnimator = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [isGeneratingFrames, setIsGeneratingFrames] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedFrames, setGeneratedFrames] = useState<any[]>([]);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);

  // アニメーションパラメータ
  const [pattern, setPattern] = useState('spiral');
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(50);
  const [colorMode, setColorMode] = useState('rainbow');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(1);

  // アニメーション状態
  const timeRef = useRef(0);

  // 色彩システム
  const getColor = (index: number, total: number, time: number, mode: string) => {
    switch (mode) {
      case 'rainbow':
        const hue = (index / total * 360 + time * 30) % 360;
        return `hsl(${hue}, 80%, 60%)`;
      case 'monochrome':
        const brightness = Math.sin(index / total * Math.PI * 2 + time * 0.02) * 50 + 50;
        return `hsl(0, 0%, ${brightness}%)`;
      case 'gradient':
        const phase = (index / total + time * 0.01) % 1;
        if (phase < 0.33) {
          return `hsl(${220 + phase * 60}, 70%, 60%)`;
        } else if (phase < 0.66) {
          return `hsl(${280 + (phase - 0.33) * 60}, 70%, 60%)`;
        } else {
          return `hsl(${340 + (phase - 0.66) * 60}, 70%, 60%)`;
        }
      case 'fire':
        const fireHue = Math.sin(index / total * Math.PI + time * 0.03) * 60;
        return `hsl(${fireHue}, 90%, 65%)`;
      case 'ocean':
        const oceanHue = 180 + Math.sin(index / total * Math.PI * 3 + time * 0.02) * 60;
        return `hsl(${oceanHue}, 70%, 55%)`;
      default:
        return '#ffffff';
    }
  };

// ✨ 螺旋ドットパターン（美しい光る点の螺旋）

const drawRandomPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.min(canvas.width, canvas.height) * 0.4 * scale;

  // 背景処理
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 点の総数（密度で調整）
  const totalDots = Math.floor(density * 2) + 30; // 30-230個
  
  // 複数の同心円レイヤーに点を配置
  const layers = 8; // 8つの同心円レイヤー
  
  for (let layer = 0; layer < layers; layer++) {
    const layerProgress = layer / (layers - 1); // 0-1
    const layerRadius = maxRadius * layerProgress;
    
    // 各レイヤーの点の数（外側ほど多く）
    const dotsInLayer = Math.floor((totalDots / layers) * (0.5 + layerProgress * 1.5));
    
    for (let i = 0; i < dotsInLayer; i++) {
      // 点のID（一意性のため）
      const dotId = layer * 1000 + i;
      
      // 基本角度（レイヤー内での均等分布 + ランダム性）
      const baseAngle = (i / dotsInLayer) * Math.PI * 2;
      const angleNoise = Math.sin(dotId * 0.1) * 0.5; // 角度のランダム性
      const angle = baseAngle + angleNoise;
      
      // 半径のランダム性（同じレイヤー内でも変動）
      const radiusNoise = Math.sin(dotId * 0.07) * 0.3; // -0.3 to 0.3
      const finalRadius = layerRadius * (0.8 + radiusNoise);
      
      // 時間による微細な動き（各点が独立）
      const timeOffset = dotId * 0.01;
      const microMotionX = Math.sin(time * 0.02 * speed + timeOffset) * 3;
      const microMotionY = Math.cos(time * 0.025 * speed + timeOffset * 1.3) * 3;
      
      // 回転による動き（レイヤーごとに異なる速度）
      const layerRotationSpeed = (layer % 2 === 0 ? 1 : -1) * (0.5 + layer * 0.1);
      const rotationAngle = angle + time * 0.003 * rotation * layerRotationSpeed;
      
      // 最終位置
      const x = centerX + Math.cos(rotationAngle) * finalRadius + microMotionX;
      const y = centerY + Math.sin(rotationAngle) * finalRadius + microMotionY;
      
      // 点のサイズ（レイヤーとランダム性）
      const baseSizeByLayer = (layerProgress * 0.6 + 0.4) * 12; // 外側ほど大きく
      const sizeRandomness = Math.sin(dotId * 0.13) * 0.4 + 0.8; // 0.4-1.2の変動
      const sizePulse = Math.sin(time * 0.04 * speed + timeOffset * 2) * 0.3 + 0.7; // 脈動
      const dotSize = baseSizeByLayer * sizeRandomness * sizePulse;
      
      // 明滅効果（各点が独立したリズム）
      const flickerSpeed = 0.05 + Math.sin(dotId * 0.03) * 0.03; // 個別の明滅速度
      const flickerPhase = Math.sin(time * flickerSpeed * speed + timeOffset * 3) * 0.5 + 0.5;
      const breathPhase = Math.sin(time * 0.02 * speed + timeOffset * 0.7) * 0.3 + 0.7;
      const brightness = flickerPhase * breathPhase;
      
      // 色彩（レイヤーと時間で変化）
      const colorBase = (layer * 15 + i * 3 + time * 0.1) % 100;
      const dotColor = getColor(Math.floor(colorBase), 100, time + dotId, colorMode);
      
      // 透明度（距離と明滅で制御）
      const distanceAlpha = Math.max(0.2, 1 - layerProgress * 0.5);
      const finalAlpha = distanceAlpha * brightness;
      
      // 画面外チェック
      if (finalRadius > maxRadius) continue;
      
      ctx.save();
      
      // 外側のグロー効果
      if (dotSize > 6) {
        const glowSize = dotSize * (1.5 + brightness * 0.5);
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
        glowGradient.addColorStop(0, dotColor);
        glowGradient.addColorStop(0.7, dotColor);
        glowGradient.addColorStop(1, 'transparent');
        
        ctx.globalAlpha = finalAlpha * 0.3;
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // メインの光る点
      const mainGradient = ctx.createRadialGradient(x, y, 0, x, y, dotSize);
      mainGradient.addColorStop(0, dotColor);
      mainGradient.addColorStop(0.6, dotColor);
      mainGradient.addColorStop(1, 'transparent');
      
      ctx.globalAlpha = finalAlpha;
      ctx.fillStyle = mainGradient;
      ctx.beginPath();
      ctx.arc(x, y, dotSize, 0, Math.PI * 2);
      ctx.fill();
      
      // 中心の明るいコア
      ctx.globalAlpha = finalAlpha * 0.9;
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(x, y, dotSize * 0.3, 0, Math.PI * 2);
      ctx.fill();
      
      // 特に明るい点にはスパークル効果
      if (brightness > 0.8 && dotSize > 8) {
        const sparkleIntensity = (brightness - 0.8) / 0.2; // 0-1
        
        // 十字のスパークル
        ctx.globalAlpha = finalAlpha * sparkleIntensity * 0.7;
        ctx.strokeStyle = dotColor;
        ctx.lineWidth = 1;
        
        const sparkleLength = dotSize * 1.5;
        
        // 水平線
        ctx.beginPath();
        ctx.moveTo(x - sparkleLength, y);
        ctx.lineTo(x + sparkleLength, y);
        ctx.stroke();
        
        // 垂直線
        ctx.beginPath();
        ctx.moveTo(x, y - sparkleLength);
        ctx.lineTo(x, y + sparkleLength);
        ctx.stroke();
      }
      
      ctx.restore();
    }
  }
  
  // 中心の特別な光源
  const coreIntensity = Math.sin(time * 0.03 * speed) * 0.3 + 0.7;
  ctx.save();
  
  const coreSize = 4 * scale * coreIntensity;
  const coreColor = getColor(50, 100, time, colorMode);
  
  ctx.globalAlpha = coreIntensity * 0.8;
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
  ctx.globalAlpha = 1;
};


  // 描画パターン関数群
  // ✨ 三角形格子パターン（軽量・高品質・完璧ループ）

  const drawSpiralPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // 背景処理
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 完璧ループのための時間正規化
    const loopTime = (time * speed * 0.03) % (Math.PI * 2); // 0-2π完璧ループ
    const phase1 = Math.sin(loopTime) * 0.5 + 0.5; // 0-1のフェーズ1
    const phase2 = Math.sin(loopTime + Math.PI / 3) * 0.5 + 0.5; // 位相差つきフェーズ2

    // グリッドサイズ（密度とスケールで調整）
    const baseGridSize = (60 - density * 0.8) * scale; // 密度↑でグリッド細かく
    const gridSize = Math.max(15, baseGridSize); // 最小サイズ制限

    // 六角形グリッドの基本パラメータ
    const hexHeight = gridSize * Math.sqrt(3) / 2;
    const hexWidth = gridSize;

    // 回転とシフト効果
    const globalRotation = loopTime * rotation * 0.5;
    const shiftX = Math.sin(loopTime * 1.5) * gridSize * 0.3;
    const shiftY = Math.cos(loopTime * 1.2) * hexHeight * 0.3;

    // 描画範囲を80%に制限 + スケール連動
    const maxDrawRadius = Math.min(canvas.width, canvas.height) * 0.4 * scale; // 最大80%（半径40%）
    const margin = gridSize;
    const startX = Math.floor((-maxDrawRadius - margin) / hexWidth) * hexWidth;
    const endX = Math.ceil((maxDrawRadius + margin) / hexWidth) * hexWidth;
    const startY = Math.floor((-maxDrawRadius - margin) / hexHeight) * hexHeight;
    const endY = Math.ceil((maxDrawRadius + margin) / hexHeight) * hexHeight;

    ctx.lineWidth = 2;

    // 六角形グリッドベースの三角形を描画
    for (let row = startY; row <= endY; row += hexHeight) {
      for (let col = startX; col <= endX; col += hexWidth) {
        // 六角形グリッドのオフセット計算
        const isOddRow = Math.floor(row / hexHeight) % 2 === 1;
        const offsetX = isOddRow ? hexWidth / 2 : 0;

        // 基本座標
        const baseX = centerX + col + offsetX + shiftX;
        const baseY = centerY + row + shiftY;

        // 回転変換
        const rotatedX = centerX + (baseX - centerX) * Math.cos(globalRotation) - (baseY - centerY) * Math.sin(globalRotation);
        const rotatedY = centerY + (baseX - centerX) * Math.sin(globalRotation) + (baseY - centerY) * Math.cos(globalRotation);

        // 中心からの距離（効果制御用 + 描画範囲制限）
        const distanceFromCenter = Math.sqrt((rotatedX - centerX) ** 2 + (rotatedY - centerY) ** 2);

        // 描画範囲外の場合はスキップ
        if (distanceFromCenter > maxDrawRadius) continue;

        const normalizedDistance = Math.min(1, distanceFromCenter / maxDrawRadius);

        // 波動効果
        const wave1 = Math.sin(distanceFromCenter * 0.02 + loopTime * 2) * 0.5 + 0.5;
        const wave2 = Math.cos(distanceFromCenter * 0.03 + loopTime * 1.5 + Math.PI / 4) * 0.5 + 0.5;

        // 色彩計算
        const colorPhase = (normalizedDistance * 100 + loopTime * 30 + wave1 * 50) % 100;
        const lineColor = getColor(Math.floor(colorPhase), 100, time, colorMode);

        // 透明度（距離と波動で制御）
        const alpha = (0.3 + wave1 * 0.4 + wave2 * 0.3) * (1 - normalizedDistance * 0.3);

        ctx.save();
        ctx.strokeStyle = lineColor;
        ctx.globalAlpha = alpha;

        // 6つの三角形を描画（六角形を6分割）
        const triangleSize = gridSize * (0.8 + phase1 * 0.4); // サイズ変動

        for (let i = 0; i < 6; i++) {
          const angle1 = (i * Math.PI) / 3;
          const angle2 = ((i + 1) * Math.PI) / 3;
          const angle3 = ((i + 2) * Math.PI) / 3;

          // 三角形の頂点計算
          const x1 = rotatedX + Math.cos(angle1) * triangleSize;
          const y1 = rotatedY + Math.sin(angle1) * triangleSize;
          const x2 = rotatedX + Math.cos(angle2) * triangleSize;
          const y2 = rotatedY + Math.sin(angle2) * triangleSize;

          // 中心から外側への線
          ctx.beginPath();
          ctx.moveTo(rotatedX, rotatedY);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          // 外周の線（隣接する頂点を結ぶ）
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // 波動による追加効果（確率的に表示）
          if (wave2 > 0.6) {
            const innerRadius = triangleSize * 0.5;
            const innerX = rotatedX + Math.cos(angle1) * innerRadius;
            const innerY = rotatedY + Math.sin(angle1) * innerRadius;

            ctx.beginPath();
            ctx.moveTo(rotatedX, rotatedY);
            ctx.lineTo(innerX, innerY);
            ctx.globalAlpha = alpha * 0.5;
            ctx.stroke();
          }
        }

        ctx.restore();
      }
    }

    // 中心部の強調エフェクト（描画範囲内のみ）
    const coreIntensity = phase1 * phase2;
    if (coreIntensity > 0.3 && maxDrawRadius > 20) { // 最小サイズ制限も追加
      ctx.save();

      const coreRadius = Math.min(12 * scale, maxDrawRadius * 0.1) * coreIntensity;
      const coreColor = getColor(50, 100, time * 2, colorMode);

      // 中心の光る点
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 3;
      ctx.globalAlpha = coreIntensity * 0.8;
      ctx.stroke();

      // 放射状の光線
      for (let i = 0; i < 8; i++) {
        const rayAngle = (i / 8) * Math.PI * 2 + globalRotation * 2;
        const rayLength = Math.min(coreRadius * 2, maxDrawRadius * 0.2);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
          centerX + Math.cos(rayAngle) * rayLength,
          centerY + Math.sin(rayAngle) * rayLength
        );
        ctx.globalAlpha = coreIntensity * 0.4;
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  };

  // プルダウンの表示名を変更
  <option value="spiral">✨ Geometric Lattice</option>

  const drawRipplePattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 1.2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorMode === 'monochrome' ? '#0a0a0a' : '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const ripples = density;
    const waveSpeed = time * 0.02 * speed;

    const rippleCenters = [
      { x: centerX, y: centerY, phase: 0 },
      { x: centerX + Math.cos(waveSpeed * 0.3) * 100, y: centerY + Math.sin(waveSpeed * 0.3) * 100, phase: Math.PI },
      { x: centerX + Math.cos(waveSpeed * 0.5 + Math.PI) * 150, y: centerY + Math.sin(waveSpeed * 0.5 + Math.PI) * 150, phase: Math.PI * 0.5 }
    ];

    for (let i = 0; i < ripples; i++) {
      const radiusBase = (i / ripples) * maxRadius * scale;

      rippleCenters.forEach((center, centerIndex) => {
        const radius = radiusBase + Math.sin(waveSpeed + center.phase + i * 0.1) * 30;
        const alpha = Math.max(0.1, 1 - (i / ripples));

        ctx.strokeStyle = getColor(i + centerIndex * 20, ripples, time, colorMode);
        ctx.lineWidth = Math.max(1, 4 - (i / ripples) * 3);
        ctx.globalAlpha = alpha;

        ctx.beginPath();
        const sides = 6 + Math.floor(i / 10);
        for (let j = 0; j <= sides; j++) {
          const angle = (j / sides) * Math.PI * 2 + waveSpeed * rotation * 0.1;
          const waveRadius = radius + Math.sin(angle * 3 + waveSpeed) * (radius * 0.1);

          const x = center.x + Math.cos(angle) * waveRadius;
          const y = center.y + Math.sin(angle) * waveRadius;

          if (j === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        if (i % 5 === 0) {
          ctx.beginPath();
          const rayCount = 8;
          for (let ray = 0; ray < rayCount; ray++) {
            const rayAngle = (ray / rayCount) * Math.PI * 2 + waveSpeed * rotation * 0.2;
            const rayLength = radius * 0.8;

            ctx.moveTo(center.x, center.y);
            ctx.lineTo(
              center.x + Math.cos(rayAngle) * rayLength,
              center.y + Math.sin(rayAngle) * rayLength
            );
          }
          ctx.stroke();
        }
      });
    }

    ctx.globalAlpha = 1;
  };

  const drawStarPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8 * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const layers = density;
    const points = 6;

    for (let layer = 0; layer < layers; layer++) {
      const progress = layer / layers;
      const radius = progress * maxRadius;
      const rotationOffset = time * 0.005 * speed * rotation + progress * Math.PI * 2;

      ctx.strokeStyle = getColor(layer, layers, time, colorMode);
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6 + Math.sin(time * 0.01 + layer * 0.1) * 0.3;

      ctx.beginPath();
      for (let point = 0; point <= points; point++) {
        const angle = (point / points) * Math.PI * 2 + rotationOffset;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;

        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      for (let point = 0; point <= points; point++) {
        const angle = (point / points) * Math.PI * 2 - rotationOffset;
        const innerRadius = radius * 0.6;
        const x = centerX + Math.cos(angle) * innerRadius;
        const y = centerY + Math.sin(angle) * innerRadius;

        if (point === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      for (let point = 0; point < points; point++) {
        const outerAngle = (point / points) * Math.PI * 2 + rotationOffset;
        const innerAngle = (point / points) * Math.PI * 2 - rotationOffset;

        const outerX = centerX + Math.cos(outerAngle) * radius;
        const outerY = centerY + Math.sin(outerAngle) * radius;
        const innerX = centerX + Math.cos(innerAngle) * radius * 0.6;
        const innerY = centerY + Math.sin(innerAngle) * radius * 0.6;

        ctx.beginPath();
        ctx.moveTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;
  };

  const drawTrianglePattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const size = Math.min(canvas.width, canvas.height) * 0.4 * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawTriangles = (x: number, y: number, size: number, depth: number, rotation: number) => {
      if (depth <= 0) return;

      ctx.strokeStyle = getColor(depth, density, time, colorMode);
      ctx.lineWidth = Math.max(0.5, 3 - depth * 0.3);
      ctx.globalAlpha = 0.7;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation + time * 0.01 * speed);

      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      const newSize = size * 0.6;
      const offset = size * 0.4;

      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 + rotation + time * 0.005 * speed;
        const newX = x + Math.cos(angle) * offset;
        const newY = y + Math.sin(angle) * offset;

        drawTriangles(newX, newY, newSize, depth - 1, rotation + Math.PI / 6);
      }
    };

    drawTriangles(centerX, centerY, size, Math.min(8, Math.floor(density / 8)), 0);
    ctx.globalAlpha = 1;
  };

  const drawHexagonPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const hexSize = (Math.min(canvas.width, canvas.height) / density) * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const rows = Math.ceil(canvas.height / hexSize) + 2;
    const cols = Math.ceil(canvas.width / hexSize) + 2;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const offsetX = (row % 2) * hexSize * 0.5;
        const x = col * hexSize * 0.866 + offsetX;
        const y = row * hexSize * 0.75;

        const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        const wave = Math.sin(distance * 0.05 - time * 0.02 * speed) * 0.5 + 0.5;
        const rotationAngle = time * 0.01 * rotation + distance * 0.01;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotationAngle);

        ctx.strokeStyle = getColor(Math.floor(distance), 100, time, colorMode);
        ctx.lineWidth = 2;
        ctx.globalAlpha = wave * 0.8 + 0.2;

        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const radius = hexSize * 0.3 * (1 + wave * 0.3);
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;

          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
      }
    }

    ctx.globalAlpha = 1;
  };

  const drawHypnoticSpiralPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(canvas.width, canvas.height) * 0.4 * scale;

    // 既存と同じ背景処理
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const lineCount = Math.floor(density * 0.8) + 10; // 最低10本の線

    ctx.lineWidth = 2;

    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const rotationAngle = time * 0.01 * rotation;

      // 渦巻きパラメータ
      const spiralTightness = 0.3;
      const cycles = 4;

      ctx.save();

      ctx.beginPath();

      // 渦巻き線を描画
      for (let r = 0; r <= maxRadius; r += 3) {
        const spiralAngle = angle + rotationAngle + (r * spiralTightness * cycles * Math.PI) / maxRadius;
        const x = centerX + Math.cos(spiralAngle) * r;
        const y = centerY + Math.sin(spiralAngle) * r;

        if (r === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // 色彩とアルファ設定（既存と同じ方式）
      const wave = Math.sin(i * 0.1 - time * 0.02 * speed) * 0.5 + 0.5;
      ctx.strokeStyle = getColor(i, lineCount, time, colorMode);
      ctx.globalAlpha = wave * 0.8 + 0.2;
      ctx.stroke();

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  };

  const drawGeometricStarPattern = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, time: number) => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // ✅ スケール修正：baseRadiusをさらに大きく調整
    const baseRadius = Math.min(canvas.width, canvas.height) * 0.3 * scale;

    // 既存と同じ背景処理
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const layers = Math.floor(density * 0.1) + 3; // 最低3層

    ctx.lineWidth = 1.5;

    for (let layer = 0; layer < layers; layer++) {
      // ✅ スケール修正：layerRadiusをより大きく
      const layerRadius = baseRadius * (0.1 + (layer / layers) * 0.9); // 0.2-1.0 → 0.1-1.0 に変更
      const rotationAngle = time * 0.01 * rotation + (layer * Math.PI / 6);

      // 距離ベースの波動効果（既存と同じ方式）
      const distance = layerRadius;
      const wave = Math.sin(distance * 0.05 - time * 0.02 * speed) * 0.5 + 0.5;

      const adjustedRadius = layerRadius * (1 + wave * 0.3); // 波動による半径調整

      // 6角形星型の頂点計算
      const outerPoints: Array<{ x: number, y: number }> = [];
      const innerPoints: Array<{ x: number, y: number }> = [];

      for (let i = 0; i < 6; i++) {
        const outerAngle = (i * Math.PI) / 3 + rotationAngle;
        const innerAngle = ((i + 0.5) * Math.PI) / 3 + rotationAngle;

        // 外側頂点（星の先端）
        outerPoints.push({
          x: centerX + Math.cos(outerAngle) * adjustedRadius,
          y: centerY + Math.sin(outerAngle) * adjustedRadius
        });

        // 内側頂点（星の谷）
        innerPoints.push({
          x: centerX + Math.cos(innerAngle) * adjustedRadius * 0.5,
          y: centerY + Math.sin(innerAngle) * adjustedRadius * 0.5
        });
      }

      ctx.save();

      // 星型描画
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const outer = outerPoints[i];
        const inner = innerPoints[i];
        const nextOuter = outerPoints[(i + 1) % 6];

        if (i === 0) {
          ctx.moveTo(outer.x, outer.y);
        }

        ctx.lineTo(inner.x, inner.y);
        ctx.lineTo(nextOuter.x, nextOuter.y);
      }
      ctx.closePath();

      // 色彩とアルファ設定（既存と同じ方式）
      ctx.strokeStyle = getColor(layer, layers, time, colorMode);
      ctx.globalAlpha = wave * 0.8 + 0.2;
      ctx.stroke();

      // 内部螺旋構造（奇数層のみ）
      if (layer % 2 === 0) {
        ctx.beginPath();
        const spiralRadius = adjustedRadius * 0.3;
        for (let angle = 0; angle < Math.PI * 4; angle += 0.2) {
          const r = spiralRadius * (angle / (Math.PI * 4));
          const x = centerX + Math.cos(angle + rotationAngle) * r;
          const y = centerY + Math.sin(angle + rotationAngle) * r;

          if (angle === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.globalAlpha = (wave * 0.5 + 0.3); // 螺旋は少し薄く
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.globalAlpha = 1;
  };


  // 🎨 GIF生成機能
  // 🎯 デバイス最適化関数群
  const getDeviceInfo = () => {
    const screenWidth = window.innerWidth;
    const userAgent = navigator.userAgent;

    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) || screenWidth < 600;
    const isTablet = (screenWidth >= 600 && screenWidth < 1024) || /iPad/i.test(userAgent);
    const isDesktop = screenWidth >= 1024;

    const memoryInfo = (navigator as any).deviceMemory || 4;

    let performance: 'low' | 'medium' | 'high' = 'medium';
    if (memoryInfo <= 2 || screenWidth <= 375) {
      performance = 'low';
    } else if (memoryInfo >= 6 && screenWidth >= 1200) {
      performance = 'high';
    }

    return {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      screenWidth,
      performance,
      isMobile,
      isTablet,
      isDesktop
    };
  };

  const calculateOptimalGifSize = (canvasSize: number) => {
    const device = getDeviceInfo();

    let optimalSize: number;
    let quality: number;
    let frameCount: number;

    if (device.isMobile) {
      if (device.performance === 'low') {
        optimalSize = Math.min(canvasSize, 250);
        quality = 25;
        frameCount = 15;
      } else {
        optimalSize = Math.min(canvasSize, 350);
        quality = 20;
        frameCount = 20;
      }
    } else if (device.isTablet) {
      optimalSize = Math.min(canvasSize, 500);
      quality = 15;
      frameCount = 30;
    } else {
      if (device.performance === 'high') {
        optimalSize = Math.min(canvasSize, 800);
        quality = 10;
        frameCount = 45;
      } else {
        optimalSize = Math.min(canvasSize, 600);
        quality = 15;
        frameCount = 30;
      }
    }

    optimalSize = Math.round(optimalSize / 25) * 25;
    optimalSize = Math.max(optimalSize, 200);

    return { size: optimalSize, quality, frameCount };
  };

  // 🎨 デバイス最適化GIF生成機能
  const generateGIF = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsGeneratingGif(true);
      setGifProgress(0);

      const wasPlaying = isPlaying;
      setIsPlaying(false);

      // 🎯 デバイス最適化設定を計算
      const optimization = calculateOptimalGifSize(Math.min(canvas.width, canvas.height));
      const device = getDeviceInfo();

      console.log('🔧 デバイス最適化:', {
        deviceType: device.type,
        performance: device.performance,
        optimalGifSize: `${optimization.size}×${optimization.size}`,
        quality: optimization.quality,
        frameCount: optimization.frameCount
      });

      // GIFインスタンス作成（デバイス最適化済み）
      const gif = new GIF({
        workers: device.performance === 'low' ? 1 : 2,
        quality: optimization.quality,
        workerScript: '/gif.worker.js',
        width: optimization.size,
        height: optimization.size,
        repeat: 0,
        background: '#2a2a2a',
      });

      const startTime = timeRef.current;
      const frameInterval = device.isMobile ? 6 : 4;

      // フレーム生成（最適化済み）
      for (let i = 0; i < optimization.frameCount; i++) {
        const normalizedTime = i / optimization.frameCount;
        const time = normalizedTime * 600; // ChatGPTが提案した共通周期
        timeRef.current = time;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          switch (pattern) {
            case 'spiral':
              drawSpiralPattern(ctx, canvas, timeRef.current);
              break;
            case 'ripple':
              drawRipplePattern(ctx, canvas, timeRef.current);
              break;
            case 'star':
              drawStarPattern(ctx, canvas, timeRef.current);
              break;
            case 'triangle':
              drawTrianglePattern(ctx, canvas, timeRef.current);
              break;
            case 'hexagon':
              drawHexagonPattern(ctx, canvas, timeRef.current);
              break;
            case 'hypnotic':
              drawHypnoticSpiralPattern(ctx, canvas, timeRef.current);
              break;
            case 'geometric-star':
              drawGeometricStarPattern(ctx, canvas, timeRef.current);
              break;
            case 'random':
              drawRandomPattern(ctx, canvas, timeRef.current);
              break;
          }
        }

        // 🎯 デバイス最適化サイズでフレーム作成
        const resizedCanvas = document.createElement('canvas');
        resizedCanvas.width = optimization.size;
        resizedCanvas.height = optimization.size;
        const resizedCtx = resizedCanvas.getContext('2d');

        if (resizedCtx) {
          resizedCtx.imageSmoothingEnabled = !device.isMobile;
          if (!device.isMobile) {
            resizedCtx.imageSmoothingQuality = 'high';
          }

          const scale = Math.min(optimization.size / canvas.width, optimization.size / canvas.height);
          const scaledWidth = canvas.width * scale;
          const scaledHeight = canvas.height * scale;
          const offsetX = (optimization.size - scaledWidth) / 2;
          const offsetY = (optimization.size - scaledHeight) / 2;

          resizedCtx.fillStyle = '#2a2a2a';
          resizedCtx.fillRect(0, 0, optimization.size, optimization.size);

          resizedCtx.drawImage(canvas, offsetX, offsetY, scaledWidth, scaledHeight);
        }

        const delay = device.isMobile ? 120 : device.isTablet ? 100 : 80;
        gif.addFrame(resizedCanvas, { copy: true, delay });

        setGifProgress(((i + 1) / optimization.frameCount) * 50);

        if (device.isMobile && i % 3 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        } else if (i % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

      timeRef.current = startTime;
      if (wasPlaying) setIsPlaying(true);

      gif.on('progress', (p: number) => {
        setGifProgress(50 + (p * 50));
      });

      gif.on('finished', (blob: Blob) => {
        const actualSizeKB = Math.round(blob.size / 1024);
        const url = URL.createObjectURL(blob);
        const newWindow = window.open();

        if (newWindow) {
          newWindow.document.write(`
          <html>
            <head><title>デバイス最適化GIF - ${optimization.size}×${optimization.size}px</title></head>
            <body style="margin:0; background:#000; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:100vh; font-family:Arial;">
              <h2 style="color:white;">🎨 ${device.type === 'mobile' ? '📱' : device.type === 'tablet' ? '📟' : '🖥️'} デバイス最適化GIF</h2>
              <img src="${url}" alt="Generated GIF" style="max-width:90%; max-height:70vh; border: 2px solid #fff;" />
              
              <div style="color:white; margin-top:20px; text-align:center; max-width: 90%;">
                <div style="background: #2a2a2a; padding: 20px; border-radius: 12px; margin: 10px 0;">
                  <h3 style="margin-top:0; color:#4ade80;">✅ ${device.type.toUpperCase()}用に最適化済み</h3>
                  
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; text-align: left;">
                    <div>
                      <p><strong>📏 サイズ:</strong> ${optimization.size}×${optimization.size}px</p>
                      <p><strong>📦 ファイルサイズ:</strong> ${actualSizeKB}KB</p>
                      <p><strong>🎬 フレーム数:</strong> ${optimization.frameCount}フレーム</p>
                    </div>
                    <div>
                      <p><strong>📱 デバイス:</strong> ${device.type} (${device.performance})</p>
                      <p><strong>📊 品質:</strong> ${optimization.quality}/30</p>
                      <p><strong>🎨 パターン:</strong> ${pattern}-${colorMode}</p>
                    </div>
                  </div>
                  
                  ${device.isMobile ? `
                    <div style="background: #059669; padding: 10px; border-radius: 8px; margin-top: 10px;">
                      <p style="margin: 0; font-size: 14px;"><strong>📱 スマホ最適化:</strong></p>
                      <p style="margin: 5px 0 0 0; font-size: 12px;">軽量・高速生成でモバイルに最適化されています</p>
                    </div>
                  ` : device.isTablet ? `
                    <div style="background: #0369a1; padding: 10px; border-radius: 8px; margin-top: 10px;">
                      <p style="margin: 0; font-size: 14px;"><strong>📟 タブレット最適化:</strong></p>
                      <p style="margin: 5px 0 0 0; font-size: 12px;">品質と軽量性のバランスを取った設定です</p>
                    </div>
                  ` : `
                    <div style="background: #7c2d12; padding: 10px; border-radius: 8px; margin-top: 10px;">
                      <p style="margin: 0; font-size: 14px;"><strong>🖥️ デスクトップ最適化:</strong></p>
                      <p style="margin: 5px 0 0 0; font-size: 12px;">高品質・大サイズでPC環境に最適化されています</p>
                    </div>
                  `}
                </div>
                
                <p><strong>💾 保存方法:</strong></p>
                <ol style="text-align:left; display:inline-block; font-size: 14px;">
                  <li>画像を右クリック → 「名前を付けて画像を保存」</li>
                  <li>ファイル名例: geometric-${pattern}-${device.type}.gif</li>
                  ${device.isMobile ? '<li><strong>💡 LINEやメッセージでのシェアに最適!</strong></li>' : ''}
                </ol>
                
                <button onclick="
                  const link = document.createElement('a');
                  link.download = 'geometric-${pattern}-${colorMode}-${device.type}-${optimization.size}px.gif';
                  link.href = '${url}';
                  link.click();
                " style="padding: 15px 30px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;">
                  📥 ${device.isMobile ? '📱' : device.isTablet ? '📟' : '🖥️'} 最適化GIFをダウンロード
                </button>
              </div>
            </body>
          </html>
        `);
          newWindow.document.close();
        }

        setIsGeneratingGif(false);
        setGifProgress(0);
      });

      gif.on('abort', () => {
        setIsGeneratingGif(false);
        setGifProgress(0);
        alert('GIF生成がキャンセルされました。');
      });

      gif.render();

    } catch (error) {
      console.error('GIF生成エラー:', error);
      alert('GIF生成に失敗しました。\n\nエラー: ' + error + '\n\n代替方法:\n1. フレーム生成でPNG画像を保存\n2. ezgif.comでGIF作成');
      setIsGeneratingGif(false);
      setGifProgress(0);
    }
  };

  // MP4録画機能（改良版）
  const startMP4Recording = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsRecording(true);
      setRecordingDuration(0);
      recordedChunksRef.current = [];

      // CanvasをMediaStreamに変換
      const stream = canvas.captureStream(30); // 30fps

      // MediaRecorder の設定
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus'
      };

      // フォールバック用のmimeType
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          options.mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          options.mimeType = 'video/webm';
        } else {
          throw new Error('WebM形式がサポートされていません');
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: options.mimeType
        });

        // 新しいタブで動画を表示
        const url = URL.createObjectURL(blob);
        const newWindow = window.open();

        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>Generated Animation Video - Right Click to Save</title></head>
              <body style="margin:0; background:#000; display:flex; flex-direction:column; justify-content:center; align-items:center; min-height:100vh; font-family:Arial;">
                <h2 style="color:white;">🎥 生成されたアニメーション動画</h2>
                <video controls autoplay loop style="max-width:90%; max-height:70vh;" src="${url}"></video>
                <div style="color:white; margin-top:20px; text-align:center;">
                  <p><strong>保存方法:</strong></p>
                  <ol style="text-align:left; display:inline-block;">
                    <li>動画を右クリック → 「名前を付けて動画を保存」</li>
                    <li>または動画上で右クリック → 「名前を付けてリンク先を保存」</li>
                    <li>ファイル形式: WebM（MP4プレイヤーで再生可能）</li>
                  </ol>
                  <p><small>パターン: ${pattern} | 色彩: ${colorMode} | 録画時間: ${recordingDuration}秒</small></p>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
        } else {
          // ポップアップがブロックされた場合のフォールバック
          alert('ポップアップがブロックされました。ポップアップを許可して再試行してください。');
        }

        setIsRecording(false);
        setRecordingDuration(0);
      };

      mediaRecorder.onerror = (event) => {
        console.error('録画エラー:', event);
        alert('録画中にエラーが発生しました。');
        setIsRecording(false);
        setRecordingDuration(0);
      };

      // 録画開始
      mediaRecorder.start(100); // 100msごとにチャンクを作成

      // 録画時間をカウント
      const startTime = Date.now();
      const durationTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setRecordingDuration(Math.round(elapsed));

        // 8秒で自動停止
        if (elapsed >= 8) {
          clearInterval(durationTimer);
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        }
      }, 100);

    } catch (error) {
      console.error('録画開始エラー:', error);
      alert('録画機能がサポートされていません。\n\nブラウザの録画機能をお試しください：\n• Chrome: Ctrl+Shift+R (Windows) / Cmd+Shift+5 (Mac)\n• 拡張機能: Loom, Screencastify');
      setIsRecording(false);
      setRecordingDuration(0);
    }
  };

  // 録画停止
  const stopMP4Recording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // スクリーンレコーダーガイド
  const showScreenRecordingGuide = () => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.9); z-index: 10000; 
      display: flex; justify-content: center; align-items: center;
    `;

    modal.innerHTML = `
      <div style="background: white; padding: 40px; border-radius: 15px; max-width: 600px; max-height: 80vh; overflow: auto;">
        <h2>🎥 画面録画ガイド</h2>
        <p>ブラウザ内蔵の録画機能またはソフトウェアで画面を録画できます：</p>
        
        <h3>🖥️ Windows:</h3>
        <ul>
          <li><strong>Xbox Game Bar:</strong> Win + G キー</li>
          <li><strong>PowerPoint:</strong> 画面録画機能</li>
          <li><strong>OBS Studio:</strong> 無料の録画ソフト</li>
        </ul>
        
        <h3>🍎 Mac:</h3>
        <ul>
          <li><strong>スクリーンショット:</strong> Cmd + Shift + 5</li>
          <li><strong>QuickTime Player:</strong> 新規画面収録</li>
        </ul>
        
        <h3>🌐 ブラウザ拡張機能:</h3>
        <ul>
          <li><strong>Loom:</strong> 簡単画面録画</li>
          <li><strong>Screencastify:</strong> Chrome拡張</li>
          <li><strong>Nimbus Screenshot:</strong> 無料録画</li>
        </ul>
        
        <h3>📱 推奨設定:</h3>
        <ul>
          <li>録画範囲: このアニメーション画面のみ</li>
          <li>フレームレート: 30fps</li>
          <li>録画時間: 3-5秒（ループ用）</li>
        </ul>
        
        <button onclick="this.parentElement.parentElement.remove()" 
                style="padding: 15px 30px; background: #007bff; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px;">
          閉じる
        </button>
      </div>
    `;

    document.body.appendChild(modal);
  };

  // 改良版：フレーム生成
  const generateAnimationFrames = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsGeneratingFrames(true);
      setGenerationProgress(0);
      setGeneratedFrames([]);

      const wasPlaying = isPlaying;
      setIsPlaying(false);

      const startTime = timeRef.current;
      const frameCount = 60;
      const frameInterval = 2;
      const frames = [];

      for (let i = 0; i < frameCount; i++) {
        const normalizedTime = i / frameCount;
        const time = normalizedTime * 600; // ChatGPTが提案した共通周期
        timeRef.current = time;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          switch (pattern) {
            case 'spiral':
              drawSpiralPattern(ctx, canvas, timeRef.current);
              break;
            case 'ripple':
              drawRipplePattern(ctx, canvas, timeRef.current);
              break;
            case 'star':
              drawStarPattern(ctx, canvas, timeRef.current);
              break;
            case 'triangle':
              drawTrianglePattern(ctx, canvas, timeRef.current);
              break;
            case 'hexagon':
              drawHexagonPattern(ctx, canvas, timeRef.current);
              break;
            case 'hypnotic':
              drawHypnoticSpiralPattern(ctx, canvas, timeRef.current);
              break;
            case 'geometric-star':
              drawGeometricStarPattern(ctx, canvas, timeRef.current);
              break;
            case 'random':
              drawRandomPattern(ctx, canvas, timeRef.current);
              break;
          }
        }

        const dataURL = canvas.toDataURL('image/png');
        frames.push({
          index: i + 1,
          dataURL: dataURL,
          filename: `frame_${String(i + 1).padStart(3, '0')}.png`
        });

        setGenerationProgress(((i + 1) / frameCount) * 100);

        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      setGeneratedFrames(frames);
      timeRef.current = startTime;
      if (wasPlaying) setIsPlaying(true);

      console.log(`フレーム生成完了: ${frames.length}フレーム`);
      alert(`✅ ${frameCount}フレームの生成が完了しました！\n\n次のステップ：\n1. 「📦 フレーム表示」で全フレームを確認\n2. 各画像を新しいタブで開いて保存\n3. ezgif.com等でGIF作成`);

    } catch (error) {
      console.error('フレーム生成エラー:', error);
      alert('フレーム生成に失敗しました。');
      setIsGeneratingFrames(false);
      setGenerationProgress(0);
    } finally {
      setIsGeneratingFrames(false);
    }
  };

  // 新しいタブでフレーム表示（Claude.ai対応）
  const showFrameInNewTab = (frame: any) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${frame.filename} - Right Click to Save</title></head>
          <body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;">
            <div style="text-align:center;">
              <h3 style="color:white; font-family:Arial;">${frame.filename}</h3>
              <img src="${frame.dataURL}" alt="${frame.filename}" style="max-width:90%; max-height:80vh;" />
              <p style="color:white; font-family:Arial; margin-top:20px;">
                右クリック → 「名前を付けて画像を保存」でダウンロード<br>
                Right Click → "Save Image As" to Download
              </p>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    }
  };

  // モーダル表示版（改良版）
  const showFramesModal = useCallback(() => {
    if (generatedFrames.length === 0) {
      alert('最初に「🎨 フレーム生成」を実行してください。');
      return;
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.9); z-index: 10000; 
      overflow: auto; padding: 20px;
    `;

    const frameGrid = generatedFrames.map((frame, index) => `
      <div style="display: inline-block; margin: 10px; text-align: center; background: white; padding: 15px; border-radius: 8px; max-width: 200px;">
        <h4 style="margin: 0 0 10px 0; font-size: 12px;">${frame.filename}</h4>
        <img src="${frame.dataURL}" 
             alt="${frame.filename}" 
             style="max-width: 150px; max-height: 150px; border: 1px solid #ddd; cursor: pointer;"
             onclick="
               const newWindow = window.open();
               newWindow.document.write(\`
                 <html>
                   <head><title>${frame.filename}</title></head>
                   <body style='margin:0; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;'>
                     <div style='text-align:center;'>
                       <h3 style='color:white; font-family:Arial;'>${frame.filename}</h3>
                       <img src='${frame.dataURL}' style='max-width:90%; max-height:80vh;' />
                       <p style='color:white; font-family:Arial; margin-top:20px;'>右クリック → 「名前を付けて画像を保存」</p>
                     </div>
                   </body>
                 </html>
               \`);
               newWindow.document.close();
             " />
        <br>
        <button onclick="
          const newWindow = window.open();
          newWindow.document.write(\`
            <html>
              <head><title>${frame.filename}</title></head>
              <body style='margin:0; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;'>
                <div style='text-align:center;'>
                  <h3 style='color:white; font-family:Arial;'>${frame.filename}</h3>
                  <img src='${frame.dataURL}' style='max-width:90%; max-height:80vh;' />
                  <p style='color:white; font-family:Arial; margin-top:20px;'>右クリック → 「名前を付けて画像を保存」</p>
                </div>
              </body>
            </html>
          \`);
          newWindow.document.close();
        " style="margin-top: 10px; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
          🔗 新しいタブで開く
        </button>
      </div>
    `).join('');

    modal.innerHTML = `
      <div style="background: white; margin: 20px auto; padding: 30px; border-radius: 15px; max-width: 1200px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1>🎨 生成されたフレーム一覧</h1>
          <p><strong>パターン:</strong> ${pattern} | <strong>フレーム数:</strong> ${generatedFrames.length}</p>
          <div style="margin: 20px 0; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
              ❌ 閉じる
            </button>
          </div>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
            <strong>💡 保存方法:</strong><br>
            1. 画像をクリックまたは「新しいタブで開く」ボタンをクリック<br>
            2. 新しいタブで画像を右クリック → 「名前を付けて画像を保存」<br>
            3. 全ファイル保存後、<a href="https://ezgif.com/maker" target="_blank" style="color: #007bff;">EZGIF.com</a> でGIF作成
          </div>
        </div>
        <div style="display: flex; flex-wrap: wrap; justify-content: center;">
          ${frameGrid}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }, [generatedFrames, pattern]);

  // メイン描画関数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    timeRef.current += speed;

    switch (pattern) {
      case 'spiral':
        drawSpiralPattern(ctx, canvas, timeRef.current);
        break;
      case 'ripple':
        drawRipplePattern(ctx, canvas, timeRef.current);
        break;
      case 'star':
        drawStarPattern(ctx, canvas, timeRef.current);
        break;
      case 'triangle':
        drawTrianglePattern(ctx, canvas, timeRef.current);
        break;
      case 'hexagon':
        drawHexagonPattern(ctx, canvas, timeRef.current);
        break;
      case 'hypnotic':
        drawHypnoticSpiralPattern(ctx, canvas, timeRef.current);
        break;
      case 'geometric-star':
        drawGeometricStarPattern(ctx, canvas, timeRef.current);
        break;
      case 'random':
        drawRandomPattern(ctx, canvas, timeRef.current);
        break;
    }

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [pattern, speed, density, colorMode, scale, rotation, isPlaying]);

  // キャンバス初期化
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        const size = Math.min(container.clientWidth, container.clientHeight, 800);
        canvas.width = size;
        canvas.height = size;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // アニメーション制御
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animationRef.current);
    }

    return () => cancelAnimationFrame(animationRef.current);
  }, [isPlaying, draw]);

  const togglePlayPause = () => setIsPlaying(!isPlaying);

  const resetAnimation = () => {
    timeRef.current = 0;
  };

  // 静止画ダウンロード
  const downloadFrame = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const newWindow = window.open();
      if (newWindow) {
        const dataURL = canvas.toDataURL('image/png');
        newWindow.document.write(`
          <html>
            <head><title>Geometric Pattern - Right Click to Save</title></head>
            <body style="margin:0; background:#000; display:flex; justify-content:center; align-items:center; min-height:100vh;">
              <div style="text-align:center;">
                <img src="${dataURL}" alt="Geometric Pattern" style="max-width:100%; max-height:80vh;" />
                <p style="color:white; font-family:Arial; margin-top:20px;">
                  右クリック → 「名前を付けて画像を保存」でダウンロード<br>
                  Right Click → "Save Image As" to Download
                </p>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
    }
  };

  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex flex-col items-center justify-center p-4">
      {/* ヘッダー */}
      <div className="w-full max-w-4xl mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-2">
          幾何学模様ループアニメ作成ツール
        </h1>
        <p className="text-gray-300 text-center text-sm">
          MP4録画・GIF生成・フレーム生成 | Claude.ai完全対応
        </p>
      </div>

      {/* メインキャンバス */}
      <div className="relative flex-1 w-full max-w-4xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="border border-purple-500/30 rounded-lg shadow-2xl"
        />

        {/* 設定ボタン（右上固定） */}
        <button
          onClick={() => setShowControls(!showControls)}
          className="absolute top-4 right-4 w-12 h-12 bg-black/70 backdrop-blur-sm hover:bg-black/90 rounded-lg flex items-center justify-center text-white transition-all duration-300 shadow-lg"
          title="設定を開く/閉じる"
        >
          <Settings size={20} className={`transition-transform duration-300 ${showControls ? 'rotate-90' : ''}`} />
        </button>

        {/* 録画・生成進捗バー */}
        {(isGeneratingFrames || isRecording || isGeneratingGif) && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-80 bg-black/80 backdrop-blur-sm rounded-lg p-4">
            <div className="text-white text-sm mb-2 text-center">
              {isRecording ? `🎥 MP4録画中... (${recordingDuration}秒)` :
                isGeneratingGif ? `🎨 GIF生成中... (${Math.round(gifProgress)}%)` :
                  `🎨 フレーム生成中... (${Math.round(generationProgress)}%)`}
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className={`${isRecording ? 'bg-gradient-to-r from-red-500 to-pink-500' :
                  isGeneratingGif ? 'bg-gradient-to-r from-pink-500 to-purple-500' :
                    'bg-gradient-to-r from-green-500 to-blue-500'} h-3 rounded-full transition-all duration-300`}
                style={{ width: isRecording ? '100%' : isGeneratingGif ? `${gifProgress}%` : `${generationProgress}%` }}
              ></div>
            </div>
            <div className="text-gray-300 text-xs mt-1 text-center">
              {isRecording ? '8秒で自動停止' :
                isGeneratingGif ? '30フレーム → GIF変換中...' :
                  '60フレーム生成中...'}
            </div>
            {isRecording && (
              <button
                onClick={stopMP4Recording}
                className="w-full mt-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded transition-colors"
              >
                ⏹️ 録画停止
              </button>
            )}
          </div>
        )}

        {/* コントロールパネル */}
        <div className={`absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 transition-all duration-300 shadow-lg min-w-56 ${showControls ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="flex gap-2 mb-4">
            <button
              onClick={togglePlayPause}
              className="w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-md flex items-center justify-center text-white transition-colors"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={resetAnimation}
              className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-md flex items-center justify-center text-white transition-colors"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={downloadFrame}
              className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-md flex items-center justify-center text-white transition-colors"
              title="静止画ダウンロード"
            >
              <Download size={18} />
            </button>
          </div>

          {/* 動画・アニメーション出力機能 */}
          <div className="mb-4">
            <label className="text-white text-xs block mb-2">動画・アニメーション出力</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={startMP4Recording}
                disabled={isRecording || isGeneratingFrames || isGeneratingGif}
                className={`h-12 ${isRecording ? 'bg-red-600' : 'bg-red-600 hover:bg-red-700'} rounded-md flex flex-col items-center justify-center text-white transition-colors text-xs disabled:opacity-50`}
              >
                <Video size={16} />
                <span>{isRecording ? '録画中...' : '🎥 MP4録画(8秒)'}</span>
              </button>
              <button
                onClick={generateGIF}
                disabled={isRecording || isGeneratingFrames || isGeneratingGif}
                className={`h-12 ${isGeneratingGif ? 'bg-pink-600' : 'bg-pink-600 hover:bg-pink-700'} rounded-md flex flex-col items-center justify-center text-white transition-colors text-xs disabled:opacity-50`}
              >
                <span className="text-base">🎨</span>
                <span>{isGeneratingGif ? 'GIF生成中...' : '🎯 GIF生成(3秒)'}</span>
              </button>
              <button
                onClick={generateAnimationFrames}
                disabled={isRecording || isGeneratingFrames || isGeneratingGif}
                className={`h-12 ${isGeneratingFrames ? 'bg-orange-600' : 'bg-green-600 hover:bg-green-700'} rounded-md flex flex-col items-center justify-center text-white transition-colors text-xs disabled:opacity-50`}
              >
                <FileImage size={16} />
                <span>{isGeneratingFrames ? '生成中...' : '🎨 フレーム生成'}</span>
              </button>
              <button
                onClick={showFramesModal}
                disabled={generatedFrames.length === 0}
                className="h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 rounded-md flex flex-col items-center justify-center text-white transition-colors text-xs"
              >
                <Package size={16} />
                <span>📦 フレーム表示</span>
              </button>
              <button
                onClick={showScreenRecordingGuide}
                className="h-12 bg-purple-600 hover:bg-purple-700 rounded-md flex flex-col items-center justify-center text-white transition-colors text-xs"
              >
                <Monitor size={16} />
                <span>🖥️ 画面録画ガイド</span>
              </button>
            </div>
          </div>

          {/* 生成状況表示 */}
          {generatedFrames.length > 0 && (
            <div className="mb-4 p-2 bg-green-900/50 rounded text-xs text-green-300">
              ✅ {generatedFrames.length}フレーム生成済み
              <br />
              <span className="text-gray-300">
                パターン: {pattern} | 新しいタブで保存可能
              </span>
            </div>
          )}

          {isGeneratingFrames && (
            <div className="mb-4 p-2 bg-blue-900/50 rounded text-xs text-blue-300">
              🎨 フレーム生成中: {Math.round(generationProgress)}%
              <br />
              <span className="text-gray-300">
                生成済み: {generatedFrames.length}/60フレーム
              </span>
            </div>
          )}

          {isGeneratingGif && (
            <div className="mb-4 p-2 bg-pink-900/50 rounded text-xs text-pink-300">
              🎯 GIF生成中: {Math.round(gifProgress)}%
              <br />
              <span className="text-gray-300">
                {gifProgress < 50 ? 'フレーム生成中...' : 'GIF変換中...'}
              </span>
            </div>
          )}

          {isRecording && (
            <div className="mb-4 p-2 bg-red-900/50 rounded text-xs text-red-300">
              🎥 MP4録画中: {recordingDuration}秒
              <br />
              <span className="text-gray-300">
                最大8秒まで録画 | WebM形式で保存
              </span>
            </div>
          )}

          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${isPlaying
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {isPlaying ? '⏸️ Pause' : '▶️ Play'}
            </button>

            <span className="text-gray-400 text-sm">
              {isPlaying ? 'Animation running' : 'Animation paused'}
            </span>
          </div>
          {/* パターン選択 */}
          <div className="mb-3">
            <label className="text-white text-xs block mb-2">パターン</label>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              className="w-full bg-gray-800 text-white text-xs rounded px-2 py-2"
            >
              <option value="spiral">三角形格子</option>
              <option value="ripple">波紋リップル</option>
              <option value="star">星型パターン</option>
              <option value="triangle">三角フラクタル</option>
              <option value="hexagon">六角形ハニカム</option>
              <option value="hypnotic">渦巻き模様</option>
              <option value="geometric-star">幾何学星</option>
              <option value="random">ドットパターン</option>
            </select>
          </div>

          {/* 色彩モード */}
          <div className="mb-3">
            <label className="text-white text-xs block mb-2">色彩</label>
            <select
              value={colorMode}
              onChange={(e) => setColorMode(e.target.value)}
              className="w-full bg-gray-800 text-white text-xs rounded px-2 py-2"
            >
              <option value="rainbow">レインボー</option>
              <option value="monochrome">モノクローム</option>
              <option value="gradient">グラデーション</option>
              <option value="fire">炎</option>
              <option value="ocean">海洋</option>
            </select>
          </div>

          {/* 速度調整 */}
          <div className="mb-3">
            <label className="text-white text-xs block mb-2">
              速度: {speed.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 密度調整 */}
          <div className="mb-3">
            <label className="text-white text-xs block mb-2">
              密度: {density}
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={density}
              onChange={(e) => setDensity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* スケール調整 */}
          <div className="mb-3">
            <label className="text-white text-xs block mb-2">
              スケール: {scale.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.3"
              max="2"
              step="0.1"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {/* 回転係数 */}
          <div>
            <label className="text-white text-xs block mb-2">
              回転: {rotation.toFixed(1)}
            </label>
            <input
              type="range"
              min="-2"
              max="2"
              step="0.1"
              value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="w-full max-w-4xl mt-4 text-center">
        <p className="text-gray-400 text-xs">
          🎥 MP4録画 | 🎯 GIF生成 | 🎨 フレーム生成 | 📦 新しいタブで保存 | 🖥️ 画面録画ガイド
        </p>
      </div>
    </div>
  );
};

export default GeometricLoopAnimator;
