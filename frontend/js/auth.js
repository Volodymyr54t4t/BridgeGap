const registerForm = document.getElementById("registerForm")
const loginForm = document.getElementById("loginForm")
const dateOfBirthInput = document.getElementById("dateOfBirth")
const generationText = document.getElementById("generationText")

function calculateGenerationFromDate(dateString) {
  if (!dateString) return { label: "невідомо", type: "unknown" }

  const birthDate = new Date(dateString)
  if (isNaN(birthDate.getTime())) return { label: "невідомо", type: "unknown" }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  if (age < 13) {
    return { label: "Занадто молодо для реєстрації", type: "invalid" }
  } else if (age <= 60) {
    return { label: "Молоде покоління (13-60 років)", type: "young" }
  } else {
    return { label: "Старше покоління (60+ років)", type: "senior" }
  }
}

dateOfBirthInput?.addEventListener("change", () => {
  const generation = calculateGenerationFromDate(dateOfBirthInput.value)
  if (generation.label !== "невідомо") {
    generationText.textContent = `Ваше покоління: ${generation.label}`
    generationText.style.color = generation.type === "invalid" ? "#ef4444" : "#10b981"
  }
})

// Handle User Registration
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const dateValue = document.getElementById("dateOfBirth").value
  const generation = calculateGenerationFromDate(dateValue)

  if (generation.type === "invalid") {
    alert("Помилка: " + generation.label)
    return
  }

  const formData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("registerEmail").value,
    password: document.getElementById("registerPassword").value,
    dateOfBirth: dateValue,
  }

  try {
    const response = await fetch("/api/register", {
      method: "POST",
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

    alert("Реєстрація успішна! Перенаправлення...")
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: data.user.id,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
        email: data.user.email,
        userType: data.user.user_type,
        dateOfBirth: data.user.date_of_birth,
        role: "user",
      }),
    )
    window.location.href = "/dashboard"
  } catch (error) {
    console.error("Registration error:", error)
    alert("Помилка при реєстрації")
  }
})

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const email = document.getElementById("loginEmail").value
  const password = document.getElementById("loginPassword").value

  const isModerator = email === "moderator@bridgegap.com" && password === "moderatorbridgegap"

  if (isModerator) {
    try {
      localStorage.setItem(
        "currentModerator",
        JSON.stringify({
          id: 1,
          email: email,
          role: "moderator",
        }),
      )
      alert("Вхід успішний!")
      window.location.href = "/moderator"
      return
    } catch (error) {
      console.error("Moderator login error:", error)
    }
  }

  // Regular user login
  const formData = {
    email: email,
    password: password,
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
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

    alert("Вхід успішний!")
    localStorage.setItem(
      "currentUser",
      JSON.stringify({
        id: data.user.id,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        email: data.user.email,
        userType: data.user.userType,
        dateOfBirth: data.user.dateOfBirth,
        role: "user",
      }),
    )
    window.location.href = "/dashboard"
  } catch (error) {
    console.error("Login error:", error)
    alert("Помилка при вході")
  }
})

// Smooth scroll to auth sections
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"))
    if (target && target.id !== "auth") {
      e.preventDefault()
      target.scrollIntoView({ behavior: "smooth" })
    }
  })
})
