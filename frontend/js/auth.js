const registerForm = document.getElementById("registerForm")
const loginForm = document.getElementById("loginForm")
const dateOfBirthInput = document.getElementById("dateOfBirth")
const generationText = document.getElementById("generationText")
const interestsGrid = document.getElementById("interestsGrid")

async function loadInterests() {
  try {
    const response = await fetch("/api/interests")
    const interests = await response.json()

    if (interestsGrid) {
      interestsGrid.innerHTML = interests
        .map(
          (interest) => `
        <div class="interest-checkbox" data-interest-id="${interest.id}">
          <input type="checkbox" id="interest-${interest.id}" value="${interest.id}">
          <label for="interest-${interest.id}">${interest.name}</label>
        </div>
      `,
        )
        .join("")

      // Add click handlers to toggle selected state
      document.querySelectorAll(".interest-checkbox").forEach((box) => {
        box.addEventListener("click", function (e) {
          if (e.target.tagName !== "INPUT") {
            const checkbox = this.querySelector('input[type="checkbox"]')
            checkbox.checked = !checkbox.checked
          }
          this.classList.toggle("selected", this.querySelector('input[type="checkbox"]').checked)
        })
      })
    }
  } catch (error) {
    console.error("Error loading interests:", error)
  }
}

// Load interests when page loads
if (interestsGrid) {
  loadInterests()
}

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
    generationText.style.color = generation.type === "invalid" ? "#ef4444" : "#C94D47"
  }
})

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault()

  const dateValue = document.getElementById("dateOfBirth").value
  const generation = calculateGenerationFromDate(dateValue)

  if (generation.type === "invalid") {
    alert("Помилка: " + generation.label)
    return
  }

  // Collect selected interests
  const selectedInterests = Array.from(document.querySelectorAll(".interest-checkbox input:checked")).map((checkbox) =>
    Number.parseInt(checkbox.value),
  )

  const customInterests = document.getElementById("customInterests").value.trim()

  const formData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("registerEmail").value,
    password: document.getElementById("registerPassword").value,
    dateOfBirth: dateValue,
    interests: selectedInterests,
    customInterests: customInterests,
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

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"))
    if (target && target.id !== "auth") {
      e.preventDefault()
      target.scrollIntoView({ behavior: "smooth" })
    }
  })
})
