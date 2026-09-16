import { buildSuggestion } from './suggestion-message.js';

const suggestionDialog = document.querySelector('#suggestion-dialog');
const suggestionForm = document.querySelector('#suggestion-form');
const ready = document.querySelector('#suggestion-ready');
const message = document.querySelector('#suggestion-message');
const copyStatus = document.querySelector('#copy-status');
const error = document.querySelector('#suggest-error');

document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-suggest]');
  if (trigger) {
    suggestionDialog.showModal();
    document.querySelector('#suggest-place').focus();
  }
});
document.querySelector('#close-suggestion').onclick = () => suggestionDialog.close();
suggestionDialog.addEventListener('click', event => {
  if (event.target !== suggestionDialog) return;
  const bounds = suggestionDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) suggestionDialog.close();
});

function clearPreparedMessage() {
  ready.hidden = true;
  error.textContent = '';
  message.value = '';
  copyStatus.textContent = '';
  document.querySelector('#reopen-suggestion').removeAttribute('href');
}
suggestionForm.addEventListener('input', clearPreparedMessage);
suggestionForm.addEventListener('reset', clearPreparedMessage);
suggestionForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!suggestionForm.reportValidity()) return;
  try {
    const data = new FormData(suggestionForm);
    const draft = buildSuggestion({
      place: data.get('place'), reason: data.get('reason'), notes: data.get('notes'),
      name: data.get('name'), email: data.get('email'), easy: data.has('easy'), dog: data.has('dog')
    });
    error.textContent = '';
    message.value = 'Subject: ' + draft.subject + '\r\n\r\n' + draft.body;
    document.querySelector('#reopen-suggestion').href = draft.mailto;
    ready.hidden = false;
    copyStatus.textContent = '';
    document.querySelector('#suggestion-ready-title').focus();
    // Creating a draft does not imply delivery; the visitor sends it in their mail app.
    try { window.location.assign(draft.mailto); } catch {
      copyStatus.textContent = 'Your email app could not be opened. Copy the message below to send it yourself.';
    }
  } catch (problem) { error.textContent = problem.message; }
});
document.querySelector('#copy-suggestion').onclick = async () => {
  try {
    await navigator.clipboard.writeText(message.value);
    copyStatus.textContent = 'Message copied. Paste it into an email to anthony@obphotography.uk and send it.';
  } catch {
    message.focus();
    message.select();
    copyStatus.textContent = 'Select and copy the message above, then paste it into your email app.';
  }
};
