/**
 * SVG转PNG转换脚本
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'image', 'chaos_space.svg');
const pngPath = path.join(__dirname, 'image', 'chaos_space.png');

// 读取SVG文件
const svgBuffer = fs.readFileSync(svgPath);

// 转换为PNG (2倍分辨率保证清晰度)
sharp(svgBuffer)
  .resize(800, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(pngPath)
  .then(() => {
    console.log('✓ SVG转换为PNG成功');
    console.log(`  输出: ${pngPath}`);
  })
  .catch(err => {
    console.error('✗ 转换失败:', err.message);
    process.exit(1);
  });
