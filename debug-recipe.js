// Debug script to test recipe creation
const testRecipe = {
  name: "Test Recipe",
  batchAmount: 4,
  batchUnit: "stuks",
  ingredients: [
    { quantity: 500, unit: "gram", name: "Test Ingredient" }
  ],
  steps: ["Step 1: Test step"],
  categories: ["Test Category"],
  saveTo: "personal"
};

console.log("Test recipe data:", JSON.stringify(testRecipe, null, 2));

// Test the API endpoint
fetch('/api/recipes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testRecipe)
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('Error:', error);
});
