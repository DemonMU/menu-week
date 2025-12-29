const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库连接
const db = new sqlite3.Database(path.join(__dirname, 'menu.db'), (err) => {
  if (err) {
    console.error('数据库连接失败:', err);
  } else {
    console.log('数据库连接成功');
    initDatabase();
  }
});

// 初始化数据库表
function initDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      day_of_week INTEGER NOT NULL,
      meal_type TEXT NOT NULL,
      video_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('创建表失败:', err);
    } else {
      console.log('数据表初始化成功');
    }
  });
}

// 数据库操作函数
const dbOperations = {
  // 获取所有菜品
  getAllDishes: () => {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM dishes ORDER BY day_of_week, meal_type', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  // 根据ID获取菜品
  getDishById: (id) => {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM dishes WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  // 添加新菜品
  addDish: (dish) => {
    return new Promise((resolve, reject) => {
      const { name, description, day_of_week, meal_type, video_path } = dish;
      db.run(
        `INSERT INTO dishes (name, description, day_of_week, meal_type, video_path) 
         VALUES (?, ?, ?, ?, ?)`,
        [name, description, day_of_week, meal_type, video_path],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });
  },

  // 更新菜品
  updateDish: (id, dish) => {
    return new Promise((resolve, reject) => {
      const { name, description, day_of_week, meal_type, video_path } = dish;
      db.run(
        `UPDATE dishes 
         SET name = ?, description = ?, day_of_week = ?, meal_type = ?, video_path = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [name, description, day_of_week, meal_type, video_path, id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  },

  // 删除菜品
  deleteDish: (id) => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM dishes WHERE id = ?', [id], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }
};

module.exports = { db, dbOperations };
