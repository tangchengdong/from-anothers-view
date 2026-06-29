const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const TARGETS = [
  { dir: path.join(__dirname, 'public', 'cards'), maxSizeKB: 120, minWidth: 480, label: 'public/cards' },
  { dir: path.join(__dirname, 'src', 'assets', 'characters'), maxSizeKB: 80, minWidth: 300, label: 'src/assets/characters' }
];

async function compressToWebp(inputPath, outputPath, maxSizeKB, minWidth) {
  const originalSize = fs.statSync(inputPath).size;
  const metadata = await sharp(inputPath).metadata();

  let width = Math.min(metadata.width, minWidth);
  let height = Math.round((width / metadata.width) * metadata.height);

  let quality = 82;
  let outputBuffer;
  let compressedSize;
  const maxBytes = maxSizeKB * 1024;

  let attempts = 0;
  do {
    attempts++;
    outputBuffer = await sharp(inputPath)
      .resize(width, height, { fit: 'inside', withoutEnlargement: false })
      .webp({ quality, effort: 6 })
      .toBuffer();

    compressedSize = outputBuffer.length;

    if (compressedSize > maxBytes && quality > 30) {
      quality -= 8;
    } else if (compressedSize > maxBytes && width > 200) {
      width = Math.round(width * 0.88);
      height = Math.round(height * 0.88);
      quality = 82;
    } else {
      break;
    }
  } while (compressedSize > maxBytes && attempts < 25 && (quality > 30 || width > 200));

  fs.writeFileSync(outputPath, outputBuffer);

  return {
    originalSize,
    compressedSize,
    originalWidth: metadata.width,
    originalHeight: metadata.height,
    finalWidth: width,
    finalHeight: height,
    quality
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function processDir(target) {
  const { dir, maxSizeKB, minWidth, label } = target;

  if (!fs.existsSync(dir)) {
    console.log(`[跳过] ${label} 目录不存在: ${dir}`);
    return { totalOriginal: 0, totalCompressed: 0, count: 0 };
  }

  const allFiles = fs.readdirSync(dir);
  const sourceFiles = allFiles.filter(f => /\.(jpg|jpeg|png)$/i.test(f));
  const webpFiles = allFiles.filter(f => /\.webp$/i.test(f));

  console.log(`\n${'='.repeat(70)}`);
  console.log(`处理目录: ${label}`);
  console.log(`发现 ${sourceFiles.length} 张 JPG/PNG 源图片, 已有 ${webpFiles.length} 张 WebP`);
  console.log(`${'='.repeat(70)}`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let count = 0;

  for (const file of sourceFiles) {
    const inputPath = path.join(dir, file);
    const webpOutput = path.join(dir, file.replace(/\.(jpg|jpeg|png)$/i, '.webp'));

    const webpExists = fs.existsSync(webpOutput);

    try {
      const result = await compressToWebp(inputPath, webpOutput, maxSizeKB, minWidth);
      totalOriginal += result.originalSize;
      totalCompressed += result.compressedSize;
      count++;

      const ratio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);
      const status = webpExists ? '[更新]' : '[新建]';
      console.log(
        `${status} ${file.padEnd(32)} ${formatSize(result.originalSize).padStart(10)} -> ${formatSize(result.compressedSize).padStart(10)} (-${ratio}%) Q${result.quality} ${result.finalWidth}x${result.finalHeight}`
      );
    } catch (err) {
      console.error(`处理 ${file} 时出错:`, err.message);
    }
  }

  if (count > 0) {
    console.log(`${'-'.repeat(70)}`);
    const totalRatio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
    console.log(
      `[${label}] 总计: ${formatSize(totalOriginal)} -> ${formatSize(totalCompressed)} (节省 ${totalRatio}%, ${count} 张)`
    );
  }

  return { totalOriginal, totalCompressed, count };
}

async function main() {
  console.log('===== 图片批量压缩为 WebP =====');
  console.log(`目标: 卡牌 <=120KB(480px宽), 头像 <=80KB(300px宽)`);

  let grandOriginal = 0;
  let grandCompressed = 0;
  let grandCount = 0;

  for (const target of TARGETS) {
    const result = await processDir(target);
    grandOriginal += result.totalOriginal;
    grandCompressed += result.totalCompressed;
    grandCount += result.count;
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`全部完成! 处理 ${grandCount} 张图片`);
  console.log(`总大小: ${formatSize(grandOriginal)} -> ${formatSize(grandCompressed)}`);
  const ratio = ((1 - grandCompressed / grandOriginal) * 100).toFixed(1);
  console.log(`总体节省: ${ratio}%`);
}

main().catch(console.error);
