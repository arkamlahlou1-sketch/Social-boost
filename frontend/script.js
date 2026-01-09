const CONFIG = {
  API_BASE: "https://social-boost-production-eac9.up.railway.app",
  USER_ID: localStorage.getItem("userId")
};

let activeTaskId = null;

// تسجيل الدخول تلقائيًا
async function autoLogin() {
  if (!CONFIG.USER_ID) {
    const res = await fetch(`${CONFIG.API_BASE}/auth/login`, { method: "POST" });
    const data = await res.json();
    localStorage.setItem("userId", data.userId);
    CONFIG.USER_ID = data.userId;
  }
}

// تحديث الرصيد
async function updateBalance(points=0) {
  document.getElementById('userBalance').innerText = points;
}

// تحميل المهام
async function loadTasks() {
  const list = document.getElementById('tasksList');
  try {
    const res = await fetch(`${CONFIG.API_BASE}/tasks`);
    const tasks = await res.json();

    if (!tasks || tasks.length === 0) {
      list.innerHTML = `<p style="text-align:center;color:gray;">لا توجد مهام متاحة</p>`;
      return;
    }

    list.innerHTML = tasks.map(task => `
      <div class="task-card">
        <h3>زيارة حساب</h3>
        <p>المكافأة: ${task.reward} نقطة</p>
        <button onclick="startTask('${task.id}', '${task.link}')">بدء المهمة</button>
      </div>
    `).join('');

  } catch (e) {
    list.innerHTML = `<p style="text-align:center;color:red;">حدث خطأ في تحميل المهام</p>`;
    console.error(e);
  }
}

// بدء المهمة
async function startTask(taskId, link) {
  activeTaskId = taskId;

  try {
    await fetch(`${CONFIG.API_BASE}/tasks/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: CONFIG.USER_ID, taskId })
    });

    window.open(link, "_blank");

    let seconds = 20;
    const btn = document.getElementById("confirmTask");
    btn.disabled = true;

    const timer = setInterval(() => {
      btn.innerText = `انتظر ${seconds--} ثانية`;
      if (seconds < 0) {
        clearInterval(timer);
        btn.disabled = false;
        btn.innerText = "تأكيد المهمة";
      }
    }, 1000);

  } catch (e) {
    alert("خطأ في بدء المهمة");
    console.error(e);
  }
}

// تأكيد المهمة
async function confirmTask() {
  if (!activeTaskId) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE}/tasks/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: CONFIG.USER_ID, taskId: activeTaskId })
    });

    const data = await res.json();

    if (data.success) {
      alert(`تمت المهمة! رصيدك الآن: ${data.points} نقطة`);
      updateBalance(data.points);
      loadTasks();
    } else {
      alert(data.error || "حدث خطأ أثناء تأكيد المهمة");
    }

  } catch (e) {
    alert("خطأ في الاتصال بالسيرفر");
    console.error(e);
  }
}

// شراء باقات النقاط
function buyPackage(points) {
  alert(`تم شراء ${points} نقطة! (في النسخة التجريبية مؤقت)`);
  updateBalance(points); // مؤقت
}

// عند تحميل الصفحة
window.onload = async () => {
  await autoLogin();
  await loadTasks();
  await updateBalance();
};
