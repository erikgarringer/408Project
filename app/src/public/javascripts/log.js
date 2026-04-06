// log.js
// Handles dynamic add/remove of exercise rows on the Log Workout form

const addBtn = document.getElementById('addExerciseBtn');
const rowsContainer = document.getElementById('exerciseRows');

// Build a new exercise row identical to the first one
function createExerciseRow() {
  const row = document.createElement('div');
  row.className = 'exercise-row row g-2 mb-2 align-items-center';
  row.innerHTML = `
    <div class="col-md-4">
      <input type="text" class="form-control" name="exercise_name" placeholder="e.g. Squat" required />
    </div>
    <div class="col-md-2">
      <input type="number" class="form-control" name="sets" placeholder="Sets" min="1" required />
    </div>
    <div class="col-md-2">
      <input type="number" class="form-control" name="reps" placeholder="Reps" min="1" required />
    </div>
    <div class="col-md-3">
      <input type="number" class="form-control" name="weight_lbs" placeholder="lbs" min="0" step="0.5" required />
    </div>
    <div class="col-md-1 text-center">
      <button type="button" class="btn btn-sm btn-outline-danger remove-row-btn">
        <i class="bi bi-trash"></i>
      </button>
    </div>
  `;
  return row;
}

// Keep the first row's delete button disabled when it's the only row
function updateRemoveButtons() {
  const rows = rowsContainer.querySelectorAll('.exercise-row');
  rows.forEach((row, idx) => {
    const btn = row.querySelector('.remove-row-btn');
    btn.disabled = rows.length === 1;
  });
}

// Add a new row
addBtn.addEventListener('click', () => {
  const newRow = createExerciseRow();
  rowsContainer.appendChild(newRow);
  updateRemoveButtons();
  // Focus the exercise name field in the new row
  newRow.querySelector('input[name="exercise_name"]').focus();
});

// Remove a row (event delegation)
rowsContainer.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-row-btn');
  if (!btn) return;
  const row = btn.closest('.exercise-row');
  row.remove();
  updateRemoveButtons();
});
