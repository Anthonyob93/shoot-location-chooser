export const SUGGESTION_EMAIL = 'anthony@obphotography.uk';

function field(value, label, max, required = false, oneLine = false) {
  let text = String(value ?? '').trim();
  if (oneLine) text = text.replace(/\s+/g, ' ');
  if (required && !text) throw new Error(`Please enter ${label}.`);
  if (text.length > max) throw new Error(`Please keep ${label} to ${max} characters or fewer.`);
  return text;
}

export function buildSuggestion(input) {
  const place = field(input.place, 'a place name or map link', 300, true, true);
  const name = field(input.name, 'your name', 80, true, true);
  const email = field(input.email, 'your email address', 254, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Please enter a valid email address.');
  const reason = field(input.reason, 'what draws you to the place', 500);
  const notes = field(input.notes, 'your access or parking notes', 300);
  const needs = [input.easy === true ? 'Easy walking' : '', input.dog === true ? 'Bringing a dog' : ''].filter(Boolean);
  const subject = 'Shoot location suggestion: ' + place.slice(0, 100);
  const body = [
    'Hi Anthony,', '', 'I have a location in mind for a photoshoot.', '',
    'Place or Google Maps link: ' + place,
    ...(reason ? ['', 'What draws me to this place:', reason] : []),
    '', 'Practical needs: ' + (needs.join(', ') || 'None specified'),
    ...(notes ? ['', 'Access or parking notes:', notes] : []),
    '', 'My name: ' + name, 'My email: ' + email, '',
    'Please let me know whether it would be suitable and whether any travel or location fees would apply.', '',
    'Thanks,', name
  ].join('\r\n');
  return { subject, body, mailto: `mailto:${SUGGESTION_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` };
}
