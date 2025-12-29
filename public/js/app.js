// 全局变量
const API_URL = '/api/dishes';
let currentEditId = null;
const weekDays = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const weekDaysShort = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const mealTypes = {
  'breakfast': '🌅 早餐',
  'lunch': '☀️ 午餐',
  'dinner': '🌙 晚餐'
};

// 检查是否为管理员模式
function isAdmin() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('role') === 'admin';
}

// DOM 元素
const dishModal = document.getElementById('dishModal');
const videoModal = document.getElementById('videoModal');
const dishForm = document.getElementById('dishForm');
const addDishBtn = document.getElementById('addDishBtn');
const weekMenu = document.getElementById('weekMenu');
const videoPlayer = document.getElementById('videoPlayer');

// 获取今天是星期几 (1-7, 1=周一)
function getTodayDayOfWeek() {
  const today = new Date();
  const day = today.getDay();
  // JavaScript: 0=周日, 1=周一...6=周六
  // 转换为: 1=周一, 2=周二...7=周日
  return day === 0 ? 7 : day;
}

// 格式化当前日期
function formatCurrentDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const date = today.getDate();
  const dayOfWeek = getTodayDayOfWeek();
  
  return `${year}年${month}月${date}日 ${weekDays[dayOfWeek - 1]}`;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 根据权限控制添加按钮显示
  if (!isAdmin()) {
    addDishBtn.style.display = 'none';
  }
  
  displayCurrentDate();
  loadDishes();
  initEventListeners();
  setDefaultDayOfWeek();
});

// 显示当前日期
function displayCurrentDate() {
  const dateElement = document.getElementById('currentDate');
  if (dateElement) {
    dateElement.innerHTML = `
      <span class="date-icon">📅</span>
      <span class="date-text">${formatCurrentDate()}</span>
    `;
  }
}

// 设置默认选中今天
function setDefaultDayOfWeek() {
  const daySelect = document.getElementById('dayOfWeek');
  if (daySelect) {
    daySelect.value = getTodayDayOfWeek();
  }
}

// 初始化事件监听
function initEventListeners() {
  // 添加菜品按钮
  addDishBtn.addEventListener('click', () => openModal());

  // 关闭模态框
  document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      this.closest('.modal').style.display = 'none';
      if (videoPlayer) videoPlayer.pause();
    });
  });

  // 点击模态框外部关闭
  window.addEventListener('click', (e) => {
    if (e.target === dishModal) {
      dishModal.style.display = 'none';
    }
    if (e.target === videoModal) {
      videoModal.style.display = 'none';
      videoPlayer.pause();
    }
  });

  // ESC键关闭模态框
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      dishModal.style.display = 'none';
      videoModal.style.display = 'none';
      if (videoPlayer) videoPlayer.pause();
    }
  });

  // 取消按钮
  document.getElementById('cancelBtn').addEventListener('click', () => {
    dishModal.style.display = 'none';
  });

  // 表单提交
  dishForm.addEventListener('submit', handleFormSubmit);
}

// 加载所有菜品
async function loadDishes() {
  try {
    weekMenu.innerHTML = '<div class="loading">加载中</div>';
    
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('加载失败');
    
    const dishes = await response.json();
    renderWeekMenu(dishes);
  } catch (error) {
    console.error('加载菜品失败:', error);
    weekMenu.innerHTML = '<div class="loading">加载失败，请刷新页面重试</div>';
  }
}

// 渲染周菜单
function renderWeekMenu(dishes) {
  weekMenu.innerHTML = '';
  const todayNum = getTodayDayOfWeek();
  
  // 按天分组
  const dishesByDay = {};
  for (let i = 1; i <= 7; i++) {
    dishesByDay[i] = {
      breakfast: [],
      lunch: [],
      dinner: []
    };
  }
  
  // 分类菜品
  dishes.forEach(dish => {
    if (dishesByDay[dish.day_of_week]) {
      dishesByDay[dish.day_of_week][dish.meal_type].push(dish);
    }
  });
  
  // 生成每天的卡片
  for (let day = 1; day <= 7; day++) {
    const dayCard = createDayCard(day, dishesByDay[day], day === todayNum);
    weekMenu.appendChild(dayCard);
  }
}

// 创建每天的卡片
function createDayCard(dayNum, meals, isToday) {
  const card = document.createElement('div');
  card.className = 'day-card' + (isToday ? ' today' : '');
  
  const dayHeader = document.createElement('div');
  dayHeader.className = 'day-header';
  dayHeader.textContent = weekDays[dayNum - 1];
  card.appendChild(dayHeader);
  
  // 遍历三餐
  ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
    const mealSection = document.createElement('div');
    mealSection.className = 'meal-section';
    
    const mealTypeLabel = document.createElement('div');
    mealTypeLabel.className = 'meal-type';
    mealTypeLabel.textContent = mealTypes[mealType];
    mealSection.appendChild(mealTypeLabel);
    
    if (meals[mealType].length > 0) {
      // 支持每餐多个菜品
      meals[mealType].forEach(dish => {
        const dishItem = createDishItem(dish);
        mealSection.appendChild(dishItem);
      });
    } else {
      const emptyMeal = document.createElement('div');
      emptyMeal.className = 'empty-meal';
      emptyMeal.textContent = '暂无菜品';
      mealSection.appendChild(emptyMeal);
    }
    
    card.appendChild(mealSection);
  });
  
  return card;
}

