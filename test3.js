const API_KEY = "e58eeed7927d48848b485071066d2708";

const searchBtn = document.getElementById("searchBtn");
const ingredientSearch = document.getElementById("ingredientSearch");
const recipeResult = document.getElementById("reciperesult");
const recipeModal = document.getElementById("recipeModal");
const modalRecipeContent = document.getElementById("modalRecipeContent");
const dietFilter = document.getElementById("dietFilter");
const timeFilter = document.getElementById("timeFilter");
const themeToggle = document.getElementById("themeToggle");
const historyToggle = document.getElementById("historyToggle");
const historyBox = document.getElementById("history");

const recipeTitle = document.getElementById("recipeTitle");
const recipeImage = document.getElementById("recipeImage");
const recipeTime = document.getElementById("recipeTime");
const recipeServings = document.getElementById("recipeServings");
const recipeSteps = document.getElementById("recipeSteps");
const ingredientList = document.getElementById("ingredientList");

const substituteModal = document.getElementById("substituteModal");
const substituteIngredientName = document.getElementById("substitute-ingredient-name");
const substituteResults = document.getElementById("substitute-results");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  themeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

ingredientSearch.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    searchBtn.click();
  }
});
const savedBtn = document.getElementById("savedBtn");
const savedSection = document.getElementById("savedSection");

savedBtn.addEventListener("click", () => {
    savedSection.style.display = "block";
    loadSavedRecipes();
});

historyToggle.addEventListener("click", () => {
  if (historyBox.style.display === "none") {
    historyBox.style.display = "block";
    historyToggle.textContent = "❌ Hide Recent Searches";
    showHistory();
  } else {
    historyBox.style.display = "none";
    historyToggle.textContent = "📜 Show Recent Searches";
  }
});

document.querySelectorAll(".close-modal").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-close");
    document.getElementById(target).style.display = "none";
  });
});

window.addEventListener("click", (e) => {
  if (e.target === recipeModal) recipeModal.style.display = "none";
  if (e.target === substituteModal) substituteModal.style.display = "none";
});

