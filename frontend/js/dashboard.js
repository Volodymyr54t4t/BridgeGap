const editBioField = document.getElementById("editBio")
const bioCharCountSpan = document.getElementById("bioCharCount")

function updateBioCharCount() {
  if (editBioField && bioCharCountSpan) {
    bioCharCountSpan.textContent = editBioField.value.length
  }
}

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

function formatDateForInput(dateString) {
  if (!dateString) return ""
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ""
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

  const firstName = currentUser.firstName || "Ім'я"
  const lastName = currentUser.lastName || "Прізвище"
  const email = currentUser.email || "емейл"
  const bio = currentUser.bio || "Немає опису профілю"

  document.getElementById("profileName").textContent = `${firstName} ${lastName}`
  document.getElementById("profileEmail").textContent = email
  document.getElementById("profileAge").textContent = `Вік: ${age} років`
  document.getElementById("profileBio").textContent = bio

  document.getElementById("editFirstName").value = firstName
  document.getElementById("editLastName").value = lastName
  document.getElementById("editDateOfBirth").value = formatDateForInput(currentUser.dateOfBirth)
  document.getElementById("editBio").value = currentUser.bio || ""
  updateBioCharCount()

  const avatarData = localStorage.getItem(`avatar_${currentUser.id}`)
  if (avatarData) {
    document.getElementById("profileAvatarImg").src = avatarData
    document.getElementById("profileAvatarImg").style.display = "block"
    document.querySelector(".profile-avatar").style.display = "none"
  }

  loadUserInterests()
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
    bio: document.getElementById("editBio").value,
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
    currentUser.bio = formData.bio

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

async function loadUserInterests() {
  const interestsContainer = document.getElementById("profileInterests")
  interestsContainer.innerHTML = '<p class="empty-state">Завантаження інтересів...</p>'

  try {
    const response = await fetch(`/api/user/${currentUser.id}/interests`)

    if (!response.ok) {
      throw new Error("Помилка завантаження інтересів")
    }

    const data = await response.json()

    if ((!data.interests || data.interests.length === 0) && (!data.custom_interests || !data.custom_interests.trim())) {
      interestsContainer.innerHTML = '<p class="empty-state">Інтереси не обрані</p>'
      return
    }

    let interestsHTML = ""

    if (data.interests && data.interests.length > 0) {
      interestsHTML += '<div class="interests-tags">'
      data.interests.forEach((interest) => {
        interestsHTML += `<span class="interest-tag">${interest}</span>`
      })
      interestsHTML += "</div>"
    }

    if (data.custom_interests && data.custom_interests.trim()) {
      interestsHTML += `<div class="custom-interests"><strong>Інші інтереси:</strong> ${data.custom_interests}</div>`
    }

    interestsContainer.innerHTML = interestsHTML || '<p class="empty-state">Інтереси не обрані</p>'
  } catch (error) {
    console.error("Error loading interests:", error)
    interestsContainer.innerHTML = '<p class="empty-state">Помилка завантаження інтересів</p>'
  }
}

// Edit Interests
const editInterestsBtn = document.getElementById("editInterestsBtn")
const editInterestsForm = document.getElementById("editInterestsForm")
const updateInterestsForm = document.getElementById("updateInterestsForm")
const cancelEditInterestsBtn = document.getElementById("cancelEditInterestsBtn")
const editInterestsGrid = document.getElementById("editInterestsGrid")

editInterestsBtn?.addEventListener("click", async () => {
  editInterestsForm.classList.remove("hidden")
  await loadInterestsForEdit()
})

cancelEditInterestsBtn?.addEventListener("click", () => {
  editInterestsForm.classList.add("hidden")
})

async function loadInterestsForEdit() {
  try {
    // Get all available interests
    const allInterestsResponse = await fetch("/api/interests")
    const allInterests = await allInterestsResponse.json()

    // Get user's current interests
    const userInterestsResponse = await fetch(`/api/user/${currentUser.id}/interests`)
    const userData = await userInterestsResponse.json()
    const userInterestNames = userData.interests || []
    const customInterests = userData.custom_interests || ""

    // Populate the grid
    editInterestsGrid.innerHTML = allInterests
      .map((interest) => {
        const isChecked = userInterestNames.includes(interest.name)
        return `
        <div class="interest-checkbox ${isChecked ? "selected" : ""}" data-interest-id="${interest.id}">
          <input type="checkbox" id="edit-interest-${interest.id}" value="${interest.id}" ${isChecked ? "checked" : ""}>
          <label for="edit-interest-${interest.id}">${interest.name}</label>
        </div>
      `
      })
      .join("")

    // Set custom interests
    document.getElementById("editCustomInterests").value = customInterests

    // Add click handlers
    document.querySelectorAll("#editInterestsGrid .interest-checkbox").forEach((box) => {
      box.addEventListener("click", function (e) {
        if (e.target.tagName !== "INPUT") {
          const checkbox = this.querySelector('input[type="checkbox"]')
          checkbox.checked = !checkbox.checked
        }
        this.classList.toggle("selected", this.querySelector('input[type="checkbox"]').checked)
      })
    })
  } catch (error) {
    console.error("Error loading interests for edit:", error)
    alert("Помилка при завантаженні інтересів")
  }
}

updateInterestsForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const selectedInterests = Array.from(
    document.querySelectorAll("#editInterestsGrid .interest-checkbox input:checked"),
  ).map((checkbox) => Number.parseInt(checkbox.value))

  const customInterests = document.getElementById("editCustomInterests").value.trim()

  try {
    const response = await fetch(`/api/user/${currentUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        interests: selectedInterests,
        customInterests: customInterests,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      alert("Помилка: " + data.error)
      return
    }

    loadUserInterests()
    editInterestsForm.classList.add("hidden")
    alert("Інтереси оновлено успішно!")
  } catch (error) {
    console.error("Error updating interests:", error)
    alert("Помилка при оновленні інтересів")
  }
})
