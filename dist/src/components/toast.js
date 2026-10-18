/** Show a toast notification at the bottom of the screen. */
export function toast(message, undo = null) {
  const el = document.getElementById('toast');
  el.textContent = '';
  const inner = document.createElement('div');
  inner.className = 'toast-inner';
  const text = document.createElement('span');
  text.textContent = message;
  inner.append(text);
  if (undo) {
    const button = document.createElement('button');
    button.textContent = 'Undo';
    button.onclick = () => { undo(); el.classList.remove('visible'); };
    inner.append(button);
  }
  el.append(inner);
  el.classList.add('visible');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('visible'), undo ? 10000 : 5000);
}
