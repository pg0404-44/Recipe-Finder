    // API Key for Spoonacular (replace with your own)
    const API_KEY = "e58eeed7927d48848b485071066d2708";
        
    // DOM Elements
    const searchBtn = document.getElementById('searchBtn');
    const ingredientSearch = document.getElementById('ingredientSearch');
    const recipeResult = document.getElementById('reciperesult');
    const recipeModal = document.getElementById('recipeModal');
    const modalRecipeContent = document.getElementById('modalRecipeContent');
    const substituteModal = document.getElementById('substituteModal');
    const substituteResults = document.getElementById('substitute-results');
    const substituteIngredientName = document.getElementById('substitute-ingredient-name');

    // Local substitution database
    const substitutionData = {
        'milk': ['almond milk', 'soy milk', 'oat milk', 'coconut milk'],
        'egg': ['flaxseed meal + water', 'applesauce', 'banana', 'chia seeds + water'],
        'butter': ['coconut oil', 'olive oil', 'avocado', 'greek yogurt'],
        'flour': ['almond flour', 'coconut flour', 'oat flour', 'rice flour'],
        'sugar': ['honey', 'maple syrup', 'agave nectar', 'stevia'],
        'chicken': ['tofu', 'turkey', 'pork', 'mushrooms'],
        'beef': ['lamb', 'portobello mushrooms', 'lentils', 'turkey'],
        'onion': ['shallots', 'leeks', 'green onions', 'onion powder'],
        'garlic': ['garlic powder', 'shallots', 'onion', 'chives'],
        'tomato': ['tomato paste + water', 'canned tomatoes', 'red bell pepper', 'sun-dried tomatoes'],
        'cheese': ['nutritional yeast', 'tofu', 'cashew cheese', 'avocado'],
        'cream': ['coconut cream', 'greek yogurt', 'silken tofu', 'cashew cream'],
        'pasta': ['zucchini noodles', 'spaghetti squash', 'rice noodles', 'shirataki noodles'],
        'rice': ['cauliflower rice', 'quinoa', 'barley', 'couscous'],
        'potato': ['sweet potato', 'cauliflower', 'turnip', 'parsnip'],
        'bread': ['lettuce wraps', 'collard greens', 'portobello mushrooms', 'sweet potato slices'],
        'oil': ['applesauce', 'mashed banana', 'yogurt', 'avocado']
    };

    // Search for recipes
    searchBtn.addEventListener('click', async () => {
        const ingredients = ingredientSearch.value.trim();
        
        if (!ingredients) {
            alert('Please enter some ingredients!');
            return;
        }

        try {
            recipeResult.innerHTML = '<div class="loading">Searching for recipes...</div>';
            
            const recipes = await fetchRecipes(ingredients);
            displayRecipes(recipes);
        } catch (error) {
            console.error('Error:', error);
            recipeResult.innerHTML = '<div class="error">Failed to load recipes. Please try again.</div>';
        }
    });

    // Fetch recipes from Spoonacular API
    async function fetchRecipes(ingredients) {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=12&apiKey=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipes');
        }
        
        return await response.json();
    }

    // Display recipes in the grid
    function displayRecipes(recipes) {
        if (!recipes || recipes.length === 0) {
            recipeResult.innerHTML = '<div class="error">No recipes found. Try different ingredients.</div>';
            return;
        }

        recipeResult.innerHTML = '';
        
        recipes.forEach(recipe => {
            const recipeCard = document.createElement('div');
            recipeCard.className = 'recipe-card';
            
            recipeCard.innerHTML = `
                <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                <div class="recipe-info">
                    <h3 class="recipe-title">${recipe.title}</h3>
                    <div class="recipe-meta">
                        <span>Used: ${recipe.usedIngredientCount}</span>
                        <span>Missing: ${recipe.missedIngredientCount}</span>
                    </div>
                    <div class="recipe-actions">
                        <button class="action-btn view-btn" data-id="${recipe.id}">View Recipe</button>
                        <button class="action-btn save-btn" data-id="${recipe.id}">Save</button>
                    </div>
                </div>
            `;
            
            recipeResult.appendChild(recipeCard);
        });

        // Add event listeners to view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recipeId = e.target.getAttribute('data-id');
                viewRecipeDetails(recipeId);
            });
        });

        // Add event listeners to save buttons
        document.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const recipeId = e.target.getAttribute('data-id');
                saveRecipe(recipeId, e.target);
            });
        });
    }

    // View full recipe details
    async function viewRecipeDetails(recipeId) {
        try {
            modalRecipeContent.innerHTML = '<div class="loading">Loading recipe details...</div>';
            recipeModal.style.display = 'block';
            
            const recipe = await fetchRecipeDetails(recipeId);
            displayRecipeDetails(recipe);
        } catch (error) {
            console.error('Error:', error);
            modalRecipeContent.innerHTML = '<div class="error">Failed to load recipe details.</div>';
        }
    }

    // Fetch detailed recipe information
    async function fetchRecipeDetails(recipeId) {
        const response = await fetch(
            `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch recipe details');
        }
        
        return await response.json();
    }

    // Display full recipe details in modal
    function displayRecipeDetails(recipe) {
        // Format ingredients list
        const ingredientsList = recipe.extendedIngredients.map(ingredient => `
            <li>
                ${ingredient.original}
                <button class="sub-btn" data-ingredient="${ingredient.name}">Substitute</button>
            </li>
        `).join('');
        
        // Format instructions (remove HTML tags if present)
        let instructions = recipe.instructions || 'No instructions provided';
        if (instructions) {
            instructions = instructions.replace(/<[^>]*>?/gm, '');
            instructions = instructions.replace(/\n/g, '<br>');
        }
        
        modalRecipeContent.innerHTML = `
            <div class="modal-header">
                <h2>${recipe.title}</h2>
                <img src="${recipe.image}" alt="${recipe.title}" class="modal-img">
            </div>
            
            <div class="modal-meta">
                <div>
                    <h3>⏱️ Ready In</h3>
                    <p>${recipe.readyInMinutes} minutes</p>
                </div>
                <div>
                    <h3>👨‍👩‍👧‍👦 Servings</h3>
                    <p>${recipe.servings}</p>
                </div>
            </div>
            
            <div class="modal-section">
                <h3>Ingredients</h3>
                <ul class="ingredients-list">
                    ${ingredientsList}
                </ul>
            </div>
            
            <div class="modal-section">
                <h3>Instructions</h3>
                <p>${instructions}</p>
            </div>
        `;
        
        // Add event listeners to substitution buttons
        document.querySelectorAll('.sub-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const ingredient = e.target.getAttribute('data-ingredient');
                showSubstitutes(ingredient);
            });
        });
    }

    // Show substitution options for an ingredient
    function showSubstitutes(ingredient) {
        substituteIngredientName.textContent = ingredient;
        
        // Find substitutes (first try exact match, then partial match)
        let substitutes = substitutionData[ingredient.toLowerCase()] || [];
        
        if (substitutes.length === 0) {
            // Try to find partial matches
            for (const [key, values] of Object.entries(substitutionData)) {
                if (ingredient.toLowerCase().includes(key)) {
                    substitutes = values;
                    break;
                }
            }
        }
        
        if (substitutes.length === 0) {
            substituteResults.innerHTML = '<p>No substitutes found for this ingredient.</p>';
        } else {
            substituteResults.innerHTML = `
                <ul class="sub-list">
                    ${substitutes.map(sub => `
                        <li>
                            <span>${sub}</span>
                            <button class="use-sub-btn" data-sub="${sub}">Use</button>
                        </li>
                    `).join('')}
                </ul>
            `;
            
            // Add event listeners to use buttons
            document.querySelectorAll('.use-sub-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const sub = e.target.getAttribute('data-sub');
                    ingredientSearch.value = ingredientSearch.value.replace(
                        new RegExp(ingredient, 'gi'), 
                        sub
                    );
                    substituteModal.style.display = 'none';
                });
            });
        }
        
        // Show the modal
        recipeModal.style.display = 'none';
        substituteModal.style.display = 'block';
    }

    // Save recipe to localStorage
    function saveRecipe(recipeId, button) {
        const recipeCard = button.closest('.recipe-card');
        const recipeTitle = recipeCard.querySelector('.recipe-title').textContent;
        const recipeImage = recipeCard.querySelector('.recipe-img').src;
        
        let savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') )|| [];
        
        // Check if already saved
        if (savedRecipes.some(r => r.id == recipeId)) {
            alert('This recipe is already saved!');
            return;
        }
        
        // Add to saved recipes
        savedRecipes.push({
            id: recipeId,
            title: recipeTitle,
            image: recipeImage
        });
        
        localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
        
        // Update button
        button.textContent = 'Saved!';
        button.style.backgroundColor = '#2ecc71';
        setTimeout(() => {
            button.textContent = 'Save';
            button.style.backgroundColor = '#f1c40f';
        }, 2000);
    }

    // Close modals when clicking X or outside
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            recipeModal.style.display = 'none';
            substituteModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === recipeModal) {
            recipeModal.style.display = 'none';
        }
        if (e.target === substituteModal) {
            substituteModal.style.display = 'none';
        }
    });

    // Load saved recipes on page load
    function loadSavedRecipes() {
        const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
        if (savedRecipes.length > 0) {
            const savedSection = document.createElement('div');
            savedSection.innerHTML = `
                <h2 style="margin-top: 2rem; margin-bottom: 1rem;">Your Saved Recipes</h2>
                <div class="recipes-grid" id="savedRecipesGrid"></div>
            `;
            document.querySelector('.container').appendChild(savedSection);
            
            const savedGrid = document.getElementById('savedRecipesGrid');
            
            savedRecipes.forEach(recipe => {
                const recipeCard = document.createElement('div');
                recipeCard.className = 'recipe-card';
                
                recipeCard.innerHTML = `
                    <img src="${recipe.image}" alt="${recipe.title}" class="recipe-img">
                    <div class="recipe-info">
                        <h3 class="recipe-title">${recipe.title}</h3>
                        <div class="recipe-actions">
                            <button class="action-btn view-btn" data-id="${recipe.id}">View Recipe</button>
                        </div>
                    </div>
                `;
                
                savedGrid.appendChild(recipeCard);
            });
            
            // Add event listeners to view buttons in saved recipes
            document.querySelectorAll('#savedRecipesGrid .view-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const recipeId = e.target.getAttribute('data-id');
                    viewRecipeDetails(recipeId);
                });
            });
        }
    }

    // Initialize
    loadSavedRecipes();