// 创建菜品项
function createDishItem(dish) {
  const item = document.createElement('div');
  item.className = 'dish-item';
  
  const name = document.createElement('div');
  name.className = 'dish-name';
  name.textContent = dish.name;
  item.appendChild(name);
  
  if (dish.description) {
    const desc = document.createElement('div');
    desc.className = 'dish-description';
    desc.textContent = dish.description;
    item.appendChild(desc);
  }
  
  const actions = document.createElement('div');
  actions.className = 'dish-actions';
  
  // 查看视频按钮（视频是可选的，只有有视频时才显示）- 醒目样式
  if (dish.video_path) {
    const videoBtn = document.createElement('button');
    videoBtn.className = 'btn btn-video game-btn';
    videoBtn.innerHTML = '▶️ 观看视频';
    videoBtn.onclick = () => openVideoModal(dish);
    actions.appendChild(videoBtn);
  }
  
  // 只有管理员才能看到编辑和删除按钮
  if (isAdmin()) {
    // 编辑按钮 - 使用弱化样式
    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-subtle edit';
    editBtn.innerHTML = '✏️ 编辑';
    editBtn.onclick = () => openModal(dish);
    actions.appendChild(editBtn);
    
    // 删除按钮 - 使用弱化样式
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-subtle delete';
    deleteBtn.innerHTML = '🗑️ 删除';
    deleteBtn.onclick = () => deleteDish(dish.id);
    actions.appendChild(deleteBtn);
  }
  
  item.appendChild(actions);
  return item;
}

// 打开模态框（添加或编辑）
function openModal(dish = null) {
  const modalTitle = document.getElementById('modalTitle');
  const dishId = document.getElementById('dishId');
  const currentVideo = document.getElementById('currentVideo');
  
  dishForm.reset();
  currentVideo.innerHTML = '';
  
  if (dish) {
    // 编辑模式
    modalTitle.textContent = '✏️ 编辑菜品';
    dishId.value = dish.id;
    document.getElementById('dishName').value = dish.name;
    document.getElementById('dayOfWeek').value = dish.day_of_week;
    document.getElementById('mealType').value = dish.meal_type;
    document.getElementById('description').value = dish.description || '';
    
    if (dish.video_path) {
      currentVideo.innerHTML = `<strong>📹 当前视频：</strong><a href="${dish.video_path}" target="_blank">点击查看</a>`;
    }
    
    currentEditId = dish.id;
  } else {
    // 添加模式
    modalTitle.textContent = '🍖 添加菜品';
    dishId.value = '';
    currentEditId = null;
    // 默认选择今天
    setDefaultDayOfWeek();
  }
  
  dishModal.style.display = 'block';
  // 聚焦到菜品名称输入框
  setTimeout(() => {
    document.getElementById('dishName').focus();
  }, 100);
}

// 打开视频模态框
function openVideoModal(dish) {
  const videoTitle = document.getElementById('videoTitle');
  videoTitle.textContent = `🎬 ${dish.name} - 烹饪视频`;
  
  videoPlayer.src = dish.video_path;
  videoPlayer.load();
  videoModal.style.display = 'block';
}

// 表单提交处理
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const formData = new FormData(dishForm);
  formData.delete('dishId'); // 删除隐藏字段
  
  // 如果没有选择视频，确保不发送空文件
  const videoFile = document.getElementById('videoFile').files[0];
  if (!videoFile) {
    formData.delete('video');
  }
  
  try {
    let response;
    
    if (currentEditId) {
      // 更新菜品
      response = await fetch(`${API_URL}/${currentEditId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      // 添加新菜品
      response = await fetch(API_URL, {
        method: 'POST',
        body: formData
      });
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '操作失败');
    }
    
    dishModal.style.display = 'none';
    await loadDishes();
    showNotification(currentEditId ? '🎉 菜品更新成功！' : '🎉 菜品添加成功！', 'success');
  } catch (error) {
    console.error('提交失败:', error);
    showNotification('❌ 操作失败: ' + error.message, 'error');
  }
}

// 删除菜品
async function deleteDish(id) {
  if (!confirm('⚠️ 确定要删除这道菜品吗？此操作无法撤销！')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '删除失败');
    }
    
    await loadDishes();
    showNotification('🗑️ 菜品删除成功！', 'success');
  } catch (error) {
    console.error('删除失败:', error);
    showNotification('❌ 删除失败: ' + error.message, 'error');
  }
}

// 显示通知 - 游戏风格
function showNotification(message, type = 'info') {
  // 移除已有的通知
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'notificationOut 0.4s ease forwards';
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}
