const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { dbOperations } = require('./database');

const app = express();
const PORT = process.env.PORT || 3005;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads/videos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持视频文件格式！'));
    }
  },
  limits: { fileSize: 100 * 1024 * 1024 } // 限制100MB
});

// API 路由

// 获取所有菜品
app.get('/api/dishes', async (req, res) => {
  try {
    const dishes = await dbOperations.getAllDishes();
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ error: '获取菜品失败', message: error.message });
  }
});

// 获取单个菜品
app.get('/api/dishes/:id', async (req, res) => {
  try {
    const dish = await dbOperations.getDishById(req.params.id);
    if (dish) {
      res.json(dish);
    } else {
      res.status(404).json({ error: '菜品不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: '获取菜品失败', message: error.message });
  }
});

// 添加新菜品
app.post('/api/dishes', upload.single('video'), async (req, res) => {
  try {
    const dishData = {
      name: req.body.name,
      description: req.body.description || '',
      day_of_week: parseInt(req.body.day_of_week),
      meal_type: req.body.meal_type,
      video_path: req.file ? `/uploads/videos/${req.file.filename}` : null
    };
    
    const result = await dbOperations.addDish(dishData);
    res.status(201).json({ id: result.id, message: '菜品添加成功' });
  } catch (error) {
    res.status(500).json({ error: '添加菜品失败', message: error.message });
  }
});

// 更新菜品
app.put('/api/dishes/:id', upload.single('video'), async (req, res) => {
  try {
    const oldDish = await dbOperations.getDishById(req.params.id);
    
    if (!oldDish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    
    const dishData = {
      name: req.body.name,
      description: req.body.description || '',
      day_of_week: parseInt(req.body.day_of_week),
      meal_type: req.body.meal_type,
      video_path: req.file ? `/uploads/videos/${req.file.filename}` : oldDish.video_path
    };
    
    // 如果上传了新视频，删除旧视频
    if (req.file && oldDish.video_path) {
      const oldVideoPath = path.join(__dirname, 'public', oldDish.video_path);
      if (fs.existsSync(oldVideoPath)) {
        fs.unlinkSync(oldVideoPath);
      }
    }
    
    await dbOperations.updateDish(req.params.id, dishData);
    res.json({ message: '菜品更新成功' });
  } catch (error) {
    res.status(500).json({ error: '更新菜品失败', message: error.message });
  }
});

// 删除菜品
app.delete('/api/dishes/:id', async (req, res) => {
  try {
    const dish = await dbOperations.getDishById(req.params.id);
    
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    
    // 删除关联的视频文件
    if (dish.video_path) {
      const videoPath = path.join(__dirname, 'public', dish.video_path);
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
    }
    
    await dbOperations.deleteDish(req.params.id);
    res.json({ message: '菜品删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除菜品失败', message: error.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
