const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, 'src', 'assets', 'characters');
const MAX_SIZE_BYTES = 200 * 1024;
const MIN_WIDTH = 400;

async function compressImage(inputPath, outputPath) {
  const originalSize = fs.statSync(inputPath).size;
  const metadata = await sharp(inputPath).metadata();
  
  let width = metadata.width;
  let height = metadata.height;
  
  if (width < MIN_WIDTH) {
    width = MIN_WIDTH;
    height = Math.round((MIN_WIDTH / metadata.width) * metadata.height);
  }
  
  let quality = 80;
  let outputBuffer;
  let compressedSize;
  
  do {
    outputBuffer = await sharp(inputPath)
      .resize(width, height, { fit: 'inside', withoutEnlargement: false })
      .webp({ quality, effort: 6 })
      .toBuffer();
    
    compressedSize = outputBuffer.length;
    
    if (compressedSize > MAX_SIZE_BYTES && quality > 20) {
      quality -= 10;
    } else if (compressedSize > MAX_SIZE_BYTES && width > MIN_WIDTH) {
      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
      quality = 80;
    } else {
      break;
    }
  } while (compressedSize > MAX_SIZE_BYTES && (quality > 20 || width > MIN_WIDTH));
  
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

async function main() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.toLowerCase().endsWith('.png'));
  
  console.log(`找到 ${files.length} 张 PNG 图片\n`);
  console.log('文件名'.padEnd(25) + '原始大小'.padStart(12) + '压缩后'.padStart(12) + '压缩率'.padStart(10) + '原始尺寸'.padStart(15) + '压缩后尺寸'.padStart(15));
  console.log('-'.repeat(90));
  
  const results = [];
  let totalOriginal = 0;
  let totalCompressed = 0;
  
  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const outputFile = file.replace(/\.png$/i, '.webp');
    const outputPath = path.join(IMAGES_DIR, outputFile);
    
    try {
      const result = await compressImage(inputPath, outputPath);
      results.push({ file: outputFile, ...result });
      totalOriginal += result.originalSize;
      totalCompressed += result.compressedSize;
      
      const ratio = ((1 - result.compressedSize / result.originalSize) * 100).toFixed(1);
      console.log(
        outputFile.padEnd(25) +
        formatSize(result.originalSize).padStart(12) +
        formatSize(result.compressedSize).padStart(12) +
        (ratio + '%').padStart(10) +
        `${result.originalWidth}x${result.originalHeight}`.padStart(15) +
        `${result.finalWidth}x${result.finalHeight}`.padStart(15)
      );
    } catch (err) {
      console.error(`处理 ${file} 时出错:`, err.message);
    }
  }
  
  console.log('-'.repeat(90));
  const totalRatio = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
  console.log(
    '总计'.padEnd(25) +
    formatSize(totalOriginal).padStart(12) +
    formatSize(totalCompressed).padStart(12) +
    (totalRatio + '%').padStart(10)
  );
  
  console.log('\n✓ 压缩完成！WebP 文件已保存到同一目录');
  return results;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

main().catch(console.error);
