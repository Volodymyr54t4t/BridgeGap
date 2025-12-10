function calculateGenerationFromDate(dateString) {
  if (!dateString) return "невідомо"
  const birthDate = new Date(dateString)
  if (isNaN(birthDate.getTime())) return "невідомо"

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  if (age < 13) return "Занадто молодо"
  if (age <= 60) return "Молоде покоління (13-60 років)"
  return "Старше покоління (60+ років)"
}

// Check if user is logged in
function checkAuth() {
  const currentUser = JSON.parse(localStorage.getItem("currentUser"))
  if (!currentUser) {
    window.location.href = "/"
  }
  if (!currentUser.firstName) {
    console.error("[v0] User data incomplete:", currentUser)
    localStorage.removeItem("currentUser")
    window.location.href = "/"
  }
  return currentUser
}

const currentUser = checkAuth()

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
}

// Initialize user greeting and profile
function initializeUserData() {
  const firstName = currentUser.firstName || "Користувач"
  const lastName = currentUser.lastName || ""
  document.getElementById("userGreeting").textContent = `Привіт, ${firstName}!`
  updateProfileDisplay()
}

function updateProfileDisplay() {
  let age = "невідомо"
  try {
    const birthDate = new Date(currentUser.dateOfBirth)
    if (!isNaN(birthDate.getTime())) {
      age = calculateAge(birthDate)
    }
  } catch (e) {
    console.error("Error calculating age:", e)
  }

  const generation = calculateGenerationFromDate(currentUser.dateOfBirth)

  const firstName = currentUser.firstName || "Ім'я"
  const lastName = currentUser.lastName || "Прізвище"
  const email = currentUser.email || "емейл"

  document.getElementById("profileName").textContent = `${firstName} ${lastName}`
  document.getElementById("profileEmail").textContent = email
  document.getElementById("profileGeneration").textContent = `Покоління: ${generation}`
  document.getElementById("profileAge").textContent = `Вік: ${age} років`

  document.getElementById("editFirstName").value = firstName
  document.getElementById("editLastName").value = lastName
  document.getElementById("editDateOfBirth").value = currentUser.dateOfBirth || ""

  const avatarData = localStorage.getItem(`avatar_${currentUser.id}`)
  if (avatarData) {
    document.getElementById("profileAvatarImg").src = avatarData
    document.getElementById("profileAvatarImg").style.display = "block"
    document.querySelector(".profile-avatar").style.display = "none"
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

const avatarUpload = document.getElementById("avatarUpload")
avatarUpload?.addEventListener("change", (e) => {
  const file = e.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (event) => {
      const avatarData = event.target.result
      localStorage.setItem(`avatar_${currentUser.id}`, avatarData)
      document.getElementById("profileAvatarImg").src = avatarData
      document.getElementById("profileAvatarImg").style.display = "block"
      document.querySelector(".profile-avatar").style.display = "none"
    }
    reader.readAsDataURL(file)
  }
})

// Edit Profile
const editProfileBtn = document.getElementById("editProfileBtn")
const editProfileForm = document.getElementById("editProfileForm")
const updateProfileForm = document.getElementById("updateProfileForm")
const cancelEditBtn = document.getElementById("cancelEditBtn")

editProfileBtn?.addEventListener("click", () => {
  editProfileForm.classList.remove("hidden")
})

cancelEditBtn?.addEventListener("click", () => {
  editProfileForm.classList.add("hidden")
})

updateProfileForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const formData = {
    firstName: document.getElementById("editFirstName").value,
    lastName: document.getElementById("editLastName").value,
    dateOfBirth: document.getElementById("editDateOfBirth").value,
  }

  try {
    const response = await fetch(`/api/user/${currentUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      alert("Помилка: " + data.error)
      return
    }

    currentUser.firstName = formData.firstName
    currentUser.lastName = formData.lastName
    currentUser.dateOfBirth = formData.dateOfBirth

    localStorage.setItem("currentUser", JSON.stringify(currentUser))
    updateProfileDisplay()
    editProfileForm.classList.add("hidden")
    alert("Профіль оновлено успішно!")
  } catch (error) {
    console.error("Error updating profile:", error)
    alert("Помилка при оновленні профілю")
  }
})

// Floating Contact Button
const contactBtn = document.getElementById("contactBtn")
const contactModal = document.getElementById("contactModal")
const closeContactModal = document.getElementById("closeContactModal")
const contactForm = document.getElementById("contactForm")

contactBtn?.addEventListener("click", () => {
  contactModal.classList.add("active")
})

closeContactModal?.addEventListener("click", () => {
  contactModal.classList.remove("active")
})

contactModal?.addEventListener("click", (e) => {
  if (e.target === contactModal) {
    contactModal.classList.remove("active")
  }
})

contactForm?.addEventListener("submit", (e) => {
  e.preventDefault()
  const message = contactForm.querySelector("textarea").value
  alert("Ваше звернення до модератора надіслано: " + message)
  contactForm.reset()
  contactModal.classList.remove("active")
})

const hamburgerMenu = document.getElementById("hamburgerMenu")
const menuClose = document.getElementById("menuClose")
const sidebar = document.querySelector(".sidebar")

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
  localStorage.removeItem("currentUser")
  window.location.href = "/"
})

// Initialize
showPage("home")
initializeUserData()
