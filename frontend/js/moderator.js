// Check if moderator is logged in
function checkModAuth() {
  const currentModerator = JSON.parse(localStorage.getItem("currentModerator"))
  if (!currentModerator || !currentModerator.id) {
    window.location.href = "/"
  }
  return currentModerator
}

const currentModerator = checkModAuth()

// Page Navigation
const navItems = document.querySelectorAll(".nav-item")
const pages = document.querySelectorAll(".page")

navItems.forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault()
    const page = item.getAttribute("data-page")
    showPage(page)
    const sidebar = document.querySelector(".sidebar")
    if (window.innerWidth <= 768) {
      sidebar.classList.remove("open")
    }
  })
})

function showPage(pageId) {
  pages.forEach((page) => {
    page.classList.remove("active")
  })

  const activePage = document.getElementById(`page-${pageId}`)
  if (activePage) {
    activePage.classList.add("active")
  }

  navItems.forEach((item) => {
    item.classList.remove("active")
    if (item.getAttribute("data-page") === pageId) {
      item.classList.add("active")
    }
  })

  if (pageId === "notifications") {
    loadNotifications()
  } else if (pageId === "users") {
    loadAllUsers()
  }
}

// Load Notifications
async function loadNotifications() {
  const notificationsList = document.getElementById("notificationsList")
  notificationsList.innerHTML = '<p class="empty-state">Завантаження...</p>'

  try {
    const response = await fetch(`/api/moderator/${currentModerator.id}/notifications`)
    const notifications = await response.json()

    if (notifications.length === 0) {
      notificationsList.innerHTML = '<p class="empty-state">Сповіщень немає</p>'
      return
    }

    notificationsList.innerHTML = notifications
      .map(
        (notif) => `
      <div class="notification-item ${!notif.is_read ? "unread" : ""}">
        <div class="notification-header">
          <h4>${notif.first_name || "Ім'я"} ${notif.last_name || "Прізвище"}</h4>
          <span class="notification-time">${new Date(notif.created_at).toLocaleString("uk-UA")}</span>
        </div>
        <p class="notification-message">${notif.message || "Новий користувач"}</p>
        <div class="notification-actions">
          <button class="btn-primary" onclick="viewUserProfile(${notif.user_id})">Переглянути профіль</button>
          <button class="btn-secondary" onclick="markAsRead(${notif.id})">Позначити прочитаним</button>
        </div>
      </div>
    `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading notifications:", error)
    notificationsList.innerHTML = '<p class="empty-state">Помилка при завантаженні сповіщень</p>'
  }
}

// Load All Users
async function loadAllUsers() {
  const usersList = document.getElementById("usersList")
  usersList.innerHTML = '<p class="empty-state">Завантаження користувачів...</p>'

  try {
    const response = await fetch("/api/moderator/users")
    const users = await response.json()

    if (users.length === 0) {
      usersList.innerHTML = '<p class="empty-state">Користувачей не знайдено</p>'
      return
    }

    usersList.innerHTML = users
      .map(
        (user) => `
      <div class="user-item">
        <div class="user-header">
          <h4>${user.first_name || "Ім'я"} ${user.last_name || "Прізвище"}</h4>
          <span class="user-type">${user.user_type === "senior" ? "Старше 60+" : "13-60 років"}</span>
        </div>
        <p class="user-email">${user.email || "емейл"}</p>
        <p class="user-registered">Зареєстрований: ${new Date(user.created_at).toLocaleDateString("uk-UA")}</p>
        <button class="btn-primary" onclick="viewUserProfile(${user.id})">Переглянути профіль</button>
      </div>
    `,
      )
      .join("")
  } catch (error) {
    console.error("Error loading users:", error)
    usersList.innerHTML = '<p class="empty-state">Помилка при завантаженні користувачів</p>'
  }
}

// Mark Notification as Read
async function markAsRead(notificationId) {
  try {
    await fetch(`/api/notification/${notificationId}/read`, {
      method: "PUT",
    })
    loadNotifications()
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}

// View User Profile
async function viewUserProfile(userId) {
  try {
    const response = await fetch(`/api/moderator/user/${userId}`)
    const user = await response.json()

    let age = "невідомо"
    try {
      const birthDate = new Date(user.date_of_birth)
      if (!isNaN(birthDate.getTime())) {
        age = calculateAge(birthDate)
      }
    } catch (e) {
      console.error("Error calculating age:", e)
    }

    const userTypeText = user.user_type === "senior" ? "Старше 60 років" : "13-60 років"

    const userDetailModal = document.getElementById("userDetailModal")
    const userDetailContent = document.getElementById("userDetailContent")

    userDetailContent.innerHTML = `
      <h2>${user.first_name || "Ім'я"} ${user.last_name || "Прізвище"}</h2>
      <div class="profile-info">
        <p><strong>Електронна адреса:</strong> ${user.email || "невідомо"}</p>
        <p><strong>Тип користувача:</strong> ${userTypeText}</p>
        <p><strong>Вік:</strong> ${age} років</p>
        <p><strong>Дата реєстрації:</strong> ${new Date(user.created_at).toLocaleString("uk-UA")}</p>
      </div>
    `

    userDetailModal.classList.add("active")
  } catch (error) {
    console.error("Error fetching user profile:", error)
    alert("Помилка при завантаженні профілю користувача")
  }
}

function calculateAge(birthDate) {
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

// Close User Detail Modal
const closeUserModal = document.getElementById("closeUserModal")
const userDetailModal = document.getElementById("userDetailModal")

closeUserModal?.addEventListener("click", () => {
  userDetailModal.classList.remove("active")
})

userDetailModal?.addEventListener("click", (e) => {
  if (e.target === userDetailModal) {
    userDetailModal.classList.remove("active")
  }
})

// Mobile Sidebar Toggle
const menuToggle = document.getElementById("menuToggle")
const sidebar = document.querySelector(".sidebar")

menuToggle?.addEventListener("click", () => {
  sidebar.classList.toggle("open")
})

const hamburgerMenu = document.getElementById("hamburgerMenu")
const menuClose = document.getElementById("menuClose")

hamburgerMenu?.addEventListener("click", () => {
  sidebar.classList.toggle("open")
})

menuClose?.addEventListener("click", () => {
  sidebar.classList.remove("open")
})

// Close sidebar when clicking outside on mobile
document.addEventListener("click", (e) => {
  if (window.innerWidth <= 768 && sidebar.classList.contains("open")) {
    if (!e.target.closest(".sidebar") && !e.target.closest(".hamburger-menu")) {
      sidebar.classList.remove("open")
    }
  }
})

// Logout
const logoutBtn = document.getElementById("logoutBtn")
logoutBtn?.addEventListener("click", () => {
  localStorage.removeItem("currentModerator")
  window.location.href = "/"
})

// Initialize
showPage("notifications")