searchBtn.addEventListener("click", async () => {
  const ingredients = ingredientSearch.value.trim();

  if (!ingredients) {
    alert("Please enter ingredients.");
    return;
  }

  const userIngredients = ingredients
    .toLowerCase()
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  saveSearchHistory(ingredients);

  try {
    recipeResult.innerHTML = `<div class="loading">Searching recipes...</div>`;

    let recipes = await fetchRecipes(ingredients);

    if (timeFilter.value !== "all") {
      recipes = recipes.filter(
        (recipe) => recipe.readyInMinutes <= parseInt(timeFilter.value, 10)
      );
    }

    if (dietFilter.value === "veg") {
      recipes = recipes.filter((recipe) => recipe.vegetarian);
    }

    if (dietFilter.value === "nonveg") {
      recipes = recipes.filter((recipe) => !recipe.vegetarian);
    }

    recipes.forEach((recipe) => {
      recipe.similarity = calculateSimilarity(userIngredients, recipe);
    });

    recipes.sort((a, b) => b.similarity - a.similarity);
    displayRecipes(recipes.slice(0, 8));
  } catch (error) {
    console.error(error);
    recipeResult.innerHTML = `<div class="error-box">Error fetching recipes.</div>`;
  }
});
async function fetchRecipes(ingredients) {
  const url = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(
    ingredients
  )}&number=16&addRecipeInformation=true&fillIngredients=true&instructionsRequired=true&apiKey=${API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP ${response.status}`);
  }

  return data.results || [];
}
function loadSavedRecipes() {
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes')) || [];
    const grid = document.getElementById("savedRecipesGrid");

    grid.innerHTML = "";

    if (savedRecipes.length === 0) {
        grid.innerHTML = "<p>No saved recipes yet 😢</p>";
        return;
    }

    savedRecipes.forEach(recipe => {
        const card = document.createElement("div");
        card.className = "recipe-card";

        card.innerHTML = `
            <img src="${recipe.image}" class="recipe-img">
            <div class="recipe-info">
                <h3>${recipe.title}</h3>
                <button onclick="viewRecipe(${recipe.id})">View</button>
            </div>
        `;

        grid.appendChild(card);
    });
}
function calculateSimilarity(userIngredients, recipe) {
  const textParts = [
    recipe.title || "",
    recipe.summary || "",
    Array.isArray(recipe.dishTypes) ? recipe.dishTypes.join(" ") : "",
    Array.isArray(recipe.extendedIngredients)
      ? recipe.extendedIngredients.map((i) => i.name).join(" ")
      : ""
  ];

  const fullText = textParts.join(" ").toLowerCase();

  let matchCount = 0;
  userIngredients.forEach((ingredient) => {
    if (fullText.includes(ingredient)) {
      matchCount++;
    }
  });

  return userIngredients.length ? matchCount / userIngredients.length : 0;
}

function displayRecipes(recipes) {
  if (!recipes.length) {
    recipeResult.innerHTML = `<div class="message-box">No recipes found 😢</div>`;
    return;
  }

  recipeResult.innerHTML = "";

  recipes.forEach((recipe) => {
    const matchPercent = Math.round(recipe.similarity * 100);

    let matchLabel = "😐 Low Match";
    if (matchPercent >= 70) matchLabel = "🔥 Best Match";
    else if (matchPercent >= 40) matchLabel = "👍 Good Match";

    const card = document.createElement("div");
    card.className = "recipe-card";

    card.innerHTML = `
      <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img">
      <div class="recipe-info">
        <h3>${recipe.title}</h3>
        <p>⏱ ${recipe.readyInMinutes || "N/A"} mins</p>
        <p>⭐ Match: ${matchPercent}%</p>
        <p>${matchLabel}</p>
        <div class="card-actions">
          <button class="card-btn view-btn" data-id="${recipe.id}">View</button>
          <button class="card-btn save-btn" data-id="${recipe.id}">Save</button>
        </div>
      </div>
    `;

    recipeResult.appendChild(card);
  });

  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      viewRecipe(btn.dataset.id);
    });
  });

  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      saveRecipe(btn.dataset.id, btn);
    });
  });
}

async function viewRecipe(id) {
  try {
    recipeModal.style.display = "block";
    recipeTitle.textContent = "Loading...";
    recipeSteps.innerHTML = `<div class="loading">Loading recipe details...</div>`;
    ingredientList.innerHTML = "";

    const res = await fetch(
      `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch recipe details");
    }

    const recipe = await res.json();

    recipeTitle.textContent = recipe.title;
    recipeImage.src = recipe.image;
    recipeImage.alt = recipe.title;
    recipeTime.textContent = `⏱ ${recipe.readyInMinutes || "N/A"} mins`;
    recipeServings.textContent = `👨‍👩‍👧‍👦 ${recipe.servings || "N/A"} servings`;

    if (
      recipe.analyzedInstructions &&
      recipe.analyzedInstructions.length > 0 &&
      recipe.analyzedInstructions[0].steps.length > 0
    ) {
      recipeSteps.innerHTML = recipe.analyzedInstructions[0].steps
        .map(
          (step, index) => `
            <div class="step-item">
              <strong>Step ${index + 1}:</strong> ${step.step}
            </div>
          `
        )
        .join("");
    } else {
      recipeSteps.innerHTML = `<div class="step-item">No step-by-step instructions available.</div>`;
    }

    ingredientList.innerHTML = "";
    (recipe.extendedIngredients || []).forEach((ingredient) => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${ingredient.original}
        <span class="ingredient-note">Click to see substitutes</span>
      `;
      li.addEventListener("click", () => getSubstitutes(ingredient.name));
      ingredientList.appendChild(li);
    });
  } catch (error) {
    console.error(error);
    recipeSteps.innerHTML = `<div class="error-box">Could not load recipe details.</div>`;
  }
}

async function getSubstitutes(ingredient) {
  substituteModal.style.display = "block";
  substituteIngredientName.textContent = ingredient;
  substituteResults.innerHTML = "Loading substitutes...";

  try {
    const res = await fetch(
      `https://api.spoonacular.com/food/ingredients/substitutes?ingredientName=${encodeURIComponent(
        ingredient
      )}&apiKey=${API_KEY}`
    );

    if (!res.ok) {
      throw new Error("Failed to fetch substitutes");
    }

    const data = await res.json();

    if (!data.substitutes || data.substitutes.length === 0) {
      substituteResults.innerHTML = `<p>No substitutes found for this ingredient.</p>`;
      return;
    }

    substituteResults.innerHTML = `
      <p><strong>Original:</strong> ${data.ingredient}</p>
      <ul>
        ${data.substitutes.map((sub) => `<li>${sub}</li>`).join("")}
      </ul>
    `;
  } catch (error) {
    console.error(error);
    substituteResults.innerHTML = `<p>Error fetching substitutes.</p>`;
  }
}

function saveRecipe(recipeId, button) {
  const recipeCard = button.closest(".recipe-card");
  const title = recipeCard.querySelector("h3").textContent;
  const image = recipeCard.querySelector(".recipe-img").src;

  let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];

  if (savedRecipes.some((recipe) => recipe.id == recipeId)) {
    button.textContent = "Already Saved";
    button.disabled = true;
    return;
  }

  savedRecipes.push({
    id: recipeId,
    title,
    image
  });

  localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
  button.textContent = "Saved!";
  button.style.background = "#27ae60";
}

function saveSearchHistory(query) {
  let history = JSON.parse(localStorage.getItem("history")) || [];
  history = history.filter((item) => item.toLowerCase() !== query.toLowerCase());
  history.unshift(query);
  if (history.length > 5) history.pop();
  localStorage.setItem("history", JSON.stringify(history));
}

function showHistory() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  if (history.length === 0) {
    historyBox.innerHTML = `<p class="history-title">No recent searches</p>`;
    return;
  }

  historyBox.innerHTML = `
    <p class="history-title">Recent Searches</p>
    ${history
      .map(
        (item) =>
          `<span class="history-item" data-query="${item.replace(/"/g, "&quot;")}">${item}</span>`
      )
      .join("")}
  `;

  document.querySelectorAll(".history-item").forEach((item) => {
    item.addEventListener("click", () => {
      ingredientSearch.value = item.dataset.query;
      searchBtn.click();
    });
  });
